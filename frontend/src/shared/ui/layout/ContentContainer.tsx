import type { HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

export function ContentContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  // pb reserves room at the bottom so the fixed chat launcher FAB (bottom-5 right-5, size-14)
  // never sits on top of page content like right-aligned form submit buttons.
  return <div className={cn('mx-auto w-full max-w-[1600px] px-4 py-6 pb-24 lg:px-8 lg:py-8 lg:pb-24', className)} {...props} />
}
