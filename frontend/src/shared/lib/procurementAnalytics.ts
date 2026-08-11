import type { PurchaseOrder } from '@/types/entities/purchaseOrder'
import type { RawMaterial } from '@/types/entities/rawMaterial'

/**
 * This platform tracks procurement (money spent on purchase orders), not sales —
 * there is no Sales/Revenue entity anywhere in the real backend. These helpers
 * compute real spend analytics from actual purchase orders, replacing the
 * fabricated "Revenue" mock data that previously stood in for it.
 */

function withinDays(dateIso: string, days: number): boolean {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return new Date(dateIso).getTime() >= cutoff
}

export function getTotalSpend(purchaseOrders: PurchaseOrder[], days = 30): number {
  return purchaseOrders.filter((po) => withinDays(po.createdAt, days)).reduce((sum, po) => sum + po.totalAmount, 0)
}

export function getOrderCount(purchaseOrders: PurchaseOrder[], days = 30): number {
  return purchaseOrders.filter((po) => withinDays(po.createdAt, days)).length
}

/** Compares spend in the most recent half of the window against the prior half. */
export function getSpendChangePct(purchaseOrders: PurchaseOrder[], days = 30): number {
  const now = Date.now()
  const halfMs = (days / 2) * 24 * 60 * 60 * 1000
  const recentCutoff = now - halfMs
  const priorCutoff = now - days * 24 * 60 * 60 * 1000

  const recent = purchaseOrders.filter((po) => new Date(po.createdAt).getTime() >= recentCutoff).reduce((sum, po) => sum + po.totalAmount, 0)
  const prior = purchaseOrders
    .filter((po) => {
      const t = new Date(po.createdAt).getTime()
      return t >= priorCutoff && t < recentCutoff
    })
    .reduce((sum, po) => sum + po.totalAmount, 0)

  if (prior === 0) return recent > 0 ? 100 : 0
  return Number((((recent - prior) / prior) * 100).toFixed(1))
}

export interface SpendPoint {
  date: string
  spend: number
}

/** Daily spend for the trailing N days — sparse (zero on days with no PO), unlike synthetic revenue data. */
export function getDailySpend(purchaseOrders: PurchaseOrder[], days = 30): SpendPoint[] {
  const byDate = new Map<string, number>()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    byDate.set(d.toISOString().slice(0, 10), 0)
  }
  for (const po of purchaseOrders) {
    const key = po.createdAt.slice(0, 10)
    if (byDate.has(key)) byDate.set(key, (byDate.get(key) ?? 0) + po.totalAmount)
  }
  return Array.from(byDate.entries()).map(([date, spend]) => ({ date, spend }))
}

export interface CategorySpend {
  name: string
  value: number
}

export function getSpendByMaterialCategory(purchaseOrders: PurchaseOrder[], rawMaterials: RawMaterial[]): CategorySpend[] {
  const categoryById = new Map(rawMaterials.map((rm) => [rm.id, rm.category]))
  const totals = new Map<string, number>()

  for (const po of purchaseOrders) {
    for (const line of po.items) {
      const category = categoryById.get(line.rawMaterialId) ?? 'Other'
      totals.set(category, (totals.get(category) ?? 0) + line.quantity * line.unitCost)
    }
  }

  return Array.from(totals.entries())
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)
}
