import { Suspense } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { X } from 'lucide-react'
import { LoadingScreen } from '@/shared/ui/LoadingScreen'
import { FloatingBlobs } from '@/shared/ui/motion/FloatingBlobs'

export function SetupWizardLayout() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <FloatingBlobs className="opacity-30" />
      <header className="relative z-10 flex h-16 items-center justify-between border-b border-border px-6 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center overflow-hidden rounded-xl bg-black">
            <img src="/logo.png" alt="Nexora" className="h-full w-full object-cover object-[center_18%]" />
          </div>
          <span className="text-sm font-bold text-foreground">Nexora Setup</span>
        </div>
        <Link to="/app" className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <X className="size-4" /> Exit setup
        </Link>
      </header>
      <main className="relative z-10 mx-auto max-w-3xl px-6 py-10">
        <Suspense fallback={<LoadingScreen />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
