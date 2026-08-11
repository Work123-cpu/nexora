import { useMemo } from 'react'
import { getCompanyConfig } from '@/shared/lib/companyConfig'
import { useLiveCommodities } from '@/features/market-intelligence/hooks/useLiveCommodities'
import type { RawMaterial } from '@/types/entities/rawMaterial'

export interface LiveMarketSignal {
  name: string
  changePct: number
  matchedMaterials: string[]
}

/**
 * The one place Business Health's market-risk score and AI Recommendations' market-impact
 * category get their data — real live commodity prices (Alpha Vantage) matched against this
 * company's actual raw materials, same source as the Market Intelligence page. Previously
 * these two read a hardcoded synthetic seed file directly, which meant they could describe a
 * fabricated price move while the Market Intelligence page showed the real one for the same
 * commodity. No API key or no matches now correctly means no market signal, not a fake one.
 */
export function useLiveMarketSignals(rawMaterials: RawMaterial[]): { signals: LiveMarketSignal[]; isLoading: boolean } {
  const { alphaVantageApiKey } = getCompanyConfig()
  const names = useMemo(() => rawMaterials.map((m) => m.name), [rawMaterials])
  const { data: liveCommodities, isLoading } = useLiveCommodities(names, alphaVantageApiKey)

  const signals = useMemo<LiveMarketSignal[]>(
    () => (liveCommodities ?? []).map((c) => ({ name: c.def.label, changePct: c.changePct, matchedMaterials: c.matchedMaterials })),
    [liveCommodities],
  )

  return { signals, isLoading }
}
