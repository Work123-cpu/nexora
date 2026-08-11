import { products } from './seed/products.seed'
import { rawMaterials } from './seed/rawMaterials.seed'
import { billsOfMaterials } from './seed/bom.seed'
import { warehouses } from './seed/warehouses.seed'
import { vendors } from './seed/vendors.seed'
import { purchaseOrders } from './seed/purchaseOrders.seed'
import { inventoryItems } from './seed/inventory.seed'

/**
 * Clears every mutable mock "table" back to empty, in place, so every module reading
 * these arrays (they're shared references, not copies) sees the reset immediately.
 * This is what makes "blank slate" possible without a real backend — a fresh company
 * starts truly empty instead of permanently inheriting the bakery demo data.
 */
export function resetAllMockData(): void {
  products.length = 0
  rawMaterials.length = 0
  billsOfMaterials.length = 0
  warehouses.length = 0
  vendors.length = 0
  purchaseOrders.length = 0
  inventoryItems.length = 0

  Object.keys(localStorage)
    .filter((key) => key.startsWith('nexora.custom-categories.'))
    .forEach((key) => localStorage.removeItem(key))
}
