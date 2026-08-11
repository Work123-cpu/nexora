import { Check, X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { formatDateTime } from '@/shared/lib/formatters'
import type { PurchaseOrderStatus, PurchaseOrderTimelineEvent } from '@/types/entities/purchaseOrder'

const STAGES: PurchaseOrderStatus[] = ['draft', 'pending_approval', 'approved', 'ordered', 'in_transit', 'received']

const STAGE_LABEL: Record<PurchaseOrderStatus, string> = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  ordered: 'Ordered',
  in_transit: 'In Transit',
  received: 'Received',
  cancelled: 'Cancelled',
}

export function POTimeline({ timeline, currentStatus }: { timeline: PurchaseOrderTimelineEvent[]; currentStatus: PurchaseOrderStatus }) {
  const isCancelled = currentStatus === 'cancelled'
  const currentIndex = STAGES.indexOf(currentStatus)

  return (
    <ol className="space-y-0">
      {STAGES.map((stage, i) => {
        const event = timeline.find((e) => e.status === stage)
        const isDone = event !== undefined
        const isCurrent = stage === currentStatus
        const isLast = i === STAGES.length - 1

        return (
          <li key={stage} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold',
                  isDone ? 'border-primary bg-primary text-primary-foreground' : 'border-border-strong text-muted-foreground',
                  isCurrent && !isDone && 'border-primary text-primary',
                )}
              >
                {isDone ? <Check className="size-3.5" /> : i + 1}
              </span>
              {!isLast && <span className={cn('w-0.5 flex-1', isDone && STAGES.indexOf(stage) < currentIndex ? 'bg-primary' : 'bg-border')} style={{ minHeight: 28 }} />}
            </div>
            <div className="pb-7">
              <p className={cn('text-sm font-medium', isDone ? 'text-foreground' : 'text-muted-foreground')}>{STAGE_LABEL[stage]}</p>
              {event && <p className="text-xs text-muted-foreground">{formatDateTime(event.date)}</p>}
              {event?.note && <p className="text-xs text-muted-foreground">{event.note}</p>}
            </div>
          </li>
        )
      })}
      {isCancelled && (
        <li className="flex gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-danger bg-danger text-white">
            <X className="size-3.5" />
          </span>
          <div>
            <p className="text-sm font-medium text-danger">Cancelled</p>
            {timeline.find((e) => e.status === 'cancelled') && (
              <p className="text-xs text-muted-foreground">{formatDateTime(timeline.find((e) => e.status === 'cancelled')!.date)}</p>
            )}
          </div>
        </li>
      )}
    </ol>
  )
}
