import { rankRisks } from '@/services/predictive'
import type { AppData, MaintenanceSchedule } from '@/types'

export interface PlanSuggestion {
  scheduleId?: string
  aircraftId: string
  title: string
  proposedStart: string
  proposedEnd: string
  reason: string
  constraints: string[]
  partsOk: boolean
  capacityNote: string
}

export function suggestPlan(data: AppData): PlanSuggestion[] {
  const risks = rankRisks(data)
  const hangarLoad = data.schedules.filter((s) => {
    const t = new Date(s.start).getTime()
    return t > Date.now() && t < Date.now() + 14 * 86400000
  }).length

  return data.workOrders
    .filter((w) => w.status === 'planned' || w.status === 'open' || w.status === 'awaiting_parts')
    .slice(0, 8)
    .map((w) => {
      const partsOk = w.requiredParts.every((need) => {
        const p = data.parts.find((x) => x.id === need.partId)
        return p && p.qtyAvailable + p.qtyReserved >= need.quantity
      })
      const risk = risks.find((r) => r.componentId === w.componentId)
      const reason = [
        `Priority ${w.priority}.`,
        risk ? `Baseline component score ${risk.riskScore}.` : 'No component risk row.',
        partsOk ? 'Required demo stock is available or reserved.' : 'Parts shortage may delay execution.',
      ].join(' ')
      return {
        scheduleId: data.schedules.find((s) => s.workOrderId === w.id)?.id,
        aircraftId: w.aircraftId,
        title: w.title,
        proposedStart: w.plannedStart,
        proposedEnd: w.dueDate,
        reason,
        constraints: [
          'Must remain subject to approved maintenance programme and intervals.',
          'Authorized personnel only.',
          'Prototype cannot release an aircraft.',
        ],
        partsOk,
        capacityNote: `${hangarLoad} calendar items fall in the next 14 days in this demo set.`,
      }
    })
}

export function conflicts(schedules: MaintenanceSchedule[]) {
  const out: Array<{ a: string; b: string; aircraftId: string }> = []
  const byAc = new Map<string, MaintenanceSchedule[]>()
  for (const s of schedules) {
    const arr = byAc.get(s.aircraftId) ?? []
    arr.push(s)
    byAc.set(s.aircraftId, arr)
  }
  for (const [aircraftId, list] of byAc) {
    const sorted = [...list].sort((a, b) => a.start.localeCompare(b.start))
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].start < sorted[i - 1].end) {
        out.push({ a: sorted[i - 1].id, b: sorted[i].id, aircraftId })
      }
    }
  }
  return out
}
