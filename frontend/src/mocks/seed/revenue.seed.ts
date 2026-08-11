import { createSeededRandom, seededFloat } from '../generators/seedRandom'
import { products, PRODUCT_CATEGORIES } from './products.seed'

const rand = createSeededRandom(13013)

export interface RevenuePoint {
  date: string
  revenue: number
  orders: number
}

const DAYS = 30

function buildDailyRevenue(): RevenuePoint[] {
  const baseRevenue = products.reduce((sum, p) => sum + p.unitPrice, 0) * 8
  const points: RevenuePoint[] = []

  for (let day = DAYS - 1; day >= 0; day--) {
    const date = new Date()
    date.setDate(date.getDate() - day)
    const weekday = date.getDay()
    const weekendBoost = weekday === 0 || weekday === 6 ? 1.18 : 1
    const revenue = Math.round(baseRevenue * weekendBoost * seededFloat(rand, 0.82, 1.22))
    const orders = Math.round(revenue / seededFloat(rand, 1900, 2700))
    points.push({ date: date.toISOString().slice(0, 10), revenue, orders })
  }
  return points
}

export const dailyRevenue: RevenuePoint[] = buildDailyRevenue()

export function getTotalRevenue(days = 30): number {
  return dailyRevenue.slice(-days).reduce((sum, p) => sum + p.revenue, 0)
}

export function getTotalOrders(days = 30): number {
  return dailyRevenue.slice(-days).reduce((sum, p) => sum + p.orders, 0)
}

export function getRevenueChangePct(): number {
  const midpoint = Math.floor(dailyRevenue.length / 2)
  const first = dailyRevenue.slice(0, midpoint).reduce((sum, p) => sum + p.revenue, 0)
  const second = dailyRevenue.slice(midpoint).reduce((sum, p) => sum + p.revenue, 0)
  return Number((((second - first) / first) * 100).toFixed(1))
}

export interface CategoryRevenue {
  name: string
  value: number
}

export const revenueByCategory: CategoryRevenue[] = PRODUCT_CATEGORIES.map((category) => {
  const categoryProducts = products.filter((p) => p.category === category)
  const value = Math.round(categoryProducts.reduce((sum, p) => sum + p.unitPrice, 0) * seededFloat(rand, 180, 260))
  return { name: category, value }
})
