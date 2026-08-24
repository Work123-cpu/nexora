export type MaterialCategory = 'agricultural' | 'metal' | 'mineral' | 'chemical' | 'industrial' | 'specialty' | 'unclassified'
export type DataMode = 'pending' | 'real_price' | 'indicator_only'
export type PriceTrend = 'rising' | 'stable' | 'falling'
export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface MaterialForecast {
  projectedPrice: number
  lowerBound: number
  upperBound: number
  horizonDays: number
  confidenceScore: number
}

/** One card's worth of data on the Market Intelligence page — one row per raw material, fetched
 * automatically with no manual material selection. Every nullable field really can be null: a
 * brand-new material not yet classified, or a REAL_PRICE material without enough history to
 * forecast — never a fabricated stand-in value. */
export interface MaterialIntelligence {
  rawMaterialId: string
  materialName: string
  category: MaterialCategory
  dataMode: DataMode
  currentPrice: number | null
  unit: string | null
  source: string | null
  market: string | null
  changePct1d: number | null
  changePct7d: number | null
  changePct30d: number | null
  trend: PriceTrend | null
  confidenceLevel: ConfidenceLevel | null
  forecast: MaterialForecast | null
  lastUpdated: string | null
  isEstimate: boolean
}
