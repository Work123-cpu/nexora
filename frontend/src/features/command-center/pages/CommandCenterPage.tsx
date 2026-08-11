import { Reveal } from '@/shared/ui/Reveal'
import { HeroBanner } from '../components/HeroBanner'
import { WelcomeTourBanner } from '../components/WelcomeTourBanner'
import { RevenueStatCards } from '../components/RevenueStatCards'
import { BusinessHealthCard } from '../components/BusinessHealthCard'
import { PrioritiesAndAlerts } from '../components/PrioritiesAndAlerts'
import { DomainOverviewCards } from '../components/DomainOverviewCards'
import { RevenueAnalytics } from '../components/RevenueAnalytics'
import { AIRecommendationsSection } from '../components/AIRecommendationsSection'
import { QuickActionsPanel } from '../components/QuickActionsPanel'
import { CalendarWidget } from '../components/CalendarWidget'
import { RecentActivityPanel } from '../components/RecentActivityPanel'
import { BusinessInsightsPanel } from '../components/BusinessInsightsPanel'

export function CommandCenterPage() {
  return (
    <div className="space-y-6">
      <WelcomeTourBanner />
      <HeroBanner />
      <RevenueStatCards />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BusinessHealthCard />
        </div>
        <QuickActionsPanel />
      </div>

      <Reveal>
        <PrioritiesAndAlerts />
      </Reveal>
      <Reveal delay={0.05}>
        <DomainOverviewCards />
      </Reveal>
      <Reveal delay={0.1}>
        <RevenueAnalytics />
      </Reveal>
      <Reveal delay={0.1}>
        <AIRecommendationsSection />
      </Reveal>

      <Reveal delay={0.05}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentActivityPanel />
          </div>
          <div className="space-y-6">
            <CalendarWidget />
          </div>
        </div>
      </Reveal>

      <Reveal>
        <BusinessInsightsPanel />
      </Reveal>
    </div>
  )
}
