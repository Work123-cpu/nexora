import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Card } from './Card'
import { CountUp } from './motion/CountUp'

interface StatCardProps {
  label: string
  value: string
  icon?: ReactNode
  trend?: { value: number; label?: string }
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

const toneClasses = {
  primary: 'bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]',
  success: 'bg-gradient-to-br from-success/20 to-success/5 text-success shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]',
  warning: 'bg-gradient-to-br from-warning/20 to-warning/5 text-warning shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]',
  danger: 'bg-gradient-to-br from-danger/20 to-danger/5 text-danger shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]',
  info: 'bg-gradient-to-br from-info/20 to-info/5 text-info shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]',
}

export function StatCard({ label, value, icon, trend, tone = 'primary', className }: StatCardProps) {
  const positive = (trend?.value ?? 0) >= 0
  return (
    <Card interactive tilt className={cn('p-5', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            <CountUp value={value} />
          </p>
        </div>
        {icon && <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', toneClasses[tone])}>{icon}</div>}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs font-medium">
          <span className={cn('flex items-center gap-0.5', positive ? 'text-success' : 'text-danger')}>
            {positive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {Math.abs(trend.value)}%
          </span>
          <span className="text-muted-foreground">{trend.label ?? 'vs last period'}</span>
        </div>
      )}
    </Card>
  )
}
