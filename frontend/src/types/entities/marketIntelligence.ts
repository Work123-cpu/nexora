export type MarketIndicatorCategory =
  | 'commodity'
  | 'fuel'
  | 'exchange-rate'
  | 'inflation'
  | 'global-event'
  | 'supply-chain-risk'

export type MarketImpactLevel = 'none' | 'low' | 'medium' | 'high'

export interface MarketIndicator {
  id: string
  category: MarketIndicatorCategory
  name: string
  value: number
  unit: string
  changePct: number
  relatedRawMaterialIds: string[]
  impactLevel: MarketImpactLevel
  summary: string
  updatedAt: string
  history: number[]
  /** True when value/changePct/history came from a real API call this session, not the static seed. */
  isLive?: boolean
}
