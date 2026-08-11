import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Role } from '@/shared/lib/permissions'
import { teamService, type TeamMemberInput } from '../services/teamService'

export const teamKeys = {
  all: ['team'] as const,
}

export function useTeamMembers() {
  return useQuery({ queryKey: teamKeys.all, queryFn: () => teamService.getTeamMembers() })
}

export function useCreateTeamMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: TeamMemberInput) => teamService.createTeamMember(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teamKeys.all }),
  })
}

export function useUpdateTeamMemberRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => teamService.updateTeamMemberRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teamKeys.all }),
  })
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => teamService.removeTeamMember(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teamKeys.all }),
  })
}
