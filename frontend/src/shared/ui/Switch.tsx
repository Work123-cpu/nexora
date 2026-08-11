import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  description?: string
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, description, id, ...props }, ref) => {
    const switchId = id ?? props.name
    return (
      <label htmlFor={switchId} className={cn('flex items-center justify-between gap-3', props.disabled && 'opacity-50')}>
        {(label || description) && (
          <span className="flex flex-col">
            {label && <span className="text-sm font-medium text-foreground">{label}</span>}
            {description && <span className="text-xs text-muted-foreground">{description}</span>}
          </span>
        )}
        <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
          <input ref={ref} id={switchId} type="checkbox" className="peer sr-only" {...props} />
          <span
            className={cn(
              'absolute inset-0 rounded-full bg-border-strong transition-colors peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-1',
              className,
            )}
          />
          <span className="pointer-events-none absolute left-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
        </span>
      </label>
    )
  },
)
Switch.displayName = 'Switch'
