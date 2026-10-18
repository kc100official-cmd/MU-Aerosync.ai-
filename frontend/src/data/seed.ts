import { seeded, uid } from '@/lib/id'
import type {
  Aircraft,
  Alert,
  AppData,
  Component,
  ComponentSystem,
  InventoryPart,
  MaintenanceRecord,
  MaintenanceSchedule,
  SensorReading,
  SensorThreshold,
  User,
  WorkOrder,
  WorkOrderStatus,
} from '@/types'

const SYSTEMS: ComponentSystem[] = [
  'engine',
  'fuel',
  'hydraulic',
  'landing_gear',
  'electrical',
  'avionics',
  'ecs',
]

function isoOffset(days: number, hours = 0) {
  return new Date(Date.now() + (days * 24 + hours) * 3600_000).toISOString()
}

export const DEMO_USERS: User[] = [
  {
    id: 'usr-eng',
    name: 'Maya Chen',
    email: 'engineer@aerosync.demo',
    role: 'maintenance_engineer',
    password: 'demo',
  },
  {
    id: 'usr-flt',
    name: 'Jonas Hale',
    email: 'fleet@aerosync.demo',
    role: 'fleet_manager',
    password: 'demo',
  },
  {
    id: 'usr-inv',
    name: 'Priya Nair',
    email: 'inventory@aerosync.demo',
    role: 'inventory_manager',
    password: 'demo',
  },
  {
    id: 'usr-adm',
    name: 'Alex Rivera',
    email: 'admin@aerosync.demo',
    role: 'administrator',
    password: 'demo',
  },
]

export function buildSeed(): AppData {
  const rnd = seeded(2048)

  const aircraftMeta: Array<Omit<Aircraft, 'healthScore' | 'status'> & { healthScore: number; status: Aircraft['status'] }> = [
    { id: 'AS-101', type: 'Narrowbody', model: 'A320neo', fleet: 'Alpha', status: 'operational', healthScore: 92, flightHours: 18420, flightCycles: 11240, lastMaintenance: isoOffset(-18), nextInspection: isoOffset(21), base: 'SFO', notes: 'Synthetic demo airframe.' },
    { id: 'AS-102', type: 'Narrowbody', model: 'A320neo', fleet: 'Alpha', status: 'watch', healthScore: 71, flightHours: 20110, flightCycles: 12480, lastMaintenance: isoOffset(-9), nextInspection: isoOffset(4), base: 'SFO', notes: 'Demo aircraft for emerging engine vibration trend (ENG-204).' },
    { id: 'AS-103', type: 'Narrowbody', model: 'B737-8', fleet: 'Bravo', status: 'operational', healthScore: 88, flightHours: 15660, flightCycles: 9800, lastMaintenance: isoOffset(-30), nextInspection: isoOffset(12), base: 'DEN', notes: 'Synthetic demo airframe.' },
    { id: 'AS-104', type: 'Narrowbody', model: 'B737-8', fleet: 'Bravo', status: 'maintenance', healthScore: 58, flightHours: 22140, flightCycles: 14110, lastMaintenance: isoOffset(-2), nextInspection: isoOffset(2), base: 'DEN', notes: 'In hangar; hydraulic pump replacement blocked in demo by parts shortage.' },
    { id: 'AS-105', type: 'Widebody', model: 'A350-900', fleet: 'Charlie', status: 'operational', healthScore: 95, flightHours: 9800, flightCycles: 3120, lastMaintenance: isoOffset(-40), nextInspection: isoOffset(6), base: 'JFK', notes: 'Upcoming C-check window used in planning scenario.' },
    { id: 'AS-106', type: 'Regional', model: 'ATR 72-600', fleet: 'Delta', status: 'watch', healthScore: 73, flightHours: 14220, flightCycles: 16890, lastMaintenance: isoOffset(-11), nextInspection: isoOffset(8), base: 'SEA', notes: 'Synthetic demo airframe.' },
    { id: 'AS-107', type: 'Narrowbody', model: 'A320neo', fleet: 'Alpha', status: 'grounded', healthScore: 41, flightHours: 26300, flightCycles: 17120, lastMaintenance: isoOffset(-1), nextInspection: isoOffset(1), base: 'SFO', notes: 'Grounded in demo pending avionics rack inspection.' },
    { id: 'AS-108', type: 'Widebody', model: 'B787-9', fleet: 'Charlie', status: 'operational', healthScore: 90, flightHours: 12100, flightCycles: 2880, lastMaintenance: isoOffset(-22), nextInspection: isoOffset(18), base: 'JFK', notes: 'Synthetic demo airframe.' },
    { id: 'AS-109', type: 'Narrowbody', model: 'A220-300', fleet: 'Bravo', status: 'operational', healthScore: 86, flightHours: 7400, flightCycles: 6100, lastMaintenance: isoOffset(-14), nextInspection: isoOffset(16), base: 'DEN', notes: 'Synthetic demo airframe.' },
    { id: 'AS-110', type: 'Regional', model: 'ATR 72-600', fleet: 'Delta', status: 'maintenance', healthScore: 55, flightHours: 11880, flightCycles: 13240, lastMaintenance: isoOffset(-3), nextInspection: isoOffset(3), base: 'SEA', notes: 'Landing gear inspection in progress (demo).' },
    { id: 'AS-111', type: 'Narrowbody', model: 'A320neo', fleet: 'Alpha', status: 'operational', healthScore: 91, flightHours: 9900, flightCycles: 7200, lastMaintenance: isoOffset(-25), nextInspection: isoOffset(28), base: 'SFO', notes: 'Synthetic demo airframe.' },
    { id: 'AS-112', type: 'Narrowbody', model: 'B737-8', fleet: 'Bravo', status: 'watch', healthScore: 76, flightHours: 17820, flightCycles: 10990, lastMaintenance: isoOffset(-7), nextInspection: isoOffset(9), base: 'DEN', notes: 'ECS pack performance watch item (demo).' },
  ]

  const aircraft: Aircraft[] = aircraftMeta

  const componentPlan: Array<{ id: string; aircraftId: string; name: string; system: ComponentSystem; health: number }> = [
    { id: 'ENG-101', aircraftId: 'AS-101', name: 'CFM LEAP-1A left', system: 'engine', health: 93 },
    { id: 'HYD-101', aircraftId: 'AS-101', name: 'Green hydraulic circuit', system: 'hydraulic', health: 90 },
    { id: 'AVN-101', aircraftId: 'AS-101', name: 'Flight management suite', system: 'avionics', health: 94 },
    { id: 'ENG-204', aircraftId: 'AS-102', name: 'CFM LEAP-1A right', system: 'engine', health: 62 },
    { id: 'FUEL-102', aircraftId: 'AS-102', name: 'Center fuel pumps', system: 'fuel', health: 84 },
    { id: 'ECS-102', aircraftId: 'AS-102', name: 'Pack 2 ACS', system: 'ecs', health: 80 },
    { id: 'ENG-103', aircraftId: 'AS-103', name: 'LEAP-1B left', system: 'engine', health: 89 },
    { id: 'LG-103', aircraftId: 'AS-103', name: 'Main landing gear', system: 'landing_gear', health: 87 },
    { id: 'ELC-103', aircraftId: 'AS-103', name: 'IDG / electrical', system: 'electrical', health: 88 },
    { id: 'HYD-440', aircraftId: 'AS-104', name: 'Engine-driven hydraulic pump', system: 'hydraulic', health: 48 },
    { id: 'ENG-104', aircraftId: 'AS-104', name: 'LEAP-1B right', system: 'engine', health: 72 },
    { id: 'AVN-104', aircraftId: 'AS-104', name: 'Display suite', system: 'avionics', health: 81 },
    { id: 'ENG-105', aircraftId: 'AS-105', name: 'Trent XWB-84', system: 'engine', health: 96 },
    { id: 'FUEL-105', aircraftId: 'AS-105', name: 'Trim tank system', system: 'fuel', health: 94 },
    { id: 'LG-105', aircraftId: 'AS-105', name: 'Nose landing gear', system: 'landing_gear', health: 93 },
    { id: 'ENG-106', aircraftId: 'AS-106', name: 'PW127M left', system: 'engine', health: 74 },
    { id: 'ELC-106', aircraftId: 'AS-106', name: 'DC generation', system: 'electrical', health: 78 },
    { id: 'AVN-107', aircraftId: 'AS-107', name: 'IOM rack A', system: 'avionics', health: 39 },
    { id: 'ENG-107', aircraftId: 'AS-107', name: 'CFM LEAP-1A left', system: 'engine', health: 68 },
    { id: 'HYD-107', aircraftId: 'AS-107', name: 'Yellow hydraulic circuit', system: 'hydraulic', health: 71 },
    { id: 'ENG-108', aircraftId: 'AS-108', name: 'GEnx-1B', system: 'engine', health: 91 },
    { id: 'ECS-108', aircraftId: 'AS-108', name: 'Cabin pressure controller', system: 'ecs', health: 90 },
    { id: 'FUEL-108', aircraftId: 'AS-108', name: 'Jettison valves', system: 'fuel', health: 92 },
    { id: 'ENG-109', aircraftId: 'AS-109', name: 'PW1500G', system: 'engine', health: 87 },
    { id: 'LG-109', aircraftId: 'AS-109', name: 'Brake assembly', system: 'landing_gear', health: 85 },
    { id: 'LG-110', aircraftId: 'AS-110', name: 'Main landing gear', system: 'landing_gear', health: 52 },
    { id: 'HYD-110', aircraftId: 'AS-110', name: 'Aux hydraulic pump', system: 'hydraulic', health: 66 },
    { id: 'ENG-111', aircraftId: 'AS-111', name: 'CFM LEAP-1A right', system: 'engine', health: 92 },
    { id: 'AVN-111', aircraftId: 'AS-111', name: 'ADS-B transponder', system: 'avionics', health: 93 },
    { id: 'ECS-112', aircraftId: 'AS-112', name: 'Pack 1 ACS', system: 'ecs', health: 69 },
  ]

  const components: Component[] = componentPlan.map((c) => ({
    id: c.id,
    aircraftId: c.aircraftId,
    name: c.name,
    system: c.system,
    healthScore: c.health,
    serial: `SN-${c.id}-${Math.floor(1000 + rnd() * 8000)}`,
    installedOn: isoOffset(-200 - Math.floor(rnd() * 400)),
    cycles: 2000 + Math.floor(rnd() * 12000),
    hours: 3000 + Math.floor(rnd() * 18000),
  }))

  const thresholds: SensorThreshold[] = components.flatMap((c) => {
    const base: SensorThreshold[] = [
      { metric: 'temperature', componentId: c.id, min: 40, max: 920, cautionHigh: 780 },
      { metric: 'vibration', componentId: c.id, min: 0, max: 4.5, cautionHigh: 2.4 },
      { metric: 'pressure', componentId: c.id, min: 18, max: 3200, cautionLow: 40, cautionHigh: 2800 },
    ]
    if (c.system === 'engine') {
      base.push(
        { metric: 'oil_temp', componentId: c.id, min: 40, max: 160, cautionHigh: 135 },
        { metric: 'n1', componentId: c.id, min: 15, max: 105, cautionHigh: 101 },
        { metric: 'n2', componentId: c.id, min: 30, max: 110, cautionHigh: 104 },
      )
    }
    return base
  })

  const readings: SensorReading[] = []
  const metricsFor = (system: ComponentSystem): SensorReading['metric'][] =>
    system === 'engine'
      ? ['temperature', 'vibration', 'pressure', 'oil_temp', 'n1', 'n2']
      : ['temperature', 'vibration', 'pressure']

  const baselines: Record<SensorReading['metric'], number> = {
    temperature: 540,
    vibration: 1.1,
    pressure: 210,
    oil_temp: 98,
    n1: 86,
    n2: 91,
  }
  const units: Record<SensorReading['metric'], string> = {
    temperature: '°C',
    vibration: 'ips',
    pressure: 'psi',
    oil_temp: '°C',
    n1: '%',
    n2: '%',
  }

  for (const c of components) {
    for (const metric of metricsFor(c.system)) {
      for (let i = 72; i >= 0; i--) {
        const t = new Date(Date.now() - i * 60 * 60 * 1000)
        let value = baselines[metric] + (rnd() - 0.5) * (metric === 'vibration' ? 0.35 : 18)
        if (c.id === 'ENG-204' && metric === 'vibration') {
          const ramp = Math.max(0, (72 - i - 36) / 36)
          value = 1.15 + ramp * 1.85 + (rnd() - 0.5) * 0.12
        }
        if (c.id === 'HYD-440' && metric === 'pressure') {
          value = 95 + (rnd() - 0.5) * 12
        }
        if (c.id === 'ECS-112' && metric === 'temperature') {
          value = 72 + (rnd() - 0.4) * 8
        }
        readings.push({
          id: uid('rd'),
          aircraftId: c.aircraftId,
          componentId: c.id,
          metric,
          value: Number(value.toFixed(2)),
          unit: units[metric],
          timestamp: t.toISOString(),
          simulated: true,
        })
      }
    }
  }

  const faults = [
    { id: 'FLT-01', aircraftId: 'AS-102', componentId: 'ENG-204', code: 'VIB-TREND', summary: 'Elevated right-engine vibration trend in simulated readings', timestamp: isoOffset(0, -6), resolved: false },
    { id: 'FLT-02', aircraftId: 'AS-104', componentId: 'HYD-440', code: 'HYD-PMP-PRESS', summary: 'Engine-driven pump pressure below caution band (demo)', timestamp: isoOffset(-2), resolved: false },
    { id: 'FLT-03', aircraftId: 'AS-107', componentId: 'AVN-107', code: 'IOM-COMMS', summary: 'Repeated IOM rack communication drops (demo log)', timestamp: isoOffset(-1, -4), resolved: false },
    { id: 'FLT-04', aircraftId: 'AS-110', componentId: 'LG-110', code: 'LG-WEAR', summary: 'Landing-gear inspection findings (demo)', timestamp: isoOffset(-3), resolved: false },
    { id: 'FLT-05', aircraftId: 'AS-112', componentId: 'ECS-112', code: 'PACK-PERF', summary: 'Pack 1 outlet temperature scatter (demo)', timestamp: isoOffset(-1), resolved: false },
    { id: 'FLT-06', aircraftId: 'AS-106', componentId: 'ENG-106', code: 'OIL-CONSUME', summary: 'Oil consumption watch item (demo)', timestamp: isoOffset(-5), resolved: true },
    { id: 'FLT-07', aircraftId: 'AS-101', componentId: 'ENG-101', code: 'BSI-OK', summary: 'Borescope complete — no findings (demo)', timestamp: isoOffset(-18), resolved: true },
  ]

  const techs = ['Maya Chen', 'Luis Ortega', 'Samira Okonkwo', 'Kenji Sato', 'Riley Brooks']
  const maintenance: MaintenanceRecord[] = aircraft.flatMap((ac, i) => {
    const comps = components.filter((c) => c.aircraftId === ac.id)
    return [
      {
        id: `MR-${ac.id}-A`,
        aircraftId: ac.id,
        componentId: comps[0]?.id,
        date: ac.lastMaintenance,
        type: i % 2 === 0 ? 'Line' : 'A-check',
        summary: `Scheduled ${i % 2 === 0 ? 'line' : 'A-check'} servicing (synthetic record)`,
        durationHours: 4 + (i % 8),
        technician: techs[i % techs.length],
      },
    ]
  })
  maintenance.push(
    { id: 'MR-102-VIB', aircraftId: 'AS-102', componentId: 'ENG-204', date: isoOffset(-9), type: 'Inspection', summary: 'Vibration survey — within band at the time (demo)', durationHours: 3, technician: 'Maya Chen' },
    { id: 'MR-104-HYD', aircraftId: 'AS-104', componentId: 'HYD-440', date: isoOffset(-60), type: 'Replacement', summary: 'Previous EDP replacement (demo history)', durationHours: 11, technician: 'Luis Ortega' },
    { id: 'MR-107-AVN', aircraftId: 'AS-107', componentId: 'AVN-107', date: isoOffset(-1), type: 'Troubleshooting', summary: 'Avionics rack isolation in progress (demo)', durationHours: 16, technician: 'Samira Okonkwo' },
  )

  const suppliers = [
    { id: 'SUP-01', name: 'Northwind Aero Spares', region: 'NA', contact: 'spares@northwind.demo' },
    { id: 'SUP-02', name: 'Helios Hydraulics', region: 'EU', contact: 'ops@helios-hyd.demo' },
    { id: 'SUP-03', name: 'Pacific Avionics', region: 'APAC', contact: 'desk@pacific-av.demo' },
  ]

  const partNames = [
    ['EDP-440', 'Engine-driven hydraulic pump', ['HYD-440', 'AS-104'], 0, 2, 'Hangar B-12', 'SUP-02', 12],
    ['VIB-SNS-12', 'Engine vibration sensor pack', ['ENG-204', 'AS-102'], 3, 2, 'Stores A-04', 'SUP-01', 6],
    ['IOM-RK-A', 'IOM rack module', ['AVN-107', 'AS-107'], 1, 1, 'Avionics cage', 'SUP-03', 18],
    ['LG-PIN-90', 'Landing gear pivot pin', ['LG-110', 'AS-110'], 4, 2, 'Hangar C-02', 'SUP-01', 9],
    ['PACK-VLV-1', 'ACS pack flow valve', ['ECS-112', 'AS-112'], 2, 2, 'Stores A-11', 'SUP-01', 8],
    ['OIL-FLT-7', 'Engine oil filter', ['engine'], 24, 8, 'Stores A-01', 'SUP-01', 3],
    ['HYD-FLT-G', 'Hydraulic filter (green)', ['hydraulic'], 11, 6, 'Stores A-02', 'SUP-02', 4],
    ['TIRE-MLG', 'Main-gear tire', ['landing_gear'], 8, 4, 'Hangar C-01', 'SUP-01', 5],
    ['BRK-PAD-A', 'Carbon brake heat pack', ['landing_gear'], 6, 3, 'Hangar C-01', 'SUP-01', 10],
    ['FUEL-PMP-C', 'Center tank pump', ['fuel'], 5, 2, 'Stores B-03', 'SUP-01', 7],
    ['IDG-OIL', 'IDG oil kit', ['electrical'], 9, 4, 'Stores B-06', 'SUP-01', 4],
    ['ADC-MOD', 'Air data module', ['avionics'], 2, 2, 'Avionics cage', 'SUP-03', 14],
    ['FAN-ECS', 'Cabin fan cartridge', ['ecs'], 7, 3, 'Stores A-11', 'SUP-01', 5],
    ['SEAL-HYD', 'Hydraulic seal kit', ['hydraulic'], 18, 6, 'Stores A-02', 'SUP-02', 2],
    ['IGN-LEAD', 'Ignition lead set', ['engine'], 4, 2, 'Stores A-01', 'SUP-01', 6],
    ['NWS-ACT', 'Nosewheel steering actuator', ['landing_gear'], 1, 1, 'Hangar C-02', 'SUP-01', 16],
    ['BATT-NI', 'Main battery', ['electrical'], 3, 2, 'Stores B-06', 'SUP-01', 11],
    ['TAT-PRB', 'TAT probe', ['avionics'], 5, 2, 'Avionics cage', 'SUP-03', 8],
    ['PITOT-HT', 'Pitot heater element', ['avionics'], 6, 2, 'Avionics cage', 'SUP-03', 7],
    ['APU-FLT', 'APU oil filter', ['engine'], 10, 4, 'Stores A-01', 'SUP-01', 3],
    ['WAI-VLV', 'Wing anti-ice valve', ['ecs'], 3, 2, 'Stores A-11', 'SUP-01', 9],
    ['CVR-SSD', 'CVR storage module', ['avionics'], 2, 1, 'Avionics cage', 'SUP-03', 20],
    ['FDR-SSD', 'FDR storage module', ['avionics'], 2, 1, 'Avionics cage', 'SUP-03', 20],
    ['ALT-ST', 'Static inverter', ['electrical'], 2, 1, 'Stores B-06', 'SUP-01', 13],
    ['HYD-RSV', 'Hydraulic reservoir bladder', ['hydraulic'], 1, 1, 'Stores A-02', 'SUP-02', 15],
    ['FUEL-VLV', 'Crossfeed valve', ['fuel'], 4, 2, 'Stores B-03', 'SUP-01', 8],
    ['LG-DR-ACT', 'Gear door actuator', ['landing_gear'], 2, 1, 'Hangar C-02', 'SUP-01', 12],
    ['EICAS-DSP', 'EICAS display unit', ['avionics'], 1, 1, 'Avionics cage', 'SUP-03', 21],
    ['O2-GEN', 'Crew oxygen generator', ['ecs'], 8, 3, 'Stores A-08', 'SUP-01', 6],
    ['SLAT-ACT', 'Slat actuator', ['hydraulic'], 2, 1, 'Hangar B-08', 'SUP-02', 14],
    ['FLAP-TMU', 'Flap PCU module', ['hydraulic'], 1, 1, 'Hangar B-08', 'SUP-02', 17],
    ['BLEED-PRV', 'Bleed pressure regulator', ['engine'], 3, 2, 'Stores A-01', 'SUP-01', 10],
    ['FADEC-CH', 'FADEC channel card', ['engine'], 1, 1, 'Avionics cage', 'SUP-03', 22],
    ['TR-UNIT', 'Transformer rectifier', ['electrical'], 2, 1, 'Stores B-06', 'SUP-01', 12],
    ['WSHLD-HT', 'Windshield heat controller', ['electrical'], 3, 1, 'Stores B-06', 'SUP-01', 9],
    ['CB-PANEL', 'C/B panel module', ['electrical'], 2, 1, 'Stores B-06', 'SUP-01', 11],
    ['HYD-QDC', 'Hydraulic QDC coupling', ['hydraulic'], 14, 4, 'Stores A-02', 'SUP-02', 3],
    ['ENG-MNT', 'Engine mount bushing', ['engine'], 6, 2, 'Hangar B-01', 'SUP-01', 8],
    ['FUEL-QTY', 'Fuel quantity probe', ['fuel'], 5, 2, 'Stores B-03', 'SUP-01', 7],
    ['LG-PROX', 'Proximity sensor', ['landing_gear'], 9, 3, 'Hangar C-02', 'SUP-01', 4],
  ] as const

  const parts: InventoryPart[] = partNames.map((p, i) => ({
    id: `PRT-${String(i + 1).padStart(2, '0')}`,
    partNumber: p[0],
    name: p[1],
    compatible: [...p[2]],
    qtyAvailable: p[3],
    qtyReserved: i === 0 ? 0 : Math.min(p[3], Math.floor(p[4] / 3)),
    minStock: p[4],
    location: p[5],
    supplierId: p[6],
    leadTimeDays: p[7],
    shelfLife: i % 9 === 0 ? isoOffset(180) : undefined,
  }))

  const statuses: WorkOrderStatus[] = [
    'open',
    'planned',
    'in_progress',
    'awaiting_parts',
    'awaiting_inspection',
    'completed',
  ]

  const workOrders: WorkOrder[] = []
  const woTitles = [
    'Line inspection',
    'Oil service',
    'Borescope',
    'Filter replacement',
    'Avionics bite check',
    'Gear lubrication',
    'Pack performance check',
    'Hydraulic leak survey',
    'IDG oil service',
    'Probe replacement',
  ]

  for (let i = 0; i < 47; i++) {
    const ac = aircraft[i % aircraft.length]
    const comps = components.filter((c) => c.aircraftId === ac.id)
    const comp = comps[i % Math.max(1, comps.length)]
    const status = i < 8 ? statuses[i % 6] : statuses[(i * 3) % 6]
    const part = parts[(i * 5) % parts.length]
    workOrders.push({
      id: `WO-${1100 + i}`,
      aircraftId: ac.id,
      componentId: comp?.id,
      title: `${woTitles[i % woTitles.length]} — ${ac.id}`,
      faultDescription: `Synthetic work package ${i + 1} for demonstration workflows.`,
      priority: i % 11 === 0 ? 'critical' : i % 4 === 0 ? 'high' : i % 3 === 0 ? 'medium' : 'low',
      assignee: techs[i % techs.length],
      team: i % 2 === 0 ? 'Line North' : 'Hangar South',
      requiredParts: part
        ? [{ partId: part.id, quantity: 1, reserved: status === 'completed' ? 0 : Math.min(1, part.qtyReserved) }]
        : [],
      estimatedHours: 2 + (i % 10),
      plannedStart: isoOffset(-10 + (i % 20)),
      dueDate: isoOffset(-4 + (i % 22)),
      status,
      notes: status === 'awaiting_parts' ? 'Parts check required before continuation.' : 'Demo work order.',
      completionNotes: status === 'completed' ? 'Closed in demo dataset. Not a release-to-service record.' : '',
      checklist: [
        { id: 'c1', label: 'Review technical log', done: status !== 'open' },
        { id: 'c2', label: 'Confirm tooling & AMM task', done: status === 'completed' || status === 'awaiting_inspection' },
        { id: 'c3', label: 'Independent inspection (as required)', done: status === 'completed' },
      ],
      createdAt: isoOffset(-20 + (i % 12)),
      updatedAt: isoOffset(-1),
    })
  }

  workOrders.push(
    {
      id: 'WO-1045',
      aircraftId: 'AS-104',
      componentId: 'HYD-440',
      title: 'Replace engine-driven hydraulic pump',
      faultDescription: 'Pump pressure below caution band in simulated readings. Inspection/replacement package opened for demo Scenario B.',
      priority: 'critical',
      assignee: 'Luis Ortega',
      team: 'Hangar South',
      requiredParts: [{ partId: 'PRT-01', quantity: 1, reserved: 0 }],
      estimatedHours: 14,
      plannedStart: isoOffset(-1),
      dueDate: isoOffset(1),
      status: 'awaiting_parts',
      notes: 'EDP-440 has zero available stock in the demo inventory.',
      completionNotes: '',
      checklist: [
        { id: 'c1', label: 'Lockout / tagout per AMM', done: true },
        { id: 'c2', label: 'Pump swap', done: false },
        { id: 'c3', label: 'Leak and pressure test', done: false },
      ],
      createdAt: isoOffset(-2),
      updatedAt: isoOffset(0, -3),
    },
    {
      id: 'WO-1020',
      aircraftId: 'AS-102',
      componentId: 'ENG-204',
      title: 'Engine vibration survey (open recommendation)',
      faultDescription: 'Illustrative vibration trend on ENG-204. Not a certified diagnosis.',
      priority: 'high',
      assignee: 'Maya Chen',
      team: 'Line North',
      requiredParts: [{ partId: 'PRT-02', quantity: 1, reserved: 0 }],
      estimatedHours: 6,
      plannedStart: isoOffset(1),
      dueDate: isoOffset(3),
      status: 'open',
      notes: 'Prefill candidate for Scenario A inspection package.',
      completionNotes: '',
      checklist: [
        { id: 'c1', label: 'Download FADEC / vibration snapshot', done: false },
        { id: 'c2', label: 'On-wing survey', done: false },
        { id: 'c3', label: 'Engineering review', done: false },
      ],
      createdAt: isoOffset(0, -5),
      updatedAt: isoOffset(0, -5),
    },
    {
      id: 'WO-1055',
      aircraftId: 'AS-105',
      componentId: 'ENG-105',
      title: 'Block inspection / service check',
      faultDescription: 'Upcoming inspection window used for Scenario C planning. Subject to approved maintenance programme.',
      priority: 'medium',
      assignee: 'Kenji Sato',
      team: 'Hangar South',
      requiredParts: [{ partId: 'PRT-06', quantity: 2, reserved: 2 }],
      estimatedHours: 20,
      plannedStart: isoOffset(6),
      dueDate: isoOffset(7),
      status: 'planned',
      notes: 'Parts reserved. Slot suggestion available in planner.',
      completionNotes: '',
      checklist: [
        { id: 'c1', label: 'Capacity check', done: true },
        { id: 'c2', label: 'Parts staging', done: true },
        { id: 'c3', label: 'Execute inspection', done: false },
      ],
      createdAt: isoOffset(-8),
      updatedAt: isoOffset(-1),
    },
  )

  const schedules: MaintenanceSchedule[] = [
    { id: 'SCH-105', aircraftId: 'AS-105', title: 'Block inspection AS-105', kind: 'inspection', start: isoOffset(6, 8), end: isoOffset(7, 18), workOrderId: 'WO-1055', componentId: 'ENG-105', notes: 'Suggested hangar South bay 2. Subject to AMP.' },
    { id: 'SCH-104', aircraftId: 'AS-104', title: 'EDP replacement AS-104', kind: 'work_order', start: isoOffset(0, 6), end: isoOffset(1, 20), workOrderId: 'WO-1045', componentId: 'HYD-440', notes: 'Blocked on EDP-440 stock.' },
    { id: 'SCH-102', aircraftId: 'AS-102', title: 'Predicted inspection ENG-204', kind: 'predicted_inspection', start: isoOffset(2, 7), end: isoOffset(2, 16), workOrderId: 'WO-1020', componentId: 'ENG-204', notes: 'Baseline risk score — not a failure prediction.' },
    { id: 'SCH-107', aircraftId: 'AS-107', title: 'Avionics rack work', kind: 'work_order', start: isoOffset(-1, 6), end: isoOffset(1, 18), componentId: 'AVN-107', notes: 'Aircraft grounded in demo dataset.' },
    { id: 'SCH-110', aircraftId: 'AS-110', title: 'MLG inspection', kind: 'preventive', start: isoOffset(-3), end: isoOffset(3), componentId: 'LG-110', notes: 'In progress.' },
    { id: 'SCH-101', aircraftId: 'AS-101', title: 'A-check window', kind: 'inspection', start: isoOffset(21, 6), end: isoOffset(21, 20), notes: 'Nominal.' },
    { id: 'SCH-108', aircraftId: 'AS-108', title: 'Engine boroscope', kind: 'preventive', start: isoOffset(18, 8), end: isoOffset(18, 14), componentId: 'ENG-108', notes: 'Planned.' },
    { id: 'SCH-112', aircraftId: 'AS-112', title: 'Pack 1 performance', kind: 'predicted_inspection', start: isoOffset(4, 9), end: isoOffset(4, 15), componentId: 'ECS-112', notes: 'Watch item.' },
  ]

  const moreSchedules: MaintenanceSchedule[] = aircraft.slice(0, 8).map((ac, i) => ({
    id: `SCH-X-${ac.id}`,
    aircraftId: ac.id,
    title: `${i % 2 ? 'Line service' : 'Oil sample'} ${ac.id}`,
    kind: i % 2 ? 'preventive' : 'inspection',
    start: isoOffset(8 + i, 8),
    end: isoOffset(8 + i, 14),
    notes: 'Synthetic calendar item.',
  }))
  schedules.push(...moreSchedules)

  const alerts: Alert[] = [
    {
      id: 'AL-VIB-102',
      type: 'component_anomaly',
      severity: 'high',
      aircraftId: 'AS-102',
      componentId: 'ENG-204',
      title: 'Elevated vibration trend — ENG-204',
      description: 'Simulated vibration readings on ENG-204 have climbed through the caution band over the last 36 hours.',
      recommendedAction: 'Review the sensor trend and maintenance history, validate the anomaly, and arrange an engineering inspection if warranted. This is not a certified failure prediction.',
      timestamp: isoOffset(0, -1),
      source: 'baseline-anomaly-engine',
      read: false,
      acknowledged: false,
      resolved: false,
      fingerprint: 'ENG-204:vibration:caution',
    },
    {
      id: 'AL-PART-440',
      type: 'spare_parts_shortage',
      severity: 'critical',
      aircraftId: 'AS-104',
      componentId: 'HYD-440',
      workOrderId: 'WO-1045',
      partId: 'PRT-01',
      title: 'Critical shortage — EDP-440',
      description: 'Work order WO-1045 requires engine-driven hydraulic pump EDP-440. Available quantity is 0.',
      recommendedAction: 'Create a purchase request or locate alternate stock. Do not treat this demo shortage as a live AOG event.',
      timestamp: isoOffset(0, -3),
      source: 'inventory-service',
      read: false,
      acknowledged: false,
      resolved: false,
      fingerprint: 'PRT-01:shortage',
    },
    {
      id: 'AL-GND-107',
      type: 'maintenance_recommendation',
      severity: 'critical',
      aircraftId: 'AS-107',
      componentId: 'AVN-107',
      title: 'AS-107 grounded — avionics rack',
      description: 'Demo aircraft is grounded pending IOM rack troubleshooting.',
      recommendedAction: 'Continue authorized troubleshooting. Acknowledgement does not restore airworthiness.',
      timestamp: isoOffset(-1, -2),
      source: 'fleet-status',
      read: true,
      acknowledged: true,
      resolved: false,
      fingerprint: 'AS-107:grounded',
    },
    {
      id: 'AL-INSP-105',
      type: 'overdue_inspection',
      severity: 'warning',
      aircraftId: 'AS-105',
      workOrderId: 'WO-1055',
      title: 'Inspection window approaching — AS-105',
      description: 'Block inspection is due in approximately six days in this demo calendar.',
      recommendedAction: 'Review planner capacity, parts staging, and AMP constraints.',
      timestamp: isoOffset(0, -8),
      source: 'scheduler',
      read: false,
      acknowledged: false,
      resolved: false,
      fingerprint: 'AS-105:inspection-window',
    },
    {
      id: 'AL-WO-DELAY',
      type: 'work_order_delay',
      severity: 'warning',
      aircraftId: 'AS-104',
      workOrderId: 'WO-1045',
      title: 'WO-1045 at risk of delay',
      description: 'Awaiting parts with a 12-day catalog lead time (not a confirmed delivery date).',
      recommendedAction: 'Expedite purchase request; confirm with authorized supply chain, not this prototype.',
      timestamp: isoOffset(0, -2),
      source: 'work-order-service',
      read: false,
      acknowledged: false,
      resolved: false,
      fingerprint: 'WO-1045:delay',
    },
    {
      id: 'AL-DQ-01',
      type: 'data_quality',
      severity: 'info',
      title: 'All telemetry is synthetic',
      description: 'No aircraft health-monitoring system is connected. Charts use generated demonstration readings.',
      recommendedAction: 'Keep Demo Mode visible in any live presentation.',
      timestamp: isoOffset(0, -10),
      source: 'platform',
      read: true,
      acknowledged: true,
      resolved: false,
      fingerprint: 'platform:synthetic',
    },
    {
      id: 'AL-SENS-106',
      type: 'sensor_disconnection',
      severity: 'warning',
      aircraftId: 'AS-106',
      componentId: 'ELC-106',
      title: 'Simulated sensor delay — ELC-106',
      description: 'Connection status set to delayed for integration-path demonstration.',
      recommendedAction: 'Treat as a future IoT status example, not a live aircraft event.',
      timestamp: isoOffset(0, -4),
      source: 'health-monitor',
      read: false,
      acknowledged: false,
      resolved: false,
      fingerprint: 'ELC-106:delayed',
    },
  ]

  const purchaseRequests = [
    {
      id: 'PR-01',
      partId: 'PRT-03',
      quantity: 2,
      status: 'submitted' as const,
      createdAt: isoOffset(-4),
      note: 'Buffer stock for avionics (demo).',
      expectedLeadDays: 18,
    },
  ]

  const transactions = [
    {
      id: 'TX-01',
      partId: 'PRT-06',
      type: 'reserve' as const,
      quantity: 2,
      at: isoOffset(-8),
      note: 'Reserved for WO-1055',
      workOrderId: 'WO-1055',
      userId: 'usr-inv',
    },
  ]

  const audit = [
    {
      id: 'AUD-01',
      at: isoOffset(-1),
      userId: 'usr-adm',
      action: 'seed',
      detail: 'Loaded synthetic AEROSYNC AI demonstration dataset. Not operational aviation data.',
    },
  ]

  void SYSTEMS
  return {
    users: DEMO_USERS,
    aircraft,
    components,
    readings,
    thresholds,
    faults,
    maintenance,
    workOrders,
    parts,
    transactions,
    suppliers,
    purchaseRequests,
    schedules,
    alerts,
    audit,
  }
}
