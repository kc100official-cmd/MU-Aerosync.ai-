import type {
  Aircraft,
  Alert,
  Component,
  InventoryPart,
  MaintenanceSchedule,
  RiskAssessment,
  SensorReading,
  User,
  WorkOrder,
} from '@/types'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
const WS_BASE = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000/ws/telemetry'

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`API Error [${res.status}]: ${errorText || res.statusText}`)
  }

  return res.json()
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getUsers: () => request<User[]>('/auth/users'),

  // Fleet
  getFleet: (fleet?: string, search?: string) => {
    const params = new URLSearchParams()
    if (fleet && fleet !== 'all') params.append('fleet', fleet)
    if (search) params.append('search', search)
    const query = params.toString() ? `?${params.toString()}` : ''
    return request<Aircraft[]>(`/fleet${query}`)
  },
  getAircraft: (id: string) => request<Aircraft>(`/fleet/${id}`),
  upsertAircraft: (aircraft: Aircraft) =>
    request<Aircraft>('/fleet', {
      method: 'POST',
      body: JSON.stringify(aircraft),
    }),

  // Components
  getComponents: (aircraftId?: string) => {
    const query = aircraftId ? `?aircraftId=${encodeURIComponent(aircraftId)}` : ''
    return request<Component[]>(`/components${query}`)
  },
  getComponent: (id: string) => request<Component>(`/components/${id}`),

  // Telemetry
  getReadings: (aircraftId?: string, componentId?: string, metric?: string) => {
    const params = new URLSearchParams()
    if (aircraftId) params.append('aircraftId', aircraftId)
    if (componentId) params.append('componentId', componentId)
    if (metric) params.append('metric', metric)
    const query = params.toString() ? `?${params.toString()}` : ''
    return request<SensorReading[]>(`/telemetry/readings${query}`)
  },
  getTelemetryStatus: () => request<{ paused: boolean; liveAircraft: string }>('/telemetry/status'),
  controlSimulation: (control: { paused?: boolean; liveAircraft?: string }) =>
    request<{ paused: boolean; liveAircraft: string }>('/telemetry/control', {
      method: 'POST',
      body: JSON.stringify(control),
    }),
  triggerTick: () => request<{ ok: boolean; data: any }>('/telemetry/tick', { method: 'POST' }),

  // Predictive
  getRisks: () => request<RiskAssessment[]>('/predictive/risks'),
  getRiskAssessment: (componentId: string) => request<RiskAssessment>(`/predictive/assessment/${componentId}`),
  getNarrative: (componentId: string) =>
    request<{ narrative: string; recommendation: string }>(`/predictive/narrative/${componentId}`),

  // Work Orders
  getWorkOrders: (status?: string, priority?: string, aircraftId?: string) => {
    const params = new URLSearchParams()
    if (status && status !== 'all') params.append('status', status)
    if (priority && priority !== 'all') params.append('priority', priority)
    if (aircraftId) params.append('aircraftId', aircraftId)
    const query = params.toString() ? `?${params.toString()}` : ''
    return request<WorkOrder[]>(`/work-orders${query}`)
  },
  createWorkOrder: (wo: Partial<WorkOrder>) =>
    request<WorkOrder>('/work-orders', {
      method: 'POST',
      body: JSON.stringify(wo),
    }),
  updateWorkOrder: (id: string, wo: Partial<WorkOrder>) =>
    request<WorkOrder>(`/work-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(wo),
    }),
  createWoFromAlert: (alertId: string) =>
    request<WorkOrder>(`/work-orders/from-alert/${alertId}`, {
      method: 'POST',
    }),

  // Inventory
  getParts: () => request<InventoryPart[]>('/inventory/parts'),
  reservePart: (partId: string, quantity: number, workOrderId?: string, userId?: string) =>
    request<{ ok: boolean; message: string; part: InventoryPart }>('/inventory/reserve', {
      method: 'POST',
      body: JSON.stringify({ partId, quantity, workOrderId, userId }),
    }),
  adjustStock: (partId: string, quantity: number, userId?: string) =>
    request<{ ok: boolean; message: string; part: InventoryPart }>('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({ partId, quantity, userId }),
    }),
  createPurchaseRequest: (partId: string, quantity: number, note: string) =>
    request<any>('/inventory/purchases', {
      method: 'POST',
      body: JSON.stringify({ partId, quantity, note }),
    }),

  // Schedules
  getSchedules: () => request<MaintenanceSchedule[]>('/schedules'),
  updateSchedule: (id: string, start: string, end: string) =>
    request<MaintenanceSchedule>(`/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ start, end }),
    }),
  getScheduleConflicts: () => request<Array<{ a: string; b: string; aircraftId: string }>>('/schedules/conflicts'),
  getPlanSuggestions: () => request<any[]>('/schedules/suggestions'),

  // Alerts
  getAlerts: () => request<Alert[]>('/alerts'),
  acknowledgeAlert: (id: string) => request<{ ok: boolean }>(`/alerts/${id}/acknowledge`, { method: 'POST' }),
  readAlert: (id: string) => request<{ ok: boolean }>(`/alerts/${id}/read`, { method: 'POST' }),
  resolveAlert: (id: string, note: string) =>
    request<{ ok: boolean }>(`/alerts/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    }),

  // Insights
  getPresetQuestions: () => request<string[]>('/insights/presets'),
  askQuestion: (question: string) =>
    request<any>('/insights/query', {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),
  getExecutiveBrief: () => request<{ brief: string }>('/insights/executive-brief'),

  // Audit and Reset
  getAudit: () => request<any[]>('/audit'),
  resetDemo: () => request<{ ok: boolean; message: string }>('/audit/reset-demo', { method: 'POST' }),

  // WebSocket
  createTelemetryWebSocket: () => new WebSocket(WS_BASE),
}
