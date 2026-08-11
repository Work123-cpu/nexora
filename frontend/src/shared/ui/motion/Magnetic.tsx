import { useRef, type MouseEvent, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { usePrefersReducedMotion } from '@/shared/hooks/useMediaQuery'

const SPRING = { stiffness: 300, damping: 20, mass: 0.5 }

/**
 * Pulls its child toward the cursor within its own bounding box, spring-settling back to
 * center on leave. Wrapped around primary buttons app-wide via Button.tsx so most CTAs get
 * this "magnetic" feel without every call site opting in individually.
 */
export function Magnetic({ children, strength = 0.35, fullWidth = false }: { children: ReactNode; strength?: number; fullWidth?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, SPRING)
  const springY = useSpring(y, SPRING)

  if (reducedMotion) return <>{children}</>

  const handleMouseMove = (e: MouseEvent<HTMLSpanElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    x.set((e.clientX - rect.left - rect.width / 2) * strength)
    y.set((e.clientY - rect.top - rect.height / 2) * strength)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.span
      ref={ref}
      className={fullWidth ? 'block w-full' : 'inline-block'}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.span>
  )
}
