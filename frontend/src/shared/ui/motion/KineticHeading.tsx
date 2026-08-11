import { motion, type Variants } from 'framer-motion'
import { usePrefersReducedMotion } from '@/shared/hooks/useMediaQuery'
import { cn } from '@/shared/lib/cn'

interface KineticHeadingProps {
  children: string
  as?: 'span' | 'div'
  className?: string
  /** Delay (seconds) before the first word starts animating — lets it sync after other page motion. */
  delay?: number
  /** Re-plays every time `replayKey` changes, instead of only once on mount. */
  replayKey?: string | number
}

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.055 } },
}

const word: Variants = {
  hidden: { opacity: 0, y: '0.7em', rotateX: -40 },
  visible: { opacity: 1, y: '0em', rotateX: 0, transition: { duration: 0.55, ease: EASE_OUT_EXPO } },
}

/**
 * Splits text into words and reveals them with a staggered rise+tilt — the "big bold kinetic
 * typography" treatment. Used for page titles (via PageHeader) and hero headlines everywhere,
 * so most of the app gets this for free from one component. Intended to sit inline inside
 * whatever real heading element (h1, etc.) the caller already renders.
 */
export function KineticHeading({ children, as = 'span', className, delay = 0, replayKey }: KineticHeadingProps) {
  const reducedMotion = usePrefersReducedMotion()
  const words = children.split(' ')
  const MotionTag = as === 'div' ? motion.div : motion.span

  if (reducedMotion) {
    const Plain = as
    return <Plain className={className}>{children}</Plain>
  }

  return (
    <MotionTag
      key={replayKey}
      className={cn('inline-block [perspective:600px]', className)}
      variants={container}
      initial="hidden"
      animate="visible"
      transition={{ delayChildren: delay }}
    >
      {words.map((w, i) => (
        <motion.span key={i} variants={word} className="inline-block [transform-style:preserve-3d] will-change-transform">
          {w}
          {i < words.length - 1 ? ' ' : ''}
        </motion.span>
      ))}
    </MotionTag>
  )
}
