import { motion } from 'framer-motion'
import { AnimatedLogo } from './AnimatedLogo'
import { usePrefersReducedMotion } from '@/shared/hooks/useMediaQuery'

export function LoadingScreen({ label = 'Loading Nexora…' }: { label?: string }) {
  const reducedMotion = usePrefersReducedMotion()

  return (
    <div className="flex min-h-[40vh] w-full flex-col items-center justify-center gap-4">
      <AnimatedLogo size={64} />
      <motion.p
        className="text-sm text-muted-foreground"
        initial={reducedMotion ? undefined : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        {label}
      </motion.p>
    </div>
  )
}
