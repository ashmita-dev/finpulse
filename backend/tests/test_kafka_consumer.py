from app.kafka.consumer import parse_transaction_event, process_transaction_event


def test_parse_transaction_event():
    event = {
        "transaction_id": 52,
        "user_id": 1,
        "amount": 800.0,
        "currency": "INR",
        "merchant": "Kafka Test Merchant",
        "category": "Shopping",
        "timestamp": "2026-09-22T11:01:22.005716+05:30",
        "location": "Mumbai",
        "device_id": "device_kafka_test",
        "status": "completed",
    }

    transaction = parse_transaction_event(event)

    assert transaction["transaction_id"] == 52
    assert transaction["user_id"] == 1
    assert transaction["amount"] == 800.0
    assert transaction["currency"] == "INR"
    assert transaction["merchant"] == "Kafka Test Merchant"


def test_process_transaction_event(monkeypatch):
    event = {
        "transaction_id": 52,
        "user_id": 1,
        "amount": 800.0,
        "currency": "INR",
        "merchant": "Kafka Test Merchant",
        "category": "Shopping",
        "timestamp": "2026-09-22T11:01:22.005716+05:30",
        "location": "Mumbai",
        "device_id": "device_kafka_test",
        "status": "completed",
    }

    captured = {}

    def fake_process(transaction):
        captured["transaction"] = transaction
        return {
            "risk_score": 0,
            "risk_level": "LOW",
            "decision": "APPROVE",
            "reasons": [],
        }

    monkeypatch.setattr(
        "app.kafka.consumer.process_transaction",
        fake_process,
    )

    monkeypatch.setattr(
        "app.kafka.consumer.create_risk_assessment",
        lambda **kwargs: None,
    )

    result = process_transaction_event(event)

    assert result["risk_score"] == 0
    assert result["risk_level"] == "LOW"
    assert result["decision"] == "APPROVE"
    assert captured["transaction"]["transaction_id"] == 52


def test_persist_risk_assessment(monkeypatch):
    event = {
        "transaction_id": 52,
        "user_id": 1,
        "amount": 800.0,
        "currency": "INR",
        "merchant": "Kafka Test Merchant",
        "category": "Shopping",
        "timestamp": "2026-09-22T11:01:22.005716+05:30",
        "location": "Mumbai",
        "device_id": "device_kafka_test",
        "status": "completed",
    }

    captured = {}

    def fake_process(transaction):
        return {
            "risk_score": 0,
            "risk_level": "LOW",
            "decision": "APPROVE",
            "reasons": [],
        }

    def fake_persist(
        transaction_id,
        risk_score,
        risk_level,
        decision,
        reasons,
    ):
        captured["transaction_id"] = transaction_id
        captured["risk_score"] = risk_score
        captured["risk_level"] = risk_level
        captured["decision"] = decision
        captured["reasons"] = reasons

    monkeypatch.setattr(
        "app.kafka.consumer.process_transaction",
        fake_process,
    )

    monkeypatch.setattr(
        "app.kafka.consumer.create_risk_assessment",
        fake_persist,
    )

    result = process_transaction_event(event)

    assert result["decision"] == "APPROVE"
    assert captured["transaction_id"] == 52
    assert captured["risk_score"] == 0
    assert captured["risk_level"] == "LOW"
    assert captured["decision"] == "APPROVE"
    assert captured["reasons"] == []