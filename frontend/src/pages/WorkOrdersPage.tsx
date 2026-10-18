import { Badge, Button, Card, Input, Modal, PageHeader, Select, statusTone } from '@/components/ui/primitives'
import { uid } from '@/lib/id'
import { statusLabel } from '@/lib/format'
import { useApp } from '@/store/AppStore'
import type { WorkOrder, WorkOrderStatus } from '@/types'
import { useMemo, useState } from 'react'

const COLS: WorkOrderStatus[] = ['open', 'planned', 'in_progress', 'awaiting_parts', 'awaiting_inspection', 'completed']

function blank(aircraftId: string): WorkOrder {
  const now = new Date().toISOString()
  return {
    id: `WO-${Math.floor(3000 + Math.random() * 5000)}`,
    aircraftId,
    title: '',
    faultDescription: '',
    priority: 'medium',
    assignee: 'Maya Chen',
    team: 'Line North',
    requiredParts: [],
    estimatedHours: 4,
    plannedStart: now,
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    status: 'open',
    notes: '',
    completionNotes: '',
    checklist: [
      { id: uid('ck'), label: 'Review task card', done: false },
      { id: uid('ck'), label: 'Execute work', done: false },
      { id: uid('ck'), label: 'Independent inspection if required', done: false },
    ],
    createdAt: now,
    updatedAt: now,
  }
}

export function WorkOrdersPage() {
  const app = useApp()
  const [view, setView] = useState<'kanban' | 'table'>('kanban')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [edit, setEdit] = useState<WorkOrder | null>(null)
  const [confirm, setConfirm] = useState<WorkOrder | null>(null)

  const rows = useMemo(() => {
    const ids = new Set(app.filteredAircraft.map((a) => a.id))
    return app.data.workOrders.filter((w) => {
      if (!ids.has(w.aircraftId)) return false
      if (status !== 'all' && w.status !== status) return false
      const blob = `${w.id} ${w.title} ${w.aircraftId} ${w.assignee}`.toLowerCase()
      return blob.includes(q.toLowerCase())
    })
  }, [app.data.workOrders, app.filteredAircraft, q, status])

  const partLabel = (w: WorkOrder) =>
    w.requiredParts
      .map((r) => {
        const p = app.data.parts.find((x) => x.id === r.partId)
        if (!p) return r.partId
        const ok = p.qtyAvailable >= r.quantity
        return `${p.partNumber} (${ok ? 'in stock' : 'shortage'})`
      })
      .join(', ')

  const save = () => {
    if (!edit?.title.trim()) {
      app.toast({ title: 'Title required', tone: 'danger' })
      return
    }
    const partsOk = edit.requiredParts.every((r) => {
      const p = app.data.parts.find((x) => x.id === r.partId)
      return p && p.qtyAvailable >= r.quantity
    })
    const wo = {
      ...edit,
      updatedAt: new Date().toISOString(),
      status: !partsOk && edit.status !== 'completed' ? ('awaiting_parts' as const) : edit.status,
    }
    if (wo.status === 'completed' && !wo.completionNotes.trim()) {
      app.toast({ title: 'Completion notes required — this is not an aircraft release', tone: 'warning' })
      return
    }
    app.saveWorkOrder(wo)
    setEdit(null)
  }

  return (
    <div>
      <PageHeader
        title="Maintenance work orders"
        subtitle="Workflow is demonstration-only. Completing a card does not release an aircraft to service."
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setView(view === 'kanban' ? 'table' : 'kanban')}>
              {view === 'kanban' ? 'Table' : 'Kanban'}
            </Button>
            <Button onClick={() => setEdit(blank(app.filteredAircraft[0]?.id ?? 'AS-101'))}>Create work order</Button>
          </div>
        }
      />
      <div className="mb-4 flex gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {COLS.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </Select>
      </div>

      {view === 'kanban' ? (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {COLS.map((col) => (
            <div key={col} className="w-72 shrink-0 rounded-2xl bg-white/5 p-3">
              <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">{statusLabel(col)}</div>
              <div className="space-y-2">
                {rows
                  .filter((w) => w.status === col)
                  .map((w) => (
                    <button key={w.id} className="w-full rounded-xl bg-[#0b1224] p-3 text-left text-sm" onClick={() => setEdit(w)}>
                      <div className="font-medium text-cyan-200">{w.id}</div>
                      <div>{w.title}</div>
                      <div className="text-xs text-slate-500">
                        {w.aircraftId} · {w.priority}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">ID</th>
                <th>Aircraft</th>
                <th>Title</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>Parts</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((w) => (
                <tr key={w.id} className="cursor-pointer border-t border-white/5" onClick={() => setEdit(w)}>
                  <td className="py-2">{w.id}</td>
                  <td>{w.aircraftId}</td>
                  <td>{w.title}</td>
                  <td>{w.priority}</td>
                  <td>{w.assignee}</td>
                  <td className="text-xs">{partLabel(w) || '—'}</td>
                  <td>
                    <Badge tone={statusTone(w.status)}>{statusLabel(w.status)}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={!!edit} title={edit?.id ?? ''} onClose={() => setEdit(null)}>
        {edit && (
          <div className="space-y-2 text-sm">
            <Input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} placeholder="Title" />
            <textarea
              className="h-20 w-full rounded-lg border border-white/10 bg-slate-950/50 p-2"
              value={edit.faultDescription}
              onChange={(e) => setEdit({ ...edit, faultDescription: e.target.value })}
            />
            <Select value={edit.aircraftId} onChange={(e) => setEdit({ ...edit, aircraftId: e.target.value })}>
              {app.data.aircraft.map((a) => (
                <option key={a.id}>{a.id}</option>
              ))}
            </Select>
            <Select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value as WorkOrderStatus })}>
              {COLS.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </Select>
            <Input value={edit.assignee} onChange={(e) => setEdit({ ...edit, assignee: e.target.value })} placeholder="Assignee" />
            <Input value={edit.team} onChange={(e) => setEdit({ ...edit, team: e.target.value })} placeholder="Team" />
            <Input
              type="number"
              value={edit.estimatedHours}
              onChange={(e) => setEdit({ ...edit, estimatedHours: Number(e.target.value) })}
            />
            <Input value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} placeholder="Notes" />
            <Input value={edit.completionNotes} onChange={(e) => setEdit({ ...edit, completionNotes: e.target.value })} placeholder="Completion notes" />
            <div>
              {edit.checklist.map((c) => (
                <label key={c.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={c.done} onChange={() => setEdit({ ...edit, checklist: edit.checklist.map((x) => (x.id === c.id ? { ...x, done: !x.done } : x)) })} />
                  {c.label}
                </label>
              ))}
            </div>
            <div className="text-xs text-slate-400">Parts: {partLabel(edit) || 'none mapped'}</div>
            {edit.requiredParts[0] && (
              <Button
                variant="outline"
                onClick={() => {
                  const r = app.reserve(edit.requiredParts[0].partId, 1, edit.id)
                  if (!r.ok) app.toast({ title: r.message, tone: 'danger' })
                }}
              >
                Reserve required part
              </Button>
            )}
            <div className="flex gap-2">
              <Button onClick={save}>Save</Button>
              <Button variant="ghost" onClick={() => setConfirm(edit)}>
                Mark completed
              </Button>
            </div>
          </div>
        )}
      </Modal>
      <Modal open={!!confirm} title="Confirm completion" onClose={() => setConfirm(null)}>
        <p className="text-sm text-slate-300">
          Completing this work order records a demo workflow state only. It does not constitute a return-to-service or CRS.
        </p>
        <Button
          className="mt-3"
          onClick={() => {
            if (confirm) {
              setEdit({ ...confirm, status: 'completed', completionNotes: confirm.completionNotes || 'Closed in demo. Not a CRS.' })
              setConfirm(null)
            }
          }}
        >
          Confirm
        </Button>
      </Modal>
    </div>
  )
}
