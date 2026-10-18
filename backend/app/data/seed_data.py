import math
import random
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List

def iso_offset(days: float = 0, hours: float = 0) -> str:
    dt = datetime.now(timezone.utc) + timedelta(days=days, hours=hours)
    return dt.isoformat()

def build_seed() -> Dict[str, Any]:
    # Pseudo-random generator with fixed seed for repeatability
    rnd = random.Random(2048)

    users = [
        {
            "id": "usr-eng",
            "name": "Maya Chen",
            "email": "engineer@aerosync.demo",
            "role": "maintenance_engineer",
            "password": "demo",
        },
        {
            "id": "usr-flt",
            "name": "Jonas Hale",
            "email": "fleet@aerosync.demo",
            "role": "fleet_manager",
            "password": "demo",
        },
        {
            "id": "usr-inv",
            "name": "Priya Nair",
            "email": "inventory@aerosync.demo",
            "role": "inventory_manager",
            "password": "demo",
        },
        {
            "id": "usr-adm",
            "name": "Alex Rivera",
            "email": "admin@aerosync.demo",
            "role": "administrator",
            "password": "demo",
        },
    ]

    aircraft_meta = [
        {"id": "AS-101", "type": "Narrowbody", "model": "A320neo", "fleet": "Alpha", "status": "operational", "healthScore": 92.0, "flightHours": 18420.0, "flightCycles": 11240, "lastMaintenance": iso_offset(-18), "nextInspection": iso_offset(21), "base": "SFO", "notes": "Synthetic demo airframe."},
        {"id": "AS-102", "type": "Narrowbody", "model": "A320neo", "fleet": "Alpha", "status": "watch", "healthScore": 71.0, "flightHours": 20110.0, "flightCycles": 12480, "lastMaintenance": iso_offset(-9), "nextInspection": iso_offset(4), "base": "SFO", "notes": "Demo aircraft for emerging engine vibration trend (ENG-204)."},
        {"id": "AS-103", "type": "Narrowbody", "model": "B737-8", "fleet": "Bravo", "status": "operational", "healthScore": 88.0, "flightHours": 15660.0, "flightCycles": 9800, "lastMaintenance": iso_offset(-30), "nextInspection": iso_offset(12), "base": "DEN", "notes": "Synthetic demo airframe."},
        {"id": "AS-104", "type": "Narrowbody", "model": "B737-8", "fleet": "Bravo", "status": "maintenance", "healthScore": 58.0, "flightHours": 22140.0, "flightCycles": 14110, "lastMaintenance": iso_offset(-2), "nextInspection": iso_offset(2), "base": "DEN", "notes": "In hangar; hydraulic pump replacement blocked in demo by parts shortage."},
        {"id": "AS-105", "type": "Widebody", "model": "A350-900", "fleet": "Charlie", "status": "operational", "healthScore": 95.0, "flightHours": 9800.0, "flightCycles": 3120, "lastMaintenance": iso_offset(-40), "nextInspection": iso_offset(6), "base": "JFK", "notes": "Upcoming C-check window used in planning scenario."},
        {"id": "AS-106", "type": "Regional", "model": "ATR 72-600", "fleet": "Delta", "status": "watch", "healthScore": 73.0, "flightHours": 14220.0, "flightCycles": 16890, "lastMaintenance": iso_offset(-11), "nextInspection": iso_offset(8), "base": "SEA", "notes": "Synthetic demo airframe."},
        {"id": "AS-107", "type": "Narrowbody", "model": "A320neo", "fleet": "Alpha", "status": "grounded", "healthScore": 41.0, "flightHours": 26300.0, "flightCycles": 17120, "lastMaintenance": iso_offset(-1), "nextInspection": iso_offset(1), "base": "SFO", "notes": "Grounded in demo pending avionics rack inspection."},
        {"id": "AS-108", "type": "Widebody", "model": "B787-9", "fleet": "Charlie", "status": "operational", "healthScore": 90.0, "flightHours": 12100.0, "flightCycles": 2880, "lastMaintenance": iso_offset(-22), "nextInspection": iso_offset(18), "base": "JFK", "notes": "Synthetic demo airframe."},
        {"id": "AS-109", "type": "Narrowbody", "model": "A220-300", "fleet": "Bravo", "status": "operational", "healthScore": 86.0, "flightHours": 7400.0, "flightCycles": 6100, "lastMaintenance": iso_offset(-14), "nextInspection": iso_offset(16), "base": "DEN", "notes": "Synthetic demo airframe."},
        {"id": "AS-110", "type": "Regional", "model": "ATR 72-600", "fleet": "Delta", "status": "maintenance", "healthScore": 55.0, "flightHours": 11880.0, "flightCycles": 13240, "lastMaintenance": iso_offset(-3), "nextInspection": iso_offset(3), "base": "SEA", "notes": "Landing gear inspection in progress (demo)."},
        {"id": "AS-111", "type": "Narrowbody", "model": "A320neo", "fleet": "Alpha", "status": "operational", "healthScore": 91.0, "flightHours": 9900.0, "flightCycles": 7200, "lastMaintenance": iso_offset(-25), "nextInspection": iso_offset(28), "base": "SFO", "notes": "Synthetic demo airframe."},
        {"id": "AS-112", "type": "Narrowbody", "model": "B737-8", "fleet": "Bravo", "status": "watch", "healthScore": 76.0, "flightHours": 17820.0, "flightCycles": 10990, "lastMaintenance": iso_offset(-7), "nextInspection": iso_offset(9), "base": "DEN", "notes": "ECS pack performance watch item (demo)."},
    ]

    component_plan = [
        {"id": "ENG-101", "aircraftId": "AS-101", "name": "CFM LEAP-1A left", "system": "engine", "health": 93.0},
        {"id": "HYD-101", "aircraftId": "AS-101", "name": "Green hydraulic circuit", "system": "hydraulic", "health": 90.0},
        {"id": "AVN-101", "aircraftId": "AS-101", "name": "Flight management suite", "system": "avionics", "health": 94.0},
        {"id": "ENG-204", "aircraftId": "AS-102", "name": "CFM LEAP-1A right", "system": "engine", "health": 62.0},
        {"id": "FUEL-102", "aircraftId": "AS-102", "name": "Center fuel pumps", "system": "fuel", "health": 84.0},
        {"id": "ECS-102", "aircraftId": "AS-102", "name": "Pack 2 ACS", "system": "ecs", "health": 80.0},
        {"id": "ENG-103", "aircraftId": "AS-103", "name": "LEAP-1B left", "system": "engine", "health": 89.0},
        {"id": "LG-103", "aircraftId": "AS-103", "name": "Main landing gear", "system": "landing_gear", "health": 87.0},
        {"id": "ELC-103", "aircraftId": "AS-103", "name": "IDG / electrical", "system": "electrical", "health": 88.0},
        {"id": "HYD-440", "aircraftId": "AS-104", "name": "Engine-driven hydraulic pump", "system": "hydraulic", "health": 48.0},
        {"id": "ENG-104", "aircraftId": "AS-104", "name": "LEAP-1B right", "system": "engine", "health": 72.0},
        {"id": "AVN-104", "aircraftId": "AS-104", "name": "Display suite", "system": "avionics", "health": 81.0},
        {"id": "ENG-105", "aircraftId": "AS-105", "name": "Trent XWB-84", "system": "engine", "health": 96.0},
        {"id": "FUEL-105", "aircraftId": "AS-105", "name": "Trim tank system", "system": "fuel", "health": 94.0},
        {"id": "LG-105", "aircraftId": "AS-105", "name": "Nose landing gear", "system": "landing_gear", "health": 93.0},
        {"id": "ENG-106", "aircraftId": "AS-106", "name": "PW127M left", "system": "engine", "health": 74.0},
        {"id": "ELC-106", "aircraftId": "AS-106", "name": "DC generation", "system": "electrical", "health": 78.0},
        {"id": "AVN-107", "aircraftId": "AS-107", "name": "IOM rack A", "system": "avionics", "health": 39.0},
        {"id": "ENG-107", "aircraftId": "AS-107", "name": "CFM LEAP-1A left", "system": "engine", "health": 68.0},
        {"id": "HYD-107", "aircraftId": "AS-107", "name": "Yellow hydraulic circuit", "system": "hydraulic", "health": 71.0},
        {"id": "ENG-108", "aircraftId": "AS-108", "name": "GEnx-1B", "system": "engine", "health": 91.0},
        {"id": "ECS-108", "aircraftId": "AS-108", "name": "Cabin pressure controller", "system": "ecs", "health": 90.0},
        {"id": "FUEL-108", "aircraftId": "AS-108", "name": "Jettison valves", "system": "fuel", "health": 92.0},
        {"id": "ENG-109", "aircraftId": "AS-109", "name": "PW1500G", "system": "engine", "health": 87.0},
        {"id": "LG-109", "aircraftId": "AS-109", "name": "Brake assembly", "system": "landing_gear", "health": 85.0},
        {"id": "LG-110", "aircraftId": "AS-110", "name": "Main landing gear", "system": "landing_gear", "health": 52.0},
        {"id": "HYD-110", "aircraftId": "AS-110", "name": "Aux hydraulic pump", "system": "hydraulic", "health": 66.0},
        {"id": "ENG-111", "aircraftId": "AS-111", "name": "CFM LEAP-1A right", "system": "engine", "health": 92.0},
        {"id": "AVN-111", "aircraftId": "AS-111", "name": "ADS-B transponder", "system": "avionics", "health": 93.0},
        {"id": "ECS-112", "aircraftId": "AS-112", "name": "Pack 1 ACS", "system": "ecs", "health": 69.0},
    ]

    components = []
    for c in component_plan:
        components.append({
            "id": c["id"],
            "aircraftId": c["aircraftId"],
            "name": c["name"],
            "system": c["system"],
            "healthScore": c["health"],
            "serial": f"SN-{c['id']}-{int(1000 + rnd.random() * 8000)}",
            "installedOn": iso_offset(-200 - int(rnd.random() * 400)),
            "cycles": int(2000 + rnd.random() * 12000),
            "hours": int(3000 + rnd.random() * 18000),
        })

    thresholds = []
    for c in components:
        base = [
            {"metric": "temperature", "componentId": c["id"], "min": 40.0, "max": 920.0, "cautionHigh": 780.0},
            {"metric": "vibration", "componentId": c["id"], "min": 0.0, "max": 4.5, "cautionHigh": 2.4},
            {"metric": "pressure", "componentId": c["id"], "min": 18.0, "max": 3200.0, "cautionLow": 40.0, "cautionHigh": 2800.0},
        ]
        if c["system"] == "engine":
            base.extend([
                {"metric": "oil_temp", "componentId": c["id"], "min": 40.0, "max": 160.0, "cautionHigh": 135.0},
                {"metric": "n1", "componentId": c["id"], "min": 15.0, "max": 105.0, "cautionHigh": 101.0},
                {"metric": "n2", "componentId": c["id"], "min": 30.0, "max": 110.0, "cautionHigh": 104.0},
            ])
        thresholds.extend(base)

    baselines = {
        "temperature": 540.0,
        "vibration": 1.1,
        "pressure": 210.0,
        "oil_temp": 98.0,
        "n1": 86.0,
        "n2": 91.0,
    }
    units = {
        "temperature": "°C",
        "vibration": "ips",
        "pressure": "psi",
        "oil_temp": "°C",
        "n1": "%",
        "n2": "%",
    }

    readings = []
    reading_count = 0
    for c in components:
        metrics = ["temperature", "vibration", "pressure", "oil_temp", "n1", "n2"] if c["system"] == "engine" else ["temperature", "vibration", "pressure"]
        for metric in metrics:
            for i in range(72, -1, -1):
                t = (datetime.now(timezone.utc) - timedelta(hours=i)).isoformat()
                val = baselines[metric] + (rnd.random() - 0.5) * (0.35 if metric == "vibration" else 18.0)
                if c["id"] == "ENG-204" and metric == "vibration":
                    ramp = max(0.0, (72 - i - 36) / 36.0)
                    val = 1.15 + ramp * 1.85 + (rnd.random() - 0.5) * 0.12
                if c["id"] == "HYD-440" and metric == "pressure":
                    val = 95.0 + (rnd.random() - 0.5) * 12.0
                if c["id"] == "ECS-112" and metric == "temperature":
                    val = 72.0 + (rnd.random() - 0.4) * 8.0

                reading_count += 1
                readings.append({
                    "id": f"rd-{reading_count}",
                    "aircraftId": c["aircraftId"],
                    "componentId": c["id"],
                    "metric": metric,
                    "value": round(val, 2),
                    "unit": units[metric],
                    "timestamp": t,
                    "simulated": True,
                })

    faults = [
        {"id": "FLT-01", "aircraftId": "AS-102", "componentId": "ENG-204", "code": "VIB-TREND", "summary": "Elevated right-engine vibration trend in simulated readings", "timestamp": iso_offset(0, -6), "resolved": False},
        {"id": "FLT-02", "aircraftId": "AS-104", "componentId": "HYD-440", "code": "HYD-PMP-PRESS", "summary": "Engine-driven pump pressure below caution band (demo)", "timestamp": iso_offset(-2), "resolved": False},
        {"id": "FLT-03", "aircraftId": "AS-107", "componentId": "AVN-107", "code": "IOM-COMMS", "summary": "Repeated IOM rack communication drops (demo log)", "timestamp": iso_offset(-1, -4), "resolved": False},
        {"id": "FLT-04", "aircraftId": "AS-110", "componentId": "LG-110", "code": "LG-WEAR", "summary": "Landing-gear inspection findings (demo)", "timestamp": iso_offset(-3), "resolved": False},
        {"id": "FLT-05", "aircraftId": "AS-112", "componentId": "ECS-112", "code": "PACK-PERF", "summary": "Pack 1 outlet temperature scatter (demo)", "timestamp": iso_offset(-1), "resolved": False},
        {"id": "FLT-06", "aircraftId": "AS-106", "componentId": "ENG-106", "code": "OIL-CONSUME", "summary": "Oil consumption watch item (demo)", "timestamp": iso_offset(-5), "resolved": True},
        {"id": "FLT-07", "aircraftId": "AS-101", "componentId": "ENG-101", "code": "BSI-OK", "summary": "Borescope complete — no findings (demo)", "timestamp": iso_offset(-18), "resolved": True},
    ]

    techs = ["Maya Chen", "Luis Ortega", "Samira Okonkwo", "Kenji Sato", "Riley Brooks"]
    maintenance = []
    for i, ac in enumerate(aircraft_meta):
        comps = [c for c in components if c["aircraftId"] == ac["id"]]
        maintenance.append({
            "id": f"MR-{ac['id']}-A",
            "aircraftId": ac["id"],
            "componentId": comps[0]["id"] if comps else None,
            "date": ac["lastMaintenance"],
            "type": "Line" if i % 2 == 0 else "A-check",
            "summary": f"Scheduled {'line' if i % 2 == 0 else 'A-check'} servicing (synthetic record)",
            "durationHours": 4.0 + (i % 8),
            "technician": techs[i % len(techs)],
        })
    maintenance.extend([
        {"id": "MR-102-VIB", "aircraftId": "AS-102", "componentId": "ENG-204", "date": iso_offset(-9), "type": "Inspection", "summary": "Vibration survey — within band at the time (demo)", "durationHours": 3.0, "technician": "Maya Chen"},
        {"id": "MR-104-HYD", "aircraftId": "AS-104", "componentId": "HYD-440", "date": iso_offset(-60), "type": "Replacement", "summary": "Previous EDP replacement (demo history)", "durationHours": 11.0, "technician": "Luis Ortega"},
        {"id": "MR-107-AVN", "aircraftId": "AS-107", "componentId": "AVN-107", "date": iso_offset(-1), "type": "Troubleshooting", "summary": "Avionics rack isolation in progress (demo)", "durationHours": 16.0, "technician": "Samira Okonkwo"},
    ])

    suppliers = [
        {"id": "SUP-01", "name": "Northwind Aero Spares", "region": "NA", "contact": "spares@northwind.demo"},
        {"id": "SUP-02", "name": "Helios Hydraulics", "region": "EU", "contact": "ops@helios-hyd.demo"},
        {"id": "SUP-03", "name": "Pacific Avionics", "region": "APAC", "contact": "desk@pacific-av.demo"},
    ]

    part_specs = [
        ("EDP-440", "Engine-driven hydraulic pump", ["HYD-440", "AS-104"], 0, 2, "Hangar B-12", "SUP-02", 12),
        ("VIB-SNS-12", "Engine vibration sensor pack", ["ENG-204", "AS-102"], 3, 2, "Stores A-04", "SUP-01", 6),
        ("IOM-RK-A", "IOM rack module", ["AVN-107", "AS-107"], 1, 1, "Avionics cage", "SUP-03", 18),
        ("LG-PIN-90", "Landing gear pivot pin", ["LG-110", "AS-110"], 4, 2, "Hangar C-02", "SUP-01", 9),
        ("PACK-VLV-1", "ACS pack flow valve", ["ECS-112", "AS-112"], 2, 2, "Stores A-11", "SUP-01", 8),
        ("OIL-FLT-7", "Engine oil filter", ["engine"], 24, 8, "Stores A-01", "SUP-01", 3),
        ("HYD-FLT-G", "Hydraulic filter (green)", ["hydraulic"], 11, 6, "Stores A-02", "SUP-02", 4),
        ("TIRE-MLG", "Main-gear tire", ["landing_gear"], 8, 4, "Hangar C-01", "SUP-01", 5),
        ("BRK-PAD-A", "Carbon brake heat pack", ["landing_gear"], 6, 3, "Hangar C-01", "SUP-01", 10),
        ("FUEL-PMP-C", "Center tank pump", ["fuel"], 5, 2, "Stores B-03", "SUP-01", 7),
        ("IDG-OIL", "IDG oil kit", ["electrical"], 9, 4, "Stores B-06", "SUP-01", 4),
        ("ADC-MOD", "Air data module", ["avionics"], 2, 2, "Avionics cage", "SUP-03", 14),
        ("FAN-ECS", "Cabin fan cartridge", ["ecs"], 7, 3, "Stores A-11", "SUP-01", 5),
        ("SEAL-HYD", "Hydraulic seal kit", ["hydraulic"], 18, 6, "Stores A-02", "SUP-02", 2),
        ("IGN-LEAD", "Ignition lead set", ["engine"], 4, 2, "Stores A-01", "SUP-01", 6),
        ("NWS-ACT", "Nosewheel steering actuator", ["landing_gear"], 1, 1, "Hangar C-02", "SUP-01", 16),
        ("BATT-NI", "Main battery", ["electrical"], 3, 2, "Stores B-06", "SUP-01", 11),
        ("TAT-PRB", "TAT probe", ["avionics"], 5, 2, "Avionics cage", "SUP-03", 8),
        ("PITOT-HT", "Pitot heater element", ["avionics"], 6, 2, "Avionics cage", "SUP-03", 7),
        ("APU-FLT", "APU oil filter", ["engine"], 10, 4, "Stores A-01", "SUP-01", 3),
        ("WAI-VLV", "Wing anti-ice valve", ["ecs"], 3, 2, "Stores A-11", "SUP-01", 9),
        ("CVR-SSD", "CVR storage module", ["avionics"], 2, 1, "Avionics cage", "SUP-03", 20),
        ("FDR-SSD", "FDR storage module", ["avionics"], 2, 1, "Avionics cage", "SUP-03", 20),
        ("ALT-ST", "Static inverter", ["electrical"], 2, 1, "Stores B-06", "SUP-01", 13),
        ("HYD-RSV", "Hydraulic reservoir bladder", ["hydraulic"], 1, 1, "Stores A-02", "SUP-02", 15),
        ("FUEL-VLV", "Crossfeed valve", ["fuel"], 4, 2, "Stores B-03", "SUP-01", 8),
        ("LG-DR-ACT", "Gear door actuator", ["landing_gear"], 2, 1, "Hangar C-02", "SUP-01", 12),
        ("EICAS-DSP", "EICAS display unit", ["avionics"], 1, 1, "Avionics cage", "SUP-03", 21),
        ("O2-GEN", "Crew oxygen generator", ["ecs"], 8, 3, "Stores A-08", "SUP-01", 6),
        ("SLAT-ACT", "Slat actuator", ["hydraulic"], 2, 1, "Hangar B-08", "SUP-02", 14),
        ("FLAP-TMU", "Flap PCU module", ["hydraulic"], 1, 1, "Hangar B-08", "SUP-02", 17),
        ("BLEED-PRV", "Bleed pressure regulator", ["engine"], 3, 2, "Stores A-01", "SUP-01", 10),
        ("FADEC-CH", "FADEC channel card", ["engine"], 1, 1, "Avionics cage", "SUP-03", 22),
        ("TR-UNIT", "Transformer rectifier", ["electrical"], 2, 1, "Stores B-06", "SUP-01", 12),
        ("WSHLD-HT", "Windshield heat controller", ["electrical"], 3, 1, "Stores B-06", "SUP-01", 9),
        ("CB-PANEL", "C/B panel module", ["electrical"], 2, 1, "Stores B-06", "SUP-01", 11),
        ("HYD-QDC", "Hydraulic QDC coupling", ["hydraulic"], 14, 4, "Stores A-02", "SUP-02", 3),
        ("ENG-MNT", "Engine mount bushing", ["engine"], 6, 2, "Hangar B-01", "SUP-01", 8),
        ("FUEL-QTY", "Fuel quantity probe", ["fuel"], 5, 2, "Stores B-03", "SUP-01", 7),
        ("LG-PROX", "Proximity sensor", ["landing_gear"], 9, 3, "Hangar C-02", "SUP-01", 4),
    ]

    parts = []
    for i, p in enumerate(part_specs):
        parts.append({
            "id": f"PRT-{str(i + 1).zfill(2)}",
            "partNumber": p[0],
            "name": p[1],
            "compatible": list(p[2]),
            "qtyAvailable": p[3],
            "qtyReserved": 0 if i == 0 else min(p[3], p[4] // 3),
            "minStock": p[4],
            "location": p[5],
            "supplierId": p[6],
            "leadTimeDays": p[7],
            "shelfLife": iso_offset(180) if i % 9 == 0 else None,
        })

    statuses = ["open", "planned", "in_progress", "awaiting_parts", "awaiting_inspection", "completed"]
    wo_titles = [
        "Line inspection", "Oil service", "Borescope", "Filter replacement", "Avionics bite check",
        "Gear lubrication", "Pack performance check", "Hydraulic leak survey", "IDG oil service", "Probe replacement"
    ]

    work_orders = []
    for i in range(47):
        ac = aircraft_meta[i % len(aircraft_meta)]
        comps = [c for c in components if c["aircraftId"] == ac["id"]]
        comp = comps[i % max(1, len(comps))] if comps else None
        status = statuses[i % 6] if i < 8 else statuses[(i * 3) % 6]
        part = parts[(i * 5) % len(parts)]
        work_orders.append({
            "id": f"WO-{1100 + i}",
            "aircraftId": ac["id"],
            "componentId": comp["id"] if comp else None,
            "title": f"{wo_titles[i % len(wo_titles)]} — {ac['id']}",
            "faultDescription": f"Synthetic work package {i + 1} for demonstration workflows.",
            "priority": "critical" if i % 11 == 0 else "high" if i % 4 == 0 else "medium" if i % 3 == 0 else "low",
            "assignee": techs[i % len(techs)],
            "team": "Line North" if i % 2 == 0 else "Hangar South",
            "requiredParts": [{"partId": part["id"], "quantity": 1, "reserved": 0 if status == "completed" else min(1, part["qtyReserved"])}] if part else [],
            "estimatedHours": float(2 + (i % 10)),
            "plannedStart": iso_offset(-10 + (i % 20)),
            "dueDate": iso_offset(-4 + (i % 22)),
            "status": status,
            "notes": "Parts check required before continuation." if status == "awaiting_parts" else "Demo work order.",
            "completionNotes": "Closed in demo dataset. Not a release-to-service record." if status == "completed" else "",
            "checklist": [
                {"id": "c1", "label": "Review technical log", "done": status != "open"},
                {"id": "c2", "label": "Confirm tooling & AMM task", "done": status in ("completed", "awaiting_inspection")},
                {"id": "c3", "label": "Independent inspection (as required)", "done": status == "completed"},
            ],
            "createdAt": iso_offset(-20 + (i % 12)),
            "updatedAt": iso_offset(-1),
        })

    work_orders.append({
        "id": "WO-1045",
        "aircraftId": "AS-104",
        "componentId": "HYD-440",
        "title": "Replace engine-driven hydraulic pump",
        "faultDescription": "Pump pressure below caution band in simulated readings. Inspection/replacement package opened for demo Scenario B.",
        "priority": "critical",
        "assignee": "Luis Ortega",
        "team": "Hangar South",
        "requiredParts": [{"partId": "PRT-01", "quantity": 1, "reserved": 0}],
        "estimatedHours": 14.0,
        "plannedStart": iso_offset(-1),
        "dueDate": iso_offset(1),
        "status": "awaiting_parts",
        "notes": "EDP-440 has zero available stock in the demo inventory.",
        "completionNotes": "",
        "checklist": [
            {"id": "c1", "label": "Lockout / tagout per AMM", "done": True},
            {"id": "c2", "label": "Pump swap", "done": False},
            {"id": "c3", "label": "Leak and pressure test", "done": False},
        ],
        "createdAt": iso_offset(-2),
        "updatedAt": iso_offset(0, -2),
        "sourceAlertId": "AL-INIT-HYD",
    })

    schedules = [
        {"id": "SCH-101", "aircraftId": "AS-101", "title": "Line check & service", "kind": "preventive", "start": iso_offset(1, 8), "end": iso_offset(1, 14), "notes": "Overnight bay assignment."},
        {"id": "SCH-102", "aircraftId": "AS-102", "title": "Vibration investigation — ENG-204", "kind": "predicted_inspection", "start": iso_offset(2, 6), "end": iso_offset(2, 18), "componentId": "ENG-204", "notes": "Follow-up survey."},
        {"id": "SCH-104", "aircraftId": "AS-104", "title": "Hydraulic pump swap (WO-1045)", "kind": "work_order", "start": iso_offset(0, 10), "end": iso_offset(1, 20), "workOrderId": "WO-1045", "notes": "Parts delivery pending."},
        {"id": "SCH-105", "aircraftId": "AS-105", "title": "Heavy maintenance C-check window", "kind": "inspection", "start": iso_offset(5, 0), "end": iso_offset(9, 0), "notes": "Hangar bay Charlie reserved."},
        {"id": "SCH-107", "aircraftId": "AS-107", "title": "Avionics rack harness replacement", "kind": "work_order", "start": iso_offset(0, 4), "end": iso_offset(2, 12), "componentId": "AVN-107", "notes": "Aircraft grounded."},
        {"id": "SCH-110", "aircraftId": "AS-110", "title": "Main gear pin inspection", "kind": "inspection", "start": iso_offset(3, 8), "end": iso_offset(3, 16), "notes": "SEA line maintenance."},
    ]

    alerts = [
        {
            "id": "AL-INIT-VIB",
            "type": "component_anomaly",
            "severity": "critical",
            "aircraftId": "AS-102",
            "componentId": "ENG-204",
            "title": "Vibration caution exceedance — ENG-204",
            "description": "CFM LEAP-1A right vibration crossed 2.4 ips caution threshold in synthetic stream.",
            "recommendedAction": "Inspect borescope and sensor mount. Human sign-off required.",
            "timestamp": iso_offset(0, -1),
            "source": "health-monitor",
            "read": False,
            "acknowledged": False,
            "resolved": False,
            "fingerprint": "ENG-204:vibration:caution",
        },
        {
            "id": "AL-INIT-HYD",
            "type": "spare_parts_shortage",
            "severity": "high",
            "aircraftId": "AS-104",
            "componentId": "HYD-440",
            "workOrderId": "WO-1045",
            "partId": "PRT-01",
            "title": "Shortage blocking WO-1045 — EDP-440",
            "description": "EDP-440 has 0 units available. Hangar hold active.",
            "recommendedAction": "Expedite supplier SUP-02 order or loan from pooled inventory.",
            "timestamp": iso_offset(-1, -6),
            "source": "inventory-monitor",
            "read": True,
            "acknowledged": True,
            "resolved": False,
            "fingerprint": "WO-1045:PRT-01:shortage",
        },
        {
            "id": "AL-INIT-AVN",
            "type": "component_anomaly",
            "severity": "critical",
            "aircraftId": "AS-107",
            "componentId": "AVN-107",
            "title": "Avionics IOM communication failure",
            "description": "Repeated bus timeout on rack A. Airframe grounded per demo flight ops.",
            "recommendedAction": "Carry out AMM 31-20 troubleshooting before next flight assignment.",
            "timestamp": iso_offset(-1, -12),
            "source": "flight-ops-logger",
            "read": False,
            "acknowledged": False,
            "resolved": False,
            "fingerprint": "AVN-107:avionics:bus_error",
        },
    ]

    purchase_requests = [
        {
            "id": "PR-901",
            "partId": "PRT-01",
            "quantity": 2,
            "status": "submitted",
            "createdAt": iso_offset(-1),
            "note": "Expedite request for WO-1045 on AS-104.",
            "expectedLeadDays": 12,
        }
    ]

    transactions = [
        {
            "id": "TX-01",
            "partId": "PRT-02",
            "type": "reserve",
            "quantity": 1,
            "at": iso_offset(-2),
            "note": "Reserved for vibration survey pack",
            "userId": "usr-eng",
        }
    ]

    audit = [
        {
            "id": "AUD-INIT",
            "at": iso_offset(0, -2),
            "userId": "usr-adm",
            "action": "system-init",
            "detail": "AeroSync AI backend initialized with demo flight and maintenance data.",
        }
    ]

    return {
        "users": users,
        "aircraft": aircraft_meta,
        "components": components,
        "thresholds": thresholds,
        "readings": readings,
        "faults": faults,
        "maintenance": maintenance,
        "suppliers": suppliers,
        "parts": parts,
        "workOrders": work_orders,
        "schedules": schedules,
        "alerts": alerts,
        "purchaseRequests": purchase_requests,
        "transactions": transactions,
        "audit": audit,
    }
