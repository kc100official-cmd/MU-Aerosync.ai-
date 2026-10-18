import { Badge, Button, Card, Input, Modal, PageHeader } from '@/components/ui/primitives'
import { useApp } from '@/store/AppStore'
import type { InventoryPart } from '@/types'
import { useMemo, useState } from 'react'

export function InventoryPage() {
  const app = useApp()
  const [q, setQ] = useState('')
  const [part, setPart] = useState<InventoryPart | null>(null)
  const [qty, setQty] = useState(1)
  const [adj, setAdj] = useState(1)
  const [note, setNote] = useState('Expedite for demonstration')

  const rows = useMemo(
    () =>
      app.data.parts.filter((p) => `${p.partNumber} ${p.name} ${p.location}`.toLowerCase().includes(q.toLowerCase())),
    [app.data.parts, q],
  )
  const critical = rows.filter((p) => p.qtyAvailable === 0)
  const low = rows.filter((p) => p.qtyAvailable > 0 && p.qtyAvailable <= p.minStock)
  const delayed = app.data.workOrders.filter((w) => w.status === 'awaiting_parts')

  return (
    <div>
      <PageHeader
        title="Spare parts & inventory"
        subtitle="Reservations cannot exceed unreserved stock. Catalog lead times are not confirmed supplier delivery dates."
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <div className="text-xs text-slate-500">Zero stock</div>
          <div className="text-2xl">{critical.length}</div>
        </Card>
        <Card>
          <div className="text-xs text-slate-500">At/below minimum</div>
          <div className="text-2xl">{low.length}</div>
        </Card>
        <Card>
          <div className="text-xs text-slate-500">WOs awaiting parts</div>
          <div className="text-2xl">{delayed.length}</div>
        </Card>
      </div>
      <Input className="my-4" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search parts" />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2">Part</th>
              <th>Name</th>
              <th>Avail</th>
              <th>Reserved</th>
              <th>Min</th>
              <th>Location</th>
              <th>Lead (catalog days)</th>
              <th>WOs</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const wos = app.data.workOrders.filter((w) => w.requiredParts.some((r) => r.partId === p.id) && w.status !== 'completed')
              return (
                <tr key={p.id} className="cursor-pointer border-t border-white/5 hover:bg-white/5" onClick={() => setPart(p)}>
                  <td className="py-2 text-cyan-200">{p.partNumber}</td>
                  <td>{p.name}</td>
                  <td>
                    {p.qtyAvailable === 0 ? <Badge tone="red">{p.qtyAvailable}</Badge> : p.qtyAvailable}
                  </td>
                  <td>{p.qtyReserved}</td>
                  <td>{p.minStock}</td>
                  <td>{p.location}</td>
                  <td>{p.leadTimeDays} (not a delivery date)</td>
                  <td>{wos.map((w) => w.id).join(', ') || '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
      <Card className="mt-4">
        <h2 className="mb-2 text-sm font-semibold">Purchase requests</h2>
        <ul className="text-sm">
          {app.data.purchaseRequests.map((r) => {
            const p = app.data.parts.find((x) => x.id === r.partId)
            return (
              <li key={r.id} className="border-t border-white/5 py-2">
                {r.id} · {p?.partNumber} × {r.quantity} · {r.status} · catalog lead {r.expectedLeadDays}d
              </li>
            )
          })}
        </ul>
      </Card>
      <Modal open={!!part} title={part?.partNumber ?? ''} onClose={() => setPart(null)}>
        {part && (
          <div className="space-y-3 text-sm">
            <p>
              {part.name} · free {part.qtyAvailable - part.qtyReserved}
            </p>
            <label>
              Reserve
              <Input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
            </label>
            <Button
              onClick={() => {
                const r = app.reserve(part.id, qty)
                if (!r.ok) app.toast({ title: r.message, tone: 'danger' })
                else setPart(app.data.parts.find((p) => p.id === part.id) ?? part)
              }}
            >
              Reserve stock
            </Button>
            <label>
              Adjust available (+/−)
              <Input type="number" value={adj} onChange={(e) => setAdj(Number(e.target.value))} />
            </label>
            <Button variant="outline" onClick={() => app.adjustStock(part.id, adj)}>
              Apply adjustment
            </Button>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
            <Button variant="ghost" onClick={() => app.createPurchase(part, qty, note)}>
              Create purchase request
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
