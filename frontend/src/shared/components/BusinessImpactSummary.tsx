import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

interface ImpactMetric {
  label: string
  value: string
  tone?: 'success' | 'warning' | 'danger' | 'neutral'
}

interface BusinessImpactSummaryProps {
  metrics: ImpactMetric[]
  footer?: ReactNode
  className?: string
}

const toneClasses = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  neutral: 'text-foreground',
}

export function BusinessImpactSummary({ metrics, footer, className }: BusinessImpactSummaryProps) {
  return (
    <div className={cn('rounded-xl border border-border bg-surface-elevated/50 p-4', className)}>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
            <p className={cn('mt-1 text-lg font-semibold', toneClasses[metric.tone ?? 'neutral'])}>{metric.value}</p>
          </div>
        ))}
      </div>
      {footer && <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">{footer}</div>}
    </div>
  )
}
