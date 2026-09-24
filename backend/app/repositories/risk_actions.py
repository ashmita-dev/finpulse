from app.db import get_connection


def apply_risk_action(
    transaction_id: int,
    decision: str,
):
    connection = get_connection()

    status_map = {
        "APPROVE": "completed",
        "REVIEW": "review",
        "BLOCK": "blocked",
    }

    status = status_map[decision]

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE risk_assessments
                SET decision = %s
                WHERE transaction_id = %s
                RETURNING
                    risk_score,
                    risk_level,
                    decision,
                    reasons;
                """,
                (
                    decision,
                    transaction_id,
                ),
            )

            risk_record = cursor.fetchone()

            if risk_record is None:
                connection.rollback()
                return None

            cursor.execute(
                """
                UPDATE transactions
                SET status = %s
                WHERE id = %s
                RETURNING
                    id,
                    user_id,
                    amount,
                    currency,
                    merchant,
                    category,
                    timestamp,
                    location,
                    device_id,
                    status;
                """,
                (
                    status,
                    transaction_id,
                ),
            )

            transaction_record = cursor.fetchone()

            if transaction_record is None:
                connection.rollback()
                return None

            connection.commit()

            risk = {
                "risk_score": risk_record[0],
                "risk_level": risk_record[1],
                "decision": risk_record[2],
                "reasons": risk_record[3],
            }

            return transaction_record, risk

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


def update_transaction_status(
    transaction_id: int,
    decision: str,
):
    connection = get_connection()

    status_map = {
        "APPROVE": "completed",
        "REVIEW": "review",
        "BLOCK": "blocked",
    }

    if decision not in status_map:
        raise ValueError(
            f"Unsupported risk decision: {decision}"
        )

    status = status_map[decision]

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE transactions
                SET status = %s
                WHERE id = %s
                RETURNING
                    id,
                    user_id,
                    amount,
                    currency,
                    merchant,
                    category,
                    timestamp,
                    location,
                    device_id,
                    status;
                """,
                (
                    status,
                    transaction_id,
                ),
            )

            result = cursor.fetchone()

            if result is None:
                connection.rollback()
                return None

            connection.commit()

            return result

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()