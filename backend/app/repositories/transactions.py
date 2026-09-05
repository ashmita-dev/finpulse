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


def get_transactions():
    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    id,
                    user_id,
                    amount,
                    currency,
                    merchant,
                    category,
                    timestamp,
                    location,
                    device_id,
                    status
                FROM transactions
                ORDER BY timestamp DESC;
                """
            )

            return cursor.fetchall()

    finally:
        connection.close()


def get_transaction_by_id(transaction_id: int):
    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    id,
                    user_id,
                    amount,
                    currency,
                    merchant,
                    category,
                    timestamp,
                    location,
                    device_id,
                    status
                FROM transactions
                WHERE id = %s;
                """,
                (transaction_id,),
            )

            return cursor.fetchone()

    finally:
        connection.close()


def get_transactions_by_user(user_id: int):
    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    id,
                    user_id,
                    amount,
                    currency,
                    merchant,
                    category,
                    timestamp,
                    location,
                    device_id,
                    status
                FROM transactions
                WHERE user_id = %s
                ORDER BY timestamp DESC;
                """,
                (user_id,),
            )

            return cursor.fetchall()

    finally:
        connection.close()


def count_recent_transactions(
    user_id: int,
    timestamp,
    window_seconds: int,
):
    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT COUNT(*)
                FROM transactions
                WHERE user_id = %s
                  AND timestamp >= %s - (%s * INTERVAL '1 second')
                  AND timestamp <= %s;
                """,
                (
                    user_id,
                    timestamp,
                    window_seconds,
                    timestamp,
                ),
            )

            result = cursor.fetchone()

            return result[0]

    finally:
        connection.close()


def get_user_transaction_amounts(user_id: int):
    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT amount
                FROM transactions
                WHERE user_id = %s
                ORDER BY timestamp ASC;
                """,
                (user_id,),
            )

            return [row[0] for row in cursor.fetchall()]

    finally:
        connection.close()