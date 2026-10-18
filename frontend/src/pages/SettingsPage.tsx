import { Button, Card, Input, PageHeader, Select } from '@/components/ui/primitives'
import { importAircraftCsv } from '@/services/csv'
import { currentUser, useApp } from '@/store/AppStore'
import type { Role } from '@/types'
import { useState } from 'react'

export function SettingsPage() {
  const app = useApp()
  const user = currentUser(app)
  const [text, setText] = useState('id,model,fleet,type,status,healthScore\nAS-201,A320neo,Echo,Narrowbody,operational,90')
  const [map, setMap] = useState({ id: 'id', model: 'model', fleet: 'fleet', type: 'type', status: 'status', healthScore: 'healthScore' })
  const [errors, setErrors] = useState<string[]>([])

  return (
    <div>
      <PageHeader title="Settings & data sources" subtitle="Demo authentication, local persistence, and CSV import. No external AHM/MIS/ERP connection is configured." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-2 text-sm">
          <h2 className="font-semibold">Session</h2>
          <p>
            {user?.name} · {user?.email}
          </p>
          <label className="block text-xs text-slate-400">
            Role (demo switch)
            <Select value={app.session?.role} onChange={(e) => app.setRole(e.target.value as Role)}>
              {['maintenance_engineer', 'fleet_manager', 'inventory_manager', 'administrator'].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </Select>
          </label>
          <p className="text-xs text-slate-500">Role checks are client-side only in this prototype.</p>
        </Card>
        <Card className="space-y-2 text-sm">
          <h2 className="font-semibold">Integrations</h2>
          <ul className="space-y-1 text-slate-400">
            <li>Aircraft health monitoring — not connected (setup required).</li>
            <li>Maintenance information system — not connected.</li>
            <li>ERP / provisioning — not connected.</li>
            <li>Trained ML endpoint — not connected; baseline scorer active.</li>
          </ul>
        </Card>
        <Card className="lg:col-span-2 space-y-3">
          <h2 className="font-semibold">CSV import (aircraft)</h2>
          <p className="text-xs text-slate-400">Imported rows are untrusted. IDs must use fictional AS- prefixes. Existing IDs are rejected.</p>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (!f) return
              setText(await f.text())
            }}
          />
          <textarea className="h-32 w-full rounded-lg border border-white/10 bg-slate-950/50 p-2 font-mono text-xs" value={text} onChange={(e) => setText(e.target.value)} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {Object.keys(map).map((k) => (
              <label key={k} className="text-xs">
                {k}
                <Input value={map[k as keyof typeof map]} onChange={(e) => setMap({ ...map, [k]: e.target.value })} />
              </label>
            ))}
          </div>
          <Button
            onClick={() => {
              const res = importAircraftCsv(app.data, text, map)
              setErrors(res.errors)
              if (res.ok.length) app.importAircraft(res.ok)
            }}
          >
            Validate & import
          </Button>
          {errors.map((e) => (
            <div key={e} className="text-sm text-red-300">
              {e}
            </div>
          ))}
        </Card>
        <Card className="space-y-2">
          <h2 className="font-semibold">Persistence</h2>
          <p className="text-sm text-slate-400">State is stored in localStorage key aerosync-ai-state-v1.</p>
          <Button variant="danger" onClick={() => app.resetDemo()}>
            Reset demo dataset
          </Button>
        </Card>
        <Card>
          <h2 className="font-semibold">Audit</h2>
          <ul className="max-h-48 overflow-auto text-xs text-slate-400">
            {app.data.audit.slice(0, 20).map((a) => (
              <li key={a.id} className="border-t border-white/5 py-1">
                {a.at.slice(0, 19)} · {a.action} · {a.detail}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
