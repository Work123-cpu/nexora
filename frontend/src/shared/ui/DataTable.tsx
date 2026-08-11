import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Inbox } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { SkeletonTable } from './Skeleton'
import { EmptyState } from './EmptyState'

export interface DataTableColumn<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  sortable?: boolean
  className?: string
  headerClassName?: string
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  isLoading?: boolean
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  onSortChange?: (key: string) => void
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  rowKey,
  onRowClick,
  sortBy,
  sortDir,
  onSortChange,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your filters or search terms.',
  emptyAction,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-surface p-5">
        <SkeletonTable cols={columns.length} />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-2">
        <EmptyState icon={<Inbox className="size-6" />} title={emptyTitle} description={emptyDescription} action={emptyAction} />
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-elevated/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn('whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground', col.headerClassName)}
                >
                  {col.sortable && onSortChange ? (
                    <button
                      onClick={() => onSortChange(col.key)}
                      className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                    >
                      {col.header}
                      {sortBy === col.key ? (
                        sortDir === 'asc' ? (
                          <ArrowUp className="size-3" />
                        ) : (
                          <ArrowDown className="size-3" />
                        )
                      ) : (
                        <ArrowUpDown className="size-3 opacity-40" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'border-b border-border last:border-0 transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-surface-elevated/60',
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-3.5 text-foreground', col.className)}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
