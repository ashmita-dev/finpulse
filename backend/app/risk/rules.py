from decimal import Decimal


def check_amount_risk(amount: Decimal) -> tuple[int, str | None]:
    if amount >= Decimal("50000"):
        return 40, "Very high transaction amount"

    if amount >= Decimal("10000"):
        return 25, "High transaction amount"

    if amount >= Decimal("5000"):
        return 10, "Elevated transaction amount"

    return 0, None


def check_new_device(device_id: str | None) -> tuple[int, str | None]:
    if not device_id:
        return 5, "Device information is missing"

    return 0, None