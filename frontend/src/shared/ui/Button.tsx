import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Magnetic } from './motion/Magnetic'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-br from-primary to-accent text-primary-foreground hover:brightness-110 shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/35 active:scale-[0.98]',
  secondary:
    'bg-primary-soft text-primary hover:brightness-95 dark:hover:brightness-125 active:scale-[0.98]',
  outline:
    'border border-border-strong bg-transparent text-foreground hover:bg-surface-elevated active:scale-[0.98]',
  ghost: 'bg-transparent text-foreground hover:bg-surface-elevated active:scale-[0.98]',
  danger: 'bg-gradient-to-br from-danger to-danger/75 text-white hover:brightness-110 shadow-md shadow-danger/25 hover:shadow-lg hover:shadow-danger/35 active:scale-[0.98]',
  success: 'bg-gradient-to-br from-success to-success/75 text-white hover:brightness-110 shadow-md shadow-success/25 hover:shadow-lg hover:shadow-success/35 active:scale-[0.98]',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2 rounded-xl',
  icon: 'h-10 w-10 rounded-xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const button = (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-150 focus-ring disabled:pointer-events-none disabled:opacity-50',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? <Loader2 className="size-4 animate-spin" /> : leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    )

    // Magnetic pull only on full CTA-style buttons — icon buttons (table row actions etc.)
    // stay still so the effect never feels like it's fighting a dense toolbar.
    if (variant === 'primary' && size !== 'icon') {
      return (
        <Magnetic strength={0.25} fullWidth={className?.includes('w-full') ?? false}>
          {button}
        </Magnetic>
      )
    }
    return button
  },
)
Button.displayName = 'Button'
