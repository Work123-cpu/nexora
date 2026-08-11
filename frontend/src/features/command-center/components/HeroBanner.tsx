import { Suspense, lazy } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useIsMobile, usePrefersReducedMotion } from '@/shared/hooks/useMediaQuery'
import { useAuth } from '@/features/auth/context/AuthContext'
import { FloatingBlobs } from '@/shared/ui/motion/FloatingBlobs'
import { KineticHeading } from '@/shared/ui/motion/KineticHeading'

const CommandCenterHero3D = lazy(() => import('./CommandCenterHero3D').then((m) => ({ default: m.CommandCenterHero3D })))

export function HeroBanner() {
  const isMobile = useIsMobile()
  const reducedMotion = usePrefersReducedMotion()
  const { session } = useAuth()
  const show3D = !isMobile && !reducedMotion

  const firstName = session?.user.name.split(' ')[0] ?? 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary via-indigo-600 to-accent p-6 sm:p-8">
      <FloatingBlobs className="opacity-50 mix-blend-screen" />
      <div className="relative z-10 flex flex-col gap-2">
        <motion.div
          className="flex items-center gap-2 text-white/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Sparkles className="size-4" />
          <span className="text-xs font-medium uppercase tracking-wide">Nexora Command Center</span>
        </motion.div>
        <h1 className="max-w-lg text-2xl font-bold text-white sm:text-3xl">
          <KineticHeading as="span" replayKey={`${greeting}-${firstName}`}>
            {`${greeting}, ${firstName}. Here's how business looks today.`}
          </KineticHeading>
        </h1>
        <motion.p
          className="max-w-md text-sm text-white/75"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          Everything important is on this page — health, priorities, alerts, and AI recommendations.
        </motion.p>
      </div>

      {show3D && (
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-72 lg:block">
          <Suspense fallback={null}>
            <CommandCenterHero3D />
          </Suspense>
        </div>
      )}
    </div>
  )
}
