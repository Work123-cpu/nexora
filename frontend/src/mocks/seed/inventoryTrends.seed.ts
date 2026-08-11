import { createSeededRandom, seededFloat } from '../generators/seedRandom'
import { inventoryItems } from './inventory.seed'

const rand = createSeededRandom(7007)

export interface TrendPoint {
  date: string
  quantity: number
}

export interface InventoryTrend {
  inventoryItemId: string
  itemName: string
  points: TrendPoint[]
}

const TREND_DAYS = 90

function buildTrend(itemId: string, itemName: string, endQuantity: number, volatility: number): InventoryTrend {
  const points: TrendPoint[] = []
  let quantity = endQuantity * seededFloat(rand, 1.15, 1.5)

  for (let day = TREND_DAYS; day >= 0; day--) {
    const drift = (endQuantity - quantity) / (day + 1)
    quantity = Math.max(0, quantity + drift + seededFloat(rand, -volatility, volatility))
    const date = new Date()
    date.setDate(date.getDate() - day)
    points.push({ date: date.toISOString().slice(0, 10), quantity: Math.round(quantity) })
  }
  // Ensure the series actually ends near current on-hand quantity for consistency.
  points[points.length - 1]!.quantity = Math.round(endQuantity)
  return { inventoryItemId: itemId, itemName, points }
}

const TRACKED_ITEM_COUNT = 12

export const inventoryTrends: InventoryTrend[] = inventoryItems
  .slice()
  .sort((a, b) => b.avgDailyUsage - a.avgDailyUsage)
  .slice(0, TRACKED_ITEM_COUNT)
  .map((item) => buildTrend(item.id, item.itemName, item.quantityOnHand, Math.max(2, item.avgDailyUsage * 0.4)))

export function getTrendForItem(inventoryItemId: string): InventoryTrend | undefined {
  return inventoryTrends.find((t) => t.inventoryItemId === inventoryItemId)
}
