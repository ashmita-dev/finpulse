# FinPulse

Real-time financial risk monitoring and transaction intelligence platform.

FinPulse is a full-stack financial risk platform designed to process transactions, evaluate transaction risk, persist risk assessments, and provide a real-time operations dashboard for monitoring and managing suspicious activity.

## Overview

FinPulse combines a FastAPI backend, PostgreSQL database, React frontend, and WebSocket-based real-time communication into a single financial risk monitoring system.

Every transaction submitted to FinPulse is evaluated by a rule-based risk engine that considers factors such as transaction amount, new devices, transaction velocity, and behavioral anomalies.

The resulting risk assessment is persisted alongside the transaction and can be monitored in real time through the dashboard.

## Key Features

- Real-time transaction processing
- Explainable transaction risk scoring
- Automatic risk classification
- Approve, Review, and Block decisions
- Persistent risk assessments
- Manual risk operations
- Real-time WebSocket updates
- High-risk transaction notifications
- Transaction monitoring dashboard
- Spending analytics
- Currency-aware financial analytics
- PostgreSQL persistence
- RESTful backend APIs
- Risk assessment history
- Transaction-level risk explanations

## Risk Engine

FinPulse uses an explainable rule-based risk engine to evaluate transactions.

The engine considers multiple risk signals:

### Transaction Amount

Large transactions receive additional risk points.

| Condition | Risk Score |
|---|---:|
| Normal amount | 0 |
| High amount | +25 |
| Very high amount | +40 |
| Extremely high amount | +75 |

### New Device

Transactions originating from a new device can receive an additional risk score.

```text
New Device
    ↓
+20 Risk Score