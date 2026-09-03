from fastapi import FastAPI
from app.api.v1.health import router as health_router

app = FastAPI()

app.include_router(health_router)


@app.get("/")
def root():
    return {"message": "FinPulse API is running"}