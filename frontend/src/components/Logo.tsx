export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg viewBox="0 0 36 36" className="h-8 w-8 shrink-0" aria-hidden>
        <rect width="36" height="36" rx="9" fill="#0b1224" stroke="#22d3ee" strokeOpacity="0.45" />
        <path d="M6 19h9l3-8 3 8h9" fill="none" stroke="#22d3ee" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18 11v16" stroke="#67e8f9" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="18" cy="19" r="1.7" fill="#22d3ee" />
        <path d="M11 26h14" stroke="#818cf8" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      {!compact && (
        <div className="leading-tight">
          <div className="font-display text-[13px] font-extrabold tracking-[0.18em] text-cyan-300">AEROSYNC</div>
          <div className="text-[10px] font-semibold tracking-[0.32em] text-slate-400">AI</div>
        </div>
      )}
    </div>
  )
}
