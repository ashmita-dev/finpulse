import os
from datetime import datetime, timedelta

import psycopg2
from airflow import DAG
from airflow.operators.python import PythonOperator


POSTGRES_HOST = os.getenv("DATABASE_HOST", "host.docker.internal")
POSTGRES_PORT = int(os.getenv("DATABASE_PORT", "5432"))
POSTGRES_DB = os.getenv("DATABASE_NAME", "finpulse")
POSTGRES_USER = os.getenv("DATABASE_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("DATABASE_PASSWORD")


def get_connection():
    return psycopg2.connect(
        host=POSTGRES_HOST,
        port=POSTGRES_PORT,
        database=POSTGRES_DB,
        user=POSTGRES_USER,
        password=POSTGRES_PASSWORD,
    )


def create_analytics_table():
    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS daily_analytics (
                    id BIGSERIAL PRIMARY KEY,
                    analytics_date DATE NOT NULL UNIQUE,
                    total_transactions INTEGER NOT NULL,
                    total_amount NUMERIC(18, 2) NOT NULL,
                    approved_transactions INTEGER NOT NULL,
                    review_transactions INTEGER NOT NULL,
                    blocked_transactions INTEGER NOT NULL,
                    high_risk_transactions INTEGER NOT NULL,
                    average_transaction_amount NUMERIC(18, 2) NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                """
            )

        connection.commit()

    finally:
        connection.close()


def calculate_daily_analytics():
    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO daily_analytics (
                    analytics_date,
                    total_transactions,
                    total_amount,
                    approved_transactions,
                    review_transactions,
                    blocked_transactions,
                    high_risk_transactions,
                    average_transaction_amount
                )
                SELECT
                    CURRENT_DATE,
                    COUNT(*),
                    COALESCE(SUM(amount), 0),
                    COUNT(*) FILTER (
                        WHERE status = 'completed'
                    ),
                    COUNT(*) FILTER (
                        WHERE status = 'review'
                    ),
                    COUNT(*) FILTER (
                        WHERE status = 'blocked'
                    ),
                    COUNT(*) FILTER (
                        WHERE id IN (
                            SELECT transaction_id
                            FROM risk_assessments
                            WHERE risk_level = 'HIGH'
                        )
                    ),
                    COALESCE(AVG(amount), 0)
                FROM transactions
                WHERE timestamp::date = CURRENT_DATE
                ON CONFLICT (analytics_date)
                DO UPDATE SET
                    total_transactions = EXCLUDED.total_transactions,
                    total_amount = EXCLUDED.total_amount,
                    approved_transactions = EXCLUDED.approved_transactions,
                    review_transactions = EXCLUDED.review_transactions,
                    blocked_transactions = EXCLUDED.blocked_transactions,
                    high_risk_transactions = EXCLUDED.high_risk_transactions,
                    average_transaction_amount =
                        EXCLUDED.average_transaction_amount;
                """
            )

        connection.commit()

    finally:
        connection.close()


default_args = {
    "owner": "finpulse",
    "depends_on_past": False,
    "retries": 1,
    "retry_delay": timedelta(minutes=5),
}


with DAG(
    dag_id="finpulse_daily_analytics",
    default_args=default_args,
    description="Daily FinPulse transaction and risk analytics pipeline",
    schedule="0 0 * * *",
    start_date=datetime(2026, 1, 1),
    catchup=False,
    tags=["finpulse", "analytics", "risk"],
) as dag:

    create_table = PythonOperator(
        task_id="create_analytics_table",
        python_callable=create_analytics_table,
    )

    calculate_metrics = PythonOperator(
        task_id="calculate_daily_analytics",
        python_callable=calculate_daily_analytics,
    )

    create_table >> calculate_metrics