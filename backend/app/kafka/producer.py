import json

from kafka import KafkaProducer

from app.config import KAFKA_BOOTSTRAP_SERVERS


producer = KafkaProducer(
    bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
    value_serializer=lambda value: json.dumps(value).encode("utf-8"),
)


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