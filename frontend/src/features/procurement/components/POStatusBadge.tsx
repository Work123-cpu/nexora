import { Badge, type BadgeTone } from '@/shared/ui/Badge'
import type { PurchaseOrderStatus } from '@/types/entities/purchaseOrder'

const TONE: Record<PurchaseOrderStatus, BadgeTone> = {
  draft: 'neutral',
  pending_approval: 'warning',
  approved: 'info',
  ordered: 'primary',
  in_transit: 'info',
  received: 'success',
  cancelled: 'danger',
}

const LABEL: Record<PurchaseOrderStatus, string> = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  ordered: 'Ordered',
  in_transit: 'In Transit',
  received: 'Received',
  cancelled: 'Cancelled',
}

export function POStatusBadge({ status }: { status: PurchaseOrderStatus }) {
  return (
    <Badge tone={TONE[status]} dot>
      {LABEL[status]}
    </Badge>
  )
}
