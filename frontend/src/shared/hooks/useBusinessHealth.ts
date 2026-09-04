import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { computeBusinessHealth, type BusinessHealth, type SystemHealthSignal } from '@/lib/health-engine'
import { useInventoryItems } from '@/features/inventory/hooks/useInventory'
import { useRawMaterials } from '@/features/raw-materials/hooks/useRawMaterials'
import { useVendors } from '@/features/vendors/hooks/useVendors'
import { usePurchaseOrders } from '@/features/procurement/hooks/usePurchaseOrders'
import { useBills } from '@/features/billing/hooks/useBills'
import { useProducts } from '@/features/products/hooks/useProducts'
import { apiClient } from '@/shared/lib/apiClient'
import { useLiveMarketSignals } from './useLiveMarketSignals'

/** Fetches this company's real inventory/materials/vendors/purchase-orders/live-market-data and feeds the pure health engine. */
export function useBusinessHealth(): { health: BusinessHealth; isLoading: boolean } {
  const { data: inventoryData, isLoading: loadingInventory } = useInventoryItems({ pageSize: 10000 })
  const { data: materialsData, isLoading: loadingMaterials } = useRawMaterials({ pageSize: 10000 })
  const { data: vendorsData, isLoading: loadingVendors } = useVendors({ pageSize: 10000 })
  const { data: poData, isLoading: loadingPOs } = usePurchaseOrders({ pageSize: 10000 })
  const { data: billsData, isLoading: loadingBills } = useBills({ pageSize: 10000 })
  const { data: productsData, isLoading: loadingProducts } = useProducts({ pageSize: 10000 })
  const { data: systemHealth } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => apiClient.get<SystemHealthSignal>('/system/health'),
    refetchInterval: 60_000,
    retry: false,
  })
  const { signals: marketSignals } = useLiveMarketSignals(materialsData?.items ?? [])

  const health = useMemo(
    () =>
      computeBusinessHealth({
        inventoryItems: inventoryData?.items ?? [],
        vendors: vendorsData?.items ?? [],
        purchaseOrders: poData?.items ?? [],
        marketSignals,
        bills: billsData?.items ?? [],
        products: productsData?.items ?? [],
        systemHealth: systemHealth ?? null,
      }),
    [inventoryData, vendorsData, poData, marketSignals, billsData, productsData, systemHealth],
  )

  return {
    health,
    isLoading: loadingInventory || loadingMaterials || loadingVendors || loadingPOs || loadingBills || loadingProducts,
  }
}
