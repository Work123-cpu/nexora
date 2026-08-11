import { NavLink } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'

const REPORTS = [
  { label: 'Business', value: 'business' },
  { label: 'Inventory', value: 'inventory' },
  { label: 'Procurement', value: 'procurement' },
  { label: 'Forecast', value: 'forecast' },
  { label: 'Supplier', value: 'supplier' },
]

export function ReportNav() {
  return (
    <div className="mb-6 flex items-center gap-1 overflow-x-auto rounded-xl bg-surface-elevated p-1">
      {REPORTS.map((r) => (
        <NavLink
          key={r.value}
          to={`/app/reports/${r.value}`}
          className={({ isActive }) =>
            cn(
              'whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
              isActive ? 'bg-surface text-foreground card-shadow' : 'text-muted-foreground hover:text-foreground',
            )
          }
        >
          {r.label}
        </NavLink>
      ))}
    </div>
  )
}
