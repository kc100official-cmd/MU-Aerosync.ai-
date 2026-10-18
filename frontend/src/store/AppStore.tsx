import { buildSeed } from '@/data/seed'
import { uid } from '@/lib/id'
import { maybeAnomalyAlert } from '@/services/predictive'
import type {
  Aircraft,
  Alert,
  AppData,
  DateRange,
  InventoryPart,
  PurchaseRequest,
  Role,
  SensorReading,
  Session,
  Toast,
  UiFilters,
  WorkOrder,
  WorkOrderStatus,
} from '@/types'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'

const KEY = 'aerosync-ai-state-v1'

export type DemoScenario = 'none' | 'A' | 'B' | 'C'

interface State {
  data: AppData
  session: Session | null
  filters: UiFilters
  toasts: Toast[]
  simPaused: boolean
  simLiveAircraft: string
  demoScenario: DemoScenario
  demoStep: number
}

type Action =
  | { type: 'HYDRATE'; state: Partial<State> }
  | { type: 'LOGIN'; session: Session }
  | { type: 'LOGOUT' }
  | { type: 'SET_ROLE'; role: Role }
  | { type: 'SET_FILTERS'; filters: Partial<UiFilters> }
  | { type: 'TOAST'; toast: Omit<Toast, 'id'> }
  | { type: 'DISMISS_TOAST'; id: string }
  | { type: 'RESET' }
  | { type: 'SET_SIM'; paused: boolean }
  | { type: 'SIM_TICK'; reading: SensorReading; alert?: Alert | null }
  | { type: 'UPSERT_AIRCRAFT'; aircraft: Aircraft }
  | { type: 'IMPORT_AIRCRAFT'; aircraft: Aircraft[] }
  | { type: 'SAVE_WO'; wo: WorkOrder }
  | { type: 'ACK_ALERT'; id: string }
  | { type: 'READ_ALERT'; id: string }
  | { type: 'RESOLVE_ALERT'; id: string; note: string }
  | { type: 'RESERVE'; partId: string; qty: number; workOrderId?: string; userId: string }
  | { type: 'ADJUST_STOCK'; partId: string; qty: number; userId: string }
  | { type: 'PURCHASE'; req: PurchaseRequest }
  | { type: 'UPDATE_SCHEDULE'; id: string; start: string; end: string }
  | { type: 'SCENARIO'; scenario: DemoScenario }
  | { type: 'DEMO_STEP'; step: number }
  | { type: 'AUDIT'; userId: string; action: string; detail: string }

function range(preset: DateRange['preset']): DateRange {
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90
  return { preset, from: new Date(Date.now() - days * 86400000).toISOString(), to: new Date().toISOString() }
}

function initial(): State {
  return {
    data: buildSeed(),
    session: null,
    filters: { fleet: 'all', dateRange: range('7d'), search: '', aircraftQuery: '' },
    toasts: [],
    simPaused: false,
    simLiveAircraft: 'AS-102',
    demoScenario: 'none',
    demoStep: 0,
  }
}

function persistable(s: State) {
  return {
    data: s.data,
    session: s.session,
    filters: s.filters,
    simPaused: s.simPaused,
    simLiveAircraft: s.simLiveAircraft,
    demoScenario: s.demoScenario,
    demoStep: s.demoStep,
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, ...action.state } as State
    case 'LOGIN':
      return { ...state, session: action.session }
    case 'LOGOUT':
      return { ...state, session: null }
    case 'SET_ROLE':
      if (!state.session) return state
      return { ...state, session: { ...state.session, role: action.role } }
    case 'SET_FILTERS':
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.filters,
          dateRange: action.filters.dateRange
            ? action.filters.dateRange
            : action.filters.fleet
              ? state.filters.dateRange
              : state.filters.dateRange,
        },
      }
    case 'TOAST':
      return { ...state, toasts: [...state.toasts.slice(-4), { ...action.toast, id: uid('tst') }] }
    case 'DISMISS_TOAST':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) }
    case 'RESET':
      return { ...initial(), session: state.session, toasts: [{ id: uid('tst'), title: 'Demo dataset reset', tone: 'success' }] }
    case 'SET_SIM':
      return { ...state, simPaused: action.paused }
    case 'SIM_TICK': {
      const readings = [...state.data.readings.slice(-8000), action.reading]
      let alerts = state.data.alerts
      if (action.alert && !alerts.some((a) => a.fingerprint === action.alert!.fingerprint && !a.resolved)) {
        alerts = [action.alert, ...alerts]
      }
      return { ...state, data: { ...state.data, readings, alerts } }
    }
    case 'UPSERT_AIRCRAFT': {
      const exists = state.data.aircraft.some((a) => a.id === action.aircraft.id)
      const aircraft = exists
        ? state.data.aircraft.map((a) => (a.id === action.aircraft.id ? action.aircraft : a))
        : [...state.data.aircraft, action.aircraft]
      return { ...state, data: { ...state.data, aircraft } }
    }
    case 'IMPORT_AIRCRAFT':
      return { ...state, data: { ...state.data, aircraft: [...state.data.aircraft, ...action.aircraft] } }
    case 'SAVE_WO': {
      const exists = state.data.workOrders.some((w) => w.id === action.wo.id)
      const workOrders = exists
        ? state.data.workOrders.map((w) => (w.id === action.wo.id ? action.wo : w))
        : [action.wo, ...state.data.workOrders]
      return { ...state, data: { ...state.data, workOrders } }
    }
    case 'ACK_ALERT':
      return {
        ...state,
        data: {
          ...state.data,
          alerts: state.data.alerts.map((a) => (a.id === action.id ? { ...a, acknowledged: true, read: true } : a)),
        },
      }
    case 'READ_ALERT':
      return {
        ...state,
        data: {
          ...state.data,
          alerts: state.data.alerts.map((a) => (a.id === action.id ? { ...a, read: true } : a)),
        },
      }
    case 'RESOLVE_ALERT':
      return {
        ...state,
        data: {
          ...state.data,
          alerts: state.data.alerts.map((a) =>
            a.id === action.id ? { ...a, resolved: true, read: true, acknowledged: true, resolveNote: action.note } : a,
          ),
        },
      }
    case 'RESERVE': {
      const part = state.data.parts.find((p) => p.id === action.partId)
      if (!part) return state
      const free = part.qtyAvailable - part.qtyReserved
      if (action.qty <= 0 || action.qty > free) return state
      const parts = state.data.parts.map((p) =>
        p.id === action.partId ? { ...p, qtyReserved: p.qtyReserved + action.qty } : p,
      )
      const workOrders = action.workOrderId
        ? state.data.workOrders.map((w) => {
            if (w.id !== action.workOrderId) return w
            return {
              ...w,
              requiredParts: w.requiredParts.map((r) =>
                r.partId === action.partId ? { ...r, reserved: r.reserved + action.qty } : r,
              ),
              status: (w.requiredParts.every((r) => {
                const need = r.partId === action.partId ? r.reserved + action.qty : r.reserved
                return need >= r.quantity
              })
                ? w.status === 'awaiting_parts'
                  ? 'planned'
                  : w.status
                : w.status) as WorkOrderStatus,
            }
          })
        : state.data.workOrders
      return {
        ...state,
        data: {
          ...state.data,
          parts,
          workOrders,
          transactions: [
            {
              id: uid('tx'),
              partId: action.partId,
              type: 'reserve',
              quantity: action.qty,
              at: new Date().toISOString(),
              note: 'Reservation',
              workOrderId: action.workOrderId,
              userId: action.userId,
            },
            ...state.data.transactions,
          ],
        },
      }
    }
    case 'ADJUST_STOCK': {
      const parts = state.data.parts.map((p) => {
        if (p.id !== action.partId) return p
        const qtyAvailable = Math.max(0, p.qtyAvailable + action.qty)
        return { ...p, qtyAvailable, qtyReserved: Math.min(p.qtyReserved, qtyAvailable) }
      })
      let workOrders = state.data.workOrders
      const part = parts.find((p) => p.id === action.partId)
      if (part && part.qtyAvailable === 0) {
        workOrders = workOrders.map((w) =>
          w.requiredParts.some((r) => r.partId === action.partId && r.quantity > 0) && w.status !== 'completed'
            ? { ...w, status: 'awaiting_parts' as const, notes: `${w.notes} Shortage flagged.`.trim() }
            : w,
        )
      }
      return {
        ...state,
        data: {
          ...state.data,
          parts,
          workOrders,
          transactions: [
            {
              id: uid('tx'),
              partId: action.partId,
              type: 'adjust',
              quantity: action.qty,
              at: new Date().toISOString(),
              note: 'Stock adjustment',
              userId: action.userId,
            },
            ...state.data.transactions,
          ],
        },
      }
    }
    case 'PURCHASE':
      return { ...state, data: { ...state.data, purchaseRequests: [action.req, ...state.data.purchaseRequests] } }
    case 'UPDATE_SCHEDULE':
      return {
        ...state,
        data: {
          ...state.data,
          schedules: state.data.schedules.map((s) =>
            s.id === action.id ? { ...s, start: action.start, end: action.end } : s,
          ),
        },
      }
    case 'SCENARIO':
      return applyScenario({ ...state, demoScenario: action.scenario, demoStep: 1 }, action.scenario)
    case 'DEMO_STEP':
      return { ...state, demoStep: action.step }
    case 'AUDIT':
      return {
        ...state,
        data: {
          ...state.data,
          audit: [
            { id: uid('aud'), at: new Date().toISOString(), userId: action.userId, action: action.action, detail: action.detail },
            ...state.data.audit,
          ],
        },
      }
    default:
      return state
  }
}

function applyScenario(state: State, scenario: DemoScenario): State {
  if (scenario === 'none') return state
  if (scenario === 'A') {
    return {
      ...state,
      simLiveAircraft: 'AS-102',
      filters: { ...state.filters, fleet: 'Alpha', aircraftQuery: 'AS-102' },
      toasts: [...state.toasts, { id: uid('tst'), title: 'Scenario A — Early fault detection', detail: 'AS-102 / ENG-204 vibration trend', tone: 'warning' }],
    }
  }
  if (scenario === 'B') {
    const parts = state.data.parts.map((p) => (p.id === 'PRT-01' ? { ...p, qtyAvailable: 0, qtyReserved: 0 } : p))
    const workOrders = state.data.workOrders.map((w) =>
      w.id === 'WO-1045' ? { ...w, status: 'awaiting_parts' as const } : w,
    )
    return {
      ...state,
      data: { ...state.data, parts, workOrders },
      filters: { ...state.filters, fleet: 'Bravo', aircraftQuery: 'AS-104' },
      toasts: [...state.toasts, { id: uid('tst'), title: 'Scenario B — Spare part shortage', detail: 'EDP-440 unavailable for WO-1045', tone: 'danger' }],
    }
  }
  return {
    ...state,
    filters: { ...state.filters, fleet: 'Charlie', aircraftQuery: 'AS-105' },
    toasts: [...state.toasts, { id: uid('tst'), title: 'Scenario C — Maintenance planning', detail: 'AS-105 inspection window', tone: 'info' }],
  }
}

interface StoreApi extends State {
  login: (email: string, password: string) => boolean
  logout: () => void
  setRole: (role: Role) => void
  setFilters: (f: Partial<UiFilters>) => void
  setDatePreset: (preset: DateRange['preset']) => void
  toast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
  resetDemo: () => void
  setSimPaused: (paused: boolean) => void
  upsertAircraft: (a: Aircraft) => void
  importAircraft: (a: Aircraft[]) => void
  saveWorkOrder: (wo: WorkOrder) => void
  createWoFromAlert: (alertId: string) => WorkOrder | null
  ackAlert: (id: string) => void
  readAlert: (id: string) => void
  resolveAlert: (id: string, note: string) => void
  reserve: (partId: string, qty: number, workOrderId?: string) => { ok: boolean; message: string }
  adjustStock: (partId: string, qty: number) => { ok: boolean; message: string }
  createPurchase: (part: InventoryPart, qty: number, note: string) => void
  updateSchedule: (id: string, start: string, end: string) => void
  runScenario: (s: DemoScenario) => void
  setDemoStep: (n: number) => void
  filteredAircraft: Aircraft[]
  can: (action: string) => boolean
}

const Ctx = createContext<StoreApi | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initial)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as Partial<State>
      if (parsed.data?.aircraft?.length) dispatch({ type: 'HYDRATE', state: parsed })
    } catch {
      /* ignore corrupt cache */
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(persistable(state)))
  }, [state.data, state.session, state.filters, state.simPaused, state.simLiveAircraft, state.demoScenario, state.demoStep])

  useEffect(() => {
    if (state.simPaused || !state.session) return
    const t = window.setInterval(() => {
      const comps = state.data.components.filter((c) => c.aircraftId === state.simLiveAircraft)
      const c = comps[0]
      if (!c) return
      const last = state.data.readings.filter((r) => r.componentId === c.id && r.metric === 'vibration').at(-1)
      const value = Number(((last?.value ?? 1.2) + (Math.random() - 0.42) * 0.08).toFixed(2))
      const reading: SensorReading = {
        id: uid('rd'),
        aircraftId: c.aircraftId,
        componentId: c.id,
        metric: 'vibration',
        value,
        unit: 'ips',
        timestamp: new Date().toISOString(),
        simulated: true,
      }
      dispatch({ type: 'SIM_TICK', reading, alert: maybeAnomalyAlert(state.data, reading) })
    }, 3500)
    return () => window.clearInterval(t)
  }, [state.simPaused, state.session, state.simLiveAircraft, state.data.components, state.data.readings, state.data])

  const login = useCallback((email: string, password: string) => {
    const user = state.data.users.find((u) => u.email === email && u.password === password)
    if (!user) {
      dispatch({ type: 'TOAST', toast: { title: 'Sign-in failed', detail: 'Use a documented demo account.', tone: 'danger' } })
      return false
    }
    dispatch({ type: 'LOGIN', session: { userId: user.id, role: user.role } })
    dispatch({ type: 'AUDIT', userId: user.id, action: 'login', detail: 'Demo session started' })
    return true
  }, [state.data.users])

  const can = useCallback(
    (action: string) => {
      const role = state.session?.role
      if (!role) return false
      if (role === 'administrator') return true
      if (action === 'inventory') return role === 'inventory_manager' || role === 'fleet_manager'
      if (action === 'schedule') return role === 'fleet_manager'
      if (action === 'workorders') return role === 'maintenance_engineer' || role === 'fleet_manager'
      if (action === 'settings') return false
      return true
    },
    [state.session],
  )

  const filteredAircraft = useMemo(() => {
    return state.data.aircraft.filter((a) => {
      if (state.filters.fleet !== 'all' && a.fleet !== state.filters.fleet) return false
      const q = (state.filters.aircraftQuery || state.filters.search).trim().toLowerCase()
      if (q && !`${a.id} ${a.model} ${a.fleet} ${a.status}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [state.data.aircraft, state.filters])

  const api: StoreApi = {
    ...state,
    login,
    logout: () => dispatch({ type: 'LOGOUT' }),
    setRole: (role) => dispatch({ type: 'SET_ROLE', role }),
    setFilters: (f) => dispatch({ type: 'SET_FILTERS', filters: f }),
    setDatePreset: (preset) => dispatch({ type: 'SET_FILTERS', filters: { dateRange: range(preset) } }),
    toast: (t) => dispatch({ type: 'TOAST', toast: t }),
    dismissToast: (id) => dispatch({ type: 'DISMISS_TOAST', id }),
    resetDemo: () => dispatch({ type: 'RESET' }),
    setSimPaused: (paused) => dispatch({ type: 'SET_SIM', paused }),
    upsertAircraft: (a) => {
      dispatch({ type: 'UPSERT_AIRCRAFT', aircraft: a })
      dispatch({ type: 'TOAST', toast: { title: `Aircraft ${a.id} saved`, tone: 'success' } })
    },
    importAircraft: (a) => {
      dispatch({ type: 'IMPORT_AIRCRAFT', aircraft: a })
      dispatch({ type: 'TOAST', toast: { title: `Imported ${a.length} aircraft`, tone: 'success' } })
    },
    saveWorkOrder: (wo) => {
      dispatch({ type: 'SAVE_WO', wo })
      dispatch({
        type: 'AUDIT',
        userId: state.session?.userId ?? 'anonymous',
        action: 'work-order',
        detail: `${wo.id} → ${wo.status}`,
      })
      dispatch({ type: 'TOAST', toast: { title: `${wo.id} saved`, tone: 'success' } })
    },
    createWoFromAlert: (alertId) => {
      const alert = state.data.alerts.find((a) => a.id === alertId)
      if (!alert?.aircraftId) return null
      const wo: WorkOrder = {
        id: `WO-${Math.floor(2000 + Math.random() * 7000)}`,
        aircraftId: alert.aircraftId,
        componentId: alert.componentId,
        title: `Inspection from alert: ${alert.title}`,
        faultDescription: `${alert.description}\n\nSource alert ${alert.id}. Baseline recommendation only — does not authorize maintenance or release.`,
        priority: alert.severity === 'critical' ? 'critical' : 'high',
        assignee: 'Maya Chen',
        team: 'Line North',
        requiredParts: alert.componentId === 'ENG-204' ? [{ partId: 'PRT-02', quantity: 1, reserved: 0 }] : [],
        estimatedHours: 6,
        plannedStart: new Date().toISOString(),
        dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
        status: 'open',
        notes: 'Created from predictive/anomaly alert. Human authorization still required.',
        completionNotes: '',
        checklist: [
          { id: 'c1', label: 'Review evidence pack', done: false },
          { id: 'c2', label: 'Perform inspection per AMM', done: false },
          { id: 'c3', label: 'Independent inspection if required', done: false },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sourceAlertId: alert.id,
      }
      dispatch({ type: 'SAVE_WO', wo })
      dispatch({ type: 'TOAST', toast: { title: `Work order ${wo.id} opened`, detail: 'Not a release-to-service action', tone: 'success' } })
      return wo
    },
    ackAlert: (id) => dispatch({ type: 'ACK_ALERT', id }),
    readAlert: (id) => dispatch({ type: 'READ_ALERT', id }),
    resolveAlert: (id, note) => {
      dispatch({ type: 'RESOLVE_ALERT', id, note })
      dispatch({ type: 'TOAST', toast: { title: 'Alert resolved with audit note', detail: 'Not proof a fault is fixed', tone: 'info' } })
    },
    reserve: (partId, qty, workOrderId) => {
      const part = state.data.parts.find((p) => p.id === partId)
      if (!part) return { ok: false, message: 'Unknown part' }
      const free = part.qtyAvailable - part.qtyReserved
      if (qty <= 0) return { ok: false, message: 'Quantity must be positive' }
      if (qty > free) return { ok: false, message: `Only ${free} unreserved units available` }
      dispatch({ type: 'RESERVE', partId, qty, workOrderId, userId: state.session?.userId ?? 'usr-inv' })
      dispatch({ type: 'TOAST', toast: { title: `Reserved ${qty} × ${part.partNumber}`, tone: 'success' } })
      return { ok: true, message: 'Reserved' }
    },
    adjustStock: (partId, qty) => {
      if (!Number.isFinite(qty) || qty === 0) return { ok: false, message: 'Enter a non-zero quantity' }
      dispatch({ type: 'ADJUST_STOCK', partId, qty, userId: state.session?.userId ?? 'usr-inv' })
      dispatch({ type: 'TOAST', toast: { title: 'Stock updated', tone: 'success' } })
      return { ok: true, message: 'Updated' }
    },
    createPurchase: (part, qty, note) => {
      if (qty <= 0) {
        dispatch({ type: 'TOAST', toast: { title: 'Invalid quantity', tone: 'danger' } })
        return
      }
      const req: PurchaseRequest = {
        id: uid('pr'),
        partId: part.id,
        quantity: qty,
        status: 'submitted',
        createdAt: new Date().toISOString(),
        note,
        expectedLeadDays: part.leadTimeDays,
      }
      dispatch({ type: 'PURCHASE', req })
      dispatch({
        type: 'TOAST',
        toast: {
          title: `Purchase request ${req.id}`,
          detail: `Catalog lead time ${part.leadTimeDays}d is not a confirmed delivery date.`,
          tone: 'success',
        },
      })
    },
    updateSchedule: (id, start, end) => {
      dispatch({ type: 'UPDATE_SCHEDULE', id, start, end })
      dispatch({ type: 'TOAST', toast: { title: 'Schedule updated', detail: 'Still subject to AMP and authorized personnel', tone: 'success' } })
    },
    runScenario: (s) => dispatch({ type: 'SCENARIO', scenario: s }),
    setDemoStep: (n) => dispatch({ type: 'DEMO_STEP', step: n }),
    filteredAircraft,
    can,
  }

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useApp() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp outside provider')
  return ctx
}

export function currentUser(state: { data: AppData; session: Session | null }) {
  return state.data.users.find((u) => u.id === state.session?.userId)
}
