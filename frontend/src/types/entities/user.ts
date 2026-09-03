import type { Role } from '@/shared/lib/permissions'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  avatarUrl?: string
  jobTitle?: string
  phone?: string
  companyName?: string
  createdAt: string
}
