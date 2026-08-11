import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { IconButton } from './IconButton'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  side?: 'right' | 'left'
  widthClassName?: string
}

export function Drawer({ open, onClose, title, children, side = 'right', widthClassName = 'max-w-md' }: DrawerProps) {
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: side === 'right' ? '100%' : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: side === 'right' ? '100%' : '-100%' }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.1 }}
            className={cn(
              'relative z-10 flex h-full w-full flex-col border-border bg-surface card-shadow-lg',
              side === 'right' ? 'ml-auto border-l' : 'border-r',
              widthClassName,
            )}
          >
            {title && (
              <div className="flex items-center justify-between border-b border-border p-5">
                <h2 className="text-base font-semibold text-foreground">{title}</h2>
                <IconButton icon={<X className="size-4" />} variant="ghost" aria-label="Close" onClick={onClose} />
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
