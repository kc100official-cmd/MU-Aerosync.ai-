import type { Aircraft, AircraftStatus, AppData } from '@/types'

export function toCsv(rows: Record<string, string | number | boolean | undefined>[]) {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const esc = (v: unknown) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s
  }
  return [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n')
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim().length)
  if (!lines.length) return { headers: [], rows: [] }
  const parseLine = (line: string) => {
    const out: string[] = []
    let cur = ''
    let q = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (q) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"'
          i++
        } else if (ch === '"') q = false
        else cur += ch
      } else if (ch === '"') q = true
      else if (ch === ',') {
        out.push(cur)
        cur = ''
      } else cur += ch
    }
    out.push(cur)
    return out
  }
  const headers = parseLine(lines[0]).map((h) => h.trim())
  const rows = lines.slice(1).map(parseLine)
  return { headers, rows }
}

const STATUSES: AircraftStatus[] = ['operational', 'watch', 'maintenance', 'grounded']

export function importAircraftCsv(
  data: AppData,
  text: string,
  mapping: Record<string, string>,
): { ok: Aircraft[]; errors: string[] } {
  const { headers, rows } = parseCsv(text)
  const errors: string[] = []
  const ok: Aircraft[] = []
  if (!headers.length) {
    errors.push('File is empty or has no header row.')
    return { ok, errors }
  }
  const idx = (field: string) => headers.indexOf(mapping[field] ?? field)
  const required = ['id', 'model', 'fleet']
  for (const r of required) {
    if (idx(r) < 0) errors.push(`Column mapping missing for "${r}".`)
  }
  if (errors.length) return { ok, errors }

  rows.forEach((cols, i) => {
    const line = i + 2
    const id = cols[idx('id')]?.trim()
    const model = cols[idx('model')]?.trim()
    const fleet = cols[idx('fleet')]?.trim()
    if (!id || !model || !fleet) {
      errors.push(`Line ${line}: id, model, and fleet are required.`)
      return
    }
    if (!/^AS-[A-Z0-9-]+$/i.test(id)) {
      errors.push(`Line ${line}: id "${id}" rejected. Use a fictional AS- prefix identifier.`)
      return
    }
    if (data.aircraft.some((a) => a.id === id) || ok.some((a) => a.id === id)) {
      errors.push(`Line ${line}: duplicate aircraft id ${id}.`)
      return
    }
    const statusRaw = (cols[idx('status')] ?? 'operational').trim().toLowerCase()
    const status = STATUSES.includes(statusRaw as AircraftStatus) ? (statusRaw as AircraftStatus) : 'operational'
    const health = Number(cols[idx('healthScore')] ?? 80)
    if (Number.isNaN(health) || health < 0 || health > 100) {
      errors.push(`Line ${line}: healthScore must be 0–100.`)
      return
    }
    ok.push({
      id,
      type: cols[idx('type')]?.trim() || 'Narrowbody',
      model,
      fleet,
      status,
      healthScore: health,
      flightHours: Number(cols[idx('flightHours')] ?? 0) || 0,
      flightCycles: Number(cols[idx('flightCycles')] ?? 0) || 0,
      lastMaintenance: cols[idx('lastMaintenance')]?.trim() || new Date().toISOString(),
      nextInspection: cols[idx('nextInspection')]?.trim() || new Date(Date.now() + 14 * 86400000).toISOString(),
      base: cols[idx('base')]?.trim() || 'DEMO',
      notes: 'Imported via validated CSV. Synthetic/untrusted input.',
    })
  })
  return { ok, errors }
}

export function aircraftExportRows(data: AppData) {
  return data.aircraft.map((a) => ({
    id: a.id,
    type: a.type,
    model: a.model,
    fleet: a.fleet,
    status: a.status,
    healthScore: a.healthScore,
    flightHours: a.flightHours,
    flightCycles: a.flightCycles,
    lastMaintenance: a.lastMaintenance,
    nextInspection: a.nextInspection,
    base: a.base,
  }))
}
