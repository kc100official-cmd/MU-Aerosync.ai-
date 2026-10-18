import { Badge, Button, Card, PageHeader, Select } from '@/components/ui/primitives'
import { narrativeFor, rankRisks } from '@/services/predictive'
import { useApp } from '@/store/AppStore'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export function PredictivePage() {
  const app = useApp()
  const nav = useNavigate()
  const [prio, setPrio] = useState('all')
  const [open, setOpen] = useState<string | null>(null)
  const ranked = useMemo(() => {
    const ids = new Set(app.filteredAircraft.map((a) => a.id))
    return rankRisks(app.data).filter((r) => ids.has(r.aircraftId) && (prio === 'all' || r.inspectionPriority === prio))
  }, [app.data, app.filteredAircraft, prio])
  const selected = ranked.find((r) => r.componentId === open) ?? ranked[0]
  const comp = app.data.components.find((c) => c.id === selected?.componentId)

  return (
    <div>
      <PageHeader
        title="Predictive maintenance"
        subtitle="Transparent baseline anomaly scoring. Outputs are demonstrations, not validated failure predictions, RUL, or certified diagnostics."
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Select value={prio} onChange={(e) => setPrio(e.target.value)}>
          <option value="all">All priorities</option>
          <option value="urgent">Urgent</option>
          <option value="soon">Soon</option>
          <option value="routine">Routine</option>
        </Select>
        <Badge tone="violet">Method: baseline-anomaly-score</Badge>
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">Component</th>
                <th>Aircraft</th>
                <th>Score</th>
                <th>Priority</th>
                <th>Freshness</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((r) => (
                <tr key={r.componentId} className="cursor-pointer border-t border-white/5 hover:bg-white/5" onClick={() => setOpen(r.componentId)}>
                  <td className="py-2 text-cyan-200">{r.componentId}</td>
                  <td>{r.aircraftId}</td>
                  <td>{r.riskScore}</td>
                  <td>{r.inspectionPriority}</td>
                  <td className="text-xs">{r.dataFreshness.slice(11, 16)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card className="lg:col-span-2 space-y-2 text-sm">
          {selected && comp && (
            <>
              <h2 className="font-semibold">Why {selected.componentId} is ranked</h2>
              <p className="text-slate-300">{narrativeFor(selected, comp.name)}</p>
              <ul className="space-y-1 text-xs">
                {selected.factors.map((f) => (
                  <li key={f.label}>
                    {f.label} (w{f.weight}) — {f.detail}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-slate-500">{selected.disclaimer}</p>
              <Button
                onClick={() => {
                  const alert = app.data.alerts.find((a) => a.componentId === selected.componentId)
                  if (alert) {
                    const wo = app.createWoFromAlert(alert.id)
                    if (wo) nav('/work-orders')
                  } else {
                    app.toast({ title: 'No linked alert; open a work order manually', tone: 'info' })
                    nav('/work-orders')
                  }
                }}
              >
                Create inspection work order
              </Button>
              <Button variant="ghost" onClick={() => nav(`/health?ac=${selected.aircraftId}&c=${selected.componentId}`)}>
                Inspect sensors
              </Button>
            </>
          )}
        </Card>
      </div>
      <Card className="mt-4">
        <h2 className="mb-2 text-sm font-semibold">Score distribution</h2>
        <div className="h-48">
          <ResponsiveContainer>
            <BarChart data={ranked.slice(0, 12).map((r) => ({ name: r.componentId, score: r.riskScore }))}>
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} interval={0} angle={-20} />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Bar dataKey="score" fill="#22d3ee" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}
