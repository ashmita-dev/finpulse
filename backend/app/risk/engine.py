from decimal import Decimal

from app.risk.rules import (
    BEHAVIORAL_ANOMALY_SCORE,
    BEHAVIORAL_Z_SCORE_THRESHOLD,
    HIGH_AMOUNT_SCORE,
    HIGH_AMOUNT_THRESHOLD,
    HIGH_VELOCITY_SCORE,
    NEW_DEVICE_SCORE,
    VERY_HIGH_AMOUNT_SCORE,
    VERY_HIGH_AMOUNT_THRESHOLD,
    VELOCITY_TRANSACTION_LIMIT,
)
from app.schemas.transaction import TransactionCreate


MINIMUM_HISTORY_FOR_BEHAVIORAL_ANALYSIS = 5


def calculate_behavioral_z_score(
    current_amount: Decimal,
    historical_amounts: list[Decimal],
):
    if len(historical_amounts) < MINIMUM_HISTORY_FOR_BEHAVIORAL_ANALYSIS:
        return None

    mean = sum(historical_amounts) / len(historical_amounts)

    squared_differences = [
        (amount - mean) ** 2
        for amount in historical_amounts
    ]

    variance = sum(squared_differences) / len(historical_amounts)
    standard_deviation = variance ** Decimal("0.5")

    if standard_deviation == 0:
        return None

    z_score = (
        current_amount - mean
    ) / standard_deviation

    return z_score


def calculate_risk(
    transaction: TransactionCreate,
    recent_transaction_count: int = 0,
    historical_amounts: list[Decimal] | None = None,
):
    if historical_amounts is None:
        historical_amounts = []

    risk_score = 0
    reasons = []

    # Rule 1: transaction amount
    if transaction.amount >= VERY_HIGH_AMOUNT_THRESHOLD:
        risk_score += VERY_HIGH_AMOUNT_SCORE
        reasons.append("Very high transaction amount")

    elif transaction.amount >= HIGH_AMOUNT_THRESHOLD:
        risk_score += HIGH_AMOUNT_SCORE
        reasons.append("High transaction amount")

    # Rule 2: new device
    if transaction.device_id and transaction.device_id.startswith("new_"):
        risk_score += NEW_DEVICE_SCORE
        reasons.append("Transaction from a new device")

    # Rule 3: transaction velocity
    if recent_transaction_count >= VELOCITY_TRANSACTION_LIMIT:
        risk_score += HIGH_VELOCITY_SCORE
        reasons.append("High transaction velocity")

    # Rule 4: behavioral anomaly
    z_score = calculate_behavioral_z_score(
        current_amount=transaction.amount,
        historical_amounts=historical_amounts,
    )

    if (
        z_score is not None
        and z_score >= BEHAVIORAL_Z_SCORE_THRESHOLD
    ):
        risk_score += BEHAVIORAL_ANOMALY_SCORE

        reasons.append(
            f"Transaction amount is unusually high for this user "
            f"(z-score: {float(z_score):.2f})"
        )

    # Keep score within 0–100
    risk_score = min(risk_score, 100)

    # Determine risk level and decision
    if risk_score >= 70:
        risk_level = "HIGH"
        decision = "BLOCK"

    elif risk_score >= 30:
        risk_level = "MEDIUM"
        decision = "REVIEW"

    else:
        risk_level = "LOW"
        decision = "APPROVE"

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "decision": decision,
        "reasons": reasons,
    }