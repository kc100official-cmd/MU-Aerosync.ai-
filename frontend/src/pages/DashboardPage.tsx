import { Badge, Button, Card, PageHeader } from '@/components/ui/primitives'
import { healthBand, pct, statusLabel } from '@/lib/format'
import { executiveBrief } from '@/services/query'
import { rankRisks } from '@/services/predictive'
import { useApp } from '@/store/AppStore'
import { Activity, AlertTriangle, ClipboardList, Gauge, Plane, Wrench } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export function DashboardPage() {
  const app = useApp()
  const nav = useNavigate()
  const ac = app.filteredAircraft
  const [sort, setSort] = useState<'id' | 'healthScore'>('healthScore')
  const [q, setQ] = useState('')

  const kpis = useMemo(() => {
    const operational = ac.filter((a) => a.status === 'operational').length
    const maint = ac.filter((a) => a.status === 'maintenance').length
    const attn = ac.filter((a) => a.status !== 'operational').length
    const ids = new Set(ac.map((a) => a.id))
    const wo = app.data.workOrders.filter((w) => ids.has(w.aircraftId) && w.status !== 'completed')
    const risk = rankRisks(app.data).filter((r) => ids.has(r.aircraftId) && r.inspectionPriority !== 'routine')
    const shortages = app.data.parts.filter((p) => p.qtyAvailable < p.minStock)
    return [
      { label: 'Total aircraft', value: ac.length, desc: 'In the current fleet filter', icon: Plane, to: '/fleet' },
      { label: 'Operational', value: operational, desc: 'Status = operational', icon: Gauge, to: '/fleet' },
      { label: 'Under maintenance', value: maint, desc: 'Hangar / in-work status', icon: Wrench, to: '/work-orders' },
      { label: 'Requiring attention', value: attn, desc: 'Watch, maintenance, or grounded', icon: AlertTriangle, to: '/alerts' },
      { label: 'Fleet availability', value: ac.length ? pct((operational / ac.length) * 100) : '—', desc: 'Operational ÷ filtered fleet', icon: Activity, to: '/reports' },
      { label: 'Predicted inspections', value: risk.length, desc: 'Baseline scores, not failure forecasts', icon: AlertTriangle, to: '/predictive' },
      { label: 'Open work orders', value: wo.length, desc: 'Any status except completed', icon: ClipboardList, to: '/work-orders' },
      { label: 'Parts below minimum', value: shortages.length, desc: 'Inventory risk rows', icon: Wrench, to: '/inventory' },
    ]
  }, [ac, app.data])

  const availabilitySeries = useMemo(() => {
    const days = app.filters.dateRange.preset === '7d' ? 7 : app.filters.dateRange.preset === '30d' ? 30 : 30
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(Date.now() - (days - 1 - i) * 86400000)
      const ground = ac.filter((a) => a.status === 'grounded' || a.status === 'maintenance').length
      const wobble = ((i * 3) % 5) - 2
      const ops = Math.max(0, ac.length - ground + Math.min(1, wobble))
      return { day: d.toISOString().slice(5, 10), availability: ac.length ? Number(((ops / ac.length) * 100).toFixed(1)) : 0 }
    })
  }, [ac, app.filters.dateRange.preset])

  const dist = useMemo(() => {
    const bands = { healthy: 0, watch: 0, maintenance_required: 0, grounded: 0 }
    ac.forEach((a) => {
      bands[healthBand(a.healthScore)]++
    })
    return [
      { name: 'Healthy', value: bands.healthy, color: '#34d399' },
      { name: 'Watch', value: bands.watch, color: '#f59e0b' },
      { name: 'Maintenance required', value: bands.maintenance_required, color: '#8b5cf6' },
      { name: 'Grounded', value: bands.grounded, color: '#f87171' },
    ]
  }, [ac])

  const queue = rankRisks(app.data).slice(0, 5)
  const alerts = app.data.alerts.slice(0, 5)
  const timeline = [...app.data.schedules].sort((a, b) => a.start.localeCompare(b.start)).slice(0, 6)
  const inv = app.data.parts.filter((p) => p.qtyAvailable <= p.minStock).slice(0, 5)
  const table = ac
    .filter((a) => `${a.id} ${a.model}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (sort === 'id' ? a.id.localeCompare(b.id) : a.healthScore - b.healthScore))

  return (
    <div>
      <PageHeader
        title="Operations overview"
        subtitle="Command-center metrics are calculated from the loaded synthetic dataset. Nothing here is live aircraft telemetry."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => nav('/demo')}>
              Guided demo
            </Button>
            <Button variant="ghost" onClick={() => app.resetDemo()}>
              Reset demo data
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <button key={k.label} onClick={() => nav(k.to)} className="glass rounded-2xl p-4 text-left transition hover:border-cyan-400/30">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs uppercase tracking-wide">{k.label}</span>
              <k.icon className="h-4 w-4 text-cyan-300" />
            </div>
            <div className="mt-2 font-display text-2xl font-bold">{k.value}</div>
            <p className="mt-1 text-xs text-slate-500">{k.desc}</p>
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <h2 className="mb-3 text-sm font-semibold">Fleet availability (illustrative occupancy of demo statuses)</h2>
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={availabilitySeries}>
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="availability" stroke="#22d3ee" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="mb-3 text-sm font-semibold">Health distribution</h2>
          <div className="h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={dist} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78}>
                  {dist.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Fleet status</h2>
          <input
            className="rounded-lg border border-white/10 bg-slate-950/50 px-3 py-1.5 text-sm"
            placeholder="Filter table"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="cursor-pointer py-2" onClick={() => setSort('id')}>
                  Aircraft
                </th>
                <th>Type</th>
                <th className="cursor-pointer" onClick={() => setSort('healthScore')}>
                  Health
                </th>
                <th>Availability</th>
                <th>Next inspection</th>
                <th>Alerts</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {table.map((a) => {
                const n = app.data.alerts.filter((x) => x.aircraftId === a.id && !x.resolved).length
                return (
                  <tr
                    key={a.id}
                    className="cursor-pointer border-t border-white/5 hover:bg-white/5"
                    onClick={() => nav(`/fleet/${a.id}`)}
                  >
                    <td className="py-2 font-medium text-cyan-200">{a.id}</td>
                    <td>{a.model}</td>
                    <td>{a.healthScore}</td>
                    <td>{a.status === 'operational' ? 'Available' : 'Down'}</td>
                    <td>{a.nextInspection.slice(0, 10)}</td>
                    <td>{n}</td>
                    <td>
                      <Badge tone={a.status === 'operational' ? 'green' : a.status === 'watch' ? 'amber' : 'red'}>
                        {statusLabel(a.status)}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold">Predictive maintenance queue</h2>
          <ul className="space-y-2 text-sm">
            {queue.map((r) => (
              <li key={r.componentId} className="flex cursor-pointer justify-between gap-2 rounded-lg bg-white/5 p-2" onClick={() => nav('/predictive')}>
                <div>
                  <div className="font-medium">
                    {r.componentId} · {r.aircraftId}
                  </div>
                  <div className="text-xs text-slate-400">{r.recommendedAction}</div>
                </div>
                <Badge tone={r.riskScore > 50 ? 'red' : 'amber'}>{r.riskScore}</Badge>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="mb-3 text-sm font-semibold">Recent alerts</h2>
          <ul className="space-y-2 text-sm">
            {alerts.map((a) => (
              <li key={a.id} className="cursor-pointer rounded-lg bg-white/5 p-2" onClick={() => nav('/alerts')}>
                <div className="flex justify-between">
                  <span className="font-medium">{a.title}</span>
                  <span className="text-xs text-slate-500">{a.timestamp.slice(11, 16)}</span>
                </div>
                <div className="text-xs text-slate-400">
                  {a.aircraftId} · {a.acknowledged ? 'acknowledged' : 'unacked'} · not a cleared fault
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="mb-3 text-sm font-semibold">Maintenance activity timeline</h2>
          <ul className="space-y-2 text-sm">
            {timeline.map((s) => (
              <li key={s.id} className="cursor-pointer rounded-lg bg-white/5 p-2" onClick={() => nav('/timeline')}>
                <div className="font-medium">{s.title}</div>
                <div className="text-xs text-slate-400">
                  {s.aircraftId} · {s.start.slice(0, 16).replace('T', ' ')} · {statusLabel(s.kind)}
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="mb-3 text-sm font-semibold">Inventory risk</h2>
          <ul className="space-y-2 text-sm">
            {inv.map((p) => (
              <li key={p.id} className="flex cursor-pointer justify-between rounded-lg bg-white/5 p-2" onClick={() => nav('/inventory')}>
                <span>
                  {p.partNumber} · {p.name}
                </span>
                <span className="text-amber-200">
                  {p.qtyAvailable}/{p.minStock}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-4">
        <h2 className="mb-2 text-sm font-semibold">AI executive summary</h2>
        <p className="text-sm leading-relaxed text-slate-300">{executiveBrief(app.data)}</p>
        <p className="mt-2 text-xs text-slate-500">Generated from dashboard metrics with a deterministic briefing function. No language-model API is configured.</p>
      </Card>
    </div>
  )
}
