from app.risk.rules import (
    HIGH_AMOUNT_SCORE,
    HIGH_AMOUNT_THRESHOLD,
    NEW_DEVICE_SCORE,
    VERY_HIGH_AMOUNT_SCORE,
    VERY_HIGH_AMOUNT_THRESHOLD,
)
from app.schemas.transaction import TransactionCreate


def calculate_risk(transaction: TransactionCreate):
    risk_score = 0
    reasons = []

    # Rule 1: transaction amount
    if transaction.amount >= VERY_HIGH_AMOUNT_THRESHOLD:
        risk_score += VERY_HIGH_AMOUNT_SCORE
        reasons.append("Very high transaction amount")

    elif transaction.amount >= HIGH_AMOUNT_THRESHOLD:
        risk_score += HIGH_AMOUNT_SCORE
        reasons.append("High transaction amount")

    # Rule 2: device
    if transaction.device_id and transaction.device_id.startswith("new_"):
        risk_score += NEW_DEVICE_SCORE
        reasons.append("Transaction from a new device")

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