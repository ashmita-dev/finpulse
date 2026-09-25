import json

from kafka import KafkaProducer

from app.config import (
    KAFKA_BOOTSTRAP_SERVERS,
    KAFKA_SASL_MECHANISM,
    KAFKA_SASL_PASSWORD,
    KAFKA_SASL_USERNAME,
    KAFKA_SECURITY_PROTOCOL,
    KAFKA_SSL_CAFILE,
)


kafka_config = {
    "bootstrap_servers": KAFKA_BOOTSTRAP_SERVERS,
    "security_protocol": KAFKA_SECURITY_PROTOCOL,
    "sasl_mechanism": KAFKA_SASL_MECHANISM,
    "sasl_plain_username": KAFKA_SASL_USERNAME,
    "sasl_plain_password": KAFKA_SASL_PASSWORD,
    "api_version": (3, 7, 0),
    "value_serializer": lambda value: json.dumps(value).encode("utf-8"),
}

if KAFKA_SECURITY_PROTOCOL == "SASL_SSL":
    kafka_config["ssl_cafile"] = KAFKA_SSL_CAFILE


producer = KafkaProducer(**kafka_config)


def publish_event(
    topic: str,
    event: dict,
):
    future = producer.send(
        topic,
        value=event,
    )

    future.get(timeout=10)


def close_producer():
    producer.flush()
    producer.close()