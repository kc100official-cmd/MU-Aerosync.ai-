import { rankRisks } from '@/services/predictive'
import type { AppData } from '@/types'

export interface QueryAnswer {
  question: string
  method: 'deterministic-dataset-query'
  bullets: string[]
  numbers: { label: string; value: string }[]
}

export const PRESET_QUESTIONS = [
  'Which aircraft need attention first?',
  'Which work orders are blocked by unavailable parts?',
  'What is causing the largest amount of downtime in this demo dataset?',
  'Which inspections are due soon?',
  'What would happen to availability if a planned maintenance task were delayed?',
  'Which inventory items are below minimum stock?',
]

function availability(data: AppData) {
  const ops = data.aircraft.filter((a) => a.status === 'operational').length
  return (ops / data.aircraft.length) * 100
}

export function answerQuestion(data: AppData, question: string): QueryAnswer {
  const q = question.toLowerCase()
  const risks = rankRisks(data)

  if (q.includes('attention first')) {
    const top = data.aircraft
      .filter((a) => a.status !== 'operational')
      .sort((a, b) => a.healthScore - b.healthScore)
    return {
      question,
      method: 'deterministic-dataset-query',
      bullets: top.slice(0, 5).map((a) => `${a.id} (${a.model}) — ${a.status}, health ${a.healthScore}`),
      numbers: [
        { label: 'Non-operational aircraft', value: String(top.length) },
        { label: 'Highest baseline component risk', value: `${risks[0]?.componentId} @ ${risks[0]?.riskScore}` },
      ],
    }
  }

  if (q.includes('blocked') || q.includes('unavailable')) {
    const blocked = data.workOrders.filter((w) => w.status === 'awaiting_parts')
    const detail = blocked.map((w) => {
      const missing = w.requiredParts.filter((p) => {
        const part = data.parts.find((x) => x.id === p.partId)
        return !part || part.qtyAvailable < p.quantity
      })
      const names = missing.map((m) => data.parts.find((p) => p.id === m.partId)?.partNumber ?? m.partId)
      return `${w.id} on ${w.aircraftId}: ${names.join(', ') || 'status awaiting parts'}`
    })
    return {
      question,
      method: 'deterministic-dataset-query',
      bullets: detail.length ? detail : ['No work orders are currently in awaiting_parts.'],
      numbers: [{ label: 'Awaiting parts', value: String(blocked.length) }],
    }
  }

  if (q.includes('downtime')) {
    const grounded = data.aircraft.filter((a) => a.status === 'grounded' || a.status === 'maintenance')
    const byStatus = grounded.map((a) => `${a.id}: ${a.status} — ${a.notes}`)
    return {
      question,
      method: 'deterministic-dataset-query',
      bullets: [
        'Downtime here is inferred from demo aircraft status, not from certified out-of-service logs.',
        ...byStatus,
      ],
      numbers: [
        { label: 'Maintenance', value: String(data.aircraft.filter((a) => a.status === 'maintenance').length) },
        { label: 'Grounded', value: String(data.aircraft.filter((a) => a.status === 'grounded').length) },
      ],
    }
  }

  if (q.includes('inspection') && q.includes('due')) {
    const soon = data.aircraft
      .map((a) => ({ a, days: (new Date(a.nextInspection).getTime() - Date.now()) / 86400000 }))
      .filter((x) => x.days <= 14)
      .sort((x, y) => x.days - y.days)
    return {
      question,
      method: 'deterministic-dataset-query',
      bullets: soon.map((x) => `${x.a.id}: next inspection in ${x.days.toFixed(1)} days (${x.a.nextInspection.slice(0, 10)})`),
      numbers: [{ label: 'Due within 14 days', value: String(soon.length) }],
    }
  }

  if (q.includes('delayed') || q.includes('availability')) {
    const current = availability(data)
    const planned = data.workOrders.filter((w) => w.status === 'planned' || w.status === 'in_progress')
    const extraDown = new Set(planned.map((w) => w.aircraftId)).size
    const hypo = Math.max(0, ((data.aircraft.filter((a) => a.status === 'operational').length - extraDown) / data.aircraft.length) * 100)
    return {
      question,
      method: 'deterministic-dataset-query',
      bullets: [
        `Current operational availability in this demo set is ${current.toFixed(1)}%.`,
        `If every planned/in-progress package kept an aircraft down, ${extraDown} additional tails could be unavailable.`,
        `Illustrative hypothetical availability: ${hypo.toFixed(1)}%. This is a counting exercise, not an operations forecast.`,
      ],
      numbers: [
        { label: 'Current availability', value: `${current.toFixed(1)}%` },
        { label: 'Hypothetical', value: `${hypo.toFixed(1)}%` },
      ],
    }
  }

  if (q.includes('stock') || q.includes('inventory')) {
    const low = data.parts.filter((p) => p.qtyAvailable <= p.minStock)
    return {
      question,
      method: 'deterministic-dataset-query',
      bullets: low.slice(0, 8).map((p) => `${p.partNumber} — avail ${p.qtyAvailable}, min ${p.minStock}`),
      numbers: [{ label: 'At or below min', value: String(low.length) }],
    }
  }

  const ops = data.aircraft.filter((a) => a.status === 'operational').length
  return {
    question,
    method: 'deterministic-dataset-query',
    bullets: [
      'No language-model API is configured. This interface runs transparent calculations on the loaded demo dataset.',
      `Fleet size ${data.aircraft.length}, operational ${ops}, open work orders ${data.workOrders.filter((w) => w.status !== 'completed').length}.`,
      `Top baseline risk component: ${risks[0]?.componentId ?? 'n/a'} (score ${risks[0]?.riskScore ?? 'n/a'}).`,
    ],
    numbers: [{ label: 'Aircraft', value: String(data.aircraft.length) }],
  }
}

export function executiveBrief(data: AppData) {
  const risks = rankRisks(data)
  const avail = availability(data)
  const attn = data.aircraft.filter((a) => a.status !== 'operational')
  const shortages = data.parts.filter((p) => p.qtyAvailable === 0 || p.qtyAvailable < p.minStock)
  const openWo = data.workOrders.filter((w) => w.status !== 'completed')
  return [
    `Demo fleet of ${data.aircraft.length} synthetic aircraft is ${avail.toFixed(1)}% operational (${data.aircraft.filter((a) => a.status === 'operational').length} flying status).`,
    `${attn.length} tails require attention: ${attn.map((a) => a.id).join(', ')}.`,
    `Highest baseline component risk is ${risks[0]?.componentId} on ${risks[0]?.aircraftId} (score ${risks[0]?.riskScore}).`,
    `${shortages.length} inventory rows are at/below minimum, including zero-stock EDP-440 blocking WO-1045.`,
    `${openWo.length} work orders are not completed. Scores and alerts are demonstration analytics, not certified diagnostics.`,
  ].join(' ')
}
