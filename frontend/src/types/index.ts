export type Role =
  | 'maintenance_engineer'
  | 'fleet_manager'
  | 'inventory_manager'
  | 'administrator'

export type AircraftStatus =
  | 'operational'
  | 'watch'
  | 'maintenance'
  | 'grounded'

export type HealthBand = 'healthy' | 'watch' | 'maintenance_required' | 'grounded'

export type ComponentSystem =
  | 'engine'
  | 'fuel'
  | 'hydraulic'
  | 'landing_gear'
  | 'electrical'
  | 'avionics'
  | 'ecs'

export type WorkOrderStatus =
  | 'open'
  | 'planned'
  | 'in_progress'
  | 'awaiting_parts'
  | 'awaiting_inspection'
  | 'completed'

export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'critical'

export type AlertSeverity = 'info' | 'warning' | 'high' | 'critical'

export type AlertType =
  | 'component_anomaly'
  | 'maintenance_recommendation'
  | 'overdue_inspection'
  | 'work_order_delay'
  | 'spare_parts_shortage'
  | 'sensor_disconnection'
  | 'data_quality'

export type ConnectionStatus = 'connected' | 'delayed' | 'disconnected' | 'simulated'

export type ScheduleKind =
  | 'inspection'
  | 'preventive'
  | 'predicted_inspection'
  | 'replacement'
  | 'work_order'
  | 'completion'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  password: string
}

export interface Aircraft {
  id: string
  type: string
  model: string
  fleet: string
  status: AircraftStatus
  healthScore: number
  flightHours: number
  flightCycles: number
  lastMaintenance: string
  nextInspection: string
  base: string
  notes: string
}

export interface Component {
  id: string
  aircraftId: string
  name: string
  system: ComponentSystem
  healthScore: number
  serial: string
  installedOn: string
  cycles: number
  hours: number
}

export interface SensorReading {
  id: string
  aircraftId: string
  componentId: string
  metric: 'temperature' | 'vibration' | 'pressure' | 'oil_temp' | 'n1' | 'n2'
  value: number
  unit: string
  timestamp: string
  simulated: true
}

export interface SensorThreshold {
  metric: SensorReading['metric']
  componentId: string
  min: number
  max: number
  cautionLow?: number
  cautionHigh?: number
}

export interface FaultEvent {
  id: string
  aircraftId: string
  componentId: string
  code: string
  summary: string
  timestamp: string
  resolved: boolean
}

export interface MaintenanceRecord {
  id: string
  aircraftId: string
  componentId?: string
  date: string
  type: string
  summary: string
  durationHours: number
  technician: string
}

export interface WorkOrderPartNeed {
  partId: string
  quantity: number
  reserved: number
}

export interface WorkOrder {
  id: string
  aircraftId: string
  componentId?: string
  title: string
  faultDescription: string
  priority: WorkOrderPriority
  assignee: string
  team: string
  requiredParts: WorkOrderPartNeed[]
  estimatedHours: number
  plannedStart: string
  dueDate: string
  status: WorkOrderStatus
  notes: string
  completionNotes: string
  checklist: { id: string; label: string; done: boolean }[]
  createdAt: string
  updatedAt: string
  sourceAlertId?: string
}

export interface InventoryPart {
  id: string
  partNumber: string
  name: string
  compatible: string[]
  qtyAvailable: number
  qtyReserved: number
  minStock: number
  location: string
  supplierId: string
  leadTimeDays: number
  shelfLife?: string
}

export interface InventoryTransaction {
  id: string
  partId: string
  type: 'reserve' | 'release' | 'receive' | 'adjust' | 'allocate'
  quantity: number
  at: string
  note: string
  workOrderId?: string
  userId: string
}

export interface Supplier {
  id: string
  name: string
  region: string
  contact: string
}

export interface PurchaseRequest {
  id: string
  partId: string
  quantity: number
  status: 'draft' | 'submitted' | 'ordered'
  createdAt: string
  note: string
  expectedLeadDays: number
}

export interface MaintenanceSchedule {
  id: string
  aircraftId: string
  title: string
  kind: ScheduleKind
  start: string
  end: string
  workOrderId?: string
  componentId?: string
  notes: string
}

export interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  aircraftId?: string
  componentId?: string
  workOrderId?: string
  partId?: string
  title: string
  description: string
  recommendedAction: string
  timestamp: string
  source: string
  read: boolean
  acknowledged: boolean
  resolved: boolean
  resolveNote?: string
  fingerprint: string
}

export interface AuditLog {
  id: string
  at: string
  userId: string
  action: string
  detail: string
}

export interface DateRange {
  from: string
  to: string
  preset: '7d' | '30d' | '90d'
}

export interface UiFilters {
  fleet: string
  dateRange: DateRange
  search: string
  aircraftQuery: string
}

export interface AppData {
  users: User[]
  aircraft: Aircraft[]
  components: Component[]
  readings: SensorReading[]
  thresholds: SensorThreshold[]
  faults: FaultEvent[]
  maintenance: MaintenanceRecord[]
  workOrders: WorkOrder[]
  parts: InventoryPart[]
  transactions: InventoryTransaction[]
  suppliers: Supplier[]
  purchaseRequests: PurchaseRequest[]
  schedules: MaintenanceSchedule[]
  alerts: Alert[]
  audit: AuditLog[]
}

export interface Session {
  userId: string
  role: Role
}

export interface Toast {
  id: string
  title: string
  detail?: string
  tone: 'info' | 'success' | 'warning' | 'danger'
}
