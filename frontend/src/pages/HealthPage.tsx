import { Badge, Button, Card, PageHeader, Select } from '@/components/ui/primitives'
import { useApp } from '@/store/AppStore'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const METRICS = ['temperature', 'vibration', 'pressure', 'oil_temp', 'n1', 'n2'] as const

export function HealthPage() {
  const app = useApp()
  const [params, setParams] = useSearchParams()
  const acId = params.get('ac') ?? app.simLiveAircraft
  const comps = app.data.components.filter((c) => c.aircraftId === acId)
  const cId = params.get('c') ?? comps[0]?.id
  const [metric, setMetric] = useState<(typeof METRICS)[number]>('vibration')
  const [windowHrs, setWindowHrs] = useState(24)

  const rows = useMemo(() => {
    const from = Date.now() - windowHrs * 3600_000
    return app.data.readings
      .filter((r) => r.componentId === cId && r.metric === metric && new Date(r.timestamp).getTime() >= from)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map((r) => ({ t: r.timestamp.slice(11, 16), v: r.value }))
  }, [app.data.readings, cId, metric, windowHrs])

  const th = app.data.thresholds.find((t) => t.componentId === cId && t.metric === metric)
  const last = rows.at(-1)
  const crossed = th && last && ((th.cautionHigh != null && last.v > th.cautionHigh) || (th.cautionLow != null && last.v < th.cautionLow))
  const conn = acId === 'AS-106' ? 'delayed' : 'simulated'

  return (
    <div>
      <PageHeader
        title="Live health monitoring"
        subtitle="Timer-driven simulated samples. DEMO MODE — this dashboard is not receiving actual aircraft data."
        actions={
          <div className="flex gap-2">
            <Badge tone="cyan">DEMO MODE</Badge>
            <Badge tone={conn === 'delayed' ? 'amber' : 'violet'}>{conn}</Badge>
            <Button variant="outline" onClick={() => app.setSimPaused(!app.simPaused)}>
              {app.simPaused ? 'Resume simulation' : 'Pause simulation'}
            </Button>
          </div>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Select
          value={acId}
          onChange={(e) => {
            setParams({ ac: e.target.value })
          }}
        >
          {app.filteredAircraft.map((a) => (
            <option key={a.id}>{a.id}</option>
          ))}
        </Select>
        <Select
          value={cId}
          onChange={(e) => {
            setParams({ ac: acId, c: e.target.value })
          }}
        >
          {comps.map((c) => (
            <option key={c.id} value={c.id}>
              {c.id}
            </option>
          ))}
        </Select>
        <Select value={metric} onChange={(e) => setMetric(e.target.value as (typeof METRICS)[number])}>
          {METRICS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </Select>
        <Select value={String(windowHrs)} onChange={(e) => setWindowHrs(Number(e.target.value))}>
          <option value="6">6h</option>
          <option value="24">24h</option>
          <option value="72">72h</option>
        </Select>
      </div>
      {crossed && (
        <Card className="mb-4 border border-red-500/40">
          <div className="font-semibold text-red-300">Configured threshold crossed (simulated)</div>
          <p className="text-sm text-slate-400">Latest {metric} is {last?.v}. Inspect supporting samples. This is not a live aircraft caution.</p>
        </Card>
      )}
      <Card>
        <div className="mb-2 flex justify-between text-sm">
          <span>
            {cId} · {metric}
            {last ? ` · ${last.v}` : ''}
          </span>
          <span className="text-slate-500">Freshness: simulation clock</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer>
            <LineChart data={rows}>
              <XAxis dataKey="t" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip />
              {th?.cautionHigh != null && <ReferenceLine y={th.cautionHigh} stroke="#f59e0b" strokeDasharray="4 4" />}
              {th?.cautionLow != null && <ReferenceLine y={th.cautionLow} stroke="#f59e0b" strokeDasharray="4 4" />}
              <Line dataKey="v" stroke="#22d3ee" dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}
