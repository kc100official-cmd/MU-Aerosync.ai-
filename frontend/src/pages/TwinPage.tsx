import { AircraftSchematic } from '@/components/twin/AircraftSchematic'
import { Badge, Card, PageHeader, Select } from '@/components/ui/primitives'
import { assessComponent } from '@/services/predictive'
import { useApp } from '@/store/AppStore'
import type { ComponentSystem } from '@/types'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const SYSTEMS: ComponentSystem[] = ['engine', 'fuel', 'hydraulic', 'landing_gear', 'electrical', 'avionics', 'ecs']

export function TwinPage() {
  const app = useApp()
  const [params, setParams] = useSearchParams()
  const acId = params.get('ac') ?? app.filteredAircraft[0]?.id ?? 'AS-102'
  const [system, setSystem] = useState<ComponentSystem>('engine')
  const [cursor, setCursor] = useState(72)

  const ac = app.data.aircraft.find((a) => a.id === acId)
  const comps = app.data.components.filter((c) => c.aircraftId === acId)
  const selected = comps.find((c) => c.system === system) ?? comps[0]
  const scores = Object.fromEntries(SYSTEMS.map((s) => [s, comps.find((c) => c.system === s)?.healthScore ?? 88])) as Partial<
    Record<ComponentSystem, number>
  >

  const series = useMemo(() => {
    if (!selected) return []
    return app.data.readings
      .filter((r) => r.componentId === selected.id && r.metric === 'vibration')
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .slice(0, cursor)
      .map((r) => ({ t: r.timestamp.slice(11, 16), v: r.value }))
  }, [app.data.readings, selected, cursor])

  const risk = selected ? assessComponent(app.data, selected) : null
  const wos = app.data.workOrders.filter((w) => w.componentId === selected?.id)
  const faults = app.data.faults.filter((f) => f.componentId === selected?.id)

  return (
    <div>
      <PageHeader
        title="Aircraft digital twin"
        subtitle="Interactive SVG schematic with synthetic overlay. Simulated demonstration — not connected to a real airframe."
        actions={
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
        }
      />
      <Badge tone="cyan">Simulated demonstration</Badge>
      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <div className="mb-2 text-sm text-slate-400">
            {ac?.id} {ac?.model}
          </div>
          <AircraftSchematic selected={system} scores={scores} onSelect={setSystem} />
          <div className="mt-3 flex flex-wrap gap-2">
            {SYSTEMS.map((s) => (
              <button
                key={s}
                onClick={() => setSystem(s)}
                className={`rounded-full px-3 py-1 text-xs ${system === s ? 'bg-cyan-400/20 text-cyan-200' : 'bg-white/5'}`}
              >
                {s.replaceAll('_', ' ')}
              </button>
            ))}
          </div>
          <label className="mt-4 block text-xs text-slate-400">
            History cursor ({cursor} samples)
            <input className="w-full" type="range" min={12} max={72} value={cursor} onChange={(e) => setCursor(Number(e.target.value))} />
          </label>
        </Card>
        <Card className="lg:col-span-2 space-y-2 text-sm">
          {selected ? (
            <>
              <h2 className="font-semibold">
                {selected.name} · {selected.id}
              </h2>
              <div>Health {selected.healthScore} · baseline risk {risk?.riskScore}</div>
              <div className="text-xs text-slate-400">Serial {selected.serial}</div>
              <h3 className="pt-2 text-xs uppercase text-slate-500">Latest simulated sensors</h3>
              {['temperature', 'vibration', 'pressure'].map((m) => {
                const r = app.data.readings.filter((x) => x.componentId === selected.id && x.metric === m).at(-1)
                return (
                  <div key={m} className="flex justify-between">
                    <span>{m}</span>
                    <span>
                      {r?.value} {r?.unit}
                    </span>
                  </div>
                )
              })}
              <h3 className="pt-2 text-xs uppercase text-slate-500">Anomalies / faults</h3>
              {faults.map((f) => (
                <div key={f.id}>{f.code}</div>
              ))}
              <h3 className="pt-2 text-xs uppercase text-slate-500">Related work orders</h3>
              {wos.slice(0, 4).map((w) => (
                <div key={w.id}>
                  {w.id} {w.status}
                </div>
              ))}
              <p className="text-xs text-slate-500">{risk?.recommendedAction}</p>
            </>
          ) : (
            <p>No mapped component for this hotspot on {acId}.</p>
          )}
        </Card>
      </div>
      <Card className="mt-4">
        <h2 className="mb-2 text-sm font-semibold">Historical vibration (simulated)</h2>
        <div className="h-48">
          <ResponsiveContainer>
            <LineChart data={series}>
              <XAxis dataKey="t" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip />
              <Line dataKey="v" stroke="#22d3ee" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}
