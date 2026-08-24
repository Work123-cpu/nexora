import type { RawMaterial } from '@/types/entities/rawMaterial'
import type { BillOfMaterials } from '@/types/entities/bom'
import type { InventoryItemType } from '@/types/entities/inventory'

/** Used when a real lead time can't be derived — a raw material with no lead time set, or a
 * product with no BOM yet. */
export const DEFAULT_LEAD_TIME_DAYS = 7

/** How many days of stock a suggested reorder quantity should cover. */
export const REORDER_SUPPLY_DAYS = 30

/** A raw material's own lead time is direct; a product doesn't carry one, so it's derived from
 * the slowest-to-restock raw material in its own BOM (the real bottleneck on replenishing it). */
export function computeLeadTimeDays(
  itemType: InventoryItemType,
  itemId: string,
  rawMaterials: RawMaterial[],
  boms: BillOfMaterials[],
): number {
  if (itemType === 'rawMaterial') {
    const material = rawMaterials.find((m) => m.id === itemId)
    return material && material.leadTimeDays > 0 ? material.leadTimeDays : DEFAULT_LEAD_TIME_DAYS
  }

  const bom = boms.find((b) => b.productId === itemId)
  if (!bom || bom.materials.length === 0) return DEFAULT_LEAD_TIME_DAYS

  const leadTimes = bom.materials
    .map((line) => rawMaterials.find((m) => m.id === line.rawMaterialId)?.leadTimeDays)
    .filter((days): days is number => typeof days === 'number' && days > 0)
  return leadTimes.length > 0 ? Math.max(...leadTimes) : DEFAULT_LEAD_TIME_DAYS
}

/** Classic reorder-point formula: expected demand during the replenishment window, plus
 * whatever safety buffer is already set. Reorder quantity targets a fixed supply window rather
 * than a full EOQ model, since per-unit ordering/holding costs aren't tracked anywhere yet. */
export function computeReorderLevels(avgDailyUsage: number, leadTimeDays: number, safetyStock: number) {
  return {
    reorderPoint: Math.ceil(avgDailyUsage * leadTimeDays + safetyStock),
    reorderQuantity: Math.ceil(avgDailyUsage * REORDER_SUPPLY_DAYS),
  }
}
