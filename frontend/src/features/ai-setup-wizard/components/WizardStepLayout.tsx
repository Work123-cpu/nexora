import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/shared/ui/Button'

interface WizardStepLayoutProps {
  title: string
  description?: string
  children: ReactNode
  onNext?: () => void
  onBack?: () => void
  nextLabel?: string
  hideBack?: boolean
  nextDisabled?: boolean
}

export function WizardStepLayout({ title, description, children, onNext, onBack, nextLabel = 'Continue', hideBack, nextDisabled }: WizardStepLayoutProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
      </div>

      <div className="mb-8">{children}</div>

      <div className="flex items-center justify-between border-t border-border pt-5">
        {!hideBack ? (
          <Button variant="ghost" leftIcon={<ArrowLeft className="size-4" />} onClick={onBack}>
            Back
          </Button>
        ) : (
          <span />
        )}
        {onNext && (
          <Button rightIcon={<ArrowRight className="size-4" />} onClick={onNext} disabled={nextDisabled}>
            {nextLabel}
          </Button>
        )}
      </div>
    </motion.div>
  )
}
