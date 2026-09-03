import type { HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'
import { Tilt3D } from './Tilt3D'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean
  interactive?: boolean
  /** Opt-in mouse-tracked 3D tilt, layered on top of `interactive`. Use sparingly — showcase cards, not forms. */
  tilt?: boolean
}

export function Card({ className, glass, interactive, tilt, ...props }: CardProps) {
  const cardClassName = cn(
    'rounded-2xl border border-border bg-surface card-shadow',
    glass && 'glass',
    interactive && 'card-glow-hover transition-transform duration-200 hover:-translate-y-0.5',
    tilt && 'card-shadow-lg',
    className,
  )

  if (!tilt) return <div className={cardClassName} {...props} />

  // className is duplicated on both the tilt wrapper and the inner card so layout classes
  // (h-full, grid spans, etc.) still take effect on the outer element that grids measure.
  return (
    <Tilt3D className={className} maxTilt={6}>
      <div className={cardClassName} {...props} />
    </Tilt3D>
  )
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-start justify-between gap-3 p-5 pb-0', className)} {...props} />
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-sm font-semibold tracking-tight text-foreground', className)} {...props} />
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-xs text-muted-foreground', className)} {...props} />
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)} {...props} />
}
