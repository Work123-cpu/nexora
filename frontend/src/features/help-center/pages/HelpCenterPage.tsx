import { LifeBuoy, Mail } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Card, CardContent } from '@/shared/ui/Card'
import { Button } from '@/shared/ui/Button'
import { AskAIHelpPanel } from '../components/AskAIHelpPanel'
import { TutorialCards } from '../components/TutorialCards'
import { FAQAccordion } from '../components/FAQAccordion'
import { ErrorLogPanel } from '../components/ErrorLogPanel'
import { FAQS } from '../data/faqs'

export function HelpCenterPage() {
  return (
    <div>
      <PageHeader title="Help Center" description="Guides, answers, and support for getting the most out of Nexora." />

      <div className="mb-6">
        <AskAIHelpPanel />
      </div>

      <div className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Tutorials</h2>
        <TutorialCards />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Frequently Asked Questions</h2>
          <FAQAccordion faqs={FAQS} />
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <LifeBuoy className="size-4" /> Support
              </h2>
              <p className="mb-3 text-xs text-muted-foreground">Can't find what you're looking for? Reach out to our support team.</p>
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" leftIcon={<Mail className="size-3.5" />}>
                  support@Nexora.com
                </Button>
              </div>
            </CardContent>
          </Card>

          <ErrorLogPanel />
        </div>
      </div>
    </div>
  )
}
