from app.db import get_connection
from app.schemas.transaction import TransactionCreate


def create_transaction(transaction: TransactionCreate):
    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO transactions (
                    user_id,
                    amount,
                    currency,
                    merchant,
                    category,
                    timestamp,
                    location,
                    device_id,
                    status
                )
                VALUES (
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s
                )
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
                    transaction.user_id,
                    transaction.amount,
                    transaction.currency,
                    transaction.merchant,
                    transaction.category,
                    transaction.timestamp,
                    transaction.location,
                    transaction.device_id,
                    transaction.status,
                ),
            )

            result = cursor.fetchone()
            connection.commit()

            return result

    finally:
        connection.close()