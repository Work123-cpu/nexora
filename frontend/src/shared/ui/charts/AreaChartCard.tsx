import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useChartPalette } from '@/theme/chartTheme'
import { ChartContainer } from './ChartContainer'

interface AreaChartCardProps {
  title: string
  description?: string
  data: object[]
  xKey: string
  areaKey: string
  label?: string
  colorIndex?: number
  height?: number
  className?: string
}

export function AreaChartCard({ title, description, data, xKey, areaKey, label, colorIndex = 0, height, className }: AreaChartCardProps) {
  const palette = useChartPalette()
  const color = palette.series[colorIndex % palette.series.length]

  return (
    <ChartContainer title={title} description={description} height={height} className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id={`area-fill-${areaKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={palette.grid} vertical={false} />
          <XAxis dataKey={xKey} stroke={palette.axis} fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke={palette.axis} fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 12, fontSize: 12 }}
            labelStyle={{ color: palette.tooltipText, fontWeight: 600 }}
          />
          <Area type="monotone" dataKey={areaKey} name={label ?? areaKey} stroke={color} strokeWidth={2.5} fill={`url(#area-fill-${areaKey})`} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
