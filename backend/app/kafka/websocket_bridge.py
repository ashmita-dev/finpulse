import asyncio
import json

from kafka import KafkaConsumer

from app.config import KAFKA_BOOTSTRAP_SERVERS


def create_risk_consumer():
    return KafkaConsumer(
        "risk.assessed",
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        group_id="finpulse-websocket-bridge",
        auto_offset_reset="earliest",
        enable_auto_commit=True,
        value_deserializer=lambda value: json.loads(
            value.decode("utf-8")
        ),
    )


def create_blocked_consumer():
    return KafkaConsumer(
        "transaction.blocked",
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        group_id="finpulse-websocket-bridge-blocked",
        auto_offset_reset="earliest",
        enable_auto_commit=True,
        value_deserializer=lambda value: json.loads(
            value.decode("utf-8")
        ),
    )


async def run_websocket_bridge(app):
    loop = asyncio.get_running_loop()

    risk_consumer = create_risk_consumer()
    blocked_consumer = create_blocked_consumer()

    print("📡 Kafka → WebSocket bridge started")

    try:
        while True:
            risk_messages = await loop.run_in_executor(
                None,
                risk_consumer.poll,
                100,
            )

            for _, messages in risk_messages.items():
                for message in messages:
                    payload = message.value

                    print(
                        f"📨 Kafka risk.assessed event received: {payload}"
                    )

                    websocket_payload = {
                        "type": "risk.assessed",
                        "data": payload,
                    }

                    await app.state.connection_manager.broadcast(
                        websocket_payload
                    )

            blocked_messages = await loop.run_in_executor(
                None,
                blocked_consumer.poll,
                100,
            )

            for _, messages in blocked_messages.items():
                for message in messages:
                    payload = message.value

                    print(
                        f"🚫 Kafka transaction.blocked event received: {payload}"
                    )

                    websocket_payload = {
                        "type": "transaction.blocked",
                        "data": payload,
                    }

                    await app.state.connection_manager.broadcast(
                        websocket_payload
                    )

            await asyncio.sleep(0.05)

    except asyncio.CancelledError:
        print("🛑 Kafka → WebSocket bridge stopping")
        raise

    finally:
        risk_consumer.close()
        blocked_consumer.close()
        print("🛑 Kafka → WebSocket bridge stopped")