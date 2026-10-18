import { healthBand } from '@/lib/format'
import type { Alert, AppData, Component, SensorReading } from '@/types'

export interface RiskFactor {
  label: string
  weight: number
  detail: string
}

export interface RiskAssessment {
  componentId: string
  aircraftId: string
  riskScore: number
  category: ReturnType<typeof healthBand> | 'elevated'
  anomalies: string[]
  factors: RiskFactor[]
  recommendedAction: string
  inspectionPriority: 'routine' | 'soon' | 'urgent'
  dataFreshness: string
  quality: 'complete' | 'partial'
  method: 'baseline-anomaly-score'
  disclaimer: string
}

const DISCLAIMER =
  'Baseline demonstration score from configured thresholds and synthetic readings. Not a trained failure model, remaining-useful-life estimate, or certified diagnosis. Cannot authorize aircraft release.'

function latest(readings: SensorReading[], componentId: string, metric: SensorReading['metric']) {
  return readings
    .filter((r) => r.componentId === componentId && r.metric === metric)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0]
}

function series(readings: SensorReading[], componentId: string, metric: SensorReading['metric']) {
  return readings
    .filter((r) => r.componentId === componentId && r.metric === metric)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

function slope(values: number[]) {
  if (values.length < 4) return 0
  const n = Math.min(24, values.length)
  const slice = values.slice(-n)
  return (slice[slice.length - 1] - slice[0]) / n
}

export function assessComponent(data: AppData, component: Component): RiskAssessment {
  const th = data.thresholds.filter((t) => t.componentId === component.id)
  const factors: RiskFactor[] = []
  const anomalies: string[] = []
  let score = 100 - component.healthScore

  const vib = series(data.readings, component.id, 'vibration')
  const vibLatest = latest(data.readings, component.id, 'vibration')
  const vibTh = th.find((t) => t.metric === 'vibration')
  if (vibLatest && vibTh) {
    if (vibLatest.value > (vibTh.cautionHigh ?? vibTh.max)) {
      anomalies.push(`Vibration ${vibLatest.value} ${vibLatest.unit} above caution band ${vibTh.cautionHigh}`)
      factors.push({
        label: 'Vibration caution exceedance',
        weight: 22,
        detail: `Latest simulated vibration ${vibLatest.value} ${vibLatest.unit} vs caution ${vibTh.cautionHigh}.`,
      })
      score += 18
    }
    const sl = slope(vib.map((v) => v.value))
    if (sl > 0.02) {
      factors.push({
        label: 'Rising vibration trend',
        weight: 16,
        detail: `Recent simulated samples trend upward (~${sl.toFixed(3)} per hour window).`,
      })
      score += 12
    }
  }

  const press = latest(data.readings, component.id, 'pressure')
  const pTh = th.find((t) => t.metric === 'pressure')
  if (press && pTh?.cautionLow && press.value < pTh.cautionLow) {
    anomalies.push(`Pressure ${press.value} below caution low ${pTh.cautionLow}`)
    factors.push({
      label: 'Pressure below caution',
      weight: 20,
      detail: `Latest simulated pressure ${press.value} ${press.unit}.`,
    })
    score += 16
  }

  const openFaults = data.faults.filter((f) => f.componentId === component.id && !f.resolved)
  if (openFaults.length) {
    factors.push({
      label: 'Open technical-log items',
      weight: 10 + openFaults.length * 4,
      detail: openFaults.map((f) => f.code).join(', '),
    })
    score += 8 + openFaults.length * 3
  }

  const ac = data.aircraft.find((a) => a.id === component.aircraftId)
  if (ac) {
    const due = (new Date(ac.nextInspection).getTime() - Date.now()) / 86400000
    if (due < 7) {
      factors.push({
        label: 'Inspection window nearby',
        weight: 8,
        detail: `Next inspection date in demo calendar: ${ac.nextInspection.slice(0, 10)}.`,
      })
      score += 5
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)))
  const category = score >= 70 ? 'grounded' : score >= 45 ? 'maintenance_required' : score >= 28 ? 'watch' : 'healthy'
  const inspectionPriority = score >= 55 ? 'urgent' : score >= 32 ? 'soon' : 'routine'
  const recommendedAction =
    inspectionPriority === 'urgent'
      ? `Review ${component.id} evidence, validate against approved procedures, and open an inspection work order if warranted.`
      : inspectionPriority === 'soon'
        ? `Schedule a planned review of ${component.id}. Do not treat this score as a removal requirement.`
        : `Continue routine monitoring of ${component.id} within the approved maintenance programme.`

  const last = data.readings
    .filter((r) => r.componentId === component.id)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0]

  return {
    componentId: component.id,
    aircraftId: component.aircraftId,
    riskScore: score,
    category,
    anomalies,
    factors,
    recommendedAction,
    inspectionPriority,
    dataFreshness: last?.timestamp ?? 'n/a',
    quality: last ? 'complete' : 'partial',
    method: 'baseline-anomaly-score',
    disclaimer: DISCLAIMER,
  }
}

export function rankRisks(data: AppData): RiskAssessment[] {
  return data.components
    .map((c) => assessComponent(data, c))
    .sort((a, b) => b.riskScore - a.riskScore)
}

export function narrativeFor(a: RiskAssessment, componentName: string) {
  const top = a.factors[0]
  if (!top) {
    return `Component ${a.componentId} (${componentName}) currently scores ${a.riskScore} on the demonstration baseline. No dominant anomaly factor is present in the loaded synthetic set.`
  }
  return `Component ${a.componentId} (${componentName}) has ${top.label.toLowerCase()} across recent simulated readings. ${a.recommendedAction} ${a.disclaimer}`
}

export function maybeAnomalyAlert(data: AppData, reading: SensorReading): Alert | null {
  const th = data.thresholds.find((t) => t.componentId === reading.componentId && t.metric === reading.metric)
  if (!th) return null
  const hit =
    reading.value > th.max ||
    reading.value < th.min ||
    (th.cautionHigh != null && reading.value > th.cautionHigh) ||
    (th.cautionLow != null && reading.value < th.cautionLow)
  if (!hit) return null
  const fingerprint = `${reading.componentId}:${reading.metric}:caution`
  return {
    id: `AL-LIVE-${fingerprint}`,
    type: 'component_anomaly',
    severity: reading.value > th.max || reading.value < th.min ? 'critical' : 'high',
    aircraftId: reading.aircraftId,
    componentId: reading.componentId,
    title: `Threshold event — ${reading.componentId} ${reading.metric}`,
    description: `Simulated ${reading.metric} reading ${reading.value} ${reading.unit} crossed a configured band.`,
    recommendedAction: 'Inspect supporting samples. Acknowledgement is not evidence that a fault is cleared.',
    timestamp: reading.timestamp,
    source: 'health-monitor',
    read: false,
    acknowledged: false,
    resolved: false,
    fingerprint,
  }
}
