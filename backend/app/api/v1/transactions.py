from typing import Literal

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel

from app.kafka.producer import publish_event
from app.repositories.risk_actions import apply_risk_action
from app.repositories.transactions import (
    count_recent_transactions,
    create_risk_assessment,
    create_transaction,
    get_risk_assessment_by_transaction_id,
    get_transaction_by_id,
    get_transactions,
    get_transactions_by_user,
    get_user_transaction_amounts,
)
from app.risk.engine import calculate_risk
from app.risk.rules import VELOCITY_WINDOW_SECONDS
from app.schemas.transaction import (
    TransactionCreate,
    TransactionResponse,
    TransactionWithRiskResponse,
)

router = APIRouter()


class RiskActionRequest(BaseModel):
    decision: Literal["APPROVE", "REVIEW", "BLOCK"]


def transaction_to_response(result):
    return {
        "id": result[0],
        "user_id": result[1],
        "amount": result[2],
        "currency": result[3],
        "merchant": result[4],
        "category": result[5],
        "timestamp": result[6],
        "location": result[7],
        "device_id": result[8],
        "status": result[9],
    }


def transaction_with_risk_to_response(result, risk):
    response = transaction_to_response(result)
    response["risk"] = risk

    return response


def publish_transaction_event(kafka_payload):
    try:
        publish_event(
            "transaction.created",
            kafka_payload,
        )
    except Exception:
        pass


@router.post(
    "/transactions",
    response_model=TransactionWithRiskResponse,
)
async def create_transaction_endpoint(
    transaction: TransactionCreate,
    request: Request,
    background_tasks: BackgroundTasks,
):
    transaction = transaction.model_copy(
        update={"status": "pending"}
    )

    recent_transaction_count = count_recent_transactions(
        user_id=transaction.user_id,
        timestamp=transaction.timestamp,
        window_seconds=VELOCITY_WINDOW_SECONDS,
    )

    historical_amounts = get_user_transaction_amounts(
        user_id=transaction.user_id,
    )

    risk = calculate_risk(
        transaction,
        recent_transaction_count=recent_transaction_count,
        historical_amounts=historical_amounts,
    )

    status_map = {
        "APPROVE": "completed",
        "REVIEW": "review",
        "BLOCK": "blocked",
    }

    final_status = status_map.get(
        risk["decision"],
        "review",
    )

    transaction = transaction.model_copy(
        update={"status": final_status}
    )

    result = create_transaction(transaction)

    create_risk_assessment(
        transaction_id=result[0],
        risk_score=risk["risk_score"],
        risk_level=risk["risk_level"],
        decision=risk["decision"],
        reasons=risk["reasons"],
    )

    response = transaction_with_risk_to_response(
        result,
        risk,
    )

    kafka_payload = jsonable_encoder(
        {
            "transaction_id": response["id"],
            "user_id": response["user_id"],
            "amount": response["amount"],
            "currency": response["currency"],
            "merchant": response["merchant"],
            "category": response["category"],
            "timestamp": response["timestamp"],
            "location": response["location"],
            "device_id": response["device_id"],
            "status": final_status,
        }
    )

    background_tasks.add_task(
        publish_transaction_event,
        kafka_payload,
    )

    websocket_payload = jsonable_encoder(
        {
            "type": "transaction.created",
            "data": response,
        }
    )

    await request.app.state.connection_manager.broadcast(
        websocket_payload
    )

    return response


@router.patch(
    "/transactions/{transaction_id}/decision",
    response_model=TransactionWithRiskResponse,
)
async def update_transaction_decision(
    transaction_id: int,
    action: RiskActionRequest,
    request: Request,
):
    result = apply_risk_action(
        transaction_id=transaction_id,
        decision=action.decision,
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Risk assessment not found for transaction.",
        )

    transaction, risk = result

    response = transaction_with_risk_to_response(
        transaction,
        risk,
    )

    websocket_payload = jsonable_encoder(
        {
            "type": "risk.action.updated",
            "data": response,
        }
    )

    await request.app.state.connection_manager.broadcast(
        websocket_payload
    )

    return response


@router.get(
    "/transactions",
    response_model=list[TransactionResponse],
)
def list_transactions():
    results = get_transactions()

    return [
        transaction_to_response(result)
        for result in results
    ]


@router.get(
    "/transactions/{transaction_id}",
    response_model=TransactionResponse,
)
def get_transaction(transaction_id: int):
    result = get_transaction_by_id(transaction_id)

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found",
        )

    return transaction_to_response(result)


@router.get(
    "/users/{user_id}/transactions",
    response_model=list[TransactionResponse],
)
def list_user_transactions(user_id: int):
    results = get_transactions_by_user(user_id)

    return [
        transaction_to_response(result)
        for result in results
    ]


@router.get(
    "/users/{user_id}/risk",
    response_model=list[TransactionWithRiskResponse],
)
def list_user_transaction_risk(user_id: int):
    transactions = get_transactions_by_user(user_id)

    if not transactions:
        return []

    results = []

    for transaction in transactions:
        risk_record = get_risk_assessment_by_transaction_id(
            transaction[0]
        )

        if risk_record is None:
            continue

        risk = {
            "risk_score": risk_record[0],
            "risk_level": risk_record[1],
            "decision": risk_record[2],
            "reasons": risk_record[3],
        }

        results.append(
            transaction_with_risk_to_response(
                transaction,
                risk,
            )
        )

    return results