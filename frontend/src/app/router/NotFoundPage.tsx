import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        <Compass className="size-7" />
      </div>
      <h1 className="mt-5 text-3xl font-bold text-foreground">404</h1>
      <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist or has moved.</p>
      <Link
        to="/app"
        className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:brightness-110"
      >
        Back to Command Center
      </Link>
    </div>
  )
}
