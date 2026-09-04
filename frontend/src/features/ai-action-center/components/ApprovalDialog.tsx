import { useState } from 'react'
import { CheckCircle2, ShieldCheck } from 'lucide-react'
import { Dialog } from '@/shared/ui/Dialog'
import { Button } from '@/shared/ui/Button'
import { ConfidenceScoreBadge } from '@/shared/ui/ConfidenceScoreBadge'
import { BusinessImpactSummary } from '@/shared/components/BusinessImpactSummary'
import type { AIRecommendation } from '@/lib/recommendation-engine/types'

interface ApprovalDialogProps {
  recommendation: AIRecommendation | null
  onClose: () => void
  onApprove: (recommendation: AIRecommendation) => void
  onDismiss: (id: string) => void
}

/** reorder/safety-stock approvals navigate straight to a pre-filled Purchase Order instead of
 * showing this confirmation screen (see onApprove below) — there's a real action to hand off to.
 * The other categories have no equivalent single action to take, so this screen is honest about
 * only having recorded a reviewed/agreed decision, not that anything was carried out. */
export function ApprovalDialog({ recommendation, onClose, onDismiss, onApprove }: ApprovalDialogProps) {
  const [confirmed, setConfirmed] = useState(false)

  const handleClose = () => {
    setConfirmed(false)
    onClose()
  }

  if (!recommendation) return null

  if (confirmed) {
    return (
      <Dialog open onClose={handleClose} title="Marked as approved">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-success-soft text-success">
            <CheckCircle2 className="size-7" />
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{recommendation.suggestedAction}</span> has been marked approved. There's no automated action for this
            recommendation type — you'll still need to carry it out yourself.
          </p>
          <Button onClick={handleClose}>Done</Button>
        </div>
      </Dialog>
    )
  }

  return (
    <Dialog
      open
      onClose={handleClose}
      title={recommendation.title}
      description="Review the business impact before approving this AI-recommended action."
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => {
              onDismiss(recommendation.id)
              handleClose()
            }}
          >
            Dismiss
          </Button>
          <Button
            leftIcon={<ShieldCheck className="size-4" />}
            onClick={() => {
              const actionable = recommendation.category === 'reorder' || recommendation.category === 'safety-stock'
              onApprove(recommendation)
              // Actionable categories navigate to a pre-filled PO instead (see AIActionCenterPage),
              // which unmounts this dialog — no confirmation screen needed on top of that.
              if (!actionable) setConfirmed(true)
            }}
          >
            Approve Action
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{recommendation.reason}</p>

        <BusinessImpactSummary
          metrics={[
            { label: 'Business Impact', value: recommendation.businessImpact, tone: 'neutral' },
            { label: 'Expected Benefit', value: recommendation.expectedBenefit, tone: 'success' },
          ]}
          footer={
            <div>
              <p className="mb-1 font-medium text-foreground">Risks if ignored</p>
              <ul className="list-inside list-disc space-y-0.5">
                {recommendation.risks.map((risk, i) => (
                  <li key={i}>{risk}</li>
                ))}
              </ul>
            </div>
          }
        />

        <div className="flex items-center justify-between">
          <ConfidenceScoreBadge score={recommendation.confidenceScore} />
          <p className="text-sm font-medium text-foreground">Suggested: {recommendation.suggestedAction}</p>
        </div>
      </div>
    </Dialog>
  )
}
