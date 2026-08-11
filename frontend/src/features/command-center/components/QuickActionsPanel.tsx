import { Link } from 'react-router-dom'
import { FilePlus2, HeartPulse, PackagePlus, ShoppingCart, Sparkles, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card'

const ACTIONS = [
  { label: 'Create Purchase Order', to: '/app/procurement/purchase-orders/new', icon: ShoppingCart },
  { label: 'Add Product', to: '/app/products/new', icon: PackagePlus },
  { label: 'Add Vendor', to: '/app/vendors', icon: Users },
  { label: 'Run Health Check', to: '/app/ai/health-check', icon: HeartPulse },
  { label: 'Generate Report', to: '/app/reports/business', icon: FilePlus2 },
  { label: 'AI Action Center', to: '/app/ai/action-center', icon: Sparkles },
]

export function QuickActionsPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {ACTIONS.map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 text-center transition-colors hover:border-primary hover:bg-primary-soft"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <action.icon className="size-4.5" />
              </div>
              <span className="text-xs font-medium text-foreground">{action.label}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
