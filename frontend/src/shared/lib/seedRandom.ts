/**
 * Deterministic pseudo-random generator (mulberry32) — used to synthesize a stable,
 * repeatable trend (e.g. vendor performance history) from a real object's own id, not to
 * fabricate business data.
 */
export function createSeededRandom(seed: number) {
  let state = seed >>> 0
  return function next(): number {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function seededInt(rand: () => number, min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min
}

export function seededFloat(rand: () => number, min: number, max: number, decimals = 2): number {
  const value = rand() * (max - min) + min
  return Number(value.toFixed(decimals))
}

export function seededPick<T>(rand: () => number, items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)]!
}

export function seededBool(rand: () => number, trueProbability = 0.5): boolean {
  return rand() < trueProbability
}

export function daysAgoISO(days: number, from: Date = new Date()): string {
  const date = new Date(from)
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

export function daysFromNowISO(days: number, from: Date = new Date()): string {
  const date = new Date(from)
  date.setDate(date.getDate() + days)
  return date.toISOString()
}
