import { Link } from 'react-router-dom'
import { BarChart3, ListTree, Package, ShoppingCart, Sparkles, Warehouse } from 'lucide-react'
import { Card, CardContent } from '@/shared/ui/Card'

const TUTORIALS = [
  { title: 'Getting Started with Nexora', description: 'A quick tour of the Command Center and core modules.', icon: Sparkles, to: '/app' },
  { title: 'Managing Your Product Catalog', description: 'Add, edit, and organize products and categories.', icon: Package, to: '/app/products' },
  { title: 'Building a Bill of Materials', description: 'Link raw materials to products and calculate costs.', icon: ListTree, to: '/app/bom' },
  { title: 'Understanding Reorder Points', description: 'How safety stock and reorder points are calculated.', icon: Warehouse, to: '/app/inventory' },
  { title: 'Creating Purchase Orders', description: 'From AI recommendation to approved order.', icon: ShoppingCart, to: '/app/procurement/purchase-orders' },
  { title: 'Reading Your Reports', description: 'Interpreting inventory, procurement, and forecast reports.', icon: BarChart3, to: '/app/reports/business' },
]

export function TutorialCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {TUTORIALS.map((tutorial) => (
        <Link key={tutorial.title} to={tutorial.to}>
          <Card interactive className="h-full">
            <CardContent>
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <tutorial.icon className="size-5" />
              </div>
              <p className="mt-3 text-sm font-semibold text-foreground">{tutorial.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{tutorial.description}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
