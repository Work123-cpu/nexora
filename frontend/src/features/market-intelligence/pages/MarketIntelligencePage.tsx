import { Link } from 'react-router-dom'
import { Globe2, KeyRound, Radio } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { StatCard } from '@/shared/ui/StatCard'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Button } from '@/shared/ui/Button'
import { useRawMaterials } from '@/features/raw-materials/hooks/useRawMaterials'
import { getCompanyConfig } from '@/shared/lib/companyConfig'
import { useLiveExchangeRates } from '../hooks/useLiveExchangeRates'
import { useLiveCommodities } from '../hooks/useLiveCommodities'
import { LiveIndicatorCard } from '../components/LiveIndicatorCard'

export function MarketIntelligencePage() {
  const { data: materialsData } = useRawMaterials({ pageSize: 10000 })
  const materialNames = materialsData?.items.map((m) => m.name) ?? []
  const { alphaVantageApiKey } = getCompanyConfig()

  const { data: liveRates } = useLiveExchangeRates()
  const { data: liveCommodities, isLoading: commoditiesLoading } = useLiveCommodities(materialNames, alphaVantageApiKey)

  const totalTracked = (liveRates ? Object.keys(liveRates).length : 0) + (liveCommodities?.length ?? 0)

  return (
    <div>
      <PageHeader
        title="Market Intelligence"
        description="Live currency rates and commodity prices — matched to your own raw materials, not a fixed industry template."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Live Indicators Tracked" value={String(totalTracked)} icon={<Radio className="size-5" />} tone="primary" />
        <StatCard label="Your Materials Matched" value={String(liveCommodities?.length ?? 0)} icon={<Globe2 className="size-5" />} tone="info" />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Currency</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {liveRates &&
            Object.entries(liveRates).map(([name, rate]) => (
              <LiveIndicatorCard
                key={name}
                name={name}
                value={rate.rate}
                unit="rate"
                changePct={rate.changePct}
                history={rate.history}
                asOf={rate.asOf}
                affects="Any imports invoiced in this currency"
              />
            ))}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Commodities &amp; Fuel</h2>

        {!alphaVantageApiKey.trim() ? (
          <EmptyState
            icon={<KeyRound className="size-5" />}
            title="Add a free Alpha Vantage key to unlock this"
            description="Matches real wheat, sugar, coffee, cotton, copper, aluminum, and energy prices against your own raw materials — no charge, no card required."
            action={
              <Link to="/app/account/settings">
                <Button size="sm">Add key in Settings</Button>
              </Link>
            }
          />
        ) : commoditiesLoading ? (
          <p className="text-sm text-muted-foreground">Checking live prices…</p>
        ) : liveCommodities && liveCommodities.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {liveCommodities.map((c) => (
              <LiveIndicatorCard
                key={c.def.function}
                name={c.def.label}
                value={c.value}
                unit={c.def.unit}
                changePct={c.changePct}
                history={c.history}
                asOf={c.asOf}
                affects={`Affects: ${c.matchedMaterials.join(', ')}`}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Globe2 className="size-5" />}
            title="No tracked commodity matches your raw materials yet"
            description="We track energy (oil, natural gas), base metals (copper, aluminum), and major agricultural commodities (wheat, corn, cotton, sugar, coffee) — the only ones with a free real-time price feed. If none of your raw material names match, honestly, there's nothing real to show for them here rather than a fabricated number."
          />
        )}
      </div>
    </div>
  )
}
