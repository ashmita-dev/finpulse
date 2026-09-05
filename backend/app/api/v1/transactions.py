from fastapi import APIRouter, HTTPException

from app.repositories.transactions import (
    count_recent_transactions,
    create_transaction,
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


@router.post(
    "/transactions",
    response_model=TransactionWithRiskResponse,
)
def create_transaction_endpoint(transaction: TransactionCreate):
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

    result = create_transaction(transaction)

    response = transaction_to_response(result)
    response["risk"] = risk

    return response


@router.get(
    "/transactions",
    response_model=list[TransactionResponse],
)
def list_transactions():
    results = get_transactions()

    return [transaction_to_response(result) for result in results]


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

    return [transaction_to_response(result) for result in results]