import { ArrowDownRight, ArrowRight, ArrowUpRight, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/shared/ui/Card'
import { Badge } from '@/shared/ui/Badge'
import { ConfidenceScoreBadge } from '@/shared/ui/ConfidenceScoreBadge'
import { DataConfidenceBadge } from '@/shared/ui/DataConfidenceBadge'
import { formatCurrency, formatDate } from '@/shared/lib/formatters'
import type { MaterialIntelligence } from '@/types/entities/materialIntelligence'

const CATEGORY_LABEL: Record<MaterialIntelligence['category'], string> = {
  agricultural: 'Agricultural',
  metal: 'Metal',
  mineral: 'Mineral',
  chemical: 'Chemical',
  industrial: 'Industrial',
  specialty: 'Specialty',
  unclassified: 'Classifying…',
}

// Buyer's-eye view — a rising raw material price is bad news for a manufacturer, so it's styled
// as a warning, not a "gain" — matching the convention already used elsewhere in Market Intelligence.
const TREND_STYLE = {
  rising: { icon: ArrowUpRight, tone: 'danger' as const, label: 'Rising' },
  stable: { icon: ArrowRight, tone: 'neutral' as const, label: 'Stable' },
  falling: { icon: ArrowDownRight, tone: 'success' as const, label: 'Falling' },
}

function MovementRow({ label, value }: { label: string; value: number | null }) {
  if (value === null) return null
  const positive = value >= 0
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={positive ? 'font-medium text-danger' : 'font-medium text-success'}>
        {positive ? '+' : ''}
        {value.toFixed(1)}%
      </span>
    </div>
  )
}

export function MaterialIntelligenceCard({ material }: { material: MaterialIntelligence }) {
  const isPending = material.dataMode === 'pending' || material.category === 'unclassified'

  if (isPending) {
    return (
      <Card className="p-5">
        <p className="text-sm font-medium text-foreground">{material.materialName}</p>
        <p className="mt-2 text-xs text-muted-foreground">Classifying this material — check back shortly.</p>
      </Card>
    )
  }

  const trendInfo = material.trend ? TREND_STYLE[material.trend] : null
  const TrendIcon = trendInfo?.icon

  return (
    <Card interactive className="flex flex-col">
      <CardHeader className="flex-col items-start gap-2">
        <div className="flex w-full items-start justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">{material.materialName}</p>
          <Badge tone="neutral">{CATEGORY_LABEL[material.category]}</Badge>
        </div>
        {material.isEstimate && <Badge tone="info">Estimate — no standardized price feed</Badge>}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <div>
          {material.currentPrice !== null ? (
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              {formatCurrency(material.currentPrice, true)}
              {material.unit && <span className="ml-1 text-sm font-normal text-muted-foreground">/ {material.unit}</span>}
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-lg font-semibold text-foreground">
              <Sparkles className="size-4 text-info" /> Market intelligence
            </p>
          )}

          {trendInfo && TrendIcon && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <Badge tone={trendInfo.tone}>
                <TrendIcon className="size-3" /> {trendInfo.label}
              </Badge>
              {material.changePct7d !== null && (
                <span className={material.changePct7d >= 0 ? 'text-xs font-medium text-danger' : 'text-xs font-medium text-success'}>
                  {material.changePct7d >= 0 ? '+' : ''}
                  {material.changePct7d.toFixed(1)}% (7d)
                </span>
              )}
            </div>
          )}
        </div>

        {(material.changePct1d !== null || material.changePct7d !== null || material.changePct30d !== null) && (
          <div className="space-y-1 border-t border-border pt-3">
            <MovementRow label="1 Day" value={material.changePct1d} />
            <MovementRow label="7 Days" value={material.changePct7d} />
            <MovementRow label="30 Days" value={material.changePct30d} />
          </div>
        )}

        {material.forecast && (
          <div className="space-y-1.5 rounded-xl bg-surface-elevated p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Forecast — next {material.forecast.horizonDays} days
            </p>
            <p className="text-sm font-semibold text-foreground">
              {formatCurrency(material.forecast.lowerBound, true)} – {formatCurrency(material.forecast.upperBound, true)}
            </p>
            <ConfidenceScoreBadge score={material.forecast.confidenceScore} />
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
          <div className="space-y-0.5">
            <p>Source: {material.source ?? '—'}</p>
            {material.lastUpdated && <p>Updated: {formatDate(material.lastUpdated)}</p>}
          </div>
          {material.confidenceLevel && <DataConfidenceBadge level={material.confidenceLevel} />}
        </div>
      </CardContent>
    </Card>
  )
}
