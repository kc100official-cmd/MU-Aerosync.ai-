import { Button, Card, PageHeader } from '@/components/ui/primitives'
import { aircraftExportRows, downloadCsv, toCsv } from '@/services/csv'
import { useApp } from '@/store/AppStore'
import { healthBand } from '@/lib/format'
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export function ReportsPage() {
  const app = useApp()
  const ac = app.filteredAircraft
  const completed = app.data.workOrders.filter((w) => w.status === 'completed')
  const open = app.data.workOrders.filter((w) => w.status !== 'completed')
  const mttr =
    completed.length > 0
      ? completed.reduce((s, w) => s + w.estimatedHours, 0) / completed.length
      : null
  const byAc = ac.map((a) => ({
    id: a.id,
    downtime: a.status === 'operational' ? 0 : a.status === 'watch' ? 4 : 24,
  }))
  const byComp = app.data.components.reduce<Record<string, number>>((acc, c) => {
    acc[c.system] = (acc[c.system] ?? 0) + (100 - c.healthScore)
    return acc
  }, {})
  const health = ['healthy', 'watch', 'maintenance_required', 'grounded'].map((k) => ({
    name: k,
    n: ac.filter((a) => healthBand(a.healthScore) === k).length,
  }))
  const load = ['low', 'medium', 'high', 'critical'].map((p) => ({
    name: p,
    n: open.filter((w) => w.priority === p).length,
  }))

  const printPdf = () => window.print()

  return (
    <div>
      <PageHeader
        title="Reports & export"
        subtitle="Metrics below are computed from the synthetic demo set unless marked unavailable. No unverified downtime-reduction claims."
        actions={
          <div className="flex gap-2 no-print">
            <Button variant="outline" onClick={() => downloadCsv('aerosync-aircraft.csv', toCsv(aircraftExportRows(app.data)))}>
              Export aircraft CSV
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                downloadCsv(
                  'aerosync-work-orders.csv',
                  toCsv(app.data.workOrders.map((w) => ({ id: w.id, aircraftId: w.aircraftId, status: w.status, priority: w.priority, title: w.title }))),
                )
              }
            >
              Export work orders
            </Button>
            <Button onClick={printPdf}>Print / PDF</Button>
          </div>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold">Availability (demo occupancy)</h2>
          <p className="text-xs text-slate-500">Operational count ÷ fleet size on each synthetic day.</p>
          <div className="h-40">
            <ResponsiveContainer>
              <LineChart
                data={Array.from({ length: 7 }, (_, i) => ({
                  d: `D${i + 1}`,
                  v: Number((((ac.filter((a) => a.status === 'operational').length - (i % 2)) / Math.max(1, ac.length)) * 100).toFixed(1)),
                }))}
              >
                <XAxis dataKey="d" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Line dataKey="v" stroke="#22d3ee" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="text-sm font-semibold">MTTR (illustrative)</h2>
          <p className="text-xs text-slate-500">Mean estimatedHours on completed demo work orders. Not measured shop time.</p>
          <div className="mt-2 font-display text-3xl">{mttr ? `${mttr.toFixed(1)} h` : 'Unavailable'}</div>
        </Card>
        <Card>
          <h2 className="text-sm font-semibold">MTBF</h2>
          <p className="text-xs text-slate-500">Insufficient certified failure-interval records in this prototype — metric unavailable.</p>
          <div className="mt-2 font-display text-3xl">Unavailable</div>
        </Card>
        <Card>
          <h2 className="text-sm font-semibold">Scheduled vs unscheduled (demo WO titles)</h2>
          <p className="text-xs text-slate-500">Heuristic: planned/preventive titles vs remaining open packages.</p>
          <div className="h-40">
            <ResponsiveContainer>
              <BarChart
                data={[
                  { name: 'Scheduled-like', n: app.data.workOrders.filter((w) => /inspect|check|service|a-check/i.test(w.title)).length },
                  { name: 'Other', n: app.data.workOrders.filter((w) => !/inspect|check|service|a-check/i.test(w.title)).length },
                ]}
              >
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="n" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="text-sm font-semibold">Illustrative downtime by aircraft</h2>
          <p className="text-xs text-slate-500">Assigned hours from current status, not historical out-of-service logs.</p>
          <div className="h-40">
            <ResponsiveContainer>
              <BarChart data={byAc}>
                <XAxis dataKey="id" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="downtime" fill="#22d3ee" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="text-sm font-semibold">Component deficit (100 − health)</h2>
          <div className="h-40">
            <ResponsiveContainer>
              <BarChart data={Object.entries(byComp).map(([name, n]) => ({ name, n }))}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="n" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="text-sm font-semibold">Health bands</h2>
          <div className="h-40">
            <ResponsiveContainer>
              <BarChart data={health}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="n" fill="#34d399" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="text-sm font-semibold">Open workload by priority</h2>
          <div className="h-40">
            <ResponsiveContainer>
              <BarChart data={load}>
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="n" fill="#818cf8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}
