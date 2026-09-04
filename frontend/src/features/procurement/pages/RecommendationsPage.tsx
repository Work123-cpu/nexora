import { useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { EmptyState } from '@/shared/ui/EmptyState'
import { AIRecommendationCard } from '@/shared/components/AIRecommendationCard'
import { useRecommendationsByCategory } from '@/shared/hooks/useRecommendations'
import { useExplainDialog } from '@/shared/hooks/useExplainDialog'
import { useInventoryItems } from '@/features/inventory/hooks/useInventory'
import type { AIRecommendation } from '@/lib/recommendation-engine/types'

export function RecommendationsPage() {
  const navigate = useNavigate()
  const { recommendations: safetyStockRecs } = useRecommendationsByCategory('safety-stock')
  const { recommendations: reorderRecs } = useRecommendationsByCategory('reorder')
  const recommendations = [...safetyStockRecs, ...reorderRecs]
  const { explain, dialog } = useExplainDialog()
  const { data: inventoryData } = useInventoryItems({ pageSize: 10000 })
  const inventoryItems = inventoryData?.items ?? []

  // A raw material is genuinely bought from a vendor, so that goes to a pre-filled Purchase
  // Order. A product (Samosa, Veg Biryani, ...) is made in-house, not purchased — there's no
  // vendor to buy a finished dish from, so a PO here would only ever be able to prefill nonsense.
  // The real corresponding action is recording a restock on the product's own (already-tracked)
  // inventory entry instead.
  const handleAccept = (rec: AIRecommendation, quantity: number) => {
    if (rec.entityType === 'rawMaterial') {
      navigate(`/app/procurement/purchase-orders/new?materialId=${rec.entityId}&quantity=${quantity}`)
      return
    }
    const inventoryItem = inventoryItems.find((i) => i.itemType === rec.entityType && i.itemId === rec.entityId)
    if (inventoryItem) {
      navigate(`/app/inventory/${inventoryItem.id}/edit?add=${quantity}`)
    } else {
      navigate('/app/inventory/add-stock')
    }
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
                onAccept={() => handleAccept(rec, quantity)}
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
