import { Badge } from '@/shared/ui/Badge'
import type { ProductStatus } from '@/types/entities/product'

const TONE: Record<ProductStatus, 'success' | 'neutral' | 'danger'> = {
  active: 'success',
  inactive: 'neutral',
  discontinued: 'danger',
}

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return (
    <Badge tone={TONE[status]} dot className="capitalize">
      {status}
    </Badge>
  )
}
