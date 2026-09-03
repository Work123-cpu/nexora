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

export function seededFloat(rand: () => number, min: number, max: number, decimals = 2): number {
  const value = rand() * (max - min) + min
  return Number(value.toFixed(decimals))
}
