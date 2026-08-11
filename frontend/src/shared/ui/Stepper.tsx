import { Check } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

interface Step {
  label: string
  description?: string
}

interface StepperProps {
  steps: Step[]
  currentStep: number
  className?: string
  orientation?: 'horizontal' | 'vertical'
}

export function Stepper({ steps, currentStep, className, orientation = 'horizontal' }: StepperProps) {
  return (
    <div className={cn(orientation === 'horizontal' ? 'flex items-start' : 'flex flex-col', className)}>
      {steps.map((step, i) => {
        const isComplete = i < currentStep
        const isCurrent = i === currentStep
        return (
          <div
            key={step.label}
            className={cn('flex items-start', orientation === 'horizontal' ? 'flex-1 flex-col' : 'gap-3 pb-6 last:pb-0')}
          >
            <div className={cn('flex items-center', orientation === 'horizontal' ? 'w-full' : 'flex-col')}>
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
                  isComplete && 'border-primary bg-primary text-primary-foreground',
                  isCurrent && 'border-primary text-primary',
                  !isComplete && !isCurrent && 'border-border-strong text-muted-foreground',
                )}
              >
                {isComplete ? <Check className="size-4" /> : i + 1}
              </span>
              {orientation === 'horizontal' && i < steps.length - 1 && (
                <span className={cn('mx-2 h-0.5 flex-1', isComplete ? 'bg-primary' : 'bg-border')} />
              )}
              {orientation === 'vertical' && i < steps.length - 1 && (
                <span className={cn('absolute mt-8 h-6 w-0.5', isComplete ? 'bg-primary' : 'bg-border')} />
              )}
            </div>
            <div className={cn(orientation === 'horizontal' ? 'mt-2' : '')}>
              <p className={cn('text-xs font-semibold', isCurrent || isComplete ? 'text-foreground' : 'text-muted-foreground')}>
                {step.label}
              </p>
              {step.description && <p className="text-xs text-muted-foreground">{step.description}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
