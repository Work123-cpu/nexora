/**
 * Real, live exchange rates from the Frankfurter API (ECB reference rates) — free, no API
 * key, CORS-open. Everything else on the Market Intelligence page (commodities, fuel,
 * inflation, global events, supply-chain risk) stays simulated: there's no free/keyless
 * real-time source for those, so pretending otherwise would be dishonest. See marketIntelligence.seed.ts.
 */

const API_BASE = 'https://api.frankfurter.dev/v1'

export interface LiveRate {
  rate: number
  changePct: number
  history: number[]
  asOf: string
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

async function fetchPairHistory(from: string, to: string, days = 14): Promise<LiveRate | null> {
  try {
    const end = new Date()
    const start = new Date(end)
    start.setDate(start.getDate() - (days - 1))

    const res = await fetch(`${API_BASE}/${isoDate(start)}..${isoDate(end)}?from=${from}&to=${to}`)
    if (!res.ok) return null

    const data = (await res.json()) as { rates: Record<string, Record<string, number>> }
    const dates = Object.keys(data.rates).sort()
    if (dates.length === 0) return null

    const history = dates.map((d) => data.rates[d]![to]!)
    const rate = history[history.length - 1]!
    const prev = history.length > 1 ? history[history.length - 2]! : rate
    const changePct = prev ? Number((((rate - prev) / prev) * 100).toFixed(2)) : 0

    return { rate: Number(rate.toFixed(2)), changePct, history, asOf: dates[dates.length - 1]! }
  } catch {
    return null
  }
}

/** Keyed by the exact indicator `name` used in marketIntelligence.seed.ts, for a direct merge. */
export async function fetchLiveExchangeRates(): Promise<Record<string, LiveRate>> {
  const [usdInr, eurInr] = await Promise.all([fetchPairHistory('USD', 'INR'), fetchPairHistory('EUR', 'INR')])
  const out: Record<string, LiveRate> = {}
  if (usdInr) out['USD / INR'] = usdInr
  if (eurInr) out['EUR / INR'] = eurInr
  return out
}
