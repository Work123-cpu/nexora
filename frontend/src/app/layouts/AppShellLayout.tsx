import { lazy, Suspense, useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { Sidebar } from '@/shared/ui/layout/Sidebar'
import { Topbar } from '@/shared/ui/layout/Topbar'
import { ContentContainer } from '@/shared/ui/layout/ContentContainer'
import { LoadingScreen } from '@/shared/ui/LoadingScreen'
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary'
import { CommandPalette } from '@/shared/ui/CommandPalette'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useLocalStorage } from '@/shared/hooks/useLocalStorage'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'

const ChatLauncher = lazy(() => import('@/features/ai-chatbot/components/ChatLauncher').then((m) => ({ default: m.ChatLauncher })))

export function AppShellLayout() {
  const { isAuthenticated } = useAuth()
  const [collapsed, setCollapsed] = useLocalStorage('Nexora.sidebar-collapsed', false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const { unread } = useNotifications()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="relative flex min-h-screen flex-1 flex-col overflow-hidden">
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
          <div className="ambient-orb -left-24 -top-32 size-[420px] bg-primary" />
          <div className="ambient-orb -right-32 top-1/4 size-[380px] bg-accent" />
          <div className="ambient-orb bottom-0 left-1/3 size-[460px] bg-primary/70" />
        </div>
        <Topbar onMenuClick={() => setMobileOpen(true)} unreadNotifications={unread.length} onOpenCommandPalette={() => setPaletteOpen(true)} />
        <main className="flex-1">
          <ContentContainer>
            <ErrorBoundary>
              <Suspense fallback={<LoadingScreen />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </ContentContainer>
        </main>
      </div>
      <Suspense fallback={null}>
        <ChatLauncher />
      </Suspense>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
