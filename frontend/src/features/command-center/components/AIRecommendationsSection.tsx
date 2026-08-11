import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { AIRecommendationCard } from '@/shared/components/AIRecommendationCard'
import { EmptyState } from '@/shared/ui/EmptyState'
import { CheckCircle2 } from 'lucide-react'
import { useAllRecommendations } from '@/shared/hooks/useRecommendations'
import { useToast } from '@/shared/ui/Toast'
import { aiService } from '@/services/ai'
import { useState } from 'react'

export function AIRecommendationsSection() {
  const { recommendations: allRecommendations } = useAllRecommendations()
  const recommendations = allRecommendations.slice(0, 3)
  const { toast } = useToast()
  const [explaining, setExplaining] = useState<string | null>(null)

  const handleAccept = (title: string) => {
    toast({ title: 'Action queued', description: `"${title}" was added to the AI Action Center for approval.`, tone: 'success' })
  }

  const handleExplain = async (id: string, subject: string) => {
    setExplaining(id)
    const res = await aiService.explain({ subject, data: {} })
    toast({ title: 'Nexora explains', description: res.explanation, tone: 'info' })
    setExplaining(null)
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">AI Recommendations</h2>
        <Link to="/app/ai/action-center" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          View all <ArrowRight className="size-3" />
        </Link>
      </div>
      {recommendations.length === 0 ? (
        <EmptyState icon={<CheckCircle2 className="size-5" />} title="No recommendations right now" description="Nexora will surface new recommendations as your data changes." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {recommendations.map((rec) => (
            <AIRecommendationCard
              key={rec.id}
              recommendation={rec}
              onAccept={() => handleAccept(rec.title)}
              onExplainMore={() => handleExplain(rec.id, rec.title)}
              className={explaining === rec.id ? 'opacity-60' : ''}
            />
          ))}
        </div>
      )}
    </div>
  )
}
