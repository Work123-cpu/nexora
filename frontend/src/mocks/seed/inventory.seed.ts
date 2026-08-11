import type { InventoryItem } from '@/types/entities/inventory'
import { createSeededRandom, seededFloat, seededInt, seededBool, daysAgoISO } from '../generators/seedRandom'
import { makeIdFactory } from '../generators/idGenerator'
import { products } from './products.seed'
import { rawMaterials } from './rawMaterials.seed'
import { warehouses } from './warehouses.seed'

const rand = createSeededRandom(6006)
const nextId = makeIdFactory('inv')

function pickWarehouseId(kind: 'raw' | 'finished', perishable: boolean): string {
  if (perishable) return warehouses.find((w) => w.type === 'cold-storage')!.id
  if (kind === 'raw') return warehouses.find((w) => w.type === 'raw-material')!.id
  const finishedGoods = warehouses.filter((w) => w.type === 'finished-goods' || w.type === 'mixed')
  return finishedGoods[seededInt(rand, 0, finishedGoods.length - 1)]!.id
}

const inventoryFromRawMaterials: InventoryItem[] = rawMaterials.map((rm) => {
  const avgDailyUsage = seededFloat(rand, 4, 90, 1)
  const safetyStock = Math.round(avgDailyUsage * seededInt(rand, 3, 7))
  const reorderPoint = Math.round(safetyStock + avgDailyUsage * rm.leadTimeDays)
  const reorderQuantity = Math.round(avgDailyUsage * seededInt(rand, 14, 30))
  const isLowStock = seededBool(rand, 0.22)
  const quantityOnHand = isLowStock
    ? Math.round(reorderPoint * seededFloat(rand, 0.35, 0.95))
    : Math.round(reorderPoint * seededFloat(rand, 1.3, 2.6))

  return {
    id: nextId(),
    itemType: 'rawMaterial',
    itemId: rm.id,
    itemName: rm.name,
    category: rm.category,
    unit: rm.unit,
    warehouseId: pickWarehouseId('raw', rm.isPerishable),
    quantityOnHand,
    safetyStock,
    reorderPoint,
    reorderQuantity,
    avgDailyUsage,
    lastRestockedAt: daysAgoISO(seededInt(rand, 1, 25)),
  }
})

const inventoryFromProducts: InventoryItem[] = products
  .filter((p) => p.status !== 'discontinued')
  .map((product) => {
    const avgDailyUsage = seededFloat(rand, 8, 140, 1)
    const safetyStock = Math.round(avgDailyUsage * seededInt(rand, 2, 5))
    const reorderPoint = Math.round(safetyStock + avgDailyUsage * seededInt(rand, 3, 8))
    const reorderQuantity = Math.round(avgDailyUsage * seededInt(rand, 10, 21))
    const isLowStock = seededBool(rand, 0.18)
    const quantityOnHand = isLowStock
      ? Math.round(reorderPoint * seededFloat(rand, 0.3, 0.95))
      : Math.round(reorderPoint * seededFloat(rand, 1.2, 2.4))

    return {
      id: nextId(),
      itemType: 'product',
      itemId: product.id,
      itemName: product.name,
      category: product.category,
      unit: product.unitOfMeasure,
      warehouseId: pickWarehouseId('finished', false),
      quantityOnHand,
      safetyStock,
      reorderPoint,
      reorderQuantity,
      avgDailyUsage,
      lastRestockedAt: daysAgoISO(seededInt(rand, 0, 20)),
    }
  })

export const inventoryItems: InventoryItem[] = [...inventoryFromRawMaterials, ...inventoryFromProducts]

export function getInventoryByItemId(itemId: string): InventoryItem | undefined {
  return inventoryItems.find((i) => i.itemId === itemId)
}

export function getLowStockItems(): InventoryItem[] {
  return inventoryItems.filter((i) => i.quantityOnHand <= i.reorderPoint)
}

export function getCriticalStockItems(): InventoryItem[] {
  return inventoryItems.filter((i) => i.quantityOnHand <= i.safetyStock)
}
