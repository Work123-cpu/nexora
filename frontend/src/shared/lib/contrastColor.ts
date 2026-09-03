/** Picks readable icon/text color (white or near-black) for an arbitrary background hex —
 * `accentColor` is a freeform per-product color with no contrast guarantee, so a pale color
 * (e.g. `#fef3c7`) would otherwise render a hardcoded `text-white` icon nearly invisible.
 * Standard WCAG-style relative luminance threshold, no library needed. */
export function contrastColor(hex: string): '#ffffff' | '#0f172a' {
  const normalized = hex.replace('#', '')
  const full = normalized.length === 3 ? normalized.split('').map((c) => c + c).join('') : normalized
  const r = parseInt(full.slice(0, 2), 16) / 255
  const g = parseInt(full.slice(2, 4), 16) / 255
  const b = parseInt(full.slice(4, 6), 16) / 255
  if ([r, g, b].some((v) => Number.isNaN(v))) return '#ffffff'

  const channel = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  const luminance = 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)

  // Contrast ratio against white is (1.05)/(L+0.05); against near-black it's (L+0.05)/0.05.
  // Pick whichever side actually contrasts better instead of a fixed midpoint.
  const contrastWithWhite = 1.05 / (luminance + 0.05)
  const contrastWithDark = (luminance + 0.05) / 0.05
  return contrastWithWhite >= contrastWithDark ? '#ffffff' : '#0f172a'
}
