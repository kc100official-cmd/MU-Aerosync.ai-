import asyncio
import random
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import WebSocket
from ..data.database import db
from .predictive import maybe_anomaly_alert

class TelemetrySimulator:
    def __init__(self):
        self.active_websockets: List[WebSocket] = []
        self._task: Optional[asyncio.Task] = None
        self.running: bool = False

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_websockets.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_websockets:
            self.active_websockets.remove(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        for ws in list(self.active_websockets):
            try:
                await ws.send_json(message)
            except Exception:
                self.disconnect(ws)

    def generate_tick(self) -> Optional[Dict[str, Any]]:
        if db.sim_paused:
            return None

        live_ac = db.sim_live_aircraft
        comps = [c for c in db.data.get("components", []) if c.get("aircraftId") == live_ac]
        if not comps:
            return None
        c = comps[0]

        readings = [r for r in db.data.get("readings", []) if r.get("componentId") == c["id"] and r.get("metric") == "vibration"]
        last_val = readings[-1]["value"] if readings else 1.2
        new_val = round(last_val + (random.random() - 0.42) * 0.08, 2)

        reading = {
            "id": f"rd-live-{uuid.uuid4().hex[:8]}",
            "aircraftId": c["aircraftId"],
            "componentId": c["id"],
            "metric": "vibration",
            "value": new_val,
            "unit": "ips",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "simulated": True,
        }

        # Append reading keeping last 8000
        all_readings = db.data.get("readings", [])
        all_readings.append(reading)
        if len(all_readings) > 8000:
            db.data["readings"] = all_readings[-8000:]

        alert = maybe_anomaly_alert(db.data, reading)
        if alert:
            alerts = db.data.get("alerts", [])
            if not any(a.get("fingerprint") == alert["fingerprint"] and not a.get("resolved") for a in alerts):
                alerts.insert(0, alert)

        return {"reading": reading, "alert": alert}

    async def run_loop(self):
        self.running = True
        while self.running:
            try:
                tick_data = self.generate_tick()
                if tick_data and self.active_websockets:
                    await self.broadcast(tick_data)
            except Exception:
                pass
            await asyncio.sleep(3.5)

    def start(self):
        if not self._task or self._task.done():
            self._task = asyncio.create_task(self.run_loop())

    def stop(self):
        self.running = False
        if self._task:
            self._task.cancel()

simulator = TelemetrySimulator()
