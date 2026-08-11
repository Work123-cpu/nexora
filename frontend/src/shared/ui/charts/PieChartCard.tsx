import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { useChartPalette } from '@/theme/chartTheme'
import { ChartContainer } from './ChartContainer'

interface PieChartCardProps {
  title: string
  description?: string
  data: { name: string; value: number }[]
  height?: number
  className?: string
}

export function PieChartCard({ title, description, data, height, className }: PieChartCardProps) {
  const palette = useChartPalette()

  return (
    <ChartContainer title={title} description={description} height={height} className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2}>
            {data.map((_, i) => (
              <Cell key={i} fill={palette.series[i % palette.series.length]} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: palette.tooltipBg, border: `1px solid ${palette.tooltipBorder}`, borderRadius: 12, fontSize: 12 }}
            labelStyle={{ color: palette.tooltipText, fontWeight: 600 }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ fontSize: 12, color: palette.axis }}
            iconType="circle"
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
