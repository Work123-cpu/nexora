import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode
  variant?: 'default' | 'ghost' | 'danger'
  'aria-label': string
}

const variantClasses = {
  default: 'bg-surface-elevated hover:bg-border text-foreground border border-border',
  ghost: 'bg-transparent hover:bg-surface-elevated text-muted-foreground hover:text-foreground',
  danger: 'bg-transparent hover:bg-danger-soft text-muted-foreground hover:text-danger',
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, variant = 'default', className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-lg transition-colors duration-150 focus-ring disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {icon}
    </button>
  ),
)
IconButton.displayName = 'IconButton'
