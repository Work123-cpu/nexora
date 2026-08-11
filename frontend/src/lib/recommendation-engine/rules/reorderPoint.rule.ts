import type { AIRecommendation } from '../types'
import type { InventoryItem } from '@/types/entities/inventory'
import type { RawMaterial } from '@/types/entities/rawMaterial'
import type { Vendor } from '@/types/entities/vendor'

function makeId(itemId: string): string {
  return `rec-reorder-${itemId}`
}

export function computeReorderRecommendations(
  inventoryItems: InventoryItem[],
  rawMaterials: RawMaterial[],
  vendors: Vendor[],
): AIRecommendation[] {
  return inventoryItems
    .filter((item) => item.quantityOnHand <= item.reorderPoint && item.quantityOnHand > item.safetyStock)
    .map((item) => {
      const material = item.itemType === 'rawMaterial' ? rawMaterials.find((rm) => rm.id === item.itemId) : undefined
      const vendor = material ? vendors.find((v) => v.id === material.primaryVendorId) : undefined
      const daysOfCoverLeft = Math.max(1, Math.round(item.quantityOnHand / Math.max(item.avgDailyUsage, 0.1)))
      const leadTimeDays = material?.leadTimeDays ?? 5

      const confidenceScore = Math.min(96, 70 + Math.round((item.reorderPoint - item.quantityOnHand) / Math.max(item.reorderPoint, 1) * 40))

      return {
        id: makeId(item.id),
        category: 'reorder',
        severity: daysOfCoverLeft <= leadTimeDays ? 'high' : 'medium',
        title: `Reorder ${item.itemName}`,
        reason: `Current stock (${item.quantityOnHand} ${item.unit}) covers roughly ${daysOfCoverLeft} days at current usage, and has fallen below the reorder point of ${item.reorderPoint} ${item.unit}.${vendor ? ` ${vendor.name}'s lead time is ${leadTimeDays} days.` : ''}`,
        confidenceScore,
        businessImpact: daysOfCoverLeft <= leadTimeDays ? 'Risk of stockout before replenishment arrives.' : 'Maintains continuous production/fulfillment without disruption.',
        expectedBenefit: 'Avoids rush orders and production downtime caused by material shortages.',
        risks: daysOfCoverLeft <= leadTimeDays ? ['Potential production interruption', 'Possible expedited shipping costs'] : ['Minor risk if demand spikes unexpectedly'],
        suggestedAction: `Create purchase order for ${item.reorderQuantity} ${item.unit}`,
        entityType: item.itemType === 'rawMaterial' ? 'rawMaterial' : 'product',
        entityId: item.itemId,
        entityName: item.itemName,
        createdAt: new Date().toISOString(),
      } satisfies AIRecommendation
    })
}
