from fastapi import APIRouter

from app.repositories.transactions import create_transaction
from app.schemas.transaction import (
    TransactionCreate,
    TransactionResponse,
)

router = APIRouter()


@router.post(
    "/transactions",
    response_model=TransactionResponse,
)
def create_transaction_endpoint(transaction: TransactionCreate):
    result = create_transaction(transaction)

    return {
        "id": result[0],
        "user_id": result[1],
        "amount": result[2],
        "currency": result[3],
        "merchant": result[4],
        "category": result[5],
        "timestamp": result[6],
        "location": result[7],
        "device_id": result[8],
        "status": result[9],
    }