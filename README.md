# FinPulse

## Real-Time Financial Risk & Fraud Monitoring Platform

### 🚀 Live Demo

**[👉 Open FinPulse Live Demo](https://finpulse-frontend-0lj2.onrender.com)**

> FinPulse is deployed and available for live testing. Submit transactions, observe real-time risk decisions, explore the transaction ledger, monitor risk activity, and view analytics directly from the deployed application.

---

FinPulse is a real-time financial risk monitoring platform designed to analyze transactions, evaluate fraud and risk signals, and deliver immediate decisions through an event-driven architecture.

The platform combines a React and TypeScript dashboard with a Python FastAPI backend, PostgreSQL, Apache Kafka, WebSockets, Airflow, Docker, and automated testing.

The system is designed around a production-style transaction flow:

Transaction → API → PostgreSQL → Kafka → Risk Engine → Risk Assessment → WebSocket → Real-Time Dashboard

---

## Overview

Financial transaction systems need to process large numbers of transactions while identifying potentially risky activity quickly.

FinPulse provides a centralized operations workspace where transactions can be submitted, monitored, analyzed, and reviewed in real time.

The platform currently supports:

- Real-time transaction submission
- Rule-based risk assessment
- Risk scoring
- High-risk transaction blocking
- New-device detection
- Transaction velocity analysis
- Behavioral anomaly detection
- Persistent risk assessments
- Kafka-based event-driven processing
- Real-time WebSocket updates
- Transaction and risk analytics
- Airflow-based analytics processing
- Dockerized application services
- Automated backend and frontend testing
- GitHub Actions CI

---

## Key Features

### Real-Time Transaction Screening

Transactions can be submitted directly through the dashboard and immediately enter the risk assessment pipeline.

The user receives a screening state while the transaction is being processed.

### Risk Scoring Engine

FinPulse evaluates multiple transaction signals and produces:

- Risk score
- Risk level
- Decision
- Risk reasons

Possible decisions include:

- APPROVE
- REVIEW
- BLOCK

Risk signals include:

- Transaction amount
- New device activity
- Transaction velocity
- Behavioral anomalies

### Event-Driven Processing

Transaction processing uses Apache Kafka to decouple transaction creation from risk assessment.

The main event flow is:

```text
Transaction Created
        ↓
transaction.created
        ↓
Kafka
        ↓
Risk Engine
        ↓
Risk Assessment
        ↓
risk.assessed
        ↓
WebSocket Bridge
        ↓
React Dashboard

Blocked transactions additionally generate a transaction.blocked event.

Real-Time Dashboard

The frontend provides an operations workspace for:

Transaction monitoring
Risk monitoring
Analytics
Risk decisions
Transaction details
Persistent notifications
Live transaction updates
Persistent Risk Assessments

Risk decisions are stored in PostgreSQL and associated with their corresponding transactions.

This allows previously processed transactions to retain their risk information after page refreshes or application restarts.

Analytics Pipeline

Airflow is used to support scheduled analytics processing and reporting workflows.

Dockerized Architecture

The application is containerized for consistent development and deployment.

Current services include:

Frontend
Backend API
Risk Engine
Kafka
Airflow
PostgreSQL

Nginx acts as the reverse proxy for the frontend application and backend API/WebSocket traffic.

Architecture
                     ┌──────────────────────┐
                     │   React + TypeScript  │
                     │    Redux Toolkit      │
                     └──────────┬───────────┘
                                │
                                ▼
                     ┌──────────────────────┐
                     │    Nginx Reverse     │
                     │        Proxy         │
                     └──────────┬───────────┘
                                │
                                ▼
                     ┌──────────────────────┐
                     │    FastAPI Backend   │
                     │       Python         │
                     └───────┬───────┬──────┘
                             │       │
                             │       ▼
                             │  ┌───────────────┐
                             │  │  PostgreSQL   │
                             │  │ Transactions  │
                             │  │ Risk Results  │
                             │  └───────────────┘
                             │
                             ▼
                     ┌──────────────────────┐
                     │     Apache Kafka      │
                     │  Event-driven layer   │
                     └──────────┬───────────┘
                                │
                                ▼
                     ┌──────────────────────┐
                     │      Risk Engine     │
                     │   Python Processing   │
                     └──────────┬───────────┘
                                │
                                ▼
                     ┌──────────────────────┐
                     │   Risk Assessment    │
                     │ Score / Level /       │
                     │ Decision / Reasons    │
                     └──────────┬───────────┘
                                │
                                ▼
                     ┌──────────────────────┐
                     │      WebSockets      │
                     │   Real-Time Events   │
                     └──────────┬───────────┘
                                │
                                ▼
                     ┌──────────────────────┐
                     │   FinPulse Dashboard │
                     └──────────────────────┘
Technology Stack
Frontend
React
TypeScript
Vite
Redux Toolkit
React Router
Tailwind CSS
Recharts
Lucide React
Backend
Python 3.13
FastAPI
Pydantic
SQL
PostgreSQL
Event-Driven Architecture
Apache Kafka
Kafka producers
Kafka consumers
Event-driven risk processing
WebSockets
Data & Analytics
PostgreSQL
Airflow
Infrastructure
Docker
Docker Compose
Nginx
Testing & Quality
Pytest
Jest
Cypress
GitHub Actions
Risk Engine

The FinPulse risk engine combines multiple transaction signals into a risk score.

Transaction Amount

Extremely large transactions receive additional risk weight.

New Device

Transactions originating from a device that has not previously been associated with the user can increase the risk score.

Transaction Velocity

Multiple transactions within a short time window can increase risk.

Behavioral Anomaly

Transaction amounts can be compared against historical user transaction behavior to identify unusual activity.

The resulting assessment contains:

Risk Score
Risk Level
Decision
Reasons

Example:

{
  "risk_score": 75,
  "risk_level": "HIGH",
  "decision": "BLOCK",
  "reasons": [
    "Extremely high transaction amount"
  ]
}
Real-Time Event Flow

A transaction follows this processing pipeline:

1. User submits transaction
             ↓
2. FastAPI creates transaction
             ↓
3. Transaction persisted in PostgreSQL
             ↓
4. transaction.created published to Kafka
             ↓
5. Risk Engine consumes event
             ↓
6. Risk rules calculate assessment
             ↓
7. Risk assessment persisted
             ↓
8. Transaction status synchronized
             ↓
9. risk.assessed event published
             ↓
10. WebSocket bridge receives event
             ↓
11. React dashboard updates in real time

For blocked transactions:

Risk Engine
     ↓
transaction.blocked
     ↓
Real-Time Notification
     ↓
Risk Operations Dashboard
Project Structure
FinPulse/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── kafka/
│   │   ├── repositories/
│   │   ├── risk/
│   │   ├── schemas/
│   │   ├── config.py
│   │   ├── db.py
│   │   └── main.py
│   ├── tests/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   └── types/
│   ├── cypress/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── cypress.config.ts
│
├── airflow/
│   └── dags/
│
├── infrastructure/
│   ├── docker-compose.yml
│   └── docker-compose.kafka.yml
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── .gitignore
└── README.md
API

The FastAPI backend provides endpoints for transaction processing, health monitoring, risk information, and transaction history.

Examples include:

GET  /api/v1/health
GET  /api/v1/transactions
POST /api/v1/transactions
GET  /api/v1/transactions/{transaction_id}
GET  /api/v1/users/{user_id}/transactions
GET  /api/v1/users/{user_id}/risk

The application also exposes WebSocket connections for real-time transaction and risk updates.

Testing

FinPulse uses multiple layers of automated testing.

Backend

Pytest is used for risk engine and backend validation.

Run:

cd backend
pytest -q
Frontend Unit/API Tests

Jest is used to test frontend API service behavior.

Run:

cd frontend
npm test
End-to-End Testing

Cypress validates the complete transaction screening experience from the frontend.

Run:

cd frontend
npm run test:e2e
Production Build

The frontend production build can be validated with:

cd frontend
npm run build
Continuous Integration

GitHub Actions automatically validates the project on pushes and pull requests to main.

The CI pipeline performs:

Backend
   ↓
Install dependencies
   ↓
Run Pytest
   ↓
Frontend
   ↓
Install dependencies
   ↓
Run Jest
   ↓
Build production frontend

This helps prevent broken backend or frontend changes from reaching the main branch.

Running Locally
Prerequisites

Install:

Python 3.13
Node.js 22
PostgreSQL
Docker Desktop
Git
Backend

Create and activate a virtual environment:

cd backend
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1

Install dependencies:

pip install -r requirements.txt

Configure environment variables using:

backend/.env.example

Start the backend:

uvicorn app.main:app --reload
Frontend
cd frontend
npm install
npm run dev
Kafka

Start Kafka using the infrastructure configuration:

docker compose -f infrastructure/docker-compose.kafka.yml up -d
Docker Application

Build the application images and start the services:

docker compose -f infrastructure/docker-compose.yml up -d

The frontend is available through:

http://localhost:3000
Engineering Highlights

FinPulse demonstrates practical experience with:

REST API design
Python backend development
SQL and PostgreSQL data persistence
Event-driven architecture
Kafka producers and consumers
Asynchronous risk processing
WebSocket-based real-time communication
Transaction state synchronization
Risk scoring systems
Analytics pipelines
Containerized services
Reverse proxy configuration
Automated testing
Continuous integration
Production-oriented application structure
Design Goals

FinPulse was designed with the following engineering goals:

Real-time processing instead of static demo data
Clear separation between API and risk processing
Persistent transaction and risk state
Event-driven communication
Testable business logic
Containerized deployment
Maintainable frontend and backend structure
Clear operational visibility
Future Scope

Potential future improvements include:

Machine-learning-based risk models
Advanced fraud pattern detection
Role-based authentication and authorization
Distributed Kafka consumers
Kubernetes deployment
Cloud infrastructure
Advanced observability and monitoring
Model performance monitoring
More sophisticated behavioral profiling

These are future extensions and are not required for the current core system.

Disclaimer

FinPulse is an educational and portfolio project designed to demonstrate software engineering concepts in financial transaction monitoring.

It is not intended to make real financial, credit, or fraud decisions for production financial institutions.

Author

Ashmita Mazumdar

B.Tech Computer Science Engineering
SVKM's NMIMS, Mukesh Patel School of Technology Management and Engineering

GitHub: ashmita-dev

🚀 Try FinPulse

Open the Live Application →
