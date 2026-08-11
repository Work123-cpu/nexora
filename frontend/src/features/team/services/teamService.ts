import type { User } from '@/types/entities/user'
import type { Role } from '@/shared/lib/permissions'
import { mockClient, findOrThrow, insertMock, removeMock } from '@/services/base/mockClient'
import { teamMembers } from '@/mocks/seed/teamMembers.seed'
import { makeIdFactory } from '@/mocks/generators/idGenerator'
import { apiClient } from '@/shared/lib/apiClient'
import { ApiError } from '@/services/base/types'

const nextId = makeIdFactory('user-new')

const USE_MOCK_BACKEND = import.meta.env.VITE_USE_MOCK_BACKEND !== 'false'

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

const mockTeamService = {
  getTeamMembers: (): Promise<User[]> => mockClient.request(() => [...teamMembers]),

  createTeamMember: (input: TeamMemberInput): Promise<User> =>
    mockClient.request(() => {
      if (teamMembers.some((m) => m.email.toLowerCase() === input.email.toLowerCase())) {
        throw new ApiError(400, 'An account with this email already exists')
      }
      const member: User = {
        id: nextId(),
        name: input.name,
        email: input.email,
        role: input.role,
        jobTitle: input.jobTitle,
        createdAt: new Date().toISOString(),
      }
      return insertMock(teamMembers, member)
    }),

  updateTeamMemberRole: (id: string, role: Role): Promise<User> =>
    mockClient.request(() => {
      const member = findOrThrow(teamMembers, id)
      member.role = role
      return member
    }),

  removeTeamMember: (id: string): Promise<void> =>
    mockClient.request(() => {
      removeMock(teamMembers, id)
    }),
}

const httpTeamService = {
  getTeamMembers: (): Promise<User[]> => apiClient.get<BackendUser[]>('/team').then((list) => list.map(fromBackendUser)),

  createTeamMember: (input: TeamMemberInput): Promise<User> =>
    apiClient
      .post<BackendUser>('/team', { ...input, role: input.role.toUpperCase() })
      .then(fromBackendUser),

  updateTeamMemberRole: (id: string, role: Role): Promise<User> =>
    apiClient.put<BackendUser>(`/team/${id}/role`, { role: role.toUpperCase() }).then(fromBackendUser),

  removeTeamMember: (id: string): Promise<void> => apiClient.delete(`/team/${id}`),
}

export const teamService = USE_MOCK_BACKEND ? mockTeamService : httpTeamService
