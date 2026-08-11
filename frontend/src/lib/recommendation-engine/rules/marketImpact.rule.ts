import type { AIRecommendation } from '../types'
import type { RawMaterial } from '@/types/entities/rawMaterial'
import type { LiveMarketSignal } from '@/shared/hooks/useLiveMarketSignals'

const SIGNIFICANT_MOVE_PCT = 2
const HIGH_MOVE_PCT = 6

/**
 * Only flags real, live commodity price moves (see useLiveMarketSignals) against materials
 * this company actually has — no signal, no key configured, or too small a move all correctly
 * produce zero recommendations rather than a fabricated one.
 */
export function computeMarketImpactRecommendations(rawMaterials: RawMaterial[], signals: LiveMarketSignal[]): AIRecommendation[] {
  return signals
    .filter((s) => Math.abs(s.changePct) >= SIGNIFICANT_MOVE_PCT)
    .map((s): AIRecommendation => {
      const severity: AIRecommendation['severity'] = Math.abs(s.changePct) >= HIGH_MOVE_PCT ? 'high' : 'medium'
      const rising = s.changePct >= 0
      const primaryMaterial = rawMaterials.find((rm) => s.matchedMaterials.includes(rm.name))

      return {
        id: `rec-market-${s.name.toLowerCase().replace(/\s+/g, '-')}`,
        category: 'market-impact',
        severity,
        title: `Market impact: ${s.name}`,
        reason: `${s.name} has ${rising ? 'risen' : 'fallen'} ${Math.abs(s.changePct)}% in the latest live reading. This affects: ${s.matchedMaterials.join(', ')}.`,
        confidenceScore: 90,
        businessImpact: rising
          ? severity === 'high'
            ? 'Material costs likely to rise significantly in the near term.'
            : 'Modest cost pressure on affected materials.'
          : 'An opportunity to secure lower-cost inventory before prices recover.',
        expectedBenefit: rising
          ? 'Locking in current pricing or securing alternate sourcing now can reduce future cost exposure.'
          : 'Purchasing now, while prices are down, can lower landed cost for upcoming production runs.',
        risks: rising ? ['Rising input costs', 'Potential margin compression if pricing is not adjusted'] : ['Price could reverse before you act'],
        suggestedAction: rising ? 'Review sourcing and consider forward purchasing' : 'Consider timing purchases to take advantage of the lower price',
        entityType: 'rawMaterial',
        entityId: primaryMaterial?.id ?? '',
        entityName: primaryMaterial?.name ?? s.matchedMaterials[0] ?? s.name,
        createdAt: new Date().toISOString(),
      } satisfies AIRecommendation
    })
}
