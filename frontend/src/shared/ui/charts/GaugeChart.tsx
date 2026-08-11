import { useChartPalette } from '@/theme/chartTheme'
import { cn } from '@/shared/lib/cn'

interface GaugeChartProps {
  value: number
  max?: number
  label?: string
  size?: number
  className?: string
}

export function GaugeChart({ value, max = 100, label, size = 160, className }: GaugeChartProps) {
  const palette = useChartPalette()
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const radius = size / 2 - 12
  const circumference = Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  const color = pct >= 75 ? palette.success : pct >= 45 ? palette.warning : palette.danger

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
          d={`M 12 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 12} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="-mt-8 text-center">
        <p className="text-2xl font-bold text-foreground">{Math.round(pct)}</p>
        {label && <p className="text-xs text-muted-foreground">{label}</p>}
      </div>
    </div>
  )
}
