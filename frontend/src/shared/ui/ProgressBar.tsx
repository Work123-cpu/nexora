import { cn } from '@/shared/lib/cn'

interface ProgressBarProps {
  value: number
  max?: number
  tone?: 'primary' | 'success' | 'warning' | 'danger'
  className?: string
  showLabel?: boolean
}

const toneClasses = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
}

export function ProgressBar({ value, max = 100, tone = 'primary', className, showLabel }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className={cn('space-y-1', className)}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-border/60">
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', toneClasses[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && <p className="text-xs text-muted-foreground">{pct.toFixed(0)}%</p>}
    </div>
  )
}
