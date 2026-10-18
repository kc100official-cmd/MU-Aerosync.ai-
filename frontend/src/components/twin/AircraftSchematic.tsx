import { cn } from '@/lib/cn'
import type { ComponentSystem } from '@/types'

const HOTSPOTS: Array<{ id: ComponentSystem; cx: number; cy: number; label: string }> = [
  { id: 'engine', cx: 118, cy: 92, label: 'Engine' },
  { id: 'engine', cx: 282, cy: 92, label: 'Engine' },
  { id: 'fuel', cx: 200, cy: 78, label: 'Fuel' },
  { id: 'hydraulic', cx: 200, cy: 118, label: 'Hydraulic' },
  { id: 'landing_gear', cx: 200, cy: 148, label: 'Landing gear' },
  { id: 'electrical', cx: 248, cy: 60, label: 'Electrical' },
  { id: 'avionics', cx: 78, cy: 108, label: 'Avionics' },
  { id: 'ecs', cx: 160, cy: 58, label: 'ECS' },
]

function color(score: number) {
  if (score >= 85) return '#34d399'
  if (score >= 70) return '#f59e0b'
  return '#f87171'
}

export function AircraftSchematic({
  selected,
  scores,
  onSelect,
}: {
  selected: ComponentSystem
  scores: Partial<Record<ComponentSystem, number>>
  onSelect: (s: ComponentSystem) => void
}) {
  return (
    <svg viewBox="0 0 400 200" className="h-auto w-full max-h-[420px]">
      <defs>
        <linearGradient id="fuse" x1="0" x2="1">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>
      <ellipse cx="200" cy="100" rx="168" ry="18" fill="url(#fuse)" stroke="#22d3ee" strokeOpacity="0.35" />
      <polygon points="40,100 18,108 18,92" fill="#1e293b" stroke="#67e8f9" strokeOpacity="0.5" />
      <polygon points="200,100 120,40 160,48" fill="#1e293b" stroke="#818cf8" strokeOpacity="0.5" />
      <polygon points="200,100 280,40 240,48" fill="#1e293b" stroke="#818cf8" strokeOpacity="0.5" />
      <polygon points="330,100 372,132 350,100 372,68" fill="#1e293b" stroke="#22d3ee" strokeOpacity="0.4" />
      <rect x="96" y="84" width="44" height="18" rx="8" fill="#0b1224" stroke={color(scores.engine ?? 80)} />
      <rect x="260" y="84" width="44" height="18" rx="8" fill="#0b1224" stroke={color(scores.engine ?? 80)} />
      {HOTSPOTS.map((h, i) => (
        <g key={`${h.id}-${i}`} className="cursor-pointer" onClick={() => onSelect(h.id)}>
          <circle
            cx={h.cx}
            cy={h.cy}
            r={selected === h.id ? 10 : 7}
            fill={color(scores[h.id] ?? 80)}
            fillOpacity={0.85}
            className={cn(selected === h.id && 'stroke-white')}
            stroke="#fff"
            strokeWidth={selected === h.id ? 2 : 0.6}
          />
          <text x={h.cx} y={h.cy + 18} textAnchor="middle" fontSize="8" fill="#94a3b8">
            {h.label}
          </text>
        </g>
      ))}
    </svg>
  )
}
