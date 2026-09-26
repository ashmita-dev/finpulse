import json
import logging
import ssl

from kafka import KafkaProducer

from app.config import (
    KAFKA_BOOTSTRAP_SERVERS,
    KAFKA_SASL_MECHANISM,
    KAFKA_SASL_PASSWORD,
    KAFKA_SASL_USERNAME,
    KAFKA_SECURITY_PROTOCOL,
    KAFKA_SSL_CAFILE,
)

logger = logging.getLogger(__name__)

kafka_config = {
    "bootstrap_servers": KAFKA_BOOTSTRAP_SERVERS,
    "security_protocol": KAFKA_SECURITY_PROTOCOL,
    "sasl_mechanism": KAFKA_SASL_MECHANISM,
    "sasl_plain_username": KAFKA_SASL_USERNAME,
    "sasl_plain_password": KAFKA_SASL_PASSWORD,
    "api_version": (3, 7, 0),
    "value_serializer": lambda value: json.dumps(value).encode("utf-8"),
    "acks": "all",
    "retries": 1,
    "max_block_ms": 5000,
    "request_timeout_ms": 5000,
}

if KAFKA_SECURITY_PROTOCOL == "SASL_SSL":
    if KAFKA_SSL_CAFILE:
        kafka_config["ssl_cafile"] = KAFKA_SSL_CAFILE
    else:
        kafka_config["ssl_context"] = ssl.create_default_context()

producer = KafkaProducer(**kafka_config)


def publish_event(topic: str, event: dict) -> bool:
    try:
        future = producer.send(topic, value=event)
        future.get(timeout=5)
        logger.info("Kafka event published successfully: %s", topic)
        return True
    except Exception as exc:
        logger.error("Kafka publish failed for topic %s: %s", topic, exc)
        return False


def close_producer():
    producer.flush()
    producer.close()