import { ArrowDownRight, ArrowUpRight, Radio } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui/Card'
import { Badge } from '@/shared/ui/Badge'
import { Sparkline } from '@/shared/ui/charts/Sparkline'
import { formatDate } from '@/shared/lib/formatters'

interface LiveIndicatorCardProps {
  name: string
  value: number
  unit: string
  changePct: number
  history: number[]
  asOf: string
  affects?: string
}

export function LiveIndicatorCard({ name, value, unit, changePct, history, asOf, affects }: LiveIndicatorCardProps) {
  const positive = changePct >= 0

  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">{name}</p>
            <p className="text-xs text-muted-foreground">
              {value} {unit}
            </p>
          </div>
          <Badge tone="success" className="gap-1">
            <Radio className="size-2.5" /> Live
          </Badge>
        </div>

        {changePct !== 0 && (
          <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${positive ? 'text-danger' : 'text-success'}`}>
            {positive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {Math.abs(changePct)}% vs prior reading
          </div>
        )}

        {history.length > 1 && (
          <div className="mt-3">
            <Sparkline data={history} tone={positive ? 'danger' : 'primary'} />
          </div>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs">
          <span className="text-foreground">{affects ?? 'General market signal'}</span>
          <span className="text-muted-foreground">{formatDate(asOf)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
