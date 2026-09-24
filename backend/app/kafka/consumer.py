import json
from datetime import datetime
from decimal import Decimal

from kafka import KafkaConsumer, KafkaProducer

from app.config import KAFKA_BOOTSTRAP_SERVERS
from app.repositories.risk_actions import update_transaction_status
from app.repositories.transactions import (
    count_recent_transactions,
    create_risk_assessment,
    get_user_transaction_amounts,
)
from app.risk.engine import calculate_risk
from app.risk.rules import VELOCITY_WINDOW_SECONDS
from app.schemas.transaction import TransactionCreate


def parse_transaction_event(event: dict) -> dict:
    required_fields = [
        "transaction_id",
        "user_id",
        "amount",
        "currency",
        "merchant",
        "category",
        "timestamp",
    ]

    missing_fields = [
        field
        for field in required_fields
        if field not in event
    ]

    if missing_fields:
        raise ValueError(
            f"Invalid transaction event. Missing fields: {missing_fields}"
        )

    return {
        "transaction_id": event["transaction_id"],
        "user_id": event["user_id"],
        "amount": event["amount"],
        "currency": event["currency"],
        "merchant": event["merchant"],
        "category": event["category"],
        "timestamp": event["timestamp"],
        "location": event.get("location"),
        "device_id": event.get("device_id"),
        "status": event.get("status"),
    }


def process_transaction(
    transaction: dict,
):
    transaction_data = TransactionCreate(
        user_id=transaction["user_id"],
        amount=Decimal(str(transaction["amount"])),
        currency=transaction["currency"],
        merchant=transaction["merchant"],
        category=transaction["category"],
        timestamp=datetime.fromisoformat(transaction["timestamp"]),
        location=transaction.get("location"),
        device_id=transaction.get("device_id"),
        status=transaction.get("status", "completed"),
    )

    historical_amounts = get_user_transaction_amounts(
        user_id=transaction_data.user_id,
    )

    current_amount = transaction_data.amount

    historical_amounts = [
        amount
        for amount in historical_amounts
        if amount != current_amount
    ]

    recent_transaction_count = count_recent_transactions(
        user_id=transaction_data.user_id,
        timestamp=transaction_data.timestamp,
        window_seconds=VELOCITY_WINDOW_SECONDS,
    )

    recent_transaction_count = max(
        recent_transaction_count - 1,
        0,
    )

    return calculate_risk(
        transaction_data,
        recent_transaction_count=recent_transaction_count,
        historical_amounts=historical_amounts,
    )


def process_transaction_event(
    event: dict,
):
    transaction = parse_transaction_event(event)

    risk = process_transaction(transaction)

    create_risk_assessment(
        transaction_id=transaction["transaction_id"],
        risk_score=risk["risk_score"],
        risk_level=risk["risk_level"],
        decision=risk["decision"],
        reasons=risk["reasons"],
    )

    update_transaction_status(
        transaction_id=transaction["transaction_id"],
        decision=risk["decision"],
    )

    return risk


def create_consumer():
    return KafkaConsumer(
        "transaction.created",
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        group_id="finpulse-risk-engine",
        auto_offset_reset="earliest",
        enable_auto_commit=False,
        value_deserializer=lambda value: json.loads(
            value.decode("utf-8")
        ),
    )


def create_event_producer():
    return KafkaProducer(
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        value_serializer=lambda value: json.dumps(value).encode("utf-8"),
    )


def publish_risk_events(
    producer,
    transaction: dict,
    risk: dict,
):
    event = {
        "transaction_id": transaction["transaction_id"],
        "user_id": transaction["user_id"],
        "risk_score": risk["risk_score"],
        "risk_level": risk["risk_level"],
        "decision": risk["decision"],
        "reasons": risk["reasons"],
    }

    producer.send(
        "risk.assessed",
        value=event,
    )

    if risk["decision"] == "BLOCK":
        producer.send(
            "transaction.blocked",
            value=event,
        )

    producer.flush()


def run_consumer():
    consumer = create_consumer()
    producer = create_event_producer()

    try:
        for message in consumer:
            event = message.value

            try:
                transaction = parse_transaction_event(event)
            except ValueError:
                consumer.commit()
                continue

            risk = process_transaction_event(event)

            publish_risk_events(
                producer,
                transaction,
                risk,
            )

            consumer.commit()

    finally:
        consumer.close()
        producer.close()


if __name__ == "__main__":
    run_consumer()