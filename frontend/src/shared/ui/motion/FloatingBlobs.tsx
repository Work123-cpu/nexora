import { motion } from 'framer-motion'
import { usePrefersReducedMotion } from '@/shared/hooks/useMediaQuery'
import { cn } from '@/shared/lib/cn'

interface Blob {
  className: string
  duration: number
  x: number[]
  y: number[]
  scale: number[]
}

const BLOBS: Blob[] = [
  { className: 'left-[-8%] top-[-12%] size-[420px] bg-primary/35', duration: 18, x: [0, 40, -20, 0], y: [0, 30, 50, 0], scale: [1, 1.08, 0.96, 1] },
  { className: 'right-[-10%] top-[10%] size-[380px] bg-accent/30', duration: 22, x: [0, -35, 15, 0], y: [0, 40, -25, 0], scale: [1, 0.95, 1.1, 1] },
  { className: 'bottom-[-15%] left-[20%] size-[340px] bg-info/25', duration: 26, x: [0, 25, -35, 0], y: [0, -30, 20, 0], scale: [1, 1.1, 0.9, 1] },
]

/**
 * Continuously-drifting blurred gradient blobs — the animated background language borrowed from
 * anime.js's own site. Pure transform/opacity animation (GPU-cheap), so it's safe to leave
 * running behind real content. Freezes to a static single soft glow when reduced-motion is on.
 */
export function FloatingBlobs({ className }: { className?: string }) {
  const reducedMotion = usePrefersReducedMotion()

  if (reducedMotion) {
    return (
      <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
        <div className="absolute left-1/4 top-0 size-96 rounded-full bg-primary/15 blur-3xl" />
      </div>
    )
  }

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      {BLOBS.map((b, i) => (
        <motion.div
          key={i}
          className={cn('absolute rounded-full blur-3xl', b.className)}
          animate={{ x: b.x, y: b.y, scale: b.scale }}
          transition={{ duration: b.duration, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}
