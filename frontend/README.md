# ✈️ AeroSync AI — Frontend Application

A mission-ready modern web interface for **AeroSync AI** — an Aircraft Fleet Health, Digital Twin & Predictive Maintenance Suite.

Built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS v4**, **Recharts**, and **Lucide Icons**.

---

## 🌟 Application Features & Screens

- **Executive Fleet Dashboard (`/dashboard`)**: Fleet readiness donut charts, operational availability percentages, high-priority alerts, base allocation, and quick maintenance status.
- **Fleet Management (`/fleet`)**: Multi-fleet filtering (`Alpha`, `Bravo`, `Charlie`, `Delta`), real-time search, flight hours/cycles, and validated CSV bulk import & export.
- **Interactive Digital Twin (`/twin`)**: Real-time vector schematic of the aircraft with interactive clickable systems:
  - CFM LEAP-1A / LEAP-1B Turbofan Engines
  - Green/Yellow Hydraulic Distribution
  - Center & Trim Tank Fuel Systems
  - Main & Nose Landing Gear
  - DC Generation & Electrical Distribution
  - Integrated Avionics & IOM Racks
  - ECS Environmental Packs & ACS Valves
- **Aircraft Profile Deep-Dive (`/aircraft/:id`)**: Tail-level sensor telemetry inspection, component degradation history, open work packages, and maintenance logs.
- **Predictive Risk & Anomaly Scoring (`/predictive`)**: Multi-metric anomaly detection, trend slopes, baseline risk scores, factor breakdowns, and AMM inspection guidance.
- **Work Orders & Maintenance Board (`/work-orders`)**: Task lifecycle management (`open`, `planned`, `in_progress`, `awaiting_parts`, `awaiting_inspection`, `completed`), parts allocation, and technician checklists.
- **Inventory & Supply Chain (`/inventory`)**: Warehouse bin locations, spare parts stock levels, automated low-stock warnings, reservations, manual adjustments, and supplier purchase requests.
- **Timeline & Hangar Scheduling (`/timeline`)**: Maintenance schedule calendar, hangar load capacity metrics, and automated schedule conflict resolution.
- **Fleet Insights & Query Engine (`/insights`)**: Deterministic and AI natural-language calculation answering fleet queries and rendering dynamic executive briefings.
- **Alert Triage (`/alerts`)**: Multi-level alerts (`info`, `warning`, `high`, `critical`) with one-click acknowledgement, read status tracking, and audit-logged resolutions.
- **Interactive Scenarios & Simulation Controls (`/demo`, `/settings`)**:
  - Scenario A: Early CFM LEAP-1A vibration trend detection on AS-102.
  - Scenario B: EDP-440 hydraulic pump zero-stock shortage holding WO-1045.
  - Scenario C: C-check heavy maintenance scheduling window on AS-105.

---

## 🛠️ Getting Started

### 1. Install Node Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
The application will launch at [http://localhost:5173](http://localhost:5173).

### 3. Build for Production
```bash
npm run build
```

---

## 🔗 Backend Connection

The frontend contains an integrated API client in `src/services/api.ts` configured for `http://localhost:8000/api` and `ws://localhost:8000/ws/telemetry`.
When the backend server in the `../backend` directory is running, the frontend can seamlessly sync with real-time backend updates and live WebSocket telemetry feeds!

---

## 👥 Demo Logins

| Role | Email | Password |
|---|---|---|
| Maintenance Engineer | `engineer@aerosync.demo` | `demo` |
| Fleet Manager | `fleet@aerosync.demo` | `demo` |
| Inventory Manager | `inventory@aerosync.demo` | `demo` |
| Administrator | `admin@aerosync.demo` | `demo` |
