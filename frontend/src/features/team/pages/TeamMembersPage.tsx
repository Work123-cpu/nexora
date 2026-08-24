import { useState, type FormEvent } from 'react'
import { AlertTriangle, Plus, Trash2, UserPlus, Users } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Card, CardContent } from '@/shared/ui/Card'
import { Avatar } from '@/shared/ui/Avatar'
import { Badge, type BadgeTone } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { IconButton } from '@/shared/ui/IconButton'
import { Input } from '@/shared/ui/Input'
import { Select } from '@/shared/ui/Select'
import { Dialog } from '@/shared/ui/Dialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { LoadingScreen } from '@/shared/ui/LoadingScreen'
import { useToast } from '@/shared/ui/Toast'
import { useAuth } from '@/features/auth/context/AuthContext'
import { AccountNav } from '@/features/account/components/AccountNav'
import { ALL_ROLES, roleLabel, type Role } from '@/shared/lib/permissions'
import { formatDate } from '@/shared/lib/formatters'
import { useTeamMembers, useCreateTeamMember, useUpdateTeamMemberRole, useRemoveTeamMember } from '../hooks/useTeam'

const ROLE_TONE: Record<Role, BadgeTone> = {
  admin: 'primary',
  procurement_manager: 'info',
  warehouse_manager: 'success',
  production_manager: 'warning',
  vendor: 'neutral',
  viewer: 'neutral',
}

const ASSIGNABLE_ROLES = ALL_ROLES.filter((r) => r !== 'vendor')

export function TeamMembersPage() {
  const { session } = useAuth()
  const { toast } = useToast()
  const { data: unsortedMembers, isLoading } = useTeamMembers()
  const members = unsortedMembers ? [...unsortedMembers].sort((a, b) => a.name.localeCompare(b.name)) : unsortedMembers
  const createMember = useCreateTeamMember()
  const updateRole = useUpdateTeamMemberRole()
  const removeMember = useRemoveTeamMember()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('viewer')
  const [error, setError] = useState<string | null>(null)

  if (session && session.role !== 'admin') {
    return (
      <div>
        <PageHeader title="Team Members" description="Manage who has access to your company's workspace." />
        <EmptyState icon={<Users className="size-5" />} title="Admins only" description="Ask a company Admin to manage team members." />
      </div>
    )
  }

  const resetForm = () => {
    setName('')
    setEmail('')
    setPassword('')
    setRole('viewer')
    setError(null)
  }

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const member = await createMember.mutateAsync({ name, email, password, role })
      toast({ title: 'Team member added', description: `${member.name} can now sign in as ${roleLabel(role)}.`, tone: 'success' })
      setDialogOpen(false)
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add this team member.')
    }
  }

  const handleRoleChange = async (id: string, nextRole: Role) => {
    try {
      await updateRole.mutateAsync({ id, role: nextRole })
      toast({ title: 'Role updated', tone: 'success' })
    } catch (err) {
      toast({ title: 'Could not update role', description: err instanceof Error ? err.message : undefined, tone: 'error' })
    }
  }

  const handleRemove = async (id: string, memberName: string) => {
    try {
      await removeMember.mutateAsync(id)
      toast({ title: 'Team member removed', description: `${memberName} can no longer sign in.`, tone: 'warning' })
    } catch (err) {
      toast({ title: 'Could not remove team member', description: err instanceof Error ? err.message : undefined, tone: 'error' })
    }
  }

  return (
    <div>
      <PageHeader
        title="Team Members"
        description="Manage who has access to your company's workspace, and what they can do."
        actions={
          <Button leftIcon={<UserPlus className="size-4" />} onClick={() => setDialogOpen(true)}>
            Add Team Member
          </Button>
        }
      />
      <AccountNav />

      {isLoading ? (
        <LoadingScreen label="Loading team…" />
      ) : !members || members.length === 0 ? (
        <EmptyState icon={<Users className="size-5" />} title="No team members yet" description="Add your first teammate to get started." />
      ) : (
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {members.map((member) => {
              const isSelf = member.id === session?.user.id
              return (
                <div key={member.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={member.name} size="md" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {member.name} {isSelf && <span className="text-xs text-muted-foreground">(you)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="hidden text-xs text-muted-foreground sm:block">
                      Joined {formatDate(member.createdAt)}
                    </p>
                    {isSelf ? (
                      <Badge tone={ROLE_TONE[member.role]}>{roleLabel(member.role)}</Badge>
                    ) : (
                      <Select
                        className="h-9 w-44"
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value as Role)}
                        options={ASSIGNABLE_ROLES.map((r) => ({ label: roleLabel(r), value: r }))}
                      />
                    )}
                    {!isSelf && (
                      <IconButton
                        icon={<Trash2 className="size-4 text-danger" />}
                        variant="ghost"
                        aria-label={`Remove ${member.name}`}
                        onClick={() => handleRemove(member.id, member.name)}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          resetForm()
        }}
        title="Add Team Member"
        description="They'll be able to sign in with this email and password right away."
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input
            label="Temporary password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          <Select
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            options={ASSIGNABLE_ROLES.map((r) => ({ label: roleLabel(r), value: r }))}
          />

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
              <AlertTriangle className="size-4 shrink-0" /> {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMember.isPending} leftIcon={<Plus className="size-4" />}>
              Add Member
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
