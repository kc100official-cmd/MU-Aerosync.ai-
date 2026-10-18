import { Badge, Button, Card, Input, Modal, PageHeader, Select, statusTone } from '@/components/ui/primitives'
import { statusLabel } from '@/lib/format'
import { useApp } from '@/store/AppStore'
import type { Aircraft, AircraftStatus } from '@/types'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function FleetPage() {
  const app = useApp()
  const nav = useNavigate()
  const [view, setView] = useState<'table' | 'cards'>('table')
  const [status, setStatus] = useState('all')
  const [type, setType] = useState('all')
  const [risk, setRisk] = useState('all')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Aircraft | null>(null)

  const rows = useMemo(() => {
    return app.filteredAircraft.filter((a) => {
      if (status !== 'all' && a.status !== status) return false
      if (type !== 'all' && a.type !== type) return false
      if (risk === 'high' && a.healthScore >= 70) return false
      if (risk === 'low' && a.healthScore < 85) return false
      const due = (new Date(a.nextInspection).getTime() - Date.now()) / 86400000
      if (risk === 'due' && due > 10) return false
      return true
    })
  }, [app.filteredAircraft, status, type, risk])

  const save = () => {
    if (!form) return
    if (!form.id.trim() || !form.model.trim()) {
      app.toast({ title: 'ID and model required', tone: 'danger' })
      return
    }
    app.upsertAircraft(form)
    setOpen(false)
  }

  return (
    <div>
      <PageHeader
        title="Fleet intelligence"
        subtitle="Synthetic airframes with fictional AS- identifiers. Not operational aviation records."
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setView(view === 'table' ? 'cards' : 'table')}>
              {view === 'table' ? 'Card view' : 'Table view'}
            </Button>
            <Button
              onClick={() => {
                setForm({
                  id: 'AS-NEW',
                  type: 'Narrowbody',
                  model: 'A320neo',
                  fleet: app.filters.fleet === 'all' ? 'Alpha' : app.filters.fleet,
                  status: 'operational',
                  healthScore: 88,
                  flightHours: 0,
                  flightCycles: 0,
                  lastMaintenance: new Date().toISOString(),
                  nextInspection: new Date(Date.now() + 20 * 86400000).toISOString(),
                  base: 'DEMO',
                  notes: 'User-added synthetic aircraft.',
                })
                setOpen(true)
              }}
            >
              Add aircraft
            </Button>
          </div>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {['operational', 'watch', 'maintenance', 'grounded'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
        <Select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">All types</option>
          {['Narrowbody', 'Widebody', 'Regional'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
        <Select value={risk} onChange={(e) => setRisk(e.target.value)}>
          <option value="all">Any risk / due</option>
          <option value="high">Health below 70</option>
          <option value="low">Health 85+</option>
          <option value="due">Inspection due in 10 days</option>
        </Select>
      </div>

      {view === 'cards' ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((a) => (
            <button key={a.id} className="glass rounded-2xl p-4 text-left" onClick={() => nav(`/fleet/${a.id}`)}>
              <div className="flex justify-between">
                <span className="font-semibold text-cyan-200">{a.id}</span>
                <Badge tone={statusTone(a.status)}>{statusLabel(a.status)}</Badge>
              </div>
              <div className="mt-1 text-sm text-slate-300">
                {a.model} · Fleet {a.fleet}
              </div>
              <div className="mt-3 text-2xl font-display">{a.healthScore}</div>
              <div className="text-xs text-slate-500">
                {a.flightHours.toLocaleString()} FH · next {a.nextInspection.slice(0, 10)}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2">ID</th>
                  <th>Model</th>
                  <th>Fleet</th>
                  <th>Status</th>
                  <th>Health</th>
                  <th>FH / FC</th>
                  <th>Last mx</th>
                  <th>Next insp.</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id} className="border-t border-white/5">
                    <td className="py-2">
                      <button className="text-cyan-200" onClick={() => nav(`/fleet/${a.id}`)}>
                        {a.id}
                      </button>
                    </td>
                    <td>{a.model}</td>
                    <td>{a.fleet}</td>
                    <td>
                      <Badge tone={statusTone(a.status)}>{statusLabel(a.status)}</Badge>
                    </td>
                    <td>{a.healthScore}</td>
                    <td>
                      {a.flightHours} / {a.flightCycles}
                    </td>
                    <td>{a.lastMaintenance.slice(0, 10)}</td>
                    <td>{a.nextInspection.slice(0, 10)}</td>
                    <td>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setForm(a)
                          setOpen(true)
                        }}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={open} title={form && app.data.aircraft.some((a) => a.id === form.id) ? 'Edit aircraft' : 'Add aircraft'} onClose={() => setOpen(false)}>
        {form && (
          <div className="space-y-2">
            <Input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="ID" />
            <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Model" />
            <Input value={form.fleet} onChange={(e) => setForm({ ...form, fleet: e.target.value })} placeholder="Fleet" />
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AircraftStatus })}>
              {['operational', 'watch', 'maintenance', 'grounded'].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
            <Input type="number" value={form.healthScore} onChange={(e) => setForm({ ...form, healthScore: Number(e.target.value) })} />
            <Button onClick={save}>Save</Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
