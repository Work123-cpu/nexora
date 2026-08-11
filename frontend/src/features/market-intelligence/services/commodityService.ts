/**
 * Live commodity/fuel prices via Alpha Vantage's free commodities API — matched dynamically
 * to whatever raw materials the signed-in company actually has, instead of a fixed list
 * built around one industry (the old seed data assumed a bakery). A fireworks company's
 * potassium nitrate won't match anything here — there's no free exchange-traded price feed
 * for it — and that's shown honestly as "not tracked," not faked.
 */

const API_BASE = 'https://www.alphavantage.co/query'
const CACHE_PREFIX = 'nexora.commodity-cache.'
const CACHE_TTL_MS = 20 * 60 * 60 * 1000 // Alpha Vantage free tier is 25 req/day — cache generously.

export interface CommodityDef {
  function: string
  label: string
  unit: string
  interval: 'daily' | 'weekly' | 'monthly'
  keywords: string[]
}

export const TRACKED_COMMODITIES: CommodityDef[] = [
  { function: 'WTI', label: 'Crude Oil (WTI)', unit: 'USD / barrel', interval: 'daily', keywords: ['crude oil', 'petroleum', 'wti'] },
  { function: 'BRENT', label: 'Crude Oil (Brent)', unit: 'USD / barrel', interval: 'daily', keywords: ['diesel', 'fuel', 'brent', 'plastic', 'packaging film', 'resin', 'polymer'] },
  { function: 'NATURAL_GAS', label: 'Natural Gas', unit: 'USD / MMBtu', interval: 'daily', keywords: ['natural gas', 'lpg', 'propane', 'gas'] },
  { function: 'COPPER', label: 'Copper', unit: 'USD / metric ton', interval: 'monthly', keywords: ['copper', 'wire', 'cable'] },
  { function: 'ALUMINUM', label: 'Aluminum', unit: 'USD / metric ton', interval: 'monthly', keywords: ['aluminum', 'aluminium', 'foil'] },
  { function: 'WHEAT', label: 'Wheat', unit: 'USD / metric ton', interval: 'monthly', keywords: ['wheat', 'flour', 'atta'] },
  { function: 'CORN', label: 'Corn', unit: 'USD / metric ton', interval: 'monthly', keywords: ['corn', 'maize'] },
  { function: 'COTTON', label: 'Cotton', unit: 'USD / lb', interval: 'monthly', keywords: ['cotton', 'fabric', 'textile', 'yarn'] },
  { function: 'SUGAR', label: 'Sugar', unit: 'USD / lb', interval: 'monthly', keywords: ['sugar'] },
  { function: 'COFFEE', label: 'Coffee', unit: 'USD / lb', interval: 'monthly', keywords: ['coffee'] },
]

export interface LiveCommodity {
  def: CommodityDef
  value: number
  changePct: number
  history: number[]
  asOf: string
  matchedMaterials: string[]
}

/** Matches each raw material name to the closest tracked commodity, if any. Multiple materials
 * can share one commodity (e.g. two aluminum-based materials both map to "Aluminum"). */
export function matchCommodities(rawMaterialNames: string[]): { def: CommodityDef; matchedMaterials: string[] }[] {
  const matches: { def: CommodityDef; matchedMaterials: string[] }[] = []
  for (const def of TRACKED_COMMODITIES) {
    const matched = rawMaterialNames.filter((name) => def.keywords.some((kw) => name.toLowerCase().includes(kw)))
    if (matched.length > 0) matches.push({ def, matchedMaterials: matched })
  }
  return matches
}

interface CacheEntry {
  value: number
  changePct: number
  history: number[]
  asOf: string
  cachedAt: number
}

function readCache(fn: string): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + fn)
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry
    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) return null
    return entry
  } catch {
    return null
  }
}

function writeCache(fn: string, entry: Omit<CacheEntry, 'cachedAt'>): void {
  try {
    localStorage.setItem(CACHE_PREFIX + fn, JSON.stringify({ ...entry, cachedAt: Date.now() }))
  } catch {
    // localStorage full or unavailable — live data still works, just re-fetches next time.
  }
}

async function fetchOne(def: CommodityDef, apiKey: string): Promise<Omit<CacheEntry, 'cachedAt'> | null> {
  const cached = readCache(def.function)
  if (cached) return cached

  try {
    const res = await fetch(`${API_BASE}?function=${def.function}&interval=${def.interval}&apikey=${apiKey}`)
    if (!res.ok) return null
    const data = (await res.json()) as { data?: { date: string; value: string }[]; Note?: string; Information?: string }
    if (!data.data || data.data.length === 0) return null

    // Alpha Vantage returns newest-first with occasional "." placeholder values for gaps.
    const points = data.data.filter((p) => p.value !== '.').slice(0, 14).reverse()
    if (points.length === 0) return null

    const history = points.map((p) => Number(p.value))
    const value = history[history.length - 1]!
    const prev = history.length > 1 ? history[history.length - 2]! : value
    const changePct = prev ? Number((((value - prev) / prev) * 100).toFixed(2)) : 0
    const asOf = points[points.length - 1]!.date

    const entry = { value: Number(value.toFixed(2)), changePct, history, asOf }
    writeCache(def.function, entry)
    return entry
  } catch {
    return null
  }
}

export async function fetchLiveCommodities(rawMaterialNames: string[], apiKey: string): Promise<LiveCommodity[]> {
  if (!apiKey.trim()) return []
  const matched = matchCommodities(rawMaterialNames)
  const results = await Promise.all(
    matched.map(async ({ def, matchedMaterials }) => {
      const data = await fetchOne(def, apiKey)
      return data ? { def, matchedMaterials, ...data } : null
    }),
  )
  return results.filter((r): r is LiveCommodity => r !== null)
}
