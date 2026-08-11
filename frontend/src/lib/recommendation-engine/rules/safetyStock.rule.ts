import type { AIRecommendation } from '../types'
import type { InventoryItem } from '@/types/entities/inventory'
import type { RawMaterial } from '@/types/entities/rawMaterial'
import type { Vendor } from '@/types/entities/vendor'

function makeId(itemId: string): string {
  return `rec-safety-${itemId}`
}

export function computeSafetyStockRecommendations(
  inventoryItems: InventoryItem[],
  rawMaterials: RawMaterial[],
  vendors: Vendor[],
): AIRecommendation[] {
  return inventoryItems
    .filter((item) => item.quantityOnHand <= item.safetyStock)
    .map((item) => {
      const material = item.itemType === 'rawMaterial' ? rawMaterials.find((rm) => rm.id === item.itemId) : undefined
      const vendor = material ? vendors.find((v) => v.id === material.primaryVendorId) : undefined
      const daysOfCoverLeft = Math.max(0, Math.round(item.quantityOnHand / Math.max(item.avgDailyUsage, 0.1)))

      return {
        id: makeId(item.id),
        category: 'safety-stock',
        severity: 'critical',
        title: `Critical: ${item.itemName} below safety stock`,
        reason: `${item.itemName} is at ${item.quantityOnHand} ${item.unit}, below the safety stock threshold of ${item.safetyStock} ${item.unit}. At current usage this covers only ${daysOfCoverLeft} day(s).${vendor ? ` Expedited ordering from ${vendor.name} is recommended.` : ''}`,
        confidenceScore: 96,
        businessImpact: 'High risk of imminent stockout affecting production or order fulfillment.',
        expectedBenefit: 'Emergency reorder prevents halted production lines and missed customer orders.',
        risks: ['Production halt', 'Missed fulfillment SLAs', 'Potential expedited freight costs'],
        suggestedAction: `Place urgent order for ${item.reorderQuantity} ${item.unit}`,
        entityType: item.itemType === 'rawMaterial' ? 'rawMaterial' : 'product',
        entityId: item.itemId,
        entityName: item.itemName,
        createdAt: new Date().toISOString(),
      } satisfies AIRecommendation
    })
}
