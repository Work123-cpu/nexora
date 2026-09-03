import { useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { EmptyState } from '@/shared/ui/EmptyState'
import { AIRecommendationCard } from '@/shared/components/AIRecommendationCard'
import { useRecommendationsByCategory } from '@/shared/hooks/useRecommendations'
import { useExplainDialog } from '@/shared/hooks/useExplainDialog'

export function RecommendationsPage() {
  const navigate = useNavigate()
  const { recommendations: safetyStockRecs } = useRecommendationsByCategory('safety-stock')
  const { recommendations: reorderRecs } = useRecommendationsByCategory('reorder')
  const recommendations = [...safetyStockRecs, ...reorderRecs]
  const { explain, dialog } = useExplainDialog()

  const handleAccept = (materialId: string, quantity: number) => {
    navigate(`/app/procurement/purchase-orders/new?materialId=${materialId}&quantity=${quantity}`)
  }

  return (
    <div>
      <PageHeader
        title="Procurement Recommendations"
        description="AI-generated reorder recommendations based on current inventory, safety stock, and supplier lead times."
      />

      {recommendations.length === 0 ? (
        <EmptyState icon={<CheckCircle2 className="size-5" />} title="No procurement recommendations" description="All materials are sufficiently stocked." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {recommendations.map((rec) => {
            const quantityMatch = rec.suggestedAction.match(/([\d.]+)\s*(\w+)?/)
            const quantity = quantityMatch ? Math.round(Number(quantityMatch[1])) : 100

            return (
              <AIRecommendationCard
                key={rec.id}
                recommendation={rec}
                onAccept={() => handleAccept(rec.entityId, quantity)}
                onExplainMore={() => explain(rec.title)}
              />
            )
          })}
        </div>
      )}
      {dialog}
    </div>
  )
}
