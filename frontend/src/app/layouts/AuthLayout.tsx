import { Suspense, lazy, useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, Sparkles, TrendingUp } from 'lucide-react'
import { useAuth, peekJustRegistered, clearJustRegistered } from '@/features/auth/context/AuthContext'
import { LoadingScreen } from '@/shared/ui/LoadingScreen'
import { ConstellationNetwork } from '@/shared/ui/motion/ConstellationNetwork'
import { KineticHeading } from '@/shared/ui/motion/KineticHeading'
import { useIsMobile, usePrefersReducedMotion } from '@/shared/hooks/useMediaQuery'

const AuthHero3D = lazy(() => import('@/features/auth/components/AuthHero3D').then((m) => ({ default: m.AuthHero3D })))

const HIGHLIGHTS = [
  { icon: Sparkles, text: 'AI recommendations explained in plain English' },
  { icon: TrendingUp, text: 'Real-time inventory and procurement insights' },
  { icon: ShieldCheck, text: 'Enterprise-grade security and role-based access' },
]

export function AuthLayout() {
  const { isAuthenticated } = useAuth()
  const isMobile = useIsMobile()
  const reducedMotion = usePrefersReducedMotion()
  const show3D = !isMobile && !reducedMotion

  useEffect(() => {
    if (isAuthenticated) clearJustRegistered()
  }, [isAuthenticated])

  if (isAuthenticated) {
    return <Navigate to={peekJustRegistered() ? '/welcome' : '/app'} replace />
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-indigo-700 to-accent p-12 lg:flex lg:flex-col lg:justify-between">
        <ConstellationNetwork className="absolute inset-0" tone="cool" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10" />

        {show3D && (
          <div className="pointer-events-none absolute inset-0">
            <Suspense fallback={null}>
              <AuthHero3D />
            </Suspense>
          </div>
        )}

        <div className="relative z-10 flex items-center gap-2.5 text-white">
          <div className="flex size-10 items-center justify-center overflow-hidden rounded-xl bg-black/40">
            <img src="/logo.png" alt="Nexora" className="h-full w-full object-cover object-[center_18%]" />
          </div>
          <span className="text-lg font-bold">Nexora</span>
        </div>

        <div className="relative z-10 space-y-8">
          <h1 className="max-w-md text-4xl font-bold leading-tight text-white">
            <KineticHeading as="span" delay={0.1}>
              Your intelligent business operating platform.
            </KineticHeading>
          </h1>
          <div className="space-y-4">
            {HIGHLIGHTS.map((h, i) => (
              <motion.div
                key={h.text}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.1 }}
                className="flex items-center gap-3 text-white/90"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <h.icon className="size-4" />
                </div>
                <span className="text-sm">{h.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/60">© {new Date().getFullYear()} Nexora. All rights reserved.</p>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <Suspense fallback={<LoadingScreen />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  )
}
