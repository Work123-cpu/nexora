import type { HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

export function ContentContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mx-auto w-full max-w-[1600px] px-4 py-6 lg:px-8 lg:py-8', className)} {...props} />
}
