import type { ReactNode } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

export function FilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2.5', className)}>
      <SlidersHorizontal className="size-4 text-muted-foreground" />
      {children}
    </div>
  )
}

export function FilterChip({
  active,
  onClick,
  children,
}: {
  active?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors focus-ring',
        active
          ? 'border-primary bg-primary-soft text-primary'
          : 'border-border text-muted-foreground hover:bg-surface-elevated hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}
