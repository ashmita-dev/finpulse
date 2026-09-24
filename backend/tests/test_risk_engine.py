from datetime import datetime, timezone
from decimal import Decimal

from app.risk.engine import calculate_risk
from app.schemas.transaction import TransactionCreate


def create_transaction(
    amount=Decimal("1000"),
    device_id="device_001",
):
    return TransactionCreate(
        user_id=1,
        amount=amount,
        currency="INR",
        merchant="Test Merchant",
        category="Technology",
        timestamp=datetime.now(timezone.utc),
        location="Mumbai",
        device_id=device_id,
        status="completed",
    )


def test_normal_transaction_is_approved():
    transaction = create_transaction()

    risk = calculate_risk(
        transaction,
        recent_transaction_count=0,
        historical_amounts=[
            Decimal("900"),
            Decimal("1100"),
            Decimal("1000"),
        ],
    )

    assert risk["risk_level"] == "LOW"
    assert risk["decision"] == "APPROVE"
    assert risk["risk_score"] >= 0


def test_high_amount_transaction_increases_risk():
    transaction = create_transaction(
        amount=Decimal("15000"),
    )

    risk = calculate_risk(
        transaction,
        recent_transaction_count=0,
        historical_amounts=[],
    )

    assert risk["risk_score"] >= 25
    assert "High transaction amount" in risk["reasons"]


def test_very_high_amount_transaction():
    transaction = create_transaction(
        amount=Decimal("75000"),
    )

    risk = calculate_risk(
        transaction,
        recent_transaction_count=0,
        historical_amounts=[],
    )

    assert risk["risk_score"] >= 40
    assert any(
        "transaction amount" in reason.lower()
        for reason in risk["reasons"]
    )


def test_extremely_high_amount_blocks_transaction():
    transaction = create_transaction(
        amount=Decimal("1500000"),
    )

    risk = calculate_risk(
        transaction,
        recent_transaction_count=0,
        historical_amounts=[],
    )

    assert risk["risk_score"] >= 75
    assert risk["risk_level"] == "HIGH"
    assert risk["decision"] == "BLOCK"
    assert "Extremely high transaction amount" in risk["reasons"]


def test_new_device_increases_risk():
    transaction = create_transaction(
        device_id="new_test_device",
    )

    risk = calculate_risk(
        transaction,
        recent_transaction_count=0,
        historical_amounts=[],
    )

    assert risk["risk_score"] >= 20
    assert "Transaction from a new device" in risk["reasons"]


def test_high_velocity_increases_risk():
    transaction = create_transaction()

    risk = calculate_risk(
        transaction,
        recent_transaction_count=3,
        historical_amounts=[],
    )

    assert risk["risk_score"] >= 30
    assert any(
        "velocity" in reason.lower()
        for reason in risk["reasons"]
    )


def test_multiple_risk_signals_combine():
    transaction = create_transaction(
        amount=Decimal("1500000"),
        device_id="new_combined_device",
    )

    risk = calculate_risk(
        transaction,
        recent_transaction_count=3,
        historical_amounts=[],
    )

    assert risk["risk_score"] >= 95
    assert risk["risk_level"] == "HIGH"
    assert risk["decision"] == "BLOCK"
    assert len(risk["reasons"]) >= 3


def test_behavioral_anomaly_increases_risk():
    transaction = create_transaction(
        amount=Decimal("50000"),
    )

    historical_amounts = [
        Decimal("100"),
        Decimal("110"),
        Decimal("90"),
        Decimal("105"),
        Decimal("95"),
    ]

    risk = calculate_risk(
        transaction,
        recent_transaction_count=0,
        historical_amounts=historical_amounts,
    )

    assert risk["risk_score"] == 65
    assert risk["risk_level"] == "MEDIUM"
    assert risk["decision"] == "REVIEW"
    assert any(
        "unusually high for this user" in reason.lower()
        for reason in risk["reasons"]
    )
    assert any(
        "z-score" in reason.lower()
        for reason in risk["reasons"]
    )