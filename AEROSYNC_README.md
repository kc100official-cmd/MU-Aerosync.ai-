# ✈️ AeroSync AI — Full-Stack Architecture

This repository has been structured into dedicated **Frontend** and **Backend** directories based on [kanhapandey18/aerosync-ai](https://github.com/kanhapandey18/aerosync-ai/tree/master).

---

## 📁 Project Structure

```
├── frontend/                     # AeroSync AI Frontend (React 19 + TypeScript + Vite + Tailwind CSS)
│   ├── public/                   # Static icons & assets
│   ├── src/
│   │   ├── assets/               # Images and SVG icons
│   │   ├── components/           # UI primitives, App Shell & Aircraft Digital Twin SVG Schematic
│   │   ├── data/                 # Seed dataset generator (12 tails, components, sensors)
│   │   ├── lib/                  # Utility functions (cn, format, id generator)
│   │   ├── pages/                # 14 distinct application pages & views
│   │   ├── services/             # Deterministic calculations, planner, CSV, and API client
│   │   ├── store/                # React Context application state provider
│   │   └── types/                # TypeScript interfaces and domain models
│   ├── package.json              # Frontend dependencies and npm scripts
│   ├── vite.config.ts            # Vite bundler configuration
│   └── README.md                 # Frontend documentation
│
└── backend/                      # AeroSync AI Backend (Python 3.10+ FastAPI + Uvicorn + WebSockets)
    ├── app/
    │   ├── data/                 # In-memory thread-safe database and seed data
    │   ├── models/               # Pydantic schemas and API request/response models
    │   ├── routers/              # 11 REST API routers (fleet, telemetry, predictive, etc.)
    │   ├── services/             # Predictive risk scoring, AI query engine, planning, simulation
    │   └── main.py               # FastAPI entrypoint with CORS & WebSocket streaming
    ├── test_backend.py           # Automated test suite (all tests passing)
    ├── run_backend.bat           # Windows 1-click batch launcher
    ├── run_backend.ps1           # PowerShell launcher
    ├── requirements.txt          # Python dependencies
    └── README.md                 # Backend API documentation
```

---

## 🚀 Running the Full Stack

### 1. Launch Backend
In a terminal:
```powershell
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- **REST API**: `http://localhost:8000/api`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **WebSocket Live Telemetry Feed**: `ws://localhost:8000/ws/telemetry`

To run backend tests:
```powershell
python backend/test_backend.py
```

### 2. Launch Frontend
In a separate terminal:
```powershell
cd frontend
npm install
npm run dev
```
- **Application URL**: `http://localhost:5173`

---

## 👥 Demo Logins

| Role | Email | Password |
|---|---|---|
| Maintenance Engineer | `engineer@aerosync.demo` | `demo` |
| Fleet Manager | `fleet@aerosync.demo` | `demo` |
| Inventory Manager | `inventory@aerosync.demo` | `demo` |
| Administrator | `admin@aerosync.demo` | `demo` |
