import { NavLink } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { useAuth } from '@/features/auth/context/AuthContext'

const TABS = [
  { label: 'Profile', to: '/app/account/profile' },
  { label: 'Settings', to: '/app/account/settings' },
  { label: 'Team', to: '/app/account/team', adminOnly: true },
]

export function AccountNav() {
  const { session } = useAuth()
  const tabs = TABS.filter((tab) => !tab.adminOnly || session?.role === 'admin')

  return (
    <div className="mb-6 flex items-center gap-1 rounded-xl bg-surface-elevated p-1 w-fit">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            cn(
              'rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
              isActive ? 'bg-surface text-foreground card-shadow' : 'text-muted-foreground hover:text-foreground',
            )
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  )
}
