import { Logo } from '@/components/Logo'
import { Badge, Button, Input } from '@/components/ui/primitives'
import { cn } from '@/lib/cn'
import { currentUser, useApp } from '@/store/AppStore'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Box,
  CalendarRange,
  ClipboardList,
  Cpu,
  Gauge,
  LayoutDashboard,
  Menu,
  Plane,
  Search,
  Settings,
  Sparkles,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

const NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/fleet', label: 'Fleet Intelligence', icon: Plane },
  { to: '/twin', label: 'Digital Twin', icon: Cpu },
  { to: '/predictive', label: 'Predictive', icon: Sparkles },
  { to: '/health', label: 'Health Monitoring', icon: Activity },
  { to: '/work-orders', label: 'Work Orders', icon: ClipboardList },
  { to: '/inventory', label: 'Inventory', icon: Box },
  { to: '/timeline', label: 'Timeline', icon: CalendarRange },
  { to: '/insights', label: 'AI Insights', icon: BarChart3 },
  { to: '/alerts', label: 'Alerts', icon: AlertTriangle },
  { to: '/reports', label: 'Reports', icon: Gauge },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function AppShell() {
  const app = useApp()
  const user = currentUser(app)
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const [clock, setClock] = useState(() => new Date())
  useEffect(() => {
    const t = window.setInterval(() => setClock(new Date()), 1000)
    return () => window.clearInterval(t)
  }, [])

  const unread = app.data.alerts.filter((a) => !a.read).length
  const hits = useMemo(() => {
    const q = app.filters.search.trim().toLowerCase()
    if (q.length < 2) return []
    return [
      ...app.data.aircraft.filter((a) => a.id.toLowerCase().includes(q)).map((a) => ({ to: `/fleet/${a.id}`, label: a.id })),
      ...app.data.workOrders.filter((w) => w.id.toLowerCase().includes(q)).map((w) => ({ to: '/work-orders', label: w.id })),
    ].slice(0, 6)
  }, [app.filters.search, app.data.aircraft, app.data.workOrders])

  return (
    <div className="min-h-screen bg-[#050814] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,211,238,0.08),transparent_45%),radial-gradient(ellipse_at_bottom_right,_rgba(99,102,241,0.08),transparent_40%)]" />
      <aside
        className={cn(
          'glass fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto p-4 transition lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="mb-5 flex items-center justify-between">
          <Logo />
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="relative mx-auto mb-5 h-24 w-24 radar-sweep rounded-full border border-cyan-400/20">
          <div className="sweep-arm absolute inset-0">
            <div className="h-1/2 w-px bg-gradient-to-b from-cyan-300 to-transparent mx-auto" />
          </div>
          <div className="absolute inset-3 rounded-full border border-cyan-400/10" />
          <div className="absolute inset-6 rounded-full border border-cyan-400/10" />
        </div>
        <nav className="space-y-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5',
                  isActive && 'bg-cyan-400/10 text-cyan-200',
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <p className="mt-6 text-[10px] leading-relaxed text-slate-500">
          Decision-support prototype. Synthetic data. Not certified aviation diagnostics.
        </p>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex flex-wrap items-center gap-3 border-b border-white/10 bg-[#050814]/80 px-4 py-3 backdrop-blur-xl">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <Badge tone="cyan">Demo Mode — Synthetic Data</Badge>
          <div className="hidden text-xs text-slate-400 sm:block">
            {clock.toLocaleString()} · simulated telemetry
          </div>
          <div className="relative min-w-[180px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              className="pl-9"
              placeholder="Search aircraft, work orders…"
              value={app.filters.search}
              onChange={(e) => app.setFilters({ search: e.target.value })}
            />
            {hits.length > 0 && (
              <div className="glass absolute z-20 mt-1 w-full rounded-xl p-2">
                {hits.map((h) => (
                  <button
                    key={h.label}
                    className="block w-full rounded-md px-2 py-1 text-left text-sm hover:bg-white/5"
                    onClick={() => {
                      nav(h.to)
                      app.setFilters({ search: '' })
                    }}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <select
            className="rounded-lg border border-white/10 bg-slate-950/70 px-2 py-2 text-xs"
            value={app.filters.fleet}
            onChange={(e) => app.setFilters({ fleet: e.target.value })}
          >
            <option value="all">All fleets</option>
            {['Alpha', 'Bravo', 'Charlie', 'Delta'].map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
          <select
            className="rounded-lg border border-white/10 bg-slate-950/70 px-2 py-2 text-xs"
            value={app.filters.dateRange.preset}
            onChange={(e) => app.setDatePreset(e.target.value as '7d' | '30d' | '90d')}
          >
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
            <option value="90d">90 days</option>
          </select>
          <button className="relative rounded-lg p-2 hover:bg-white/5" onClick={() => nav('/alerts')} aria-label="Notifications">
            <Bell className="h-4 w-4" />
            {unread > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />}
          </button>
          <div className="text-right text-xs">
            <div className="font-medium">{user?.name}</div>
            <div className="capitalize text-slate-500">{user?.role.replaceAll('_', ' ')}</div>
          </div>
          <Button variant="ghost" onClick={() => app.logout()}>
            Sign out
          </Button>
        </header>
        <main className="relative p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      <div className="pointer-events-none fixed bottom-4 right-4 z-50 space-y-2">
        {app.toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto glass w-72 rounded-xl p-3 text-sm">
            <div className="font-medium">{t.title}</div>
            {t.detail && <div className="text-xs text-slate-400">{t.detail}</div>}
            <button className="mt-1 text-xs text-cyan-300" onClick={() => app.dismissToast(t.id)}>
              Dismiss
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
