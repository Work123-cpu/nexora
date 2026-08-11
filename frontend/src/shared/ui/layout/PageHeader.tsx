import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/shared/lib/cn'
import { KineticHeading } from '@/shared/ui/motion/KineticHeading'
import { usePrefersReducedMotion } from '@/shared/hooks/useMediaQuery'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  breadcrumbs?: ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, breadcrumbs, className }: PageHeaderProps) {
  const reducedMotion = usePrefersReducedMotion()

  return (
    <div className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="space-y-1.5">
        {breadcrumbs}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          <KineticHeading replayKey={title}>{title}</KineticHeading>
        </h1>
        {description && (
          <motion.p
            className="text-sm text-muted-foreground"
            initial={reducedMotion ? undefined : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            {description}
          </motion.p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
