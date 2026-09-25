import os

from dotenv import load_dotenv

load_dotenv()

KAFKA_BOOTSTRAP_SERVERS = os.getenv(
    "KAFKA_BOOTSTRAP_SERVERS",
    "localhost:9092",
)

KAFKA_SECURITY_PROTOCOL = os.getenv(
    "KAFKA_SECURITY_PROTOCOL",
    "PLAINTEXT",
)

KAFKA_SASL_MECHANISM = os.getenv(
    "KAFKA_SASL_MECHANISM",
    "SCRAM-SHA-256",
)

KAFKA_SASL_USERNAME = os.getenv(
    "KAFKA_SASL_USERNAME",
    "",
)

KAFKA_SASL_PASSWORD = os.getenv(
    "KAFKA_SASL_PASSWORD",
    "",
)