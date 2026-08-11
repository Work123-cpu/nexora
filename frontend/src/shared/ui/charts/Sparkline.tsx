import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { useChartPalette } from '@/theme/chartTheme'

interface SparklineProps {
  data: number[]
  colorIndex?: number
  height?: number
  tone?: 'success' | 'danger' | 'warning' | 'primary'
}

export function Sparkline({ data, height = 40, tone = 'primary' }: SparklineProps) {
  const palette = useChartPalette()
  const color = { success: palette.success, danger: palette.danger, warning: palette.warning, primary: palette.primary }[tone]
  const chartData = data.map((value, i) => ({ i, value }))

  return (
    <div style={{ height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`sparkline-${tone}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#sparkline-${tone})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
