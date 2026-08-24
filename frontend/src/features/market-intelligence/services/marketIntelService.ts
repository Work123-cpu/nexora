import type { MaterialIntelligence } from '@/types/entities/materialIntelligence'
import { apiClient } from '@/shared/lib/apiClient'

interface BackendForecast {
  projectedPrice: number
  lowerBound: number
  upperBound: number
  horizonDays: number
  confidenceScore: number
}

interface BackendMaterialIntelligence {
  rawMaterialId: string
  materialName: string
  category: string
  dataMode: string
  currentPrice: number | null
  unit: string | null
  source: string | null
  market: string | null
  changePct1d: number | null
  changePct7d: number | null
  changePct30d: number | null
  trend: string | null
  confidenceLevel: string | null
  forecast: BackendForecast | null
  lastUpdated: string | null
  isEstimate: boolean
}

function fromBackend(item: BackendMaterialIntelligence): MaterialIntelligence {
  return {
    rawMaterialId: item.rawMaterialId,
    materialName: item.materialName,
    category: item.category as MaterialIntelligence['category'],
    dataMode: item.dataMode as MaterialIntelligence['dataMode'],
    currentPrice: item.currentPrice,
    unit: item.unit,
    source: item.source,
    market: item.market,
    changePct1d: item.changePct1d,
    changePct7d: item.changePct7d,
    changePct30d: item.changePct30d,
    trend: item.trend as MaterialIntelligence['trend'],
    confidenceLevel: item.confidenceLevel as MaterialIntelligence['confidenceLevel'],
    forecast: item.forecast,
    lastUpdated: item.lastUpdated,
    isEstimate: item.isEstimate,
  }
}

export const marketIntelService = {
  // The backend owns classification, routing, fetching, and persistence — this is the only
  // network call the frontend makes for this feature; no client-side API key or fetching logic.
  getMarketIntelligence: (): Promise<MaterialIntelligence[]> =>
    apiClient.get<BackendMaterialIntelligence[]>('/market-intelligence').then((items) => items.map(fromBackend)),

  // Bypasses the once-a-day snapshot cache — for "I just added an API key, check again now"
  // rather than waiting for tomorrow's scheduled refresh.
  refreshMarketIntelligence: (): Promise<MaterialIntelligence[]> =>
    apiClient.post<BackendMaterialIntelligence[]>('/market-intelligence/refresh').then((items) => items.map(fromBackend)),
}
