import { Link } from 'react-router-dom'
import { Command, PackagePlus, Sparkles, TrendingUp, X } from 'lucide-react'
import { useLocalStorage } from '@/shared/hooks/useLocalStorage'
import { IconButton } from '@/shared/ui/IconButton'
import { Button } from '@/shared/ui/Button'

const TOUR_STOPS = [
  { label: 'Add your first product', to: '/app/products/new', icon: PackagePlus },
  { label: 'See AI recommendations', to: '/app/procurement/recommendations', icon: Sparkles },
  { label: 'Check demand forecasts', to: '/app/reports/forecast', icon: TrendingUp },
]

/** One-time onboarding nudge — a lightweight guided tour without a full overlay library. */
export function WelcomeTourBanner() {
  const [dismissed, setDismissed] = useLocalStorage('Nexora.welcome-tour-dismissed', false)

  if (dismissed) return null

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-primary-soft p-5">
      <IconButton
        icon={<X className="size-4" />}
        variant="ghost"
        aria-label="Dismiss welcome tour"
        className="absolute right-3 top-3"
        onClick={() => setDismissed(true)}
      />
      <div className="flex items-center gap-2 text-primary">
        <Sparkles className="size-4.5" />
        <p className="font-semibold">Welcome to Nexora — a few places to start</p>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {TOUR_STOPS.map((stop) => (
          <Link key={stop.label} to={stop.to}>
            <Button variant="outline" size="sm" leftIcon={<stop.icon className="size-3.5" />}>
              {stop.label}
            </Button>
          </Link>
        ))}
        <span className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground">
          <Command className="size-3.5" /> Press Ctrl/Cmd+K anywhere to jump around
        </span>
      </div>
    </div>
  )
}
