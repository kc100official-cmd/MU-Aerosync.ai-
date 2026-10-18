import { format, formatDistanceToNow, parseISO } from 'date-fns'

export function fmtDate(iso: string) {
  return format(parseISO(iso), 'dd MMM yyyy')
}

export function fmtDateTime(iso: string) {
  return format(parseISO(iso), 'dd MMM yyyy HH:mm')
}

export function fmtTime(iso: string) {
  return format(parseISO(iso), 'HH:mm:ss')
}

export function relTime(iso: string) {
  return formatDistanceToNow(parseISO(iso), { addSuffix: true })
}

export function pct(n: number, digits = 1) {
  return `${n.toFixed(digits)}%`
}

export function statusLabel(s: string) {
  return s.replaceAll('_', ' ')
}

export function healthBand(score: number): 'healthy' | 'watch' | 'maintenance_required' | 'grounded' {
  if (score >= 85) return 'healthy'
  if (score >= 70) return 'watch'
  if (score >= 50) return 'maintenance_required'
  return 'grounded'
}
