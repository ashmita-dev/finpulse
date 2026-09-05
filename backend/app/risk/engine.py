from app.schemas.transaction import TransactionCreate
from app.risk.rules import (
    check_amount_risk,
    check_new_device,
)


def calculate_risk(transaction: TransactionCreate):
    risk_score = 0
    reasons = []

    amount_score, amount_reason = check_amount_risk(transaction.amount)

    risk_score += amount_score

    if amount_reason:
        reasons.append(amount_reason)

    device_score, device_reason = check_new_device(transaction.device_id)

    risk_score += device_score

    if device_reason:
        reasons.append(device_reason)

    risk_score = min(risk_score, 100)

    if risk_score >= 70:
        risk_level = "HIGH"
        decision = "REVIEW"
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