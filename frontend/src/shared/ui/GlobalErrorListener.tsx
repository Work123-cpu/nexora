import { useEffect } from 'react'
import { useToast } from './Toast'
import { appendErrorLog } from '@/shared/lib/errorLog'

/**
 * Catches every uncaught JS error and unhandled promise rejection app-wide, pops a toast so
 * it's never silently invisible, and persists it to the error log (Help Center → Error Log)
 * so it's still reviewable after the toast disappears. Mounted once at the app root, inside
 * ToastProvider's tree.
 */
export function GlobalErrorListener() {
  const { toast } = useToast()

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const message = event.message || 'An unexpected error occurred'
      appendErrorLog({ message, detail: event.error?.stack, source: 'error' })
      toast({ title: 'Something went wrong', description: message, tone: 'error' })
    }

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      const message = reason instanceof Error ? reason.message : String(reason)
      appendErrorLog({ message, detail: reason instanceof Error ? reason.stack : undefined, source: 'unhandledrejection' })
      toast({ title: 'Something went wrong', description: message, tone: 'error' })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [toast])

  return null
}
