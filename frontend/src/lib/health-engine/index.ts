import type { BusinessHealth, HealthCategory, HealthStatus } from './types'
import type { InventoryItem } from '@/types/entities/inventory'
import type { Vendor } from '@/types/entities/vendor'
import type { PurchaseOrder } from '@/types/entities/purchaseOrder'
import type { LiveMarketSignal } from '@/shared/hooks/useLiveMarketSignals'

export * from './types'

export interface BusinessHealthInputs {
  inventoryItems: InventoryItem[]
  vendors: Vendor[]
  purchaseOrders: PurchaseOrder[]
  marketSignals: LiveMarketSignal[]
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

function computeForecastHealth(inventoryItems: InventoryItem[]): HealthCategory {
  const lowStockCount = inventoryItems.filter((i) => i.quantityOnHand <= i.reorderPoint).length
  const score = Math.max(45, Math.round(92 - lowStockCount * 1.4))

  return {
    key: 'forecast',
    label: 'Forecast Health',
    score,
    status: statusForScore(score),
    summary: 'Forecasts use ML models trained on synthetic category data, scaled to your own products (no real sales history exists yet).',
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

// TODO(backend): once MySQL/Spring Boot exist, replace with real query latency,
// connection pool, and replication health checks. Mocked as healthy for this milestone.
function computeDatabaseHealth(): HealthCategory {
  return {
    key: 'database',
    label: 'Database Health',
    score: 98,
    status: 'excellent',
    summary: 'Mocked — will report real query latency and connection health once the backend database is connected.',
  }
}

// TODO(backend): once the billing integration (18_BILLING_INTEGRATION.md) exists,
// replace with real sync status / webhook health. Mocked as healthy for this milestone.
function computeBillingHealth(): HealthCategory {
  return {
    key: 'billing',
    label: 'Billing Health',
    score: 95,
    status: 'excellent',
    summary: 'Mocked — will report real billing sync status once a billing integration is connected.',
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
  const { inventoryItems, vendors, purchaseOrders, marketSignals } = inputs
  const categories = [
    computeInventoryHealth(inventoryItems),
    computeSupplierHealth(vendors),
    computeProcurementHealth(purchaseOrders),
    computeForecastHealth(inventoryItems),
    computeMarketRiskHealth(marketSignals),
    computeDatabaseHealth(),
    computeBillingHealth(),
  ]
  const overallScore = Math.round(categories.reduce((sum, c) => sum + c.score, 0) / categories.length)

  return {
    overallScore,
    status: statusForScore(overallScore),
    categories,
    generatedAt: new Date().toISOString(),
  }
}
