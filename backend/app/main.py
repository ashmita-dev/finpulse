import asyncio

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.health import router as health_router
from app.api.v1.transactions import router as transaction_router
from app.kafka.websocket_bridge import run_websocket_bridge


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(
            f"🔌 WebSocket connected | Active connections: {len(self.active_connections)}"
        )

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(
                f"🔌 WebSocket disconnected | Active connections: {len(self.active_connections)}"
            )

    async def broadcast(self, message: dict):
        print("📡 Broadcasting WebSocket message")
        print(
            f"👥 Active WebSocket connections: {len(self.active_connections)}"
        )
        print(f"📨 Message type: {message.get('type')}")

        disconnected = []

        for index, connection in enumerate(
            list(self.active_connections),
            start=1,
        ):
            try:
                await connection.send_json(message)
                print(
                    f"✅ WebSocket message sent successfully to connection {index}"
                )
            except Exception as error:
                print(
                    f"❌ WebSocket send failed for connection {index}: {error}"
                )
                disconnected.append(connection)

        for connection in disconnected:
            self.disconnect(connection)


app = FastAPI()

app.state.connection_manager = ConnectionManager()
app.state.websocket_bridge_task = None

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


@app.on_event("startup")
async def startup_event():
    app.state.websocket_bridge_task = asyncio.create_task(
        run_websocket_bridge(app)
    )

    print("🚀 FinPulse WebSocket Kafka bridge started")


@app.on_event("shutdown")
async def shutdown_event():
    task = app.state.websocket_bridge_task

    if task is not None:
        task.cancel()

        try:
            await task
        except asyncio.CancelledError:
            pass

    print("🛑 FinPulse WebSocket Kafka bridge stopped")


@app.websocket("/ws/transactions")
async def transaction_websocket(websocket: WebSocket):
    manager = app.state.connection_manager

    await manager.connect(websocket)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.get("/")
def root():
    return {"message": "FinPulse API is running"}