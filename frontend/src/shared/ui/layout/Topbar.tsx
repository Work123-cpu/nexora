import { useNavigate } from 'react-router-dom'
import { Bell, LogOut, Menu, Moon, Search, Settings, Sun, User } from 'lucide-react'
import { useTheme } from '@/theme/ThemeProvider'
import { useAuth } from '@/features/auth/context/AuthContext'
import { Avatar } from '../Avatar'
import { IconButton } from '../IconButton'
import { Badge } from '../Badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../DropdownMenu'

interface TopbarProps {
  onMenuClick: () => void
  unreadNotifications?: number
  onOpenCommandPalette: () => void
}

export function Topbar({ onMenuClick, unreadNotifications = 0, onOpenCommandPalette }: TopbarProps) {
  const { resolvedTheme, toggleTheme } = useTheme()
  const { session, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur-xl lg:px-6">
      <IconButton icon={<Menu className="size-5" />} variant="ghost" aria-label="Open menu" className="lg:hidden" onClick={onMenuClick} />

      <button
        type="button"
        onClick={onOpenCommandPalette}
        className="relative hidden max-w-md flex-1 items-center rounded-xl border border-border bg-surface-elevated/60 text-left transition-colors hover:border-primary/50 lg:flex"
      >
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <span className="h-9 flex-1 truncate py-2 pl-9 pr-3 text-sm text-muted-foreground/70">Search or jump to…</span>
        <kbd className="mr-2 hidden rounded-md border border-border bg-surface px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">Ctrl K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <IconButton
          icon={resolvedTheme === 'dark' ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
          variant="ghost"
          aria-label="Toggle theme"
          onClick={toggleTheme}
        />

        <div className="relative">
          <IconButton
            icon={<Bell className="size-4.5" />}
            variant="ghost"
            aria-label="Notifications"
            onClick={() => navigate('/app/notifications')}
          />
          {unreadNotifications > 0 && (
            <Badge tone="danger" className="absolute -right-1 -top-1 min-w-[1.1rem] justify-center px-1 py-0 text-[10px]">
              {unreadNotifications}
            </Badge>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <div className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 transition-colors hover:bg-surface-elevated">
              <Avatar name={session?.user.name ?? 'Guest User'} size="sm" />
              <div className="hidden text-left sm:block">
                <p className="text-xs font-semibold leading-tight text-foreground">{session?.user.name ?? 'Guest'}</p>
                <p className="text-[11px] leading-tight text-muted-foreground">{session?.user.jobTitle ?? 'Viewer'}</p>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => navigate('/app/account/profile')}>
              <User className="size-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/app/account/settings')}>
              <Settings className="size-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              danger
              onClick={() => {
                logout()
                navigate('/login')
              }}
            >
              <LogOut className="size-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
