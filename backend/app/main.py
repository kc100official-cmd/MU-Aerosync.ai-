import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from .routers import (
    auth_router,
    fleet_router,
    components_router,
    telemetry_router,
    predictive_router,
    work_orders_router,
    inventory_router,
    schedules_router,
    alerts_router,
    insights_router,
    audit_router,
)
from .services.simulator import simulator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("aerosync-backend")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting AeroSync AI Telemetry Background Simulator...")
    simulator.start()
    yield
    logger.info("Shutting down AeroSync AI Telemetry Simulator...")
    simulator.stop()

app = FastAPI(
    title="AeroSync AI API",
    description="Backend API for AeroSync AI — Aircraft Fleet Health, Digital Twin & Predictive Maintenance Suite",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all domain API routers
app.include_router(auth_router)
app.include_router(fleet_router)
app.include_router(components_router)
app.include_router(telemetry_router)
app.include_router(predictive_router)
app.include_router(work_orders_router)
app.include_router(inventory_router)
app.include_router(schedules_router)
app.include_router(alerts_router)
app.include_router(insights_router)
app.include_router(audit_router)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await simulator.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        simulator.disconnect(websocket)
    except Exception:
        simulator.disconnect(websocket)

# Check for compiled frontend dist to serve all-in-one
dist_paths = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static")),
]
static_dir = next((p for p in dist_paths if os.path.exists(p) and os.path.isdir(p)), None)

if static_dir:
    assets_dir = os.path.join(static_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        target = os.path.join(static_dir, full_path)
        if full_path and os.path.exists(target) and os.path.isfile(target):
            return FileResponse(target)
        return FileResponse(os.path.join(static_dir, "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "system": "AeroSync AI Backend",
            "status": "online",
            "version": "1.0.0",
            "docs": "/docs",
            "note": "Frontend dist not found. Run 'npm run build' in frontend/ to enable unified UI serving."
        }
