import { AlertOctagon, ArrowRight, Sparkles } from 'lucide-react'
import type { AIRecommendation } from '@/lib/recommendation-engine/types'
import { Card, CardContent } from '@/shared/ui/Card'
import { ConfidenceScoreBadge } from '@/shared/ui/ConfidenceScoreBadge'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { cn } from '@/shared/lib/cn'

const SEVERITY_TONE = {
  info: 'info',
  low: 'success',
  medium: 'warning',
  high: 'danger',
  critical: 'danger',
} as const

interface AIRecommendationCardProps {
  recommendation: AIRecommendation
  onAccept?: () => void
  onExplainMore?: () => void
  className?: string
}

export function AIRecommendationCard({ recommendation, onAccept, onExplainMore, className }: AIRecommendationCardProps) {
  const r = recommendation
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              {r.severity === 'critical' || r.severity === 'high' ? <AlertOctagon className="size-4.5" /> : <Sparkles className="size-4.5" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{r.title}</p>
              <p className="text-xs text-muted-foreground">{r.entityName}</p>
            </div>
          </div>
          <Badge tone={SEVERITY_TONE[r.severity]} className="capitalize">
            {r.severity}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground">{r.reason}</p>

        <div className="grid grid-cols-2 gap-3 rounded-xl bg-surface-elevated/60 p-3 text-xs">
          <div>
            <p className="font-medium text-muted-foreground">Business Impact</p>
            <p className="mt-0.5 text-foreground">{r.businessImpact}</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground">Expected Benefit</p>
            <p className="mt-0.5 text-foreground">{r.expectedBenefit}</p>
          </div>
        </div>

        {r.risks.length > 0 && (
          <div className="text-xs">
            <p className="font-medium text-muted-foreground">Risks if ignored</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-foreground">
              {r.risks.map((risk, i) => (
                <li key={i}>{risk}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border pt-3.5">
          <ConfidenceScoreBadge score={r.confidenceScore} />
          <div className="flex items-center gap-2">
            {onExplainMore && (
              <Button variant="ghost" size="sm" onClick={onExplainMore}>
                Ask AI to explain
              </Button>
            )}
            {onAccept && (
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="size-3.5" />} onClick={onAccept}>
                {r.suggestedAction}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
