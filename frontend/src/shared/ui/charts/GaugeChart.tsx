import { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import { useChartPalette } from '@/theme/chartTheme'
import { usePrefersReducedMotion } from '@/shared/hooks/useMediaQuery'
import { cn } from '@/shared/lib/cn'
import { CountUp } from '../motion/CountUp'

interface GaugeChartProps {
  value: number
  max?: number
  label?: string
  size?: number
  className?: string
}

export function GaugeChart({ value, max = 100, label, size = 160, className }: GaugeChartProps) {
  const palette = useChartPalette()
  const reducedMotion = usePrefersReducedMotion()
  const arcRef = useRef<SVGPathElement>(null)
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const radius = size / 2 - 12
  const circumference = Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  const color = pct >= 75 ? palette.success : pct >= 45 ? palette.warning : palette.danger

  // Reads whatever offset is currently on the DOM (starts fully empty on mount, or wherever the
  // last render left it) and eases to the new one — so both the first fill-in and any later
  // score change animate, instead of just snapping via the old CSS transition.
  useEffect(() => {
    const el = arcRef.current
    if (!el) return
    if (reducedMotion) {
      el.setAttribute('stroke-dashoffset', String(offset))
      return
    }
    const animation = animate(el, { strokeDashoffset: offset, duration: 900, ease: 'outExpo' })
    // pause (not revert/cancel) on cleanup — leaves the arc wherever it currently is so the next
    // animate() call eases from there, instead of snapping back to where this tween started.
    return () => {
      animation.pause()
    }
  }, [offset, reducedMotion])

  return (
    <div className={cn('flex flex-col items-center', className)} style={{ width: size }}>
      <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
        <path
          d={`M 12 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 12} ${size / 2}`}
          fill="none"
          stroke={palette.grid}
          strokeWidth={12}
          strokeLinecap="round"
        />
        <path
          ref={arcRef}
          d={`M 12 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 12} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
        />
      </svg>
      <div className="-mt-8 text-center">
        <p className="text-2xl font-bold text-foreground">
          <CountUp value={String(Math.round(pct))} />
        </p>
        {label && <p className="text-xs text-muted-foreground">{label}</p>}
      </div>
    </div>
  )
}
