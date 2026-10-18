import { Badge, Button, Card, Input, PageHeader } from '@/components/ui/primitives'
import { conflicts, suggestPlan } from '@/services/planner'
import { useApp } from '@/store/AppStore'
import { addDays, format, parseISO, startOfDay } from 'date-fns'
import { useMemo, useState } from 'react'

export function TimelinePage() {
  const app = useApp()
  const [start, setStart] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const days = 14
  const from = startOfDay(parseISO(start))
  const suggestions = suggestPlan(app.data)
  const cfl = conflicts(app.data.schedules)
  const ids = new Set(app.filteredAircraft.map((a) => a.id))
  const events = app.data.schedules.filter((s) => ids.has(s.aircraftId))

  const overdue = events.filter((s) => new Date(s.end) < new Date() && !s.title.toLowerCase().includes('complete'))

  const grid = useMemo(() => {
    return Array.from({ length: days }, (_, i) => addDays(from, i))
  }, [from, days])

  return (
    <div>
      <PageHeader
        title="Maintenance timeline"
        subtitle="Proposed slots remain subject to approved maintenance programmes, intervals, and authorized personnel."
        actions={<Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />}
      />
      {cfl.length > 0 && (
        <Card className="mb-4">
          <div className="text-sm text-amber-200">Potential overlaps in the demo calendar</div>
          <ul className="text-xs text-slate-400">
            {cfl.map((c) => (
              <li key={c.a + c.b}>
                {c.aircraftId}: {c.a} overlaps {c.b}
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Card className="overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[120px_repeat(14,minmax(56px,1fr))] text-[10px] text-slate-500">
            <div />
            {grid.map((d) => (
              <div key={d.toISOString()} className="px-1">
                {format(d, 'dd MMM')}
              </div>
            ))}
          </div>
          {app.filteredAircraft.map((ac) => (
            <div key={ac.id} className="grid grid-cols-[120px_repeat(14,minmax(56px,1fr))] border-t border-white/5 py-2 text-xs">
              <div className="text-cyan-200">{ac.id}</div>
              {grid.map((d) => {
                const hit = events.find((s) => s.aircraftId === ac.id && parseISO(s.start) <= addDays(d, 1) && parseISO(s.end) >= d)
                return (
                  <div key={d.toISOString()} className="px-0.5">
                    {hit && (
                      <div className="truncate rounded bg-cyan-400/20 px-1 text-[10px]" title={hit.title}>
                        {hit.kind}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </Card>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 text-sm font-semibold">Suggested planner</h2>
          <ul className="space-y-2 text-sm">
            {suggestions.map((s) => (
              <li key={s.title} className="rounded-lg bg-white/5 p-2">
                <div className="font-medium">
                  {s.aircraftId} · {s.title}
                </div>
                <p className="text-xs text-slate-400">{s.reason}</p>
                <p className="text-xs text-slate-500">{s.constraints[0]}</p>
                <Badge tone={s.partsOk ? 'green' : 'amber'}>{s.partsOk ? 'parts ok' : 'parts risk'}</Badge>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="mb-2 text-sm font-semibold">Edit event window</h2>
          <ul className="space-y-2 text-sm">
            {events.slice(0, 6).map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-2">
                <span className="w-40 truncate">{s.title}</span>
                <Input
                  type="datetime-local"
                  value={s.start.slice(0, 16)}
                  onChange={(e) => app.updateSchedule(s.id, new Date(e.target.value).toISOString(), s.end)}
                />
              </li>
            ))}
          </ul>
          {overdue.length > 0 && <p className="mt-3 text-xs text-amber-200">{overdue.length} items have end dates in the past in this demo calendar.</p>}
          <Button className="mt-3" variant="ghost" onClick={() => app.runScenario('C')}>
            Load planning scenario
          </Button>
        </Card>
      </div>
    </div>
  )
}
