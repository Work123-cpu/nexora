import { useEffect, useState } from 'react'
import { AlertTriangle, Sparkles } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { GaugeChart } from '@/shared/ui/charts/GaugeChart'
import { ProgressBar } from '@/shared/ui/ProgressBar'
import { Badge, type BadgeTone } from '@/shared/ui/Badge'
import { EmptyState } from '@/shared/ui/EmptyState'
import { AIRecommendationCard } from '@/shared/components/AIRecommendationCard'
import { useBusinessHealth } from '@/shared/hooks/useBusinessHealth'
import { useCriticalRecommendations } from '@/shared/hooks/useRecommendations'
import { aiService } from '@/services/ai'

const STATUS_TONE: Record<string, BadgeTone> = { excellent: 'success', good: 'success', fair: 'warning', poor: 'danger' }

export function AIHealthCheckPage() {
  const { health } = useBusinessHealth()
  const warnings = health.categories.filter((c) => c.status === 'fair' || c.status === 'poor')
  const { recommendations: criticalRecsAll } = useCriticalRecommendations()
  const criticalRecs = criticalRecsAll.slice(0, 4)

  const [summary, setSummary] = useState<string | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(true)

  useEffect(() => {
    let mounted = true
    aiService
      .summarize({ subject: 'overall business health', data: { overallScore: health.overallScore, categories: health.categories } })
      .then((res) => mounted && setSummary(res.summary))
      .finally(() => mounted && setLoadingSummary(false))
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      <PageHeader title="AI Health Check" description="A continuous, AI-narrated diagnostic of your business's operational health." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Overall Health Score</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <GaugeChart value={health.overallScore} label={health.status} size={190} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4" /> Nexora Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <div className="space-y-2">
                <div className="h-3 w-full animate-pulse rounded bg-border/70" />
                <div className="h-3 w-5/6 animate-pulse rounded bg-border/70" />
                <div className="h-3 w-3/4 animate-pulse rounded bg-border/70" />
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">{summary}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {health.categories.map((cat) => (
          <Card key={cat.key}>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">{cat.label}</p>
                <Badge tone={STATUS_TONE[cat.status]} className="capitalize">
                  {cat.status}
                </Badge>
              </div>
              <p className="mt-2 text-2xl font-semibold text-foreground">{cat.score}</p>
              <ProgressBar value={cat.score} tone={STATUS_TONE[cat.status] === 'danger' ? 'danger' : STATUS_TONE[cat.status] === 'warning' ? 'warning' : 'success'} className="mt-2" />
              <p className="mt-2 text-xs text-muted-foreground">{cat.summary}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <AlertTriangle className="size-4 text-warning" /> Warnings
        </h2>
        {warnings.length === 0 ? (
          <EmptyState title="No warnings" description="All health categories are performing well." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {warnings.map((w) => (
              <Card key={w.key}>
                <CardContent className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{w.label}</p>
                    <p className="text-xs text-muted-foreground">{w.summary}</p>
                  </div>
                  <Badge tone={STATUS_TONE[w.status]} className="capitalize">
                    {w.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">AI Suggestions</h2>
        {criticalRecs.length === 0 ? (
          <EmptyState title="No urgent suggestions" description="Nexora has no critical recommendations right now." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {criticalRecs.map((rec) => (
              <AIRecommendationCard key={rec.id} recommendation={rec} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
