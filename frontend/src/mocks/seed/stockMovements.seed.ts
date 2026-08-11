import type { StockMovement, StockMovementType } from '@/types/entities/inventory'
import { createSeededRandom, seededFloat, seededInt, seededPick, daysAgoISO } from '../generators/seedRandom'
import { makeIdFactory } from '../generators/idGenerator'
import { inventoryItems } from './inventory.seed'

const rand = createSeededRandom(8008)
const nextId = makeIdFactory('mov')

const OUTBOUND_REASONS = ['Production consumption', 'Order fulfillment', 'Transfer to fulfillment center', 'Sample allocation']
const INBOUND_REASONS = ['Purchase order received', 'Vendor delivery', 'Return from production', 'Inter-warehouse transfer in']
const ADJUSTMENT_REASONS = ['Cycle count correction', 'Damaged goods write-off', 'Expiry write-off', 'System reconciliation']

const MOVEMENT_COUNT = 70

export const stockMovements: StockMovement[] = Array.from({ length: MOVEMENT_COUNT }, () => {
  const item = seededPick(rand, inventoryItems)
  const type: StockMovementType = seededPick(rand, ['outbound', 'outbound', 'outbound', 'inbound', 'inbound', 'adjustment'])
  const reason =
    type === 'outbound' ? seededPick(rand, OUTBOUND_REASONS) : type === 'inbound' ? seededPick(rand, INBOUND_REASONS) : seededPick(rand, ADJUSTMENT_REASONS)
  const quantity = type === 'adjustment' ? seededInt(rand, -40, 40) : Math.round(seededFloat(rand, 5, item.avgDailyUsage * 3))

  return {
    id: nextId(),
    inventoryItemId: item.id,
    itemName: item.itemName,
    type,
    quantity: type === 'outbound' ? -Math.abs(quantity) : quantity,
    date: daysAgoISO(seededInt(rand, 0, 45)),
    reason,
  }
}).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

export function getMovementsForItem(inventoryItemId: string): StockMovement[] {
  return stockMovements.filter((m) => m.inventoryItemId === inventoryItemId)
}
