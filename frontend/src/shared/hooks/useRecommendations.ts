import { useMemo } from 'react'
import { getAllRecommendations, getCriticalRecommendations, getRecommendationsByCategory, type AIRecommendation } from '@/lib/recommendation-engine'
import { useInventoryItems } from '@/features/inventory/hooks/useInventory'
import { useRawMaterials } from '@/features/raw-materials/hooks/useRawMaterials'
import { useVendors } from '@/features/vendors/hooks/useVendors'
import { useProducts } from '@/features/products/hooks/useProducts'
import { useBOMs } from '@/features/bom/hooks/useBOM'
import { useBills } from '@/features/billing/hooks/useBills'
import { useLiveMarketSignals } from './useLiveMarketSignals'

/** Fetches this company's real inventory/materials/vendors/products/BOMs/bills/live-market-data
 * and feeds the pure recommendation engine. */
function useRecommendationInputs() {
  const { data: inventoryData, isLoading: loadingInventory } = useInventoryItems({ pageSize: 10000 })
  const { data: materialsData, isLoading: loadingMaterials } = useRawMaterials({ pageSize: 10000 })
  const { data: vendorsData, isLoading: loadingVendors } = useVendors({ pageSize: 10000 })
  const { data: productsData, isLoading: loadingProducts } = useProducts({ pageSize: 10000 })
  const { data: bomsData, isLoading: loadingBoms } = useBOMs({ pageSize: 10000 })
  const { data: billsData, isLoading: loadingBills } = useBills({ pageSize: 10000 })
  const { signals: marketSignals } = useLiveMarketSignals(materialsData?.items ?? [])

  const inputs = useMemo(
    () => ({
      inventoryItems: inventoryData?.items ?? [],
      rawMaterials: materialsData?.items ?? [],
      vendors: vendorsData?.items ?? [],
      marketSignals,
      products: productsData?.items ?? [],
      boms: bomsData?.items ?? [],
      bills: billsData?.items ?? [],
    }),
    [inventoryData, materialsData, vendorsData, marketSignals, productsData, bomsData, billsData],
  )

  return { inputs, isLoading: loadingInventory || loadingMaterials || loadingVendors || loadingProducts || loadingBoms || loadingBills }
}

export function useAllRecommendations(): { recommendations: AIRecommendation[]; isLoading: boolean } {
  const { inputs, isLoading } = useRecommendationInputs()
  const recommendations = useMemo(() => getAllRecommendations(inputs), [inputs])
  return { recommendations, isLoading }
}

export function useCriticalRecommendations(): { recommendations: AIRecommendation[]; isLoading: boolean } {
  const { inputs, isLoading } = useRecommendationInputs()
  const recommendations = useMemo(() => getCriticalRecommendations(inputs), [inputs])
  return { recommendations, isLoading }
}

export function useRecommendationsByCategory(category: AIRecommendation['category']): { recommendations: AIRecommendation[]; isLoading: boolean } {
  const { inputs, isLoading } = useRecommendationInputs()
  const recommendations = useMemo(() => getRecommendationsByCategory(inputs, category), [inputs, category])
  return { recommendations, isLoading }
}
