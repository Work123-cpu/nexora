import { useEffect, useRef, useState } from 'react'
import { animate } from 'framer-motion'
import { usePrefersReducedMotion } from '@/shared/hooks/useMediaQuery'

const NUMBER_PATTERN = /-?[\d,]+(\.\d+)?/

/**
 * Animates the numeric portion of an already-formatted display string (e.g. "₹1,234", "45%",
 * "-3.2%") from 0 up to its real value, keeping any prefix/suffix and comma grouping intact.
 * Falls back to rendering the plain string when there's no number to animate, or motion is
 * reduced. Re-plays whenever `value` changes so live data updates still feel alive.
 */
export function CountUp({ value, duration = 1.1 }: { value: string; duration?: number }) {
  const reducedMotion = usePrefersReducedMotion()
  const [display, setDisplay] = useState(reducedMotion ? value : formatWith(value, 0))
  const prevValue = useRef<string | null>(null)

  useEffect(() => {
    if (reducedMotion || prevValue.current === value) {
      setDisplay(value)
      prevValue.current = value
      return
    }
    prevValue.current = value

    const match = value.match(NUMBER_PATTERN)
    if (!match) {
      setDisplay(value)
      return
    }
    const target = Number(match[0].replace(/,/g, ''))
    if (Number.isNaN(target)) {
      setDisplay(value)
      return
    }

    const controls = animate(0, target, {
      duration,
      ease: [0.16, 1, 0.3, 1] as const,
      onUpdate: (v) => setDisplay(formatWith(value, v, match[0])),
    })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reducedMotion])

  return <>{display}</>
}

/** Rebuilds the original string with its numeric run replaced by `current`, matching decimal precision and comma grouping. */
function formatWith(original: string, current: number, matched?: string): string {
  const numberMatch = matched ?? original.match(NUMBER_PATTERN)?.[0]
  if (!numberMatch) return original

  const decimals = numberMatch.includes('.') ? numberMatch.split('.')[1]!.length : 0
  const hasCommas = numberMatch.replace('-', '').length > 3 && numberMatch.includes(',')
  let formatted = current.toFixed(decimals)
  if (hasCommas) formatted = Number(formatted).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

  const index = original.indexOf(numberMatch)
  return original.slice(0, index) + formatted + original.slice(index + numberMatch.length)
}
