import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles, X } from 'lucide-react'
import { useLocalStorage } from '@/shared/hooks/useLocalStorage'
import { ChatWindow } from './ChatWindow'

const BUTTON_SIZE = 56
const MIN_PANEL_VISIBLE_HEIGHT = 300
const GAP = 16
const EDGE_MARGIN = 8
const DRAG_THRESHOLD = 4

interface Offset {
  right: number
  bottom: number
}

const DEFAULT_OFFSET: Offset = { right: 20, bottom: 20 }

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max))
}

export function ChatLauncher() {
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useLocalStorage('Nexora.chat-fab-hidden', false)
  const [offset, setOffset] = useLocalStorage<Offset>('Nexora.chat-fab-position', DEFAULT_OFFSET)
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight })

  const dragStateRef = useRef<{ pointerId: number; startX: number; startY: number; startOffset: Offset; moved: boolean } | null>(null)
  const suppressClickRef = useRef(false)

  useEffect(() => {
    const handleResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const clampedOffset: Offset = {
    right: clamp(offset.right, EDGE_MARGIN, viewport.width - BUTTON_SIZE - EDGE_MARGIN),
    bottom: clamp(offset.bottom, EDGE_MARGIN, viewport.height - BUTTON_SIZE - EDGE_MARGIN),
  }

  const handlePointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    ;(e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId)
    dragStateRef.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, startOffset: clampedOffset, moved: false }
  }

  const handlePointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragStateRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    const deltaX = e.clientX - drag.startX
    const deltaY = e.clientY - drag.startY
    if (!drag.moved && Math.hypot(deltaX, deltaY) > DRAG_THRESHOLD) drag.moved = true
    if (!drag.moved) return
    setOffset({
      right: clamp(drag.startOffset.right - deltaX, EDGE_MARGIN, viewport.width - BUTTON_SIZE - EDGE_MARGIN),
      bottom: clamp(drag.startOffset.bottom - deltaY, EDGE_MARGIN, viewport.height - BUTTON_SIZE - EDGE_MARGIN),
    })
  }

  const handlePointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragStateRef.current
    if (drag?.pointerId === e.pointerId && drag.moved) suppressClickRef.current = true
    dragStateRef.current = null
  }

  const handleClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }
    setOpen((o) => !o)
  }

  if (hidden) {
    return (
      <motion.button
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => setHidden(false)}
        aria-label="Show Nexora assistant"
        style={{ bottom: clampedOffset.bottom }}
        className="fixed right-0 z-40 flex h-14 w-6 items-center justify-center rounded-l-xl border border-r-0 border-border bg-surface/90 text-muted-foreground shadow-md backdrop-blur transition-colors hover:text-primary"
      >
        <Sparkles className="size-3.5" />
      </motion.button>
    )
  }

  const panelBottomMax = Math.max(viewport.height - MIN_PANEL_VISIBLE_HEIGHT - EDGE_MARGIN, EDGE_MARGIN)
  const panelBottom = Math.min(clampedOffset.bottom + BUTTON_SIZE + GAP, panelBottomMax)

  return (
    <>
      <div className="fixed z-40" style={{ right: clampedOffset.right, bottom: clampedOffset.bottom }}>
        <motion.button
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onClick={handleClick}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Open Nexora assistant"
          className="flex size-14 touch-none items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/30"
        >
          <AnimatePresence mode="wait">
            {open ? (
              <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                <X className="size-6" />
              </motion.span>
            ) : (
              <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                <Sparkles className="size-6" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        <button
          onClick={(e) => {
            e.stopPropagation()
            setHidden(true)
            setOpen(false)
          }}
          aria-label="Hide Nexora assistant"
          className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground shadow-sm transition-colors hover:text-danger"
        >
          <X className="size-3" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
            style={{ right: clampedOffset.right, bottom: panelBottom }}
            className="fixed z-40 h-[560px] max-h-[calc(100vh-7rem)] w-[380px] max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-2xl border border-border bg-surface card-shadow-lg"
          >
            <ChatWindow onClose={() => setOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
