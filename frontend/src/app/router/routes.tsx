import { lazy } from 'react'
import { Navigate, type RouteObject } from 'react-router-dom'
import { AppShellLayout } from '@/app/layouts/AppShellLayout'
import { AuthLayout } from '@/app/layouts/AuthLayout'
import { SetupWizardLayout } from '@/app/layouts/SetupWizardLayout'
import { BlankLayout } from '@/app/layouts/BlankLayout'
import { NotFoundPage } from './NotFoundPage'

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })))
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })))

const CommandCenterPage = lazy(() => import('@/features/command-center/pages/CommandCenterPage').then((m) => ({ default: m.CommandCenterPage })))

const ProductListPage = lazy(() => import('@/features/products/pages/ProductListPage').then((m) => ({ default: m.ProductListPage })))
const ProductCreateWizardPage = lazy(() =>
  import('@/features/products/pages/ProductCreateWizardPage').then((m) => ({ default: m.ProductCreateWizardPage })),
)
const ProductDetailPage = lazy(() => import('@/features/products/pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })))
const ProductEditPage = lazy(() => import('@/features/products/pages/ProductEditPage').then((m) => ({ default: m.ProductEditPage })))

const RawMaterialListPage = lazy(() => import('@/features/raw-materials/pages/RawMaterialListPage').then((m) => ({ default: m.RawMaterialListPage })))
const RawMaterialCreatePage = lazy(() => import('@/features/raw-materials/pages/RawMaterialCreatePage').then((m) => ({ default: m.RawMaterialCreatePage })))
const RawMaterialDetailPage = lazy(() => import('@/features/raw-materials/pages/RawMaterialDetailPage').then((m) => ({ default: m.RawMaterialDetailPage })))
const RawMaterialEditPage = lazy(() => import('@/features/raw-materials/pages/RawMaterialEditPage').then((m) => ({ default: m.RawMaterialEditPage })))

const BomListPage = lazy(() => import('@/features/bom/pages/BomListPage').then((m) => ({ default: m.BomListPage })))
const BomCreatePage = lazy(() => import('@/features/bom/pages/BomCreatePage').then((m) => ({ default: m.BomCreatePage })))
const BomEditPage = lazy(() => import('@/features/bom/pages/BomEditPage').then((m) => ({ default: m.BomEditPage })))

const InventoryDashboardPage = lazy(() => import('@/features/inventory/pages/InventoryDashboardPage').then((m) => ({ default: m.InventoryDashboardPage })))
const InventoryAddStockPage = lazy(() => import('@/features/inventory/pages/InventoryAddStockPage').then((m) => ({ default: m.InventoryAddStockPage })))
const InventoryEditPage = lazy(() => import('@/features/inventory/pages/InventoryEditPage').then((m) => ({ default: m.InventoryEditPage })))
const StockMovementsPage = lazy(() => import('@/features/inventory/pages/StockMovementsPage').then((m) => ({ default: m.StockMovementsPage })))
const WarehouseListPage = lazy(() => import('@/features/warehouse/pages/WarehouseListPage').then((m) => ({ default: m.WarehouseListPage })))
const WarehouseCreatePage = lazy(() => import('@/features/warehouse/pages/WarehouseCreatePage').then((m) => ({ default: m.WarehouseCreatePage })))
const WarehouseDetailPage = lazy(() => import('@/features/warehouse/pages/WarehouseDetailPage').then((m) => ({ default: m.WarehouseDetailPage })))
const WarehouseEditPage = lazy(() => import('@/features/warehouse/pages/WarehouseEditPage').then((m) => ({ default: m.WarehouseEditPage })))

const PurchaseOrderListPage = lazy(() => import('@/features/procurement/pages/PurchaseOrderListPage').then((m) => ({ default: m.PurchaseOrderListPage })))
const PurchaseOrderCreatePage = lazy(() => import('@/features/procurement/pages/PurchaseOrderCreatePage').then((m) => ({ default: m.PurchaseOrderCreatePage })))
const PurchaseOrderDetailPage = lazy(() => import('@/features/procurement/pages/PurchaseOrderDetailPage').then((m) => ({ default: m.PurchaseOrderDetailPage })))
const RecommendationsPage = lazy(() => import('@/features/procurement/pages/RecommendationsPage').then((m) => ({ default: m.RecommendationsPage })))

const BillListPage = lazy(() => import('@/features/billing/pages/BillListPage').then((m) => ({ default: m.BillListPage })))
const BillCreatePage = lazy(() => import('@/features/billing/pages/BillCreatePage').then((m) => ({ default: m.BillCreatePage })))
const BillDetailPage = lazy(() => import('@/features/billing/pages/BillDetailPage').then((m) => ({ default: m.BillDetailPage })))

const VendorListPage = lazy(() => import('@/features/vendors/pages/VendorListPage').then((m) => ({ default: m.VendorListPage })))
const VendorCreatePage = lazy(() => import('@/features/vendors/pages/VendorCreatePage').then((m) => ({ default: m.VendorCreatePage })))
const VendorDetailPage = lazy(() => import('@/features/vendors/pages/VendorDetailPage').then((m) => ({ default: m.VendorDetailPage })))
const VendorEditPage = lazy(() => import('@/features/vendors/pages/VendorEditPage').then((m) => ({ default: m.VendorEditPage })))

const ReportsPage = lazy(() => import('@/features/reports/pages/ReportsPage').then((m) => ({ default: m.ReportsPage })))
const MarketIntelligencePage = lazy(() => import('@/features/market-intelligence/pages/MarketIntelligencePage').then((m) => ({ default: m.MarketIntelligencePage })))
const BusinessCalendarPage = lazy(() => import('@/features/business-calendar/pages/BusinessCalendarPage').then((m) => ({ default: m.BusinessCalendarPage })))

const AIHealthCheckPage = lazy(() => import('@/features/ai-health-check/pages/AIHealthCheckPage').then((m) => ({ default: m.AIHealthCheckPage })))
const AIActionCenterPage = lazy(() => import('@/features/ai-action-center/pages/AIActionCenterPage').then((m) => ({ default: m.AIActionCenterPage })))

const NotificationsPage = lazy(() => import('@/features/notifications/pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })))
const HelpCenterPage = lazy(() => import('@/features/help-center/pages/HelpCenterPage').then((m) => ({ default: m.HelpCenterPage })))

const ProfilePage = lazy(() => import('@/features/account/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const SettingsPage = lazy(() => import('@/features/account/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const TeamMembersPage = lazy(() => import('@/features/team/pages/TeamMembersPage').then((m) => ({ default: m.TeamMembersPage })))

const SetupWizardPage = lazy(() => import('@/features/ai-setup-wizard/pages/SetupWizardPage').then((m) => ({ default: m.SetupWizardPage })))
const WelcomeChoicePage = lazy(() => import('@/features/ai-setup-wizard/pages/WelcomeChoicePage').then((m) => ({ default: m.WelcomeChoicePage })))

export const routes: RouteObject[] = [
  { path: '/', element: <Navigate to="/app" replace /> },
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
    ],
  },
  {
    path: '/app',
    element: <AppShellLayout />,
    children: [
      { index: true, element: <CommandCenterPage /> },
      { path: 'products', element: <ProductListPage /> },
      { path: 'products/new', element: <ProductCreateWizardPage /> },
      { path: 'products/:id', element: <ProductDetailPage /> },
      { path: 'products/:id/edit', element: <ProductEditPage /> },
      { path: 'raw-materials', element: <RawMaterialListPage /> },
      { path: 'raw-materials/new', element: <RawMaterialCreatePage /> },
      { path: 'raw-materials/:id', element: <RawMaterialDetailPage /> },
      { path: 'raw-materials/:id/edit', element: <RawMaterialEditPage /> },
      { path: 'bom', element: <BomListPage /> },
      { path: 'bom/new', element: <BomCreatePage /> },
      { path: 'bom/:id/edit', element: <BomEditPage /> },
      { path: 'inventory', element: <InventoryDashboardPage /> },
      { path: 'inventory/add-stock', element: <InventoryAddStockPage /> },
      { path: 'inventory/movements', element: <StockMovementsPage /> },
      { path: 'inventory/:id/edit', element: <InventoryEditPage /> },
      { path: 'inventory/warehouses', element: <WarehouseListPage /> },
      { path: 'inventory/warehouses/new', element: <WarehouseCreatePage /> },
      { path: 'inventory/warehouses/:id', element: <WarehouseDetailPage /> },
      { path: 'inventory/warehouses/:id/edit', element: <WarehouseEditPage /> },
      { path: 'procurement/purchase-orders', element: <PurchaseOrderListPage /> },
      { path: 'procurement/purchase-orders/new', element: <PurchaseOrderCreatePage /> },
      { path: 'procurement/purchase-orders/:id', element: <PurchaseOrderDetailPage /> },
      { path: 'procurement/recommendations', element: <RecommendationsPage /> },
      { path: 'billing', element: <BillListPage /> },
      { path: 'billing/new', element: <BillCreatePage /> },
      { path: 'billing/:id', element: <BillDetailPage /> },
      { path: 'vendors', element: <VendorListPage /> },
      { path: 'vendors/new', element: <VendorCreatePage /> },
      { path: 'vendors/:id', element: <VendorDetailPage /> },
      { path: 'vendors/:id/edit', element: <VendorEditPage /> },
      { path: 'reports/:reportType', element: <ReportsPage /> },
      { path: 'market-intelligence', element: <MarketIntelligencePage /> },
      { path: 'business-calendar', element: <BusinessCalendarPage /> },
      { path: 'ai/health-check', element: <AIHealthCheckPage /> },
      { path: 'ai/action-center', element: <AIActionCenterPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'help-center', element: <HelpCenterPage /> },
      { path: 'account/profile', element: <ProfilePage /> },
      { path: 'account/settings', element: <SettingsPage /> },
      { path: 'account/team', element: <TeamMembersPage /> },
    ],
  },
  {
    path: '/setup',
    element: <SetupWizardLayout />,
    children: [{ index: true, element: <SetupWizardPage /> }],
  },
  {
    path: '/welcome',
    element: <SetupWizardLayout />,
    children: [{ index: true, element: <WelcomeChoicePage /> }],
  },
  {
    element: <BlankLayout />,
    children: [{ path: '*', element: <NotFoundPage /> }],
  },
]
