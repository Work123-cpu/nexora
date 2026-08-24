import type { User } from '@/types/entities/user'
import type { Role } from '@/shared/lib/permissions'
import { apiClient } from '@/shared/lib/apiClient'

export interface TeamMemberInput {
  name: string
  email: string
  password: string
  role: Role
  jobTitle?: string
}

interface BackendUser {
  id: string
  name: string
  email: string
  role: string
  jobTitle: string | null
  createdAt: string
}

function fromBackendUser(u: BackendUser): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role.toLowerCase() as Role,
    jobTitle: u.jobTitle ?? undefined,
    createdAt: u.createdAt,
  }
}

export const teamService = {
  getTeamMembers: (): Promise<User[]> => apiClient.get<BackendUser[]>('/team').then((list) => list.map(fromBackendUser)),

  createTeamMember: (input: TeamMemberInput): Promise<User> =>
    apiClient
      .post<BackendUser>('/team', { ...input, role: input.role.toUpperCase() })
      .then(fromBackendUser),

  updateTeamMemberRole: (id: string, role: Role): Promise<User> =>
    apiClient.put<BackendUser>(`/team/${id}/role`, { role: role.toUpperCase() }).then(fromBackendUser),

  removeTeamMember: (id: string): Promise<void> => apiClient.delete(`/team/${id}`),
}
