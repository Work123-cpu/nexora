import { Suspense } from 'react'
import { Navigate, Outlet, Link } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { LoadingScreen } from '@/shared/ui/LoadingScreen'
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary'
import { useVendorAuth } from '@/features/vendor-portal/context/VendorAuthContext'

export function VendorPortalLayout() {
  const { isAuthenticated, vendor, logout } = useVendorAuth()

  if (!isAuthenticated) {
    return <Navigate to="/vendor-portal/login" replace />
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6">
        <Link to="/vendor-portal" className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center overflow-hidden rounded-xl bg-black">
            <img src="/logo.png" alt="Nexora" className="h-full w-full object-cover object-[center_18%]" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Nexora Vendor Portal</p>
            <p className="text-[11px] text-muted-foreground">{vendor?.name}</p>
          </div>
        </Link>
        <Button variant="outline" size="sm" leftIcon={<LogOut className="size-3.5" />} onClick={logout}>
          Sign out
        </Button>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">
        <ErrorBoundary>
          <Suspense fallback={<LoadingScreen />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  )
}
