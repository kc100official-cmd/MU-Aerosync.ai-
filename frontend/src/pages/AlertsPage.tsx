import { Badge, Button, Card, Input, Modal, PageHeader, Select } from '@/components/ui/primitives'
import { useApp } from '@/store/AppStore'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function AlertsPage() {
  const app = useApp()
  const nav = useNavigate()
  const [sev, setSev] = useState('all')
  const [ac, setAc] = useState('all')
  const [note, setNote] = useState('')
  const [resolveId, setResolveId] = useState<string | null>(null)

  const rows = useMemo(() => {
    return app.data.alerts.filter((a) => {
      if (sev !== 'all' && a.severity !== sev) return false
      if (ac !== 'all' && a.aircraftId !== ac) return false
      return true
    })
  }, [app.data.alerts, sev, ac])

  return (
    <div>
      <PageHeader
        title="Alerts & notifications"
        subtitle="Acknowledgement records that a human saw the item. It is not proof a technical fault is fixed. Duplicate fingerprints are suppressed."
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Select value={sev} onChange={(e) => setSev(e.target.value)}>
          <option value="all">All severities</option>
          {['info', 'warning', 'high', 'critical'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
        <Select value={ac} onChange={(e) => setAc(e.target.value)}>
          <option value="all">All aircraft</option>
          {app.data.aircraft.map((a) => (
            <option key={a.id}>{a.id}</option>
          ))}
        </Select>
      </div>
      <Card className="space-y-3">
        {rows.map((a) => (
          <article key={a.id} className="rounded-xl bg-white/5 p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-medium">{a.title}</div>
              <Badge tone={a.severity === 'critical' || a.severity === 'high' ? 'red' : a.severity === 'warning' ? 'amber' : 'slate'}>
                {a.severity}
              </Badge>
            </div>
            <p className="mt-1 text-slate-400">{a.description}</p>
            <p className="text-xs text-slate-500">
              {a.timestamp.replace('T', ' ').slice(0, 19)} · {a.source} · {a.aircraftId ?? 'fleet'} · {a.read ? 'read' : 'unread'} ·{' '}
              {a.acknowledged ? 'acked' : 'unacked'}
            </p>
            <p className="mt-1 text-xs">{a.recommendedAction}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => app.readAlert(a.id)}>
                Mark read
              </Button>
              <Button variant="outline" onClick={() => app.ackAlert(a.id)}>
                Acknowledge
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  if (a.aircraftId) nav(`/fleet/${a.aircraftId}`)
                  else if (a.workOrderId) nav('/work-orders')
                }}
              >
                Open related
              </Button>
              {a.type === 'component_anomaly' && (
                <Button
                  onClick={() => {
                    const wo = app.createWoFromAlert(a.id)
                    if (wo) nav('/work-orders')
                  }}
                >
                  Create inspection WO
                </Button>
              )}
              <Button variant="ghost" onClick={() => setResolveId(a.id)}>
                Resolve with note
              </Button>
            </div>
          </article>
        ))}
      </Card>
      <Modal open={!!resolveId} title="Resolve with audit note" onClose={() => setResolveId(null)}>
        <p className="mb-2 text-sm text-slate-400">Resolution here is an audit trail only.</p>
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why is this closed in the demo log?" />
        <Button
          className="mt-3"
          onClick={() => {
            if (resolveId && note.trim()) {
              app.resolveAlert(resolveId, note)
              setResolveId(null)
              setNote('')
            } else app.toast({ title: 'Note required', tone: 'warning' })
          }}
        >
          Save
        </Button>
      </Modal>
    </div>
  )
}
