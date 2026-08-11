import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useChartPalette } from '@/theme/chartTheme'
import { ChartContainer } from './ChartContainer'

interface LineChartCardProps {
  title: string
  description?: string
  data: object[]
  xKey: string
  lines: { key: string; label: string; colorIndex?: number }[]
  height?: number
  className?: string
}

export function LineChartCard({ title, description, data, xKey, lines, height, className }: LineChartCardProps) {
  const palette = useChartPalette()

  return (
    <ChartContainer title={title} description={description} height={height} className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={palette.grid} vertical={false} />
          <XAxis dataKey={xKey} stroke={palette.axis} fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke={palette.axis} fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 12, fontSize: 12 }}
            labelStyle={{ color: palette.tooltipText, fontWeight: 600 }}
          />
          {lines.map((line, i) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.label}
              stroke={palette.series[line.colorIndex ?? i % palette.series.length]}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
