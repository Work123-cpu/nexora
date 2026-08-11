import type { User } from '@/types/entities/user'

export const teamMembers: User[] = [
  {
    id: 'user-0001',
    name: 'Aditya Kapoor',
    email: 'you@yourcompany.com',
    role: 'admin',
    jobTitle: 'Procurement Director',
    createdAt: new Date().toISOString(),
  },
]
