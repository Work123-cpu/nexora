import { useMemo } from 'react'
import { computeBusinessHealth, type BusinessHealth } from '@/lib/health-engine'
import { useInventoryItems } from '@/features/inventory/hooks/useInventory'
import { useRawMaterials } from '@/features/raw-materials/hooks/useRawMaterials'
import { useVendors } from '@/features/vendors/hooks/useVendors'
import { usePurchaseOrders } from '@/features/procurement/hooks/usePurchaseOrders'
import { useLiveMarketSignals } from './useLiveMarketSignals'

/** Fetches this company's real inventory/materials/vendors/purchase-orders/live-market-data and feeds the pure health engine. */
export function useBusinessHealth(): { health: BusinessHealth; isLoading: boolean } {
  const { data: inventoryData, isLoading: loadingInventory } = useInventoryItems({ pageSize: 10000 })
  const { data: materialsData, isLoading: loadingMaterials } = useRawMaterials({ pageSize: 10000 })
  const { data: vendorsData, isLoading: loadingVendors } = useVendors({ pageSize: 10000 })
  const { data: poData, isLoading: loadingPOs } = usePurchaseOrders({ pageSize: 10000 })
  const { signals: marketSignals } = useLiveMarketSignals(materialsData?.items ?? [])

  const health = useMemo(
    () =>
      computeBusinessHealth({
        inventoryItems: inventoryData?.items ?? [],
        vendors: vendorsData?.items ?? [],
        purchaseOrders: poData?.items ?? [],
        marketSignals,
      }),
    [inventoryData, vendorsData, poData, marketSignals],
  )

  return { health, isLoading: loadingInventory || loadingMaterials || loadingVendors || loadingPOs }
}
