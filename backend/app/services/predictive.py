from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from ..models.schemas import RiskAssessment, RiskFactor, Alert, SensorReading

DISCLAIMER = (
    "Baseline demonstration score from configured thresholds and synthetic readings. "
    "Not a trained failure model, remaining-useful-life estimate, or certified diagnosis. "
    "Cannot authorize aircraft release."
)

def latest_reading(readings: List[Dict[str, Any]], component_id: str, metric: str) -> Optional[Dict[str, Any]]:
    filtered = [r for r in readings if r.get("componentId") == component_id and r.get("metric") == metric]
    if not filtered:
        return None
    return sorted(filtered, key=lambda x: x.get("timestamp", ""), reverse=True)[0]

def series_readings(readings: List[Dict[str, Any]], component_id: str, metric: str) -> List[Dict[str, Any]]:
    filtered = [r for r in readings if r.get("componentId") == component_id and r.get("metric") == metric]
    return sorted(filtered, key=lambda x: x.get("timestamp", ""))

def calc_slope(values: List[float]) -> float:
    if len(values) < 4:
        return 0.0
    n = min(24, len(values))
    slice_vals = values[-n:]
    return (slice_vals[-1] - slice_vals[0]) / n

def assess_component(data: Dict[str, Any], component: Dict[str, Any]) -> Dict[str, Any]:
    comp_id = component["id"]
    th = [t for t in data.get("thresholds", []) if t.get("componentId") == comp_id]
    factors: List[Dict[str, Any]] = []
    anomalies: List[str] = []
    score = 100.0 - float(component.get("healthScore", 80.0))

    readings = data.get("readings", [])
    vib_series = series_readings(readings, comp_id, "vibration")
    vib_latest = latest_reading(readings, comp_id, "vibration")
    vib_th = next((t for t in th if t.get("metric") == "vibration"), None)

    if vib_latest and vib_th:
        caution_val = vib_th.get("cautionHigh") or vib_th.get("max", 4.5)
        if vib_latest["value"] > caution_val:
            anomalies.append(f"Vibration {vib_latest['value']} {vib_latest['unit']} above caution band {caution_val}")
            factors.append({
                "label": "Vibration caution exceedance",
                "weight": 22.0,
                "detail": f"Latest simulated vibration {vib_latest['value']} {vib_latest['unit']} vs caution {caution_val}.",
            })
            score += 18.0

        sl = calc_slope([r["value"] for r in vib_series])
        if sl > 0.02:
            factors.append({
                "label": "Rising vibration trend",
                "weight": 16.0,
                "detail": f"Recent simulated samples trend upward (~{sl:.3f} per hour window).",
            })
            score += 12.0

    press_latest = latest_reading(readings, comp_id, "pressure")
    p_th = next((t for t in th if t.get("metric") == "pressure"), None)
    if press_latest and p_th and p_th.get("cautionLow") is not None:
        if press_latest["value"] < p_th["cautionLow"]:
            anomalies.append(f"Pressure {press_latest['value']} below caution low {p_th['cautionLow']}")
            factors.append({
                "label": "Pressure below caution",
                "weight": 20.0,
                "detail": f"Latest simulated pressure {press_latest['value']} {press_latest['unit']}.",
            })
            score += 16.0

    open_faults = [f for f in data.get("faults", []) if f.get("componentId") == comp_id and not f.get("resolved")]
    if open_faults:
        factors.append({
            "label": "Open technical-log items",
            "weight": 10.0 + len(open_faults) * 4.0,
            "detail": ", ".join(f.get("code", "") for f in open_faults),
        })
        score += 8.0 + len(open_faults) * 3.0

    ac = next((a for a in data.get("aircraft", []) if a.get("id") == component.get("aircraftId")), None)
    if ac and ac.get("nextInspection"):
        try:
            insp_dt = datetime.fromisoformat(ac["nextInspection"].replace("Z", "+00:00"))
            now_dt = datetime.now(timezone.utc)
            days_due = (insp_dt - now_dt).total_seconds() / 86400.0
            if days_due < 7:
                factors.append({
                    "label": "Inspection window nearby",
                    "weight": 8.0,
                    "detail": f"Next inspection date in demo calendar: {ac['nextInspection'][:10]}.",
                })
                score += 5.0
        except Exception:
            pass

    score = max(0.0, min(100.0, round(score)))
    category = "grounded" if score >= 70 else "maintenance_required" if score >= 45 else "watch" if score >= 28 else "healthy"
    priority = "urgent" if score >= 55 else "soon" if score >= 32 else "routine"

    if priority == "urgent":
        action = f"Review {comp_id} evidence, validate against approved procedures, and open an inspection work order if warranted."
    elif priority == "soon":
        action = f"Schedule a planned review of {comp_id}. Do not treat this score as a removal requirement."
    else:
        action = f"Continue routine monitoring of {comp_id} within the approved maintenance programme."

    last_any = latest_reading(readings, comp_id, "vibration") or latest_reading(readings, comp_id, "temperature")

    return {
        "componentId": comp_id,
        "aircraftId": component.get("aircraftId", ""),
        "riskScore": score,
        "category": category,
        "anomalies": anomalies,
        "factors": factors,
        "recommendedAction": action,
        "inspectionPriority": priority,
        "dataFreshness": last_any.get("timestamp", "n/a") if last_any else "n/a",
        "quality": "complete" if last_any else "partial",
        "method": "baseline-anomaly-score",
        "disclaimer": DISCLAIMER,
    }

def rank_risks(data: Dict[str, Any]) -> List[Dict[str, Any]]:
    assessments = [assess_component(data, c) for c in data.get("components", [])]
    return sorted(assessments, key=lambda x: x["riskScore"], reverse=True)

def narrative_for(assessment: Dict[str, Any], component_name: str) -> str:
    factors = assessment.get("factors", [])
    if not factors:
        return (
            f"Component {assessment['componentId']} ({component_name}) currently scores {assessment['riskScore']} "
            f"on the demonstration baseline. No dominant anomaly factor is present in the loaded synthetic set."
        )
    top = factors[0]
    return (
        f"Component {assessment['componentId']} ({component_name}) has {top['label'].lower()} across recent simulated readings. "
        f"{assessment['recommendedAction']} {assessment['disclaimer']}"
    )

def maybe_anomaly_alert(data: Dict[str, Any], reading: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    comp_id = reading.get("componentId")
    metric = reading.get("metric")
    th = next((t for t in data.get("thresholds", []) if t.get("componentId") == comp_id and t.get("metric") == metric), None)
    if not th:
        return None

    val = reading.get("value", 0.0)
    hit = (
        val > th.get("max", 999999) or
        val < th.get("min", -999999) or
        (th.get("cautionHigh") is not None and val > th["cautionHigh"]) or
        (th.get("cautionLow") is not None and val < th["cautionLow"])
    )
    if not hit:
        return None

    is_crit = val > th.get("max", 999999) or val < th.get("min", -999999)
    fingerprint = f"{comp_id}:{metric}:caution"
    return {
        "id": f"AL-LIVE-{fingerprint}",
        "type": "component_anomaly",
        "severity": "critical" if is_crit else "high",
        "aircraftId": reading.get("aircraftId"),
        "componentId": comp_id,
        "title": f"Threshold event — {comp_id} {metric}",
        "description": f"Simulated {metric} reading {val} {reading.get('unit')} crossed a configured band.",
        "recommendedAction": "Inspect supporting samples. Acknowledgement is not evidence that a fault is cleared.",
        "timestamp": reading.get("timestamp", datetime.now(timezone.utc).isoformat()),
        "source": "health-monitor",
        "read": False,
        "acknowledged": False,
        "resolved": False,
        "fingerprint": fingerprint,
    }
