import { Badge, Button, Card, PageHeader, statusTone } from '@/components/ui/primitives'
import { statusLabel } from '@/lib/format'
import { assessComponent } from '@/services/predictive'
import { useApp } from '@/store/AppStore'
import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export function AircraftProfilePage() {
  const { id } = useParams()
  const app = useApp()
  const nav = useNavigate()
  const ac = app.data.aircraft.find((a) => a.id === id)
  const comps = app.data.components.filter((c) => c.aircraftId === id)
  const wos = app.data.workOrders.filter((w) => w.aircraftId === id)
  const logs = app.data.maintenance.filter((m) => m.aircraftId === id)
  const faults = app.data.faults.filter((f) => f.aircraftId === id)

  const trend = useMemo(() => {
    const c = comps[0]
    if (!c) return []
    return app.data.readings
      .filter((r) => r.componentId === c.id && r.metric === 'vibration')
      .slice(-24)
      .map((r) => ({ t: r.timestamp.slice(11, 16), v: r.value }))
  }, [app.data.readings, comps])

  if (!ac) {
    return (
      <Card>
        Unknown aircraft. <Link to="/fleet">Back to fleet</Link>
      </Card>
    )
  }

  return (
    <div>
      <PageHeader
        title={`${ac.id} · ${ac.model}`}
        subtitle={`${ac.notes} All values are synthetic.`}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => nav(-1)}>
              Back
            </Button>
            <Button onClick={() => nav(`/twin?ac=${ac.id}`)}>Digital twin</Button>
          </div>
        }
      />
      <div className="grid gap-3 sm:grid-cols-4">
        <Card>
          <div className="text-xs text-slate-500">Health</div>
          <div className="text-2xl font-display">{ac.healthScore}</div>
        </Card>
        <Card>
          <div className="text-xs text-slate-500">Status</div>
          <Badge tone={statusTone(ac.status)}>{statusLabel(ac.status)}</Badge>
        </Card>
        <Card>
          <div className="text-xs text-slate-500">Hours / cycles</div>
          <div>
            {ac.flightHours} / {ac.flightCycles}
          </div>
        </Card>
        <Card>
          <div className="text-xs text-slate-500">Next inspection</div>
          <div>{ac.nextInspection.slice(0, 10)}</div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 text-sm font-semibold">Component health</h2>
          <ul className="space-y-2 text-sm">
            {comps.map((c) => {
              const r = assessComponent(app.data, c)
              return (
                <li key={c.id} className="flex justify-between rounded-lg bg-white/5 p-2">
                  <span>
                    {c.id} {c.name}
                  </span>
                  <span>
                    health {c.healthScore} · risk {r.riskScore}
                  </span>
                </li>
              )
            })}
          </ul>
        </Card>
        <Card>
          <h2 className="mb-2 text-sm font-semibold">Health trend (first component vibration, simulated)</h2>
          <div className="h-40">
            <ResponsiveContainer>
              <LineChart data={trend}>
                <XAxis dataKey="t" hide />
                <YAxis hide />
                <Tooltip />
                <Line dataKey="v" stroke="#22d3ee" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="mb-2 text-sm font-semibold">Technical log / faults</h2>
          <ul className="space-y-1 text-sm">
            {faults.map((f) => (
              <li key={f.id}>
                {f.code} — {f.summary} {f.resolved ? '(closed)' : '(open)'}
              </li>
            ))}
            {!faults.length && <li className="text-slate-500">No fault rows for this tail.</li>}
          </ul>
        </Card>
        <Card>
          <h2 className="mb-2 text-sm font-semibold">Work orders</h2>
          <ul className="space-y-1 text-sm">
            {wos.slice(0, 8).map((w) => (
              <li key={w.id}>
                <button className="text-cyan-200" onClick={() => nav('/work-orders')}>
                  {w.id}
                </button>{' '}
                {w.title} · {statusLabel(w.status)}
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <Card className="mt-4">
        <h2 className="mb-2 text-sm font-semibold">Maintenance history</h2>
        <ul className="text-sm">
          {logs.map((m) => (
            <li key={m.id} className="border-t border-white/5 py-2">
              {m.date.slice(0, 10)} · {m.type} · {m.summary} · {m.durationHours}h · {m.technician}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
