import type { AIRecommendation } from './types'
import type { InventoryItem } from '@/types/entities/inventory'
import type { RawMaterial } from '@/types/entities/rawMaterial'
import type { Vendor } from '@/types/entities/vendor'
import type { LiveMarketSignal } from '@/shared/hooks/useLiveMarketSignals'
import { computeReorderRecommendations } from './rules/reorderPoint.rule'
import { computeSafetyStockRecommendations } from './rules/safetyStock.rule'
import { computeSupplierRiskRecommendations } from './rules/supplierRisk.rule'
import { computeMarketImpactRecommendations } from './rules/marketImpact.rule'

export * from './types'

export interface RecommendationInputs {
  inventoryItems: InventoryItem[]
  rawMaterials: RawMaterial[]
  vendors: Vendor[]
  marketSignals: LiveMarketSignal[]
}

function severityWeight(severity: AIRecommendation['severity']): number {
  return { critical: 4, high: 3, medium: 2, low: 1, info: 0 }[severity]
}

export function getAllRecommendations(inputs: RecommendationInputs): AIRecommendation[] {
  const { inventoryItems, rawMaterials, vendors, marketSignals } = inputs
  return [
    ...computeSafetyStockRecommendations(inventoryItems, rawMaterials, vendors),
    ...computeReorderRecommendations(inventoryItems, rawMaterials, vendors),
    ...computeSupplierRiskRecommendations(vendors),
    ...computeMarketImpactRecommendations(rawMaterials, marketSignals),
  ].sort((a, b) => severityWeight(b.severity) - severityWeight(a.severity))
}

export function getRecommendationsByCategory(inputs: RecommendationInputs, category: AIRecommendation['category']): AIRecommendation[] {
  return getAllRecommendations(inputs).filter((r) => r.category === category)
}

export function getCriticalRecommendations(inputs: RecommendationInputs): AIRecommendation[] {
  return getAllRecommendations(inputs).filter((r) => r.severity === 'critical' || r.severity === 'high')
}
