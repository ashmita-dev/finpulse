import os
from pathlib import Path

from dotenv import load_dotenv


load_dotenv()

BASE_DIR = Path(__file__).resolve().parents[1]
DEFAULT_KAFKA_CA_FILE = BASE_DIR / "certs" / "ca.pem"

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

KAFKA_SSL_CAFILE = os.getenv(
    "KAFKA_SSL_CAFILE",
    str(DEFAULT_KAFKA_CA_FILE),
)