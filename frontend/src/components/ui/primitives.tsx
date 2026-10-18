import { cn } from '@/lib/cn'
import { X } from 'lucide-react'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'

export function Button({
  className,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'outline' }) {
  const styles = {
    primary: 'bg-cyan-400/90 text-slate-950 hover:bg-cyan-300',
    ghost: 'bg-white/5 text-slate-200 hover:bg-white/10',
    outline: 'border border-white/15 bg-transparent text-slate-200 hover:border-cyan-400/40',
    danger: 'bg-red-500/90 text-white hover:bg-red-400',
  }
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:opacity-40',
        styles[variant],
        className,
      )}
      {...props}
    />
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-100 outline-none ring-cyan-400/0 placeholder:text-slate-500 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20',
        props.className,
      )}
    />
  )
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400/40',
        props.className,
      )}
    />
  )
}

export function Badge({
  children,
  tone = 'slate',
}: {
  children: ReactNode
  tone?: 'slate' | 'cyan' | 'amber' | 'red' | 'green' | 'violet'
}) {
  const map = {
    slate: 'bg-white/8 text-slate-300',
    cyan: 'bg-cyan-400/15 text-cyan-200',
    amber: 'bg-amber-400/15 text-amber-200',
    red: 'bg-red-500/15 text-red-300',
    green: 'bg-emerald-400/15 text-emerald-200',
    violet: 'bg-violet-400/15 text-violet-200',
  }
  return <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize', map[tone])}>{children}</span>
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn('glass rounded-2xl p-4', className)}>{children}</section>
}

export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 sm:items-center" role="dialog">
      <div className="glass max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-white/10" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 max-w-3xl text-sm text-slate-400">{subtitle}</p>}
      </div>
      {actions}
    </div>
  )
}

export function Empty({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-slate-400">
      <div className="font-medium text-slate-200">{title}</div>
      <p className="mt-1">{detail}</p>
    </div>
  )
}

export function statusTone(status: string) {
  if (status === 'operational' || status === 'completed' || status === 'healthy') return 'green' as const
  if (status === 'watch' || status === 'planned' || status === 'warning') return 'amber' as const
  if (status === 'maintenance' || status === 'in_progress' || status === 'awaiting_parts') return 'violet' as const
  if (status === 'grounded' || status === 'critical' || status === 'open') return 'red' as const
  return 'slate' as const
}
