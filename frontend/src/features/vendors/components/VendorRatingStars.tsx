import { Star } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

export function VendorRatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn('size-3.5', i < Math.round(rating) ? 'fill-warning text-warning' : 'text-border-strong')} />
      ))}
      <span className="ml-1 text-xs font-medium text-muted-foreground">{rating.toFixed(1)}</span>
    </div>
  )
}
