import { Boxes, RefreshCw, Radio, Sparkles, TrendingUp } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { StatCard } from '@/shared/ui/StatCard'
import { Reveal } from '@/shared/ui/Reveal'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Button } from '@/shared/ui/Button'
import { useToast } from '@/shared/ui/Toast'
import { useMaterialIntelligence, useRefreshMaterialIntelligence } from '../hooks/useMaterialIntelligence'
import { MaterialIntelligenceCard } from '../components/MaterialIntelligenceCard'

export function MarketIntelligencePage() {
  const { toast } = useToast()
  const { data: materials, isLoading } = useMaterialIntelligence()
  const refresh = useRefreshMaterialIntelligence()

  const handleRefresh = () => {
    refresh.mutate(undefined, {
      onSuccess: () => toast({ title: 'Market intelligence refreshed', description: 'Re-checked every material against its price source.', tone: 'success' }),
      onError: () => toast({ title: 'Could not refresh', description: 'Please try again in a moment.', tone: 'error' }),
    })
  }

  const realPriceCount = materials?.filter((m) => m.dataMode === 'real_price').length ?? 0
  const estimateCount = materials?.filter((m) => m.isEstimate).length ?? 0
  const risingCount = materials?.filter((m) => m.trend === 'rising').length ?? 0

  return (
    <div>
      <PageHeader
        title="Market Intelligence"
        description="Price intelligence for your own raw materials — automatically classified and sourced from Indian market data where it's available, honest AI estimates where it isn't."
        actions={
          <Button variant="outline" leftIcon={<RefreshCw className="size-4" />} onClick={handleRefresh} isLoading={refresh.isPending}>
            Refresh
          </Button>
        }
      />

      <Reveal>
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Materials Tracked" value={String(materials?.length ?? 0)} icon={<Boxes className="size-5" />} tone="primary" />
          <StatCard label="Real Price Data" value={String(realPriceCount)} icon={<Radio className="size-5" />} tone="info" />
          <StatCard label="Rising Today" value={String(risingCount)} icon={<TrendingUp className="size-5" />} tone="warning" />
        </div>
      </Reveal>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading market intelligence…</p>
      ) : materials && materials.length > 0 ? (
        <Reveal delay={0.05}>
          {estimateCount > 0 && (
            <p className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="size-3.5 text-info" />
              {estimateCount} of {materials.length} material{estimateCount === 1 ? '' : 's'} have no standardized Indian
              price feed — shown as an AI-reasoned estimate instead of a fabricated number.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {materials.map((material) => (
              <MaterialIntelligenceCard key={material.rawMaterialId} material={material} />
            ))}
          </div>
        </Reveal>
      ) : (
        <EmptyState
          icon={<Boxes className="size-5" />}
          title="No raw materials yet"
          description="Add raw materials to your catalog and price intelligence will be tracked here automatically — no setup or selection needed."
        />
      )}
    </div>
  )
}
