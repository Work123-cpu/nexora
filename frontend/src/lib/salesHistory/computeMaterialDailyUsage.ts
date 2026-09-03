import type { Bill } from '@/types/entities/bill'
import type { BillOfMaterials } from '@/types/entities/bom'
import { computeDailySalesHistory, averageDailyUsage } from './computeSalesHistory'

/** Trailing avg daily consumption for one raw material, derived by joining every product whose
 * BOM includes it with that product's own real daily sales rate (quantityPerUnit, scaled for
 * scrap). Returns undefined (never a fabricated number) unless at least one BOM-linked product
 * has `days` real calendar days of history — same honest-fallback contract as
 * computeDailySalesHistory. */
export function computeMaterialDailyUsage(bills: Bill[], boms: BillOfMaterials[], rawMaterialId: string, days = 10): number | undefined {
  let total = 0
  let anyContributed = false

  for (const bom of boms) {
    const line = bom.materials.find((m) => m.rawMaterialId === rawMaterialId)
    if (!line) continue

    const productSeries = computeDailySalesHistory(bills, bom.productId, days)
    if (!productSeries) continue

    const productDailyAvg = averageDailyUsage(productSeries)
    total += productDailyAvg * line.quantityPerUnit * (1 + line.scrapPct / 100)
    anyContributed = true
  }

  return anyContributed ? total : undefined
}
