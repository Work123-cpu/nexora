import type { BusinessHealth, HealthCategory, HealthStatus } from './types'
import type { InventoryItem } from '@/types/entities/inventory'
import type { Vendor } from '@/types/entities/vendor'
import type { PurchaseOrder } from '@/types/entities/purchaseOrder'
import type { Bill } from '@/types/entities/bill'
import type { Product } from '@/types/entities/product'
import type { LiveMarketSignal } from '@/shared/hooks/useLiveMarketSignals'
import { computeDailySalesHistory } from '@/lib/salesHistory/computeSalesHistory'

/** Matches the ai-service's MIN_HISTORY_WINDOW and computeDailySalesHistory's own default — a
 * product only counts as forecastable from real data once this many real calendar days have
 * elapsed since its first bill. */
const FORECAST_MIN_HISTORY_DAYS = 10

export * from './types'

/** Real measured DB round-trip from GET /api/system/health (field names match
 * SystemHealthResponse on the backend exactly — apiClient does no runtime validation, so a
 * mismatch here would silently read undefined instead of failing loudly). Null while that
 * request hasn't resolved yet (not the same as an empty-but-legitimate list, so it scores
 * differently below). */
export interface SystemHealthSignal {
  databaseHealthy: boolean
  databaseLatencyMs: number
}

export interface BusinessHealthInputs {
  inventoryItems: InventoryItem[]
  vendors: Vendor[]
  purchaseOrders: PurchaseOrder[]
  marketSignals: LiveMarketSignal[]
  bills: Bill[]
  products: Product[]
  systemHealth: SystemHealthSignal | null
}

function statusForScore(score: number): HealthStatus {
  if (score >= 88) return 'excellent'
  if (score >= 72) return 'good'
  if (score >= 55) return 'fair'
  return 'poor'
}

function computeInventoryHealth(inventoryItems: InventoryItem[]): HealthCategory {
  const critical = inventoryItems.filter((i) => i.quantityOnHand <= i.safetyStock).length
  const low = inventoryItems.filter((i) => i.quantityOnHand > i.safetyStock && i.quantityOnHand <= i.reorderPoint).length
  const total = Math.max(inventoryItems.length, 1)
  const score = inventoryItems.length === 0 ? 100 : Math.max(30, Math.round(100 - (critical / total) * 140 - (low / total) * 45))

  return {
    key: 'inventory',
    label: 'Inventory Health',
    score,
    status: statusForScore(score),
    summary:
      inventoryItems.length === 0
        ? 'No inventory tracked yet — add stock to your warehouses to see a real health score.'
        : critical > 0
          ? `${critical} item(s) below safety stock and ${low} approaching reorder point.`
          : `${low} item(s) approaching reorder point; no critical shortages.`,
  }
}

function computeSupplierHealth(vendors: Vendor[]): HealthCategory {
  const activeVendors = vendors.filter((v) => v.status !== 'inactive')
  if (activeVendors.length === 0) {
    return {
      key: 'supplier',
      label: 'Supplier Health',
      score: 100,
      status: 'excellent',
      summary: 'No active vendors yet — add vendors to track delivery and quality performance.',
    }
  }
  const avgOnTime = activeVendors.reduce((sum, v) => sum + v.onTimeDeliveryPct, 0) / activeVendors.length
  const avgQuality = activeVendors.reduce((sum, v) => sum + v.qualityScorePct, 0) / activeVendors.length
  const underReview = vendors.filter((v) => v.status === 'under-review').length
  const score = Math.max(30, Math.round((avgOnTime + avgQuality) / 2 - underReview * 6))

  return {
    key: 'supplier',
    label: 'Supplier Health',
    score,
    status: statusForScore(score),
    summary: `Average on-time delivery ${avgOnTime.toFixed(0)}%, quality score ${avgQuality.toFixed(0)}%${underReview > 0 ? `, ${underReview} vendor(s) under review` : ''}.`,
  }
}

/** Real forecast quality is about how much of the ML forecast is grounded in this company's own
 * sales rather than a category-level estimate — same real-history check the Forecast Report page
 * uses per product (computeDailySalesHistory), not a stand-in metric borrowed from another
 * category. */
function computeForecastHealth(products: Product[], bills: Bill[]): HealthCategory {
  const activeProducts = products.filter((p) => p.status === 'active')
  const total = activeProducts.length

  if (total === 0) {
    return {
      key: 'forecast',
      label: 'Forecast Health',
      score: 100,
      status: 'excellent',
      summary: 'No active products yet — forecasts will use category-level estimates once you start selling.',
    }
  }

  const realCount = activeProducts.filter((p) => computeDailySalesHistory(bills, p.id, FORECAST_MIN_HISTORY_DAYS) !== undefined).length
  const score = Math.round(60 + 36 * (realCount / total))

  return {
    key: 'forecast',
    label: 'Forecast Health',
    score,
    status: statusForScore(score),
    summary:
      realCount === 0
        ? `0 of ${total} product(s) have ${FORECAST_MIN_HISTORY_DAYS}+ days of real sales history yet — forecasts use a category-level estimate until then.`
        : realCount === total
          ? `All ${total} product(s) are forecast from your own real sales history.`
          : `${realCount} of ${total} product(s) are forecast from your own real sales history; the rest use a category-level estimate.`,
  }
}

function computeProcurementHealth(purchaseOrders: PurchaseOrder[]): HealthCategory {
  if (purchaseOrders.length === 0) {
    return {
      key: 'procurement',
      label: 'Procurement Health',
      score: 100,
      status: 'excellent',
      summary: 'No purchase orders yet.',
    }
  }
  const pending = purchaseOrders.filter((po) => po.status === 'pending_approval').length
  const cancelled = purchaseOrders.filter((po) => po.status === 'cancelled').length
  const score = Math.max(40, Math.round(95 - pending * 2.5 - cancelled * 1.5))

  return {
    key: 'procurement',
    label: 'Procurement Health',
    score,
    status: statusForScore(score),
    summary: `${pending} purchase order(s) awaiting approval; ${cancelled} cancelled in recent history.`,
  }
}

/** Scored from a real round-trip against the backend's DB connection pool (GET
 * /api/system/health), not a mock — see SystemHealthController on the backend. */
function computeDatabaseHealth(system: SystemHealthSignal | null): HealthCategory {
  if (!system) {
    return {
      key: 'database',
      label: 'Database Health',
      score: 50,
      status: statusForScore(50),
      summary: 'Waiting on a response from the backend to measure database health.',
    }
  }
  if (!system.databaseHealthy) {
    return {
      key: 'database',
      label: 'Database Health',
      score: 20,
      status: statusForScore(20),
      summary: 'The backend could not validate its database connection.',
    }
  }
  const score = Math.max(40, Math.round(100 - system.databaseLatencyMs * 0.5))
  return {
    key: 'database',
    label: 'Database Health',
    score,
    status: statusForScore(score),
    summary: `Database connection validated in ${system.databaseLatencyMs}ms.`,
  }
}

/** Scored from this company's real bills — "billing" here is the sales-invoice feature
 * (Bill/BillLineItem), not a third-party payment processor. A high cancellation rate is the
 * clearest available signal that something's off in the billing flow. */
function computeBillingHealth(bills: Bill[]): HealthCategory {
  if (bills.length === 0) {
    return {
      key: 'billing',
      label: 'Billing Health',
      score: 100,
      status: 'excellent',
      summary: 'No bills recorded yet.',
    }
  }
  const cancelled = bills.filter((b) => b.status === 'cancelled').length
  const cancelledPct = (cancelled / bills.length) * 100
  const score = Math.max(35, Math.round(98 - cancelledPct * 0.7))
  return {
    key: 'billing',
    label: 'Billing Health',
    score,
    status: statusForScore(score),
    summary: `${bills.length} bill(s) recorded; ${cancelled} cancelled (${cancelledPct.toFixed(0)}%).`,
  }
}

function computeMarketRiskHealth(marketSignals: LiveMarketSignal[]): HealthCategory {
  const highMove = marketSignals.filter((s) => Math.abs(s.changePct) >= 6).length
  const total = marketSignals.length
  const score = total === 0 ? 100 : Math.max(50, Math.round(94 - highMove * 8 - (total - highMove) * 3))

  return {
    key: 'market',
    label: 'Market Risk',
    score,
    status: statusForScore(score),
    summary:
      total > 0
        ? `${total} live market indicator(s) tracked for your raw materials, ${highMove} showing a significant price move.`
        : 'No live market data tracked yet — add a free Alpha Vantage key in Settings to enable this.',
  }
}

export function computeBusinessHealth(inputs: BusinessHealthInputs): BusinessHealth {
  const { inventoryItems, vendors, purchaseOrders, marketSignals, bills, products, systemHealth } = inputs
  const categories = [
    computeInventoryHealth(inventoryItems),
    computeSupplierHealth(vendors),
    computeProcurementHealth(purchaseOrders),
    computeForecastHealth(products, bills),
    computeMarketRiskHealth(marketSignals),
    computeDatabaseHealth(systemHealth),
    computeBillingHealth(bills),
  ]
  const overallScore = Math.round(categories.reduce((sum, c) => sum + c.score, 0) / categories.length)

  return {
    overallScore,
    status: statusForScore(overallScore),
    categories,
    generatedAt: new Date().toISOString(),
  }
}
