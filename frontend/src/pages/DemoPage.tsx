import { Button, Card, PageHeader } from '@/components/ui/primitives'
import { executiveBrief } from '@/services/query'
import { useApp } from '@/store/AppStore'
import { useNavigate } from 'react-router-dom'

const STEPS = [
  { title: 'Fleet readiness', body: 'Start on the overview. Availability, grounded tails, and the ENG-204 vibration queue are computed from the same synthetic store.', to: '/', scenario: 'A' as const },
  { title: 'Emerging anomaly', body: 'Open AS-102. The right engine (ENG-204) is the watch item for Scenario A.', to: '/fleet/AS-102', scenario: 'A' as const },
  { title: 'Sensor evidence', body: 'Inspect the simulated vibration trend and caution band on Health Monitoring.', to: '/health?ac=AS-102&c=ENG-204', scenario: 'A' as const },
  { title: 'Inspection work order', body: 'From Predictive or Alerts, create an inspection work order. It does not release the aircraft.', to: '/predictive', scenario: 'A' as const },
  { title: 'Parts block', body: 'Scenario B: WO-1045 needs EDP-440, which has zero stock, so the package stays Awaiting Parts.', to: '/work-orders', scenario: 'B' as const },
  { title: 'Purchase request', body: 'Open inventory, select EDP-440, and submit a purchase request. Lead time is catalog-only.', to: '/inventory', scenario: 'B' as const },
  { title: 'Planner', body: 'Scenario C: review the AS-105 inspection slot and why it is prioritized.', to: '/timeline', scenario: 'C' as const },
  { title: 'Return to overview', body: 'KPIs and alerts reflect the mutated demo state. Reset anytime to replay.', to: '/', scenario: 'none' as const },
]

export function DemoPage() {
  const app = useApp()
  const nav = useNavigate()
  const step = Math.min(app.demoStep || 1, STEPS.length)
  const current = STEPS[step - 1]

  return (
    <div>
      <PageHeader
        title="Guided demo"
        subtitle="Hacked-together live storyline using the real application store. Demo Mode — Synthetic Data."
        actions={
          <Button variant="ghost" onClick={() => app.resetDemo()}>
            Reset & replay
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 space-y-3">
          <div className="text-xs uppercase tracking-wide text-cyan-300">
            Step {step} of {STEPS.length}
          </div>
          <h2 className="font-display text-xl font-bold">{current.title}</h2>
          <p className="text-slate-300">{current.body}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                if (current.scenario !== 'none') app.runScenario(current.scenario)
                app.setDemoStep(step)
                nav(current.to)
              }}
            >
              Open this step
            </Button>
            <Button
              variant="outline"
              disabled={step >= STEPS.length}
              onClick={() => {
                const next = STEPS[step]
                app.setDemoStep(step + 1)
                if (next.scenario !== 'none') app.runScenario(next.scenario)
                nav(next.to)
              }}
            >
              Next
            </Button>
            <Button variant="ghost" disabled={step <= 1} onClick={() => app.setDemoStep(step - 1)}>
              Back
            </Button>
          </div>
        </Card>
        <Card>
          <h3 className="font-semibold">Current briefing</h3>
          <p className="mt-2 text-sm text-slate-400">{executiveBrief(app.data)}</p>
        </Card>
      </div>
      <Card className="mt-4 space-y-2 text-sm leading-relaxed text-slate-300">
        <h2 className="font-semibold text-white">Product overview</h2>
        <p>
          Aircraft availability suffers when health monitoring, technical logs, inventory, and agency workflows live in separate tools. Reactive
          maintenance finds faults late, extends downtime, and strands parts.
        </p>
        <p>
          AEROSYNC AI is a centralized decision-support prototype: baseline anomaly scoring on simulated sensors, a digital twin schematic for
          spatial context, work-order and inventory loops, and a planner that explains priority without pretending to certify airworthiness.
        </p>
        <p>
          Predictive maintenance here is a transparent, replaceable scoring service — not a trained failure model. The digital twin maps systems to
          evidence packs so engineers can inspect trends before opening work.
        </p>
        <p>
          Expected operational impact in production would depend on approved data sources, airline procedures, and a validated model. Deployment path:
          connect AHM/MIS/ERP, replace the baseline scorer with a trained service behind the same interface, and keep humans in the authorization loop.
        </p>
      </Card>
    </div>
  )
}
