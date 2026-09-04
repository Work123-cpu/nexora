import type { AIRecommendation } from '@/lib/recommendation-engine/types'
import type { BillOfMaterials } from '@/types/entities/bom'
import type { RawMaterial } from '@/types/entities/rawMaterial'
import type { InventoryItem } from '@/types/entities/inventory'

export type RestockAction =
  | { type: 'purchase-order'; url: string; omittedCount: number }
  | { type: 'inventory-edit'; url: string }

/** Where "Accept"/"Approve" on a reorder or safety-stock recommendation should actually send the
 * user, and with what pre-filled.
 *
 * - Raw material: a real vendor purchase -- pre-filled PO for that one material, unchanged.
 * - Product with a BOM: also a real vendor purchase -- but for the RAW MATERIALS the BOM says are
 *   needed to produce the suggested quantity, not for the product itself (there's no vendor to
 *   buy a finished dish from). Quantity uses the same quantityPerUnit * (1 + scrapPct/100) * qty
 *   formula BomForm/calculateBomCost already use elsewhere, rounded up. A PO is single-vendor, so
 *   materials are grouped to whichever one vendor supplies the most of them; anything from a
 *   different vendor is left out and reported via `omittedCount` so the caller can tell the user.
 * - Product with no BOM, or a BOM whose materials don't resolve to a real vendor: there's nothing
 *   to purchase -- the only honest action is recording a manual restock on the product's own
 *   (already-tracked) inventory entry. */
export function buildRestockAction(
  rec: AIRecommendation,
  quantity: number,
  boms: BillOfMaterials[],
  rawMaterials: RawMaterial[],
  inventoryItems: InventoryItem[],
): RestockAction {
  if (rec.entityType === 'rawMaterial') {
    return { type: 'purchase-order', url: `/app/procurement/purchase-orders/new?materialId=${rec.entityId}&quantity=${quantity}`, omittedCount: 0 }
  }

  const bom = boms.find((b) => b.productId === rec.entityId)
  const materialLines = (bom?.materials ?? [])
    .map((line) => {
      const material = rawMaterials.find((m) => m.id === line.rawMaterialId)
      if (!material) return null
      const neededQty = Math.ceil(line.quantityPerUnit * (1 + line.scrapPct / 100) * quantity)
      return neededQty > 0 ? { material, neededQty } : null
    })
    .filter((l): l is { material: RawMaterial; neededQty: number } => l !== null)

  if (materialLines.length > 0) {
    const countByVendor = new Map<string, number>()
    for (const l of materialLines) countByVendor.set(l.material.primaryVendorId, (countByVendor.get(l.material.primaryVendorId) ?? 0) + 1)
    const [primaryVendorId] = [...countByVendor.entries()].sort((a, b) => b[1] - a[1])[0]!
    const included = materialLines.filter((l) => l.material.primaryVendorId === primaryVendorId)
    const materialsParam = included.map((l) => `${l.material.id}:${l.neededQty}`).join(',')
    return {
      type: 'purchase-order',
      url: `/app/procurement/purchase-orders/new?vendorId=${primaryVendorId}&materials=${encodeURIComponent(materialsParam)}`,
      omittedCount: materialLines.length - included.length,
    }
  }

  const inventoryItem = inventoryItems.find((i) => i.itemType === rec.entityType && i.itemId === rec.entityId)
  return { type: 'inventory-edit', url: inventoryItem ? `/app/inventory/${inventoryItem.id}/edit?add=${quantity}` : '/app/inventory/add-stock' }
}
