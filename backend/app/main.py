from fastapi import FastAPI

from app.api.v1.health import router as health_router
from app.api.v1.transactions import router as transaction_router

app = FastAPI()

app.include_router(
    health_router,
    prefix="/api/v1",
    tags=["Health"],
)

app.include_router(
    transaction_router,
    prefix="/api/v1",
    tags=["Transactions"],
)


@app.get("/")
def root():
    return {"message": "FinPulse API is running"}
