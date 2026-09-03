import { useMemo, useState } from 'react'
import { Info, Sparkles } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { StatCard } from '@/shared/ui/StatCard'
import { Reveal } from '@/shared/ui/Reveal'
import { Select } from '@/shared/ui/Select'
import { Badge, type BadgeTone } from '@/shared/ui/Badge'
import { AreaChartCard } from '@/shared/ui/charts/AreaChartCard'
import { DataTable, type DataTableColumn } from '@/shared/ui/DataTable'
import { Skeleton } from '@/shared/ui/Skeleton'
import { formatNumber } from '@/shared/lib/formatters'
import { useProducts } from '@/features/products/hooks/useProducts'
import { useInventoryItems } from '@/features/inventory/hooks/useInventory'
import { useBills } from '@/features/billing/hooks/useBills'
import type { ForecastGranularity, ForecastResponse } from '@/services/forecast'
import { useProductForecasts } from '../hooks/useForecast'
import { computeDailySalesHistory } from '@/lib/salesHistory/computeSalesHistory'
import { ExportMenu } from './ExportMenu'

const GRANULARITY_OPTIONS: { label: string; value: ForecastGranularity }[] = [
  { label: 'Daily', value: 'day' },
  { label: 'Weekly', value: 'week' },
  { label: 'Monthly', value: 'month' },
  { label: 'Quarterly', value: 'quarter' },
]

const MODEL_LABEL: Record<ForecastResponse['modelUsed'], string> = {
  xgboost: 'XGBoost',
  random_forest: 'Random Forest',
  naive_projection: 'Naive Projection',
}

const MODEL_TONE: Record<ForecastResponse['modelUsed'], BadgeTone> = {
  xgboost: 'primary',
  random_forest: 'info',
  naive_projection: 'neutral',
}

interface ForecastRow {
  productId: string
  product: string
  currentStock: number
  coverageDays: number
}

const TREND_HORIZON = 8

export function ForecastReport() {
  const [granularity, setGranularity] = useState<ForecastGranularity>('week')
  const { data: productsData } = useProducts({ pageSize: 10000 })
  const { data: inventoryData } = useInventoryItems({ pageSize: 10000 })
  const { data: billsData } = useBills({ pageSize: 10000 })
  const getInventoryByItemId = (id: string) => inventoryData?.items.find((i) => i.itemId === id)

  const trackedProducts = useMemo(() => (productsData?.items ?? []).filter((p) => p.status === 'active').slice(0, 10), [productsData])

  const forecastRequests = useMemo(
    () =>
      trackedProducts.map((p) => {
        const inv = getInventoryByItemId(p.id)
        return {
          productId: p.id,
          productName: p.name,
          category: p.category,
          unitPrice: p.unitPrice,
          avgDailyUsage: inv?.avgDailyUsage ?? 1,
          granularity,
          horizon: 1,
          recentSalesHistory: computeDailySalesHistory(billsData?.items ?? [], p.id),
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trackedProducts, granularity, inventoryData, billsData],
  )
  const trendRequests = useMemo(
    () => forecastRequests.map((r) => ({ ...r, horizon: TREND_HORIZON })),
    [forecastRequests],
  )

  const forecastResults = useProductForecasts(forecastRequests)
  const trendResults = useProductForecasts(trendRequests)

  const chartData = Array.from({ length: TREND_HORIZON }).map((_, periodIndex) => {
    const total = trendResults.reduce((sum, r) => sum + (r.data?.points[periodIndex]?.predictedUnits ?? 0), 0)
    const label = trendResults.find((r) => r.data?.points[periodIndex])?.data?.points[periodIndex]?.periodLabel ?? `Period ${periodIndex + 1}`
    return { date: label, demand: Math.round(total) }
  })
  const avgProjectedDemand = Math.round(chartData.reduce((sum, p) => sum + p.demand, 0) / Math.max(chartData.length, 1))

  const rows: ForecastRow[] = trackedProducts.map((p) => {
    const inv = getInventoryByItemId(p.id)
    const avgDailyUsage = inv?.avgDailyUsage ?? 0
    return {
      productId: p.id,
      product: p.name,
      currentStock: inv?.quantityOnHand ?? 0,
      coverageDays: avgDailyUsage > 0 ? Math.round((inv?.quantityOnHand ?? 0) / avgDailyUsage) : 0,
    }
  })

  const allLoaded = forecastResults.length > 0 && forecastResults.every((r) => r.data)
  const anyNaive = forecastResults.some((r) => r.data?.modelUsed === 'naive_projection')
  const anyDegraded = forecastResults.some((r) => r.data?.degraded)
  const realHistoryCount = forecastResults.filter((r) => r.data && r.data.isSynthetic === false).length
  const totalProjected = allLoaded
    ? forecastResults.reduce((sum, r) => sum + (r.data?.points[0]?.predictedUnits ?? 0), 0)
    : undefined
  const avgConfidence = allLoaded
    ? forecastResults.reduce((sum, r) => sum + (r.data?.confidence ?? 0), 0) / forecastResults.length
    : undefined

  const exportRows = trackedProducts.map((p, i) => ({
    product: p.name,
    projectedDemand: forecastResults[i]?.data?.points[0]?.predictedUnits ?? '',
    model: forecastResults[i]?.data ? MODEL_LABEL[forecastResults[i]!.data!.modelUsed] : '',
    currentStock: rows[i]?.currentStock,
    coverageDays: rows[i]?.coverageDays,
  }))

  const columns: DataTableColumn<ForecastRow>[] = [
    { key: 'product', header: 'Product', render: (r) => r.product },
    {
      key: 'projectedDemand',
      header: `Projected Demand (${GRANULARITY_OPTIONS.find((g) => g.value === granularity)?.label})`,
      render: (r) => {
        const idx = trackedProducts.findIndex((p) => p.id === r.productId)
        const result = forecastResults[idx]
        if (!result?.data) return <Skeleton className="h-4 w-16" />
        return formatNumber(result.data.points[0]?.predictedUnits ?? 0)
      },
    },
    {
      key: 'model',
      header: 'Model',
      render: (r) => {
        const idx = trackedProducts.findIndex((p) => p.id === r.productId)
        const result = forecastResults[idx]
        if (!result?.data) return <Skeleton className="h-5 w-20" />
        return (
          <Badge tone={MODEL_TONE[result.data.modelUsed]}>
            {MODEL_LABEL[result.data.modelUsed]}
            {result.data.degraded ? ' (fallback)' : ''}
          </Badge>
        )
      },
    },
    { key: 'currentStock', header: 'Current Stock', render: (r) => formatNumber(r.currentStock) },
    { key: 'coverageDays', header: 'Days of Coverage', render: (r) => `${r.coverageDays} days` },
  ]

  const bannerText = anyNaive
    ? anyDegraded
      ? 'The forecasting service is currently unreachable — showing a simple avg-usage projection as a fallback until it recovers.'
      : 'Running in mock mode (VITE_USE_MOCK_FORECAST=true) — showing a simple avg-usage projection instead of live ML models.'
    : `Forecasts are produced by genuinely-trained XGBoost / Random Forest models${
        avgConfidence !== undefined ? ` (avg. confidence ${(avgConfidence * 100).toFixed(0)}%)` : ''
      }. ${
        realHistoryCount === 0
          ? "None of these products have 10 days of real sales history yet, so they're forecast from a category-level estimate — this becomes your own data automatically once enough bills accumulate."
          : realHistoryCount === trackedProducts.length
            ? 'Every one of these forecasts is built from your own real sales history.'
            : `${realHistoryCount} of ${trackedProducts.length} products are forecast from your own real sales history; the rest use a category-level estimate until they build up 10 days of sales.`
      }`

  return (
    <div className="space-y-6">
      <PageHeader
        title="Forecast Report"
        description="ML-based demand projections per product, with historical order trends for context."
        actions={
          <div className="flex items-center gap-2">
            <Select
              options={GRANULARITY_OPTIONS}
              value={granularity}
              onChange={(e) => setGranularity(e.target.value as ForecastGranularity)}
              className="h-9 w-32 text-sm"
            />
            <ExportMenu filename="forecast-report" rows={exportRows} />
          </div>
        }
      />

      <div className="flex items-start gap-2 rounded-xl border border-info/30 bg-info-soft p-4 text-sm text-foreground">
        {anyNaive ? <Info className="mt-0.5 size-4 shrink-0 text-info" /> : <Sparkles className="mt-0.5 size-4 shrink-0 text-info" />}
        <p>{bannerText}</p>
      </div>

      <Reveal>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard label="Avg Projected Demand / Period" value={formatNumber(avgProjectedDemand)} tone="primary" />
          <StatCard
            label={`Total Projected Demand (Next ${GRANULARITY_OPTIONS.find((g) => g.value === granularity)?.label})`}
            value={totalProjected !== undefined ? formatNumber(Math.round(totalProjected)) : '…'}
            tone="info"
          />
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <AreaChartCard
          title="Projected Demand Trend"
          description={`Next ${TREND_HORIZON} periods, summed across tracked products`}
          data={chartData}
          xKey="date"
          areaKey="demand"
          label="Projected units"
          colorIndex={1}
        />
      </Reveal>

      <Reveal delay={0.1}>
        <div>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Product-Level Demand Projection</h2>
          <DataTable columns={columns} data={rows} rowKey={(r) => r.productId} />
        </div>
      </Reveal>
    </div>
  )
}
