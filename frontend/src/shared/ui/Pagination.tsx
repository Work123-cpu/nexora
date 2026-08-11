import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { IconButton } from './IconButton'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  total?: number
  pageSize?: number
}

function getPageRange(page: number, totalPages: number): (number | 'ellipsis')[] {
  const delta = 1
  const range: (number | 'ellipsis')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
      range.push(i)
    } else if (range[range.length - 1] !== 'ellipsis') {
      range.push('ellipsis')
    }
  }
  return range
}

export function Pagination({ page, totalPages, onPageChange, total, pageSize }: PaginationProps) {
  const range = getPageRange(page, totalPages)

  return (
    <div className="flex items-center justify-between gap-4">
      {total !== undefined && pageSize !== undefined && (
        <p className="text-xs text-muted-foreground">
          Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}
        </p>
      )}
      <div className="ml-auto flex items-center gap-1">
        <IconButton
          icon={<ChevronLeft className="size-4" />}
          variant="ghost"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        />
        {range.map((item, i) =>
          item === 'ellipsis' ? (
            <span key={`e-${i}`} className="px-1 text-sm text-muted-foreground">
              …
            </span>
          ) : (
            <button
              key={item}
              onClick={() => onPageChange(item)}
              className={cn(
                'flex size-8 items-center justify-center rounded-lg text-sm font-medium transition-colors focus-ring',
                item === page ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-surface-elevated',
              )}
            >
              {item}
            </button>
          ),
        )}
        <IconButton
          icon={<ChevronRight className="size-4" />}
          variant="ghost"
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        />
      </div>
    </div>
  )
}
