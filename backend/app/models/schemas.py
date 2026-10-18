from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field

Role = Literal[
    'maintenance_engineer',
    'fleet_manager',
    'inventory_manager',
    'administrator',
]

AircraftStatus = Literal['operational', 'watch', 'maintenance', 'grounded']
HealthBand = Literal['healthy', 'watch', 'maintenance_required', 'grounded']
ComponentSystem = Literal[
    'engine',
    'fuel',
    'hydraulic',
    'landing_gear',
    'electrical',
    'avionics',
    'ecs',
]
WorkOrderStatus = Literal[
    'open',
    'planned',
    'in_progress',
    'awaiting_parts',
    'awaiting_inspection',
    'completed',
]
WorkOrderPriority = Literal['low', 'medium', 'high', 'critical']
AlertSeverity = Literal['info', 'warning', 'high', 'critical']
AlertType = Literal[
    'component_anomaly',
    'maintenance_recommendation',
    'overdue_inspection',
    'work_order_delay',
    'spare_parts_shortage',
    'sensor_disconnection',
    'data_quality',
]
ScheduleKind = Literal[
    'inspection',
    'preventive',
    'predicted_inspection',
    'replacement',
    'work_order',
    'completion',
]

class User(BaseModel):
    id: str
    name: str
    email: str
    role: Role
    password: str

class Aircraft(BaseModel):
    id: str
    type: str
    model: str
    fleet: str
    status: AircraftStatus
    healthScore: float
    flightHours: float
    flightCycles: int
    lastMaintenance: str
    nextInspection: str
    base: str
    notes: str

class Component(BaseModel):
    id: str
    aircraftId: str
    name: str
    system: ComponentSystem
    healthScore: float
    serial: str
    installedOn: str
    cycles: int
    hours: int

class SensorReading(BaseModel):
    id: str
    aircraftId: str
    componentId: str
    metric: Literal['temperature', 'vibration', 'pressure', 'oil_temp', 'n1', 'n2']
    value: float
    unit: str
    timestamp: str
    simulated: bool = True

class SensorThreshold(BaseModel):
    metric: Literal['temperature', 'vibration', 'pressure', 'oil_temp', 'n1', 'n2']
    componentId: str
    min: float
    max: float
    cautionLow: Optional[float] = None
    cautionHigh: Optional[float] = None

class FaultEvent(BaseModel):
    id: str
    aircraftId: str
    componentId: str
    code: str
    summary: str
    timestamp: str
    resolved: bool

class MaintenanceRecord(BaseModel):
    id: str
    aircraftId: str
    componentId: Optional[str] = None
    date: str
    type: str
    summary: str
    durationHours: float
    technician: str

class WorkOrderPartNeed(BaseModel):
    partId: str
    quantity: int
    reserved: int = 0

class WorkOrderChecklistItem(BaseModel):
    id: str
    label: str
    done: bool

class WorkOrder(BaseModel):
    id: str
    aircraftId: str
    componentId: Optional[str] = None
    title: str
    faultDescription: str
    priority: WorkOrderPriority
    assignee: str
    team: str
    requiredParts: List[WorkOrderPartNeed] = []
    estimatedHours: float
    plannedStart: str
    dueDate: str
    status: WorkOrderStatus
    notes: str = ""
    completionNotes: str = ""
    checklist: List[WorkOrderChecklistItem] = []
    createdAt: str
    updatedAt: str
    sourceAlertId: Optional[str] = None

class InventoryPart(BaseModel):
    id: str
    partNumber: str
    name: str
    compatible: List[str]
    qtyAvailable: int
    qtyReserved: int
    minStock: int
    location: str
    supplierId: str
    leadTimeDays: int
    shelfLife: Optional[str] = None

class InventoryTransaction(BaseModel):
    id: str
    partId: str
    type: Literal['reserve', 'release', 'receive', 'adjust', 'allocate']
    quantity: int
    at: str
    note: str
    workOrderId: Optional[str] = None
    userId: str

class Supplier(BaseModel):
    id: str
    name: str
    region: str
    contact: str

class PurchaseRequest(BaseModel):
    id: str
    partId: str
    quantity: int
    status: Literal['draft', 'submitted', 'ordered']
    createdAt: str
    note: str
    expectedLeadDays: int

class MaintenanceSchedule(BaseModel):
    id: str
    aircraftId: str
    title: str
    kind: ScheduleKind
    start: str
    end: str
    workOrderId: Optional[str] = None
    componentId: Optional[str] = None
    notes: str = ""

class Alert(BaseModel):
    id: str
    type: AlertType
    severity: AlertSeverity
    aircraftId: Optional[str] = None
    componentId: Optional[str] = None
    workOrderId: Optional[str] = None
    partId: Optional[str] = None
    title: str
    description: str
    recommendedAction: str
    timestamp: str
    source: str
    read: bool = False
    acknowledged: bool = False
    resolved: bool = False
    resolveNote: Optional[str] = None
    fingerprint: str

class AuditLog(BaseModel):
    id: str
    at: str
    userId: str
    action: str
    detail: str

class RiskFactor(BaseModel):
    label: str
    weight: float
    detail: str

class RiskAssessment(BaseModel):
    componentId: str
    aircraftId: str
    riskScore: float
    category: Literal['healthy', 'watch', 'maintenance_required', 'grounded', 'elevated']
    anomalies: List[str]
    factors: List[RiskFactor]
    recommendedAction: str
    inspectionPriority: Literal['routine', 'soon', 'urgent']
    dataFreshness: str
    quality: Literal['complete', 'partial']
    method: Literal['baseline-anomaly-score']
    disclaimer: str

class PlanSuggestion(BaseModel):
    scheduleId: Optional[str] = None
    aircraftId: str
    title: str
    proposedStart: str
    proposedEnd: str
    reason: str
    constraints: List[str]
    partsOk: bool
    capacityNote: str

class QueryAnswer(BaseModel):
    question: str
    method: Literal['deterministic-dataset-query']
    bullets: List[str]
    numbers: List[Dict[str, str]]

# API Request Models
class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    token: str
    user: User

class ReservePartRequest(BaseModel):
    partId: str
    quantity: int
    workOrderId: Optional[str] = None
    userId: Optional[str] = "usr-inv"

class AdjustStockRequest(BaseModel):
    partId: str
    quantity: int
    userId: Optional[str] = "usr-inv"

class PurchaseCreateRequest(BaseModel):
    partId: str
    quantity: int
    note: str = ""

class AlertResolveRequest(BaseModel):
    note: str

class WorkOrderCreateRequest(BaseModel):
    aircraftId: str
    componentId: Optional[str] = None
    title: str
    faultDescription: str
    priority: WorkOrderPriority = 'medium'
    assignee: str = 'Maya Chen'
    team: str = 'Line North'
    requiredParts: List[WorkOrderPartNeed] = []
    estimatedHours: float = 4.0
    plannedStart: Optional[str] = None
    dueDate: Optional[str] = None
    notes: str = ""
    sourceAlertId: Optional[str] = None

class WorkOrderUpdateRequest(BaseModel):
    title: Optional[str] = None
    faultDescription: Optional[str] = None
    priority: Optional[WorkOrderPriority] = None
    assignee: Optional[str] = None
    team: Optional[str] = None
    status: Optional[WorkOrderStatus] = None
    notes: Optional[str] = None
    completionNotes: Optional[str] = None
    plannedStart: Optional[str] = None
    dueDate: Optional[str] = None
    checklist: Optional[List[WorkOrderChecklistItem]] = None

class SimulationControlRequest(BaseModel):
    paused: Optional[bool] = None
    liveAircraft: Optional[str] = None
