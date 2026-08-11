import { forwardRef, type InputHTMLAttributes } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const checkId = id ?? props.name
    return (
      <label htmlFor={checkId} className={cn('inline-flex items-center gap-2 text-sm text-foreground', props.disabled && 'opacity-50')}>
        <span className="relative inline-flex size-4.5 items-center justify-center">
          <input ref={ref} id={checkId} type="checkbox" className="peer sr-only" {...props} />
          <span
            className={cn(
              'absolute inset-0 rounded-md border border-border-strong bg-surface transition-colors peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-1',
              className,
            )}
          />
          <Check className="pointer-events-none relative size-3 scale-0 text-primary-foreground transition-transform peer-checked:scale-100" strokeWidth={3} />
        </span>
        {label}
      </label>
    )
  },
)
Checkbox.displayName = 'Checkbox'
