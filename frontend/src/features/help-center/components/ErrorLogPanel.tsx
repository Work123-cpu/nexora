import { useState } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { formatRelativeTime } from '@/shared/lib/formatters'
import { readErrorLog, clearErrorLog } from '@/shared/lib/errorLog'

/** Shows recent uncaught errors captured by GlobalErrorListener — the reviewable half of the pop-up toast. */
export function ErrorLogPanel() {
  const [entries, setEntries] = useState(readErrorLog)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4" /> Error Log
          </CardTitle>
          {entries.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Trash2 className="size-3.5" />}
              onClick={() => {
                clearErrorLog()
                setEntries([])
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <EmptyState icon={<AlertTriangle className="size-5" />} title="No errors recorded" description="Any unexpected errors that occur will show up here." />
        ) : (
          <ul className="space-y-2">
            {entries.map((e) => (
              <li key={e.id} className="rounded-xl border border-border bg-surface-elevated/50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{e.message}</p>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{formatRelativeTime(e.timestamp)}</span>
                </div>
                {e.detail && <p className="mt-1 truncate text-xs text-muted-foreground">{e.detail.split('\n')[0]}</p>}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
