import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { queryClient } from './queryClient'
import { ThemeProvider } from '@/theme/ThemeProvider'
import { ToastProvider } from '@/shared/ui/Toast'
import { AuthProvider } from '@/features/auth/context/AuthContext'
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary'
import { GlobalErrorListener } from '@/shared/ui/GlobalErrorListener'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <ToastProvider>
                <GlobalErrorListener />
                {children}
              </ToastProvider>
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
