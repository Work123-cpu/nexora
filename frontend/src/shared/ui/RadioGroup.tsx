import { cn } from '@/shared/lib/cn'

interface RadioOption {
  label: string
  value: string
  description?: string
}

interface RadioGroupProps {
  name: string
  value: string
  onChange: (value: string) => void
  options: RadioOption[]
  className?: string
}

export function RadioGroup({ name, value, onChange, options, className }: RadioGroupProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {options.map((opt) => {
        const checked = value === opt.value
        return (
          <label
            key={opt.value}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors',
              checked ? 'border-primary bg-primary-soft' : 'border-border hover:bg-surface-elevated',
            )}
          >
            <span
              className={cn(
                'mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full border',
                checked ? 'border-primary' : 'border-border-strong',
              )}
            >
              {checked && <span className="size-2.5 rounded-full bg-primary" />}
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{opt.label}</span>
              {opt.description && <span className="text-xs text-muted-foreground">{opt.description}</span>}
            </span>
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={checked}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
          </label>
        )
      })}
    </div>
  )
}
