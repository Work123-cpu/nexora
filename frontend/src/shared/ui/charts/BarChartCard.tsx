import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useChartPalette } from '@/theme/chartTheme'
import { ChartContainer } from './ChartContainer'

interface BarChartCardProps {
  title: string
  description?: string
  data: object[]
  xKey: string
  bars: { key: string; label: string; colorIndex?: number }[]
  height?: number
  stacked?: boolean
  className?: string
}

export function BarChartCard({ title, description, data, xKey, bars, height, stacked, className }: BarChartCardProps) {
  const palette = useChartPalette()

  return (
    <ChartContainer title={title} description={description} height={height} className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={palette.grid} vertical={false} />
          <XAxis dataKey={xKey} stroke={palette.axis} fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke={palette.axis} fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 12, fontSize: 12 }}
            labelStyle={{ color: palette.tooltipText, fontWeight: 600 }}
            cursor={{ fill: palette.grid, opacity: 0.4 }}
          />
          {bars.map((bar, i) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              name={bar.label}
              stackId={stacked ? 'stack' : undefined}
              fill={palette.series[bar.colorIndex ?? i % palette.series.length]}
              radius={stacked ? [0, 0, 0, 0] : [6, 6, 0, 0]}
              maxBarSize={36}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
