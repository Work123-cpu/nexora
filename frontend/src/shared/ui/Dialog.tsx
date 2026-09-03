import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { IconButton } from './IconButton'

interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  className?: string
  footer?: ReactNode
}

export function Dialog({ open, onClose, title, description, children, className, footer }: DialogProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-overlay/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
            className={cn(
              'relative z-10 w-full max-w-lg rounded-2xl border border-border bg-surface card-shadow-lg',
              className,
            )}
          >
            {(title || description) && (
              <div className="flex items-start justify-between gap-3 border-b border-border p-5">
                <div>
                  {title && <h2 className="text-base font-semibold text-foreground">{title}</h2>}
                  {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
                </div>
                <IconButton icon={<X className="size-4" />} variant="ghost" aria-label="Close dialog" onClick={onClose} />
              </div>
            )}
            <div className="p-5">{children}</div>
            {footer && <div className="flex items-center justify-end gap-2 border-t border-border p-5">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
