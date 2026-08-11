import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/Card'
import { GaugeChart } from '@/shared/ui/charts/GaugeChart'
import { ProgressBar } from '@/shared/ui/ProgressBar'
import { useBusinessHealth } from '@/shared/hooks/useBusinessHealth'

const STATUS_TONE = {
  excellent: 'success',
  good: 'success',
  fair: 'warning',
  poor: 'danger',
} as const

export function BusinessHealthCard() {
  const { health } = useBusinessHealth()

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Business Health</CardTitle>
          <CardDescription className="mt-1">Composite score across inventory, suppliers, procurement, and forecast.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
          <GaugeChart value={health.overallScore} label="Overall" size={150} />
          <div className="w-full flex-1 space-y-3">
            {health.categories.map((cat) => (
              <div key={cat.key}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{cat.label}</span>
                  <span className="text-muted-foreground">{cat.score}</span>
                </div>
                <ProgressBar value={cat.score} tone={STATUS_TONE[cat.status]} />
              </div>
            ))}
          </div>
        </div>
        <Link
          to="/app/ai/health-check"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View full health check <ArrowRight className="size-3.5" />
        </Link>
      </CardContent>
    </Card>
  )
}
