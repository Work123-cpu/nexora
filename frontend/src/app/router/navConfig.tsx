import {
  LayoutDashboard,
  Package,
  Boxes,
  ListTree,
  Warehouse,
  ShoppingCart,
  Receipt,
  Truck,
  BarChart3,
  CalendarDays,
  HeartPulse,
  Sparkles,
  Globe2,
  Bell,
  HelpCircle,
  Users,
  History,
  Lightbulb,
  Factory,
  type LucideIcon,
} from 'lucide-react'
import type { Role } from '@/shared/lib/permissions'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  roles?: Role[]
  badgeCount?: number
}

export interface NavSection {
  label: string
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Overview',
    items: [{ label: 'Command Center', to: '/app', icon: LayoutDashboard }],
  },
  {
    label: 'Catalog',
    items: [
      { label: 'Products', to: '/app/products', icon: Package },
      { label: 'Raw Materials', to: '/app/raw-materials', icon: Boxes },
      { label: 'Bill of Materials', to: '/app/bom', icon: ListTree },
      { label: 'Production Planning', to: '/app/production/planning', icon: Factory },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Inventory', to: '/app/inventory', icon: Boxes },
      { label: 'Warehouses', to: '/app/inventory/warehouses', icon: Warehouse },
      { label: 'Stock Movements', to: '/app/inventory/movements', icon: History, roles: ['admin'] },
      { label: 'Purchase Orders', to: '/app/procurement/purchase-orders', icon: ShoppingCart },
      { label: 'Recommendations', to: '/app/procurement/recommendations', icon: Lightbulb },
      { label: 'Billing', to: '/app/billing', icon: Receipt },
      { label: 'Vendors', to: '/app/vendors', icon: Truck },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { label: 'Market Intelligence', to: '/app/market-intelligence', icon: Globe2 },
      { label: 'Reports', to: '/app/reports/business', icon: BarChart3 },
      { label: 'Business Calendar', to: '/app/business-calendar', icon: CalendarDays },
    ],
  },
  {
    label: 'AI',
    items: [
      { label: 'AI Health Check', to: '/app/ai/health-check', icon: HeartPulse },
      { label: 'AI Action Center', to: '/app/ai/action-center', icon: Sparkles },
    ],
  },
  {
    label: 'Support',
    items: [
      { label: 'Notifications', to: '/app/notifications', icon: Bell },
      { label: 'Help Center', to: '/app/help-center', icon: HelpCircle },
    ],
  },
  {
    label: 'Company',
    items: [{ label: 'Team Members', to: '/app/account/team', icon: Users, roles: ['admin'] }],
  },
]
