import { useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { EmptyState } from '@/shared/ui/EmptyState'
import { AIRecommendationCard } from '@/shared/components/AIRecommendationCard'
import { useRecommendationsByCategory } from '@/shared/hooks/useRecommendations'
import { useExplainDialog } from '@/shared/hooks/useExplainDialog'
import { useToast } from '@/shared/ui/Toast'
import { useInventoryItems } from '@/features/inventory/hooks/useInventory'
import { useRawMaterials } from '@/features/raw-materials/hooks/useRawMaterials'
import { useBOMs } from '@/features/bom/hooks/useBOM'
import { buildRestockAction } from '../lib/buildRestockAction'
import type { AIRecommendation } from '@/lib/recommendation-engine/types'

export function RecommendationsPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { recommendations: safetyStockRecs } = useRecommendationsByCategory('safety-stock')
  const { recommendations: reorderRecs } = useRecommendationsByCategory('reorder')
  const recommendations = [...safetyStockRecs, ...reorderRecs]
  const { explain, dialog } = useExplainDialog()
  const { data: inventoryData } = useInventoryItems({ pageSize: 10000 })
  const { data: rawMaterialsData } = useRawMaterials({ pageSize: 10000 })
  const { data: bomsData } = useBOMs({ pageSize: 10000 })
  const inventoryItems = inventoryData?.items ?? []
  const rawMaterials = rawMaterialsData?.items ?? []
  const boms = bomsData?.items ?? []

  // A raw material is genuinely bought from a vendor, so that's a pre-filled Purchase Order for
  // it directly. A product (Samosa, Veg Biryani, ...) is made in-house, not purchased — there's
  // no vendor to buy a finished dish from — so the real corresponding purchase is the RAW
  // MATERIALS its BOM says are needed to make more of it. Only when there's no BOM to derive that
  // from does this fall back to a manual restock on the product's own inventory entry.
  const handleAccept = (rec: AIRecommendation, quantity: number) => {
    const action = buildRestockAction(rec, quantity, boms, rawMaterials, inventoryItems)
    if (action.type === 'purchase-order' && action.omittedCount > 0) {
      toast({
        title: 'Purchase order pre-filled for one vendor',
        description: `${action.omittedCount} other material${action.omittedCount === 1 ? '' : 's'} in this product's BOM come from a different vendor — order ${action.omittedCount === 1 ? 'it' : 'them'} separately.`,
        tone: 'info',
      })
    }
    navigate(action.url)
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
