import type { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../Card'
import { cn } from '@/shared/lib/cn'

interface ChartContainerProps {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  height?: number
  className?: string
}

export function ChartContainer({ title, description, action, children, height = 280, className }: ChartContainerProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription className="mt-1">{description}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent>
        <div style={{ height }}>{children}</div>
      </CardContent>
    </Card>
  )
}
