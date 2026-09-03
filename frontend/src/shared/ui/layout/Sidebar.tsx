import { NavLink } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { NAV_SECTIONS } from '@/app/router/navConfig'
import { cn } from '@/shared/lib/cn'
import { useAuth } from '@/features/auth/context/AuthContext'
import { Badge } from '../Badge'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen?: boolean
  onCloseMobile?: () => void
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onCloseMobile }: SidebarProps) {
  const { session } = useAuth()
  const role = session?.role

  const visibleSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.roles || (role && item.roles.includes(role))),
  })).filter((section) => section.items.length > 0)

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-overlay/50 backdrop-blur-sm lg:hidden" onClick={onCloseMobile} />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-gradient-to-b from-surface to-surface-elevated/60 transition-all duration-200 lg:sticky lg:top-0 lg:z-0 lg:h-screen',
          collapsed ? 'w-[76px]' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-border px-4">
          <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-black shadow-md shadow-primary/20">
            <img src="/logo.png" alt="Nexora" className="h-full w-full object-cover object-[center_18%]" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">Nexora</p>
              <p className="truncate text-[11px] text-muted-foreground">Smart Procurement</p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {visibleSections.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/app'}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all',
                        isActive
                          ? 'bg-gradient-to-r from-primary/20 to-primary/5 text-primary shadow-[inset_0_1px_0_rgb(255_255_255/0.06)] before:absolute before:inset-y-1 before:left-0 before:w-[3px] before:rounded-full before:bg-gradient-to-b before:from-primary before:to-accent before:shadow-[0_0_8px_rgb(var(--primary)/0.6)]'
                          : 'text-muted-foreground hover:bg-surface-elevated hover:text-foreground',
                        collapsed && 'justify-center px-0',
                      )
                    }
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className="size-[18px] shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {!collapsed && item.badgeCount ? (
                      <Badge tone="danger" className="ml-auto px-1.5 py-0">
                        {item.badgeCount}
                      </Badge>
                    ) : null}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          {!collapsed && (
            <NavLink
              to="/setup"
              className="mb-2 flex items-center gap-2 rounded-xl bg-primary-soft px-3 py-2.5 text-xs font-medium text-primary transition-colors hover:brightness-95"
            >
              <Sparkles className="size-4" />
              Continue AI Setup
            </NavLink>
          )}
          <button
            onClick={onToggle}
            className="hidden w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-elevated hover:text-foreground lg:flex"
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            {!collapsed && 'Collapse'}
          </button>
        </div>
      </aside>
    </>
  )
}
