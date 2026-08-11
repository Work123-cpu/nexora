import type { AIRecommendation } from '../types'
import type { Vendor } from '@/types/entities/vendor'

function makeId(vendorId: string): string {
  return `rec-vendor-${vendorId}`
}

export function computeSupplierRiskRecommendations(vendors: Vendor[]): AIRecommendation[] {
  return vendors
    .filter((vendor) => vendor.status === 'under-review' || vendor.onTimeDeliveryPct < 75 || vendor.qualityScorePct < 78)
    .map((vendor) => {
      const severity = vendor.status === 'under-review' || vendor.onTimeDeliveryPct < 65 ? 'high' : 'medium'

      return {
        id: makeId(vendor.id),
        category: 'supplier-risk',
        severity,
        title: `Supplier risk: ${vendor.name}`,
        reason: `${vendor.name} has an on-time delivery rate of ${vendor.onTimeDeliveryPct}% and a quality score of ${vendor.qualityScorePct}%, both trending below acceptable thresholds across ${vendor.activeContracts} active contract(s).`,
        confidenceScore: 82,
        businessImpact: 'Increases risk of delayed shipments and material quality issues affecting production.',
        expectedBenefit: 'Diversifying or renegotiating with this supplier reduces exposure to future disruptions.',
        risks: ['Delayed raw material deliveries', 'Inconsistent material quality', 'Potential production schedule slippage'],
        suggestedAction: 'Review supplier and compare alternatives',
        entityType: 'vendor',
        entityId: vendor.id,
        entityName: vendor.name,
        createdAt: new Date().toISOString(),
      } satisfies AIRecommendation
    })
}
