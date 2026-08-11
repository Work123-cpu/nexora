import { motion } from 'framer-motion'
import { usePrefersReducedMotion } from '@/shared/hooks/useMediaQuery'

/**
 * Brand mark that draws itself in (stroke path animation) with a pulsing gradient glow behind
 * it, then settles into a filled, breathing state. Used on every loading screen — first app
 * boot, route-level Suspense fallbacks, and the Electron desktop shell's splash moment.
 */
export function AnimatedLogo({ size = 72 }: { size?: number }) {
  const reducedMotion = usePrefersReducedMotion()

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {!reducedMotion && (
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-accent blur-xl"
          animate={{ opacity: [0.3, 0.65, 0.3], scale: [0.85, 1.05, 0.85] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <svg viewBox="0 0 64 64" width={size} height={size} className="relative">
        <defs>
          <linearGradient id="nexora-logo-gradient" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="rgb(var(--primary))" />
            <stop offset="100%" stopColor="rgb(var(--accent))" />
          </linearGradient>
        </defs>
        <motion.circle
          cx="32"
          cy="32"
          r="27"
          fill="none"
          stroke="url(#nexora-logo-gradient)"
          strokeWidth="3"
          strokeLinecap="round"
          initial={reducedMotion ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0.4 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] as const }}
        />
        <motion.path
          d="M20 42 L20 22 L44 42 L44 22"
          fill="none"
          stroke="url(#nexora-logo-gradient)"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reducedMotion ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] as const }}
        />
      </svg>
    </div>
  )
}
