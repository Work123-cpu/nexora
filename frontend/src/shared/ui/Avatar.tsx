import { cn } from '@/shared/lib/cn'
import { initialsFromName } from '@/shared/lib/formatters'

interface AvatarProps {
  name: string
  src?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'size-7 text-[10px]',
  md: 'size-9 text-xs',
  lg: 'size-12 text-sm',
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover ring-2 ring-surface', sizeClasses[size], className)}
      />
    )
  }
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent font-semibold text-white ring-2 ring-surface',
        sizeClasses[size],
        className,
      )}
    >
      {initialsFromName(name)}
    </div>
  )
}
