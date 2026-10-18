import { Badge, Button, Card, PageHeader, Select } from '@/components/ui/primitives'
import { answerQuestion, executiveBrief, PRESET_QUESTIONS } from '@/services/query'
import { rankRisks } from '@/services/predictive'
import { useApp } from '@/store/AppStore'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

export function InsightsPage() {
  const app = useApp()
  const [q, setQ] = useState(PRESET_QUESTIONS[0])
  const [custom, setCustom] = useState('')
  const answer = useMemo(() => answerQuestion(app.data, custom || q), [app.data, q, custom])
  const risks = rankRisks(app.data)
  const insights = [
    {
      title: 'Emerging sensor anomalies',
      severity: 'high' as const,
      target: risks[0]?.componentId ?? 'n/a',
      evidence: risks[0]?.factors[0]?.detail ?? 'None',
      next: risks[0]?.recommendedAction ?? '',
      ts: risks[0]?.dataFreshness ?? '',
      to: '/predictive',
    },
    {
      title: 'Work orders blocked by parts',
      severity: 'critical' as const,
      target: 'WO-1045',
      evidence: 'EDP-440 available quantity is 0 in the demo inventory.',
      next: 'Open inventory and submit a purchase request.',
      ts: new Date().toISOString(),
      to: '/inventory',
    },
    {
      title: 'Upcoming inspection workload',
      severity: 'warning' as const,
      target: 'AS-105',
      evidence: 'Block inspection scheduled in the demo calendar within 7 days.',
      next: 'Review planner capacity and AMP constraints.',
      ts: new Date().toISOString(),
      to: '/timeline',
    },
    {
      title: 'Fleet availability snapshot',
      severity: 'info' as const,
      target: 'Fleet',
      evidence: executiveBrief(app.data),
      next: 'Use filters on Overview to inspect non-operational tails.',
      ts: new Date().toISOString(),
      to: '/',
    },
  ]

  return (
    <div>
      <PageHeader
        title="AI insights & decision support"
        subtitle="Deterministic queries over the loaded dataset. No language-model API is configured; there is no fake typing animation."
      />
      <Card className="mb-4">
        <h2 className="mb-2 text-sm font-semibold">Fleet briefing</h2>
        <p className="text-sm text-slate-300">{executiveBrief(app.data)}</p>
        <Button className="mt-3" variant="outline" onClick={() => navigator.clipboard.writeText(executiveBrief(app.data))}>
          Copy briefing
        </Button>
      </Card>
      <div className="grid gap-3 lg:grid-cols-2">
        {insights.map((i) => (
          <Card key={i.title}>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold">{i.title}</h3>
              <Badge tone={i.severity === 'critical' ? 'red' : i.severity === 'high' ? 'amber' : 'cyan'}>{i.severity}</Badge>
            </div>
            <p className="mt-1 text-sm">{i.target}</p>
            <p className="mt-2 text-xs text-slate-400">{i.evidence}</p>
            <p className="mt-2 text-sm">{i.next}</p>
            <p className="mt-1 text-[10px] text-slate-500">{i.ts}</p>
            <Link className="mt-2 inline-block text-sm text-cyan-300" to={i.to}>
              Open related view
            </Link>
          </Card>
        ))}
      </div>
      <Card className="mt-4 space-y-3">
        <h2 className="text-sm font-semibold">Dataset query</h2>
        <Select
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setCustom('')
          }}
        >
          {PRESET_QUESTIONS.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </Select>
        <input
          className="w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-sm"
          placeholder="Or type a question (still answered deterministically)"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
        />
        <div className="rounded-xl bg-white/5 p-3 text-sm">
          <div className="text-xs uppercase text-slate-500">{answer.method}</div>
          <ul className="mt-2 list-disc pl-4">
            {answer.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          <div className="mt-2 flex flex-wrap gap-2">
            {answer.numbers.map((n) => (
              <Badge key={n.label} tone="cyan">
                {n.label}: {n.value}
              </Badge>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
