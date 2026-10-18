# ✈️ AeroSync AI — Backend Service

A high-performance Python FastAPI backend providing enterprise telemetry ingestion, digital twin analytics, predictive maintenance risk scoring, AI/deterministic natural language query answering, work order management, and inventory tracking for the **AeroSync AI** platform.

---

## 🚀 Features

- **Fleet Management (`/api/fleet`)**: Real-time aircraft registry across fleets (Alpha, Bravo, Charlie, Delta), flight hours, flight cycles, inspection dates, and CSV import/export.
- **Component Subsystems (`/api/components`)**: Health tracking for engine, hydraulic, electrical, avionics, landing gear, fuel, and ECS packs.
- **Live Telemetry & WebSocket Streaming (`/api/telemetry`, `/ws/telemetry`)**: Continuous sensor feed generation (temperature, vibration, pressure, oil temp, N1, N2) with automatic caution band violation alerts.
- **Predictive Risk Engine (`/api/predictive`)**: Baseline anomaly scoring, trend slope calculation, multi-factor risk attribution, and inspection recommendations.
- **Work Orders (`/api/work-orders`)**: Complete maintenance lifecycle management (`open`, `planned`, `in_progress`, `awaiting_parts`, `awaiting_inspection`, `completed`), required parts reservation, checklists, and automated creation from anomaly alerts.
- **Inventory & Supply Chain (`/api/inventory`)**: Spare parts catalog, min-stock safety threshold checks, part allocation & reservations, purchase requests, and transaction ledger.
- **Maintenance Planning (`/api/schedules`)**: Gantt maintenance window scheduling, hangar conflict detection, and automated schedule suggestions.
- **AI & Deterministic Query Engine (`/api/insights`)**: Fleet query answering (e.g., *"Which aircraft need attention first?"*, *"Which work orders are blocked?"*) and executive summary generation.
- **Role-Based Auth & Auditing (`/api/auth`, `/api/audit`)**: Pre-configured demo accounts (`maintenance_engineer`, `fleet_manager`, `inventory_manager`, `administrator`) and comprehensive audit trails.

---

## 📦 Requirements

- Python 3.10+
- Dependencies:
  ```txt
  fastapi>=0.115.0
  uvicorn>=0.30.0
  pydantic>=2.7.0
  python-multipart>=0.0.9
  websockets>=12.0
  ```

---

## 🏃 Quick Start

### 1. Start the Server
Run with PowerShell or Command Prompt:
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Or execute the script:
- Windows Batch: `run_backend.bat`
- PowerShell: `.\run_backend.ps1`

### 2. Interactive Swagger Documentation
Open your browser at:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### 3. Run Automated Tests
```bash
python test_backend.py
```

---

## 📡 Key API Routes

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API status and endpoint directory |
| `GET` | `/health` | Service health check |
| `POST` | `/api/auth/login` | User sign-in with credentials |
| `GET` | `/api/fleet` | List fleet aircraft (filter by fleet/query) |
| `GET` | `/api/fleet/{id}` | Get single aircraft details |
| `GET` | `/api/fleet/export/csv` | Download full fleet CSV data |
| `GET` | `/api/components` | Subsystems filtered by aircraft |
| `GET` | `/api/telemetry/readings` | Sensor telemetry history |
| `POST` | `/api/telemetry/control` | Pause/resume simulation, change target tail |
| `POST` | `/api/telemetry/tick` | Trigger synthetic sensor telemetry tick |
| `WS` | `/ws/telemetry` | Live real-time WebSocket telemetry stream |
| `GET` | `/api/predictive/risks` | Ranked fleet-wide risk assessments |
| `GET` | `/api/predictive/narrative/{id}` | Component risk explanation narrative |
| `GET` | `/api/work-orders` | Work orders (filter by status/priority) |
| `POST` | `/api/work-orders` | Create new work order |
| `POST` | `/api/work-orders/from-alert/{id}` | Open work order directly from alert |
| `GET` | `/api/inventory/parts` | Inventory parts catalog & stock levels |
| `POST` | `/api/inventory/reserve` | Reserve parts for a work order |
| `POST` | `/api/inventory/adjust` | Adjust warehouse inventory count |
| `POST` | `/api/inventory/purchases` | Create purchase requisition |
| `GET` | `/api/schedules` | Maintenance calendar schedules |
| `GET` | `/api/schedules/conflicts` | Overlapping hangar schedule conflict detector |
| `GET` | `/api/schedules/suggestions` | Smart maintenance scheduling proposals |
| `POST` | `/api/insights/query` | Natural language / deterministic query answering |
| `GET` | `/api/insights/executive-brief` | Dynamic executive operational briefing |
| `GET` | `/api/alerts` | Active and resolved fleet alerts |
| `POST` | `/api/alerts/{id}/resolve` | Resolve alert with audit note |
| `POST` | `/api/audit/reset-demo` | Reset state to initial demo seed |

---

## 👤 Demo User Accounts

| Role | Email | Password |
|---|---|---|
| Maintenance Engineer | `engineer@aerosync.demo` | `demo` |
| Fleet Manager | `fleet@aerosync.demo` | `demo` |
| Inventory Manager | `inventory@aerosync.demo` | `demo` |
| Administrator | `admin@aerosync.demo` | `demo` |
