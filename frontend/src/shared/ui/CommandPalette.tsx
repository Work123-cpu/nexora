import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CornerDownLeft, PackagePlus, Plus, Search, Truck, Warehouse } from 'lucide-react'
import { NAV_SECTIONS } from '@/app/router/navConfig'
import { cn } from '@/shared/lib/cn'

interface PaletteAction {
  id: string
  label: string
  hint?: string
  icon: typeof Search
  run: (navigate: ReturnType<typeof useNavigate>) => void
}

const QUICK_ACTIONS: PaletteAction[] = [
  { id: 'add-product', label: 'Add Product', hint: 'Create a new product', icon: PackagePlus, run: (nav) => nav('/app/products/new') },
  { id: 'add-material', label: 'Add Raw Material', hint: 'Create a new raw material', icon: PackagePlus, run: (nav) => nav('/app/raw-materials/new') },
  { id: 'add-vendor', label: 'Add Vendor', hint: 'Create a new vendor', icon: Truck, run: (nav) => nav('/app/vendors/new') },
  { id: 'add-warehouse', label: 'Add Warehouse', hint: 'Create a new warehouse', icon: Warehouse, run: (nav) => nav('/app/inventory/warehouses/new') },
  { id: 'add-po', label: 'Create Purchase Order', hint: 'Start a new purchase order', icon: Plus, run: (nav) => nav('/app/procurement/purchase-orders/new') },
]

const NAV_ITEMS: PaletteAction[] = NAV_SECTIONS.flatMap((section) =>
  section.items.map((item) => ({
    id: `nav-${item.to}`,
    label: item.label,
    hint: `Go to ${section.label}`,
    icon: item.icon,
    run: (nav: ReturnType<typeof useNavigate>) => nav(item.to),
  })),
)

const ALL_ACTIONS = [...QUICK_ACTIONS, ...NAV_ITEMS]

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

/** Global fuzzy nav/action overlay, opened via Ctrl/Cmd+K or the Topbar search field. */
export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return ALL_ACTIONS
    return ALL_ACTIONS.filter((a) => a.label.toLowerCase().includes(needle) || a.hint?.toLowerCase().includes(needle))
  }, [query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  const runAction = (action: PaletteAction) => {
    action.run(navigate)
    onClose()
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, results.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
      }
      if (e.key === 'Enter' && results[activeIndex]) {
        e.preventDefault()
        runAction(results[activeIndex]!)
      }
    }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, results, activeIndex])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 pt-[12vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-overlay/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -6 }}
            transition={{ type: 'spring', duration: 0.3, bounce: 0.15 }}
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-surface card-shadow-lg"
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="size-4.5 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pages or type a command…"
                className="h-14 w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
              />
              <kbd className="rounded-md border border-border bg-surface-elevated px-1.5 py-0.5 text-[10px] text-muted-foreground">Esc</kbd>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {results.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">No matches for "{query}"</p>
              ) : (
                results.map((action, i) => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => runAction(action)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                      i === activeIndex ? 'bg-primary-soft text-primary' : 'text-foreground hover:bg-surface-elevated',
                    )}
                  >
                    <action.icon className="size-4 shrink-0" />
                    <span className="flex-1 font-medium">{action.label}</span>
                    {action.hint && <span className="text-xs text-muted-foreground">{action.hint}</span>}
                    {i === activeIndex && <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
