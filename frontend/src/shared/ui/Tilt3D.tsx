import { useRef, type MouseEvent, type ReactNode } from 'react'
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion'
import { usePrefersReducedMotion } from '@/shared/hooks/useMediaQuery'
import { cn } from '@/shared/lib/cn'

interface Tilt3DProps {
  children: ReactNode
  className?: string
  /** Max rotation in degrees. Kept subtle by default — this is meant to feel premium, not gimmicky. */
  maxTilt?: number
  glare?: boolean
}

const SPRING_CONFIG = { stiffness: 220, damping: 20, mass: 0.6 }

/**
 * Wraps children in a mouse-tracked 3D tilt (perspective rotateX/rotateY) with a spring for
 * smooth settle, plus an optional soft glare that follows the cursor. Falls back to static
 * (no listeners, no transform) when the user prefers reduced motion.
 */
export function Tilt3D({ children, className, maxTilt = 8, glare = true }: Tilt3DProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  const mouseX = useMotionValue(50)
  const mouseY = useMotionValue(50)
  const rotateXRaw = useMotionValue(0)
  const rotateYRaw = useMotionValue(0)
  const scaleRaw = useMotionValue(1)

  const rotateX = useSpring(rotateXRaw, SPRING_CONFIG)
  const rotateY = useSpring(rotateYRaw, SPRING_CONFIG)
  const scale = useSpring(scaleRaw, SPRING_CONFIG)
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${mouseX}% ${mouseY}%, rgb(255 255 255 / 0.14), transparent 55%)`

  if (reducedMotion) {
    return <div className={className}>{children}</div>
  }

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    mouseX.set(px * 100)
    mouseY.set(py * 100)
    rotateYRaw.set((px - 0.5) * maxTilt * 2)
    rotateXRaw.set((0.5 - py) * maxTilt * 2)
  }

  const handleMouseEnter = () => scaleRaw.set(1.015)

  const handleMouseLeave = () => {
    rotateXRaw.set(0)
    rotateYRaw.set(0)
    scaleRaw.set(1)
  }

  return (
    <motion.div
      ref={ref}
      className={cn('relative [transform-style:preserve-3d]', className)}
      style={{ rotateX, rotateY, scale, perspective: 800 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {glare && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{ background: glareBackground }}
        />
      )}
    </motion.div>
  )
}
