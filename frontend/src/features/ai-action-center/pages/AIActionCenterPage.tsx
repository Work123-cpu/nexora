import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Inbox, RotateCcw, XCircle } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent } from '@/shared/ui/Card'
import { Badge } from '@/shared/ui/Badge'
import { StatCard } from '@/shared/ui/StatCard'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/Tabs'
import { ConfidenceScoreBadge } from '@/shared/ui/ConfidenceScoreBadge'
import { useToast } from '@/shared/ui/Toast'
import { useInventoryItems } from '@/features/inventory/hooks/useInventory'
import { useActionQueue } from '../hooks/useActionQueue'
import { ApprovalDialog } from '../components/ApprovalDialog'
import type { AIRecommendation } from '@/lib/recommendation-engine/types'

const SEVERITY_TONE = { critical: 'danger', high: 'danger', medium: 'warning', low: 'success', info: 'info' } as const

function ActionRow({ recommendation, onReview }: { recommendation: AIRecommendation; onReview: () => void }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{recommendation.title}</p>
            <Badge tone={SEVERITY_TONE[recommendation.severity]} className="capitalize">
              {recommendation.severity}
            </Badge>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{recommendation.suggestedAction}</p>
        </div>
        <ConfidenceScoreBadge score={recommendation.confidenceScore} />
        <Button size="sm" onClick={onReview}>
          Review
        </Button>
      </CardContent>
    </Card>
  )
}

export function AIActionCenterPage() {
  const { pending, approved, dismissed, decide, resetQueue } = useActionQueue()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<AIRecommendation | null>(null)
  const { data: inventoryData } = useInventoryItems({ pageSize: 10000 })
  const inventoryItems = inventoryData?.items ?? []

  /** reorder/safety-stock recommendations have a real, single action to hand off to — mirrors
   * Procurement Recommendations' own Accept exactly. A raw material is genuinely bought from a
   * vendor, so that goes to a pre-filled Purchase Order. A product (e.g. Samosa) is made
   * in-house, not purchased from anyone — there's no vendor to prefill a PO with, so that instead
   * goes to the product's own (already-tracked) inventory entry with the restock pre-applied. The
   * other categories (supplier-risk, market-impact, production-plan) have no equivalent one-click
   * action, so approving them just records the decision. */
  const handleApprove = (recommendation: AIRecommendation) => {
    decide(recommendation.id, 'approved')
    if (recommendation.category === 'reorder' || recommendation.category === 'safety-stock') {
      const quantityMatch = recommendation.suggestedAction.match(/([\d.]+)\s*(\w+)?/)
      const quantity = quantityMatch ? Math.round(Number(quantityMatch[1])) : 100
      if (recommendation.entityType === 'rawMaterial') {
        navigate(`/app/procurement/purchase-orders/new?materialId=${recommendation.entityId}&quantity=${quantity}`)
        return
      }
      const inventoryItem = inventoryItems.find((i) => i.itemType === recommendation.entityType && i.itemId === recommendation.entityId)
      navigate(inventoryItem ? `/app/inventory/${inventoryItem.id}/edit?add=${quantity}` : '/app/inventory/add-stock')
      return
    }
    toast({ title: 'Action marked as approved', tone: 'success' })
  }

  return (
    <div>
      <PageHeader
        title="AI Action Center"
        description="Review and approve AI-recommended actions before they take effect. Nothing executes without your confirmation."
        actions={
          <Button variant="outline" leftIcon={<RotateCcw className="size-4" />} onClick={resetQueue}>
            Reset Queue
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Pending Review" value={String(pending.length)} icon={<Inbox className="size-5" />} tone="warning" />
        <StatCard label="Approved" value={String(approved.length)} icon={<CheckCircle2 className="size-5" />} tone="success" />
        <StatCard label="Dismissed" value={String(dismissed.length)} icon={<XCircle className="size-5" />} tone="info" />
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">Action Queue ({pending.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
          <TabsTrigger value="dismissed">Dismissed ({dismissed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3">
          {pending.length === 0 ? (
            <EmptyState icon={<CheckCircle2 className="size-5" />} title="Queue is clear" description="No pending AI-recommended actions right now." />
          ) : (
            pending.map((rec) => <ActionRow key={rec.id} recommendation={rec} onReview={() => setSelected(rec)} />)
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-3">
          {approved.length === 0 ? (
            <EmptyState title="No approved actions yet" />
          ) : (
            approved.map((rec) => (
              <Card key={rec.id}>
                <CardContent className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{rec.title}</p>
                  <Badge tone="success">Approved</Badge>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="dismissed" className="space-y-3">
          {dismissed.length === 0 ? (
            <EmptyState title="No dismissed actions" />
          ) : (
            dismissed.map((rec) => (
              <Card key={rec.id}>
                <CardContent className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{rec.title}</p>
                  <Badge tone="neutral">Dismissed</Badge>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <ApprovalDialog
        recommendation={selected}
        onClose={() => setSelected(null)}
        onApprove={handleApprove}
        onDismiss={(id) => {
          decide(id, 'dismissed')
          toast({ title: 'Action dismissed', tone: 'info' })
        }}
      />
    </div>
  )
}
