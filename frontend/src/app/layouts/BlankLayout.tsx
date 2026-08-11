import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { LoadingScreen } from '@/shared/ui/LoadingScreen'

export function BlankLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Suspense fallback={<LoadingScreen />}>
        <Outlet />
      </Suspense>
    </div>
  )
}
