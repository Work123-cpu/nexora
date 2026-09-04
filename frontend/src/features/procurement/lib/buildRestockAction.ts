import type { AIRecommendation } from '@/lib/recommendation-engine/types'
import type { BillOfMaterials } from '@/types/entities/bom'
import type { RawMaterial } from '@/types/entities/rawMaterial'
import type { InventoryItem } from '@/types/entities/inventory'

export interface OtherVendorOrder {
  vendorId: string
  vendorName: string
  materialCount: number
  url: string
}

export type RestockAction =
  | { type: 'purchase-order'; url: string; otherOrders: OtherVendorOrder[] }
  | { type: 'inventory-edit'; url: string }

/** Where "Accept"/"Approve" on a reorder or safety-stock recommendation should actually send the
 * user, and with what pre-filled.
 *
 * - Raw material: a real vendor purchase -- pre-filled PO for that one material, unchanged.
 * - Product with a BOM: also a real vendor purchase -- but for the RAW MATERIALS the BOM says are
 *   needed to produce the suggested quantity, not for the product itself (there's no vendor to
 *   buy a finished dish from). Quantity uses the same quantityPerUnit * (1 + scrapPct/100) * qty
 *   formula BomForm/calculateBomCost already use elsewhere, rounded up. A single PO can only go to
 *   one vendor (that's the real-world shape of a purchase order, not just this app's UI), so
 *   materials are grouped by vendor: whichever vendor supplies the most becomes the primary,
 *   pre-filled order, and every other vendor's materials get their own ready-to-open order
 *   returned via `otherOrders` -- a one-click way to place the rest, instead of a dead-end note
 *   saying "order the rest yourself."
 * - Product with no BOM, or a BOM whose materials don't resolve to a real vendor: there's nothing
 *   to purchase -- the only honest action is recording a manual restock on the product's own
 *   (already-tracked) inventory entry. */
export function buildRestockAction(
  rec: AIRecommendation,
  quantity: number,
  boms: BillOfMaterials[],
  rawMaterials: RawMaterial[],
  inventoryItems: InventoryItem[],
  vendors: { id: string; name: string }[],
): RestockAction {
  // `for`/`source` carry through to PurchaseOrderCreatePage purely for display -- a banner
  // naming what's being restocked and why this vendor/these materials were picked, so "review or
  // edit" has something concrete to review against instead of a silently pre-filled form.
  const forParam = `for=${encodeURIComponent(rec.entityName)}`
  const getVendorName = (vendorId: string) => vendors.find((v) => v.id === vendorId)?.name ?? 'Unknown vendor'

  if (rec.entityType === 'rawMaterial') {
    return {
      type: 'purchase-order',
      url: `/app/procurement/purchase-orders/new?materialId=${rec.entityId}&quantity=${quantity}&source=direct&${forParam}`,
      otherOrders: [],
    }
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
    const byVendor = new Map<string, { material: RawMaterial; neededQty: number }[]>()
    for (const l of materialLines) {
      const group = byVendor.get(l.material.primaryVendorId) ?? []
      group.push(l)
      byVendor.set(l.material.primaryVendorId, group)
    }
    const vendorGroups = [...byVendor.entries()].sort((a, b) => b[1].length - a[1].length)
    const [primaryVendorId, primaryLines] = vendorGroups[0]!
    const otherOrders: OtherVendorOrder[] = vendorGroups.slice(1).map(([vendorId, lines]) => ({
      vendorId,
      vendorName: getVendorName(vendorId),
      materialCount: lines.length,
      url: `/app/procurement/purchase-orders/new?vendorId=${vendorId}&materials=${encodeURIComponent(lines.map((l) => `${l.material.id}:${l.neededQty}`).join(','))}&source=bom&${forParam}`,
    }))
    const materialsParam = primaryLines.map((l) => `${l.material.id}:${l.neededQty}`).join(',')
    return {
      type: 'purchase-order',
      url: `/app/procurement/purchase-orders/new?vendorId=${primaryVendorId}&materials=${encodeURIComponent(materialsParam)}&source=bom&${forParam}`,
      otherOrders,
    }
  }

  const inventoryItem = inventoryItems.find((i) => i.itemType === rec.entityType && i.itemId === rec.entityId)
  return { type: 'inventory-edit', url: inventoryItem ? `/app/inventory/${inventoryItem.id}/edit?add=${quantity}` : '/app/inventory/add-stock' }
}
