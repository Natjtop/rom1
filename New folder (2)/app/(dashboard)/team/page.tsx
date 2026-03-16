"use client"

import { useState, useEffect, useCallback } from "react"
import { UserPlus, Pencil, Trash2, Users, Wifi, Clock, Shield, Eye, Headphones, AlertTriangle, Hourglass } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn, getInitials } from "@/lib/utils"
import { team as teamApi } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { subscribeToWorkspace, unsubscribeFromWorkspace, PusherEvents } from "@/lib/pusher-client"

// --- Types -------------------------------------------------------------------

type Role = "Admin" | "Agent" | "Viewer" | "Pending"
type Status = "Online" | "Away" | "Offline"

interface Member {
  id: string
  name: string
  email: string
  role: Role
  lastActive: string
  status: Status
  initials: string
  isOwner?: boolean
}

function mapApiUserToMember(user: Record<string, unknown>): Member {
  const name = (user.name as string) || (user.email as string) || "Unknown"
  const role = (user.role as string) || "Agent"
  const isPending = !!(user.pending)
  const mappedRole: Role = isPending ? "Pending" : role === "ADMIN" ? "Admin" : role === "VIEWER" ? "Viewer" : "Agent"
  return {
    id: (user.id as string) || String(Date.now()),
    name,
    email: (user.email as string) || "",
    role: mappedRole,
    lastActive: user.lastActive ? String(user.lastActive) : "recently",
    status: (user.status as Status) || "Offline",
    initials: getInitials(name),
    isOwner: Boolean(user.isOwner),
  }
}

// --- Sub-components ----------------------------------------------------------

function StatusBadge({ status }: { status: Status }) {
  const dotColor =
    status === "Online"  ? "bg-emerald-500" :
    status === "Away"    ? "bg-amber-400"   :
                           "bg-muted-foreground/40"

  const textColor =
    status === "Online"  ? "text-emerald-700" :
    status === "Away"    ? "text-amber-700"   :
                           "text-muted-foreground"

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[12px] font-medium", textColor)}>
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotColor, status === "Online" && "animate-pulse")} />
      {status}
    </span>
  )
}

function RoleBadge({ role }: { role: Role }) {
  const roleStyles: Record<Role, { bg: string; icon: React.ElementType }> = {
    Admin: { bg: "bg-accent/10 text-accent border border-accent/20", icon: Shield },
    Agent: { bg: "bg-foreground/5 text-foreground/80 border border-foreground/10", icon: Headphones },
    Viewer: { bg: "bg-secondary text-muted-foreground border border-border/40", icon: Eye },
    Pending: { bg: "bg-amber-500/10 text-amber-600 border border-amber-500/20", icon: Hourglass },
  }

  const style = roleStyles[role]
  const Icon = style.icon

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        style.bg,
      )}
    >
      <Icon className="h-3 w-3 shrink-0" />
      {role}
    </span>
  )
}

// Avatar color palette for team members
const avatarColors: Record<string, string> = {
  Admin: "bg-accent/10 text-accent",
  Agent: "bg-foreground/5 text-foreground/80",
  Viewer: "bg-secondary text-muted-foreground",
}

function MemberAvatar({ initials, role, size = "sm" }: { initials: string; role: Role; size?: "sm" | "md" }) {
  return (
    <div className={cn(
      "flex items-center justify-center rounded-full font-semibold transition-transform duration-150 group-hover:scale-105 shrink-0",
      size === "md" ? "h-10 w-10 text-[13px]" : "h-8 w-8 text-[11px]",
      avatarColors[role] || "bg-secondary text-foreground"
    )}>
      {initials}
    </div>
  )
}

// Role picker shared between invite and edit dialogs
function RolePicker({
  selectedRole,
  onSelect,
  disabled,
}: {
  selectedRole: Role
  onSelect: (role: Role) => void
  disabled?: boolean
}) {
  const roleConfig: Record<string, { icon: React.ElementType; desc: string }> = {
    Admin: { icon: Shield, desc: "Full access" },
    Agent: { icon: Headphones, desc: "Handle tickets" },
    Viewer: { icon: Eye, desc: "Read only" },
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {(["Admin", "Agent", "Viewer"] as Role[]).map((role) => {
        const config = roleConfig[role]
        const isSelected = selectedRole === role
        return (
          <button
            key={role}
            type="button"
            onClick={() => onSelect(role)}
            disabled={disabled}
            className={cn(
              "flex flex-row sm:flex-col items-center sm:items-center gap-2 sm:gap-1.5 rounded-lg border p-3 min-h-[44px] sm:text-center text-left transition-all duration-150 cursor-pointer disabled:opacity-50",
              isSelected
                ? role === "Admin"
                  ? "border-accent/40 bg-accent/[0.06] shadow-sm"
                  : role === "Agent"
                    ? "border-foreground/15 bg-foreground/[0.04] shadow-sm"
                    : "border-border bg-secondary/60 shadow-sm"
                : "border-border/60 hover:border-border hover:bg-secondary/30"
            )}
          >
            <config.icon className={cn(
              "h-4 w-4 shrink-0",
              isSelected
                ? role === "Admin" ? "text-accent" : role === "Agent" ? "text-foreground/70" : "text-muted-foreground"
                : "text-muted-foreground/50"
            )} />
            <div className="flex flex-row sm:flex-col items-center sm:items-center gap-1.5 sm:gap-0.5">
              <span className={cn(
                "text-[12px] font-semibold",
                isSelected ? "text-foreground" : "text-muted-foreground"
              )}>{role}</span>
              <span className="text-[10px] text-muted-foreground/60 hidden sm:inline">{config.desc}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// Mobile member card (shown on small screens instead of table rows)
function MemberCard({
  member,
  onEdit,
  onDelete,
  disableEdit,
}: {
  member: Member
  onEdit: (member: Member) => void
  onDelete: (member: Member) => void
  disableEdit?: boolean
}) {
  return (
    <div className="flex items-start gap-3 p-4 border-b border-border/40 last:border-b-0">
      <MemberAvatar initials={member.initials} role={member.role} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-foreground truncate">{member.name}</p>
            <p className="text-[12px] text-muted-foreground truncate">{member.email}</p>
          </div>
          <StatusBadge status={member.status} />
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <RoleBadge role={member.role} />
            <span className="text-[11px] text-muted-foreground tabular-nums">{member.lastActive}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onEdit(member)}
              disabled={disableEdit}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 min-h-[44px] min-w-[44px] justify-center text-[12px] font-medium text-muted-foreground transition-all duration-150 hover:bg-secondary/60 hover:text-foreground cursor-pointer active:bg-secondary/80",
                disableEdit && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground"
              )}
              aria-label={`Edit ${member.name}`}
            >
              <Pencil className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only">Edit</span>
            </button>
            <button
              onClick={() => onDelete(member)}
              className="inline-flex items-center justify-center rounded-md p-1.5 min-h-[44px] min-w-[44px] text-muted-foreground transition-all duration-150 hover:bg-red-500/10 hover:text-red-600 cursor-pointer active:bg-red-500/20"
              aria-label={`Remove ${member.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Page --------------------------------------------------------------------

export default function TeamPage() {
  const { workspace, user } = useAuth()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteName, setInviteName] = useState("")
  const [inviteRole, setInviteRole] = useState<Role>("Agent")
  const [isSending, setIsSending] = useState(false)

  // Edit member dialog state
  const [editOpen, setEditOpen] = useState(false)
  const [editMember, setEditMember] = useState<Member | null>(null)
  const [editRole, setEditRole] = useState<Role>("Agent")
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // Delete confirmation dialog state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteMember, setDeleteMember] = useState<Member | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true)
      const result = await teamApi.listMembers()
      const mapped = (Array.isArray(result) ? result : []).map((u) =>
        mapApiUserToMember(u as unknown as Record<string, unknown>)
      )
      setMembers(mapped)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load team members")
      setMembers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMembers() }, [fetchMembers])

  // Pusher real-time subscription for agent status updates
  useEffect(() => {
    if (!workspace?.id) return
    const channel = subscribeToWorkspace(workspace.id)

    channel.bind(PusherEvents.AGENT_STATUS, (data: { userId: string; status: string }) => {
      setMembers(prev => prev.map(m =>
        m.id === data.userId ? { ...m, status: data.status as Status } : m
      ))
    })

    return () => {
      unsubscribeFromWorkspace(workspace.id)
    }
  }, [workspace?.id])

  const handleOpenEdit = (member: Member) => {
    if (member.isOwner) {
      toast.error("Workspace owner's role cannot be changed. Transfer ownership first if needed.")
      return
    }
    setEditMember(member)
    setEditRole(member.role)
    setEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editMember) return
    setIsSavingEdit(true)
    try {
      const apiRole = editRole === "Admin" ? "ADMIN" : editRole === "Viewer" ? "VIEWER" : "AGENT"
      await teamApi.updateMember(editMember.id, { role: apiRole })
      setMembers((prev) =>
        prev.map((m) => (m.id === editMember.id ? { ...m, role: editRole } : m))
      )
      setEditOpen(false)
      toast.success(`Updated ${editMember.name}'s role to ${editRole}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update team member")
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleOpenDelete = (member: Member) => {
    setDeleteMember(member)
    setDeleteOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteMember) return
    setIsDeleting(true)
    try {
      await teamApi.removeMember(deleteMember.id)
      setMembers((prev) => prev.filter((m) => m.id !== deleteMember.id))
      setDeleteOpen(false)
      toast.success(`${deleteMember.name} has been removed from the team`)
      setDeleteMember(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove team member")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address")
      return
    }

    setIsSending(true)
    try {
      const name = inviteName || inviteEmail.split("@")[0]
      const apiRole = inviteRole === "Admin" ? "ADMIN" : inviteRole === "Viewer" ? "VIEWER" : "AGENT"
      const created = await teamApi.invite({ email: inviteEmail, name, role: apiRole })
      const newMember = mapApiUserToMember(created as unknown as Record<string, unknown>)
      setMembers((prev) => [...prev, newMember])
      toast.success(`Invite sent to ${inviteEmail}`)

      setInviteEmail("")
      setInviteName("")
      setInviteRole("Agent")
      setInviteOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send invite")
    } finally {
      setIsSending(false)
    }
  }

  const totalAgents    = members.length
  const onlineNow      = members.filter((m) => m.status === "Online").length
  const isEditingSelfOwner = !!(editMember && editMember.isOwner && editMember.id === user?.id)

  const stats = [
    { label: "Total agents", value: totalAgents, icon: Users, iconBg: "bg-foreground/5", iconColor: "text-foreground/80" },
    { label: "Online now", value: onlineNow, icon: Wifi, iconBg: "bg-emerald-500/10", iconColor: "text-emerald-600" },
    { label: "Away", value: members.filter((m) => m.status === "Away").length, icon: Clock, iconBg: "bg-foreground/5", iconColor: "text-foreground/80" },
  ]

  if (loading) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded-lg bg-secondary" />
            <div className="h-4 w-64 rounded bg-secondary" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl bg-secondary" />)}
            </div>
            <div className="space-y-3 mt-6">
              {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 rounded-xl bg-secondary" />)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
        >
          <div>
            <h1 className="text-[20px] sm:text-[22px] font-semibold text-foreground tracking-tight">
              Team members
            </h1>
            <p className="mt-0.5 sm:mt-1 text-[13px] text-muted-foreground">
              Manage agents and their permissions.
            </p>
          </div>

          <button
            onClick={() => setInviteOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all duration-150 hover:bg-accent/90 hover:shadow-md active:scale-[0.98] cursor-pointer min-h-[44px] w-full sm:w-auto"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Invite member
          </button>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="mb-4 sm:mb-6 grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="group rounded-xl border border-border/60 bg-card p-4 sm:p-5 transition-all duration-200 hover:border-border hover:shadow-[0_2px_8px_-2px_rgb(0_0_0/0.06)]">
              <div className="flex items-center justify-between">
                <p className="text-[13px] text-muted-foreground">{stat.label}</p>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.iconBg} transition-transform duration-200 group-hover:scale-105`}>
                  <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                </div>
              </div>
              <p className="mt-1.5 sm:mt-2 text-[26px] sm:text-[28px] font-bold text-foreground tracking-tight tabular-nums">{stat.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Members list */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-xl border border-border/60 bg-card"
        >
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-border/60">
            <h2 className="text-[14px] font-semibold text-foreground">All members</h2>
            <p className="mt-0.5 text-[12px] text-muted-foreground">{members.length} team members</p>
          </div>

          {/* Mobile card layout: visible below sm */}
          <div className="block sm:hidden">
            {members.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                onEdit={handleOpenEdit}
                onDelete={handleOpenDelete}
                disableEdit={member.isOwner && member.id === user?.id}
              />
            ))}
            {members.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary mb-4">
                  <Users className="h-6 w-6 text-muted-foreground/40" />
                </div>
                <p className="text-[14px] font-medium text-foreground/60 mb-1">No team members yet</p>
                <p className="text-[12px] text-muted-foreground/40 text-center max-w-xs">
                  Invite your first team member to start collaborating on customer support.
                </p>
              </div>
            )}
          </div>

          {/* Desktop table layout: visible at sm and above */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-[13px]" style={{ minWidth: "600px" }}>
              <thead>
                <tr className="border-b border-border/60">
                  <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50">
                    Name
                  </th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50 hidden md:table-cell">
                    Email
                  </th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50">
                    Role
                  </th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50 hidden lg:table-cell">
                    Last active
                  </th>
                  <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {members.map((member) => (
                  <tr key={member.id} className="group transition-colors duration-150 hover:bg-secondary/30">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <MemberAvatar initials={member.initials} role={member.role} />
                        <div className="min-w-0">
                          <span className="block font-medium text-foreground truncate max-w-[160px]">{member.name}</span>
                          {/* Show email under name on sm (where email column is hidden) */}
                          <span className="block md:hidden text-[11px] text-muted-foreground truncate max-w-[160px]">{member.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-muted-foreground truncate block max-w-[220px]">{member.email}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <RoleBadge role={member.role} />
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground tabular-nums whitespace-nowrap hidden lg:table-cell">{member.lastActive}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={member.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 transition-opacity duration-150 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                        <button
                          onClick={() => handleOpenEdit(member)}
                          disabled={member.isOwner && member.id === user?.id}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 min-h-[44px] text-[12px] font-medium text-muted-foreground transition-all duration-150 hover:bg-secondary/60 hover:text-foreground cursor-pointer",
                            member.isOwner && member.id === user?.id && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground"
                          )}
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleOpenDelete(member)}
                          className="inline-flex items-center justify-center rounded-md p-1.5 min-h-[44px] min-w-[44px] text-muted-foreground transition-all duration-150 hover:bg-red-500/10 hover:text-red-600 cursor-pointer"
                          aria-label={`Remove ${member.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {members.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary mb-4">
                  <Users className="h-6 w-6 text-muted-foreground/40" />
                </div>
                <p className="text-[14px] font-medium text-foreground/60 mb-1">No team members yet</p>
                <p className="text-[12px] text-muted-foreground/40 text-center max-w-xs">
                  Invite your first team member to start collaborating on customer support.
                </p>
              </div>
            )}
          </div>
        </motion.div>

      </div>

      {/* Edit member modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-[calc(100%-1rem)] sm:max-w-md max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit team member</DialogTitle>
          </DialogHeader>

          {editMember && (
            <div className="flex flex-col gap-4 py-2">
              <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-secondary/30 p-3">
                <MemberAvatar initials={editMember.initials} role={editMember.role} size="md" />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate">{editMember.name}</p>
                  <p className="text-[12px] text-muted-foreground truncate">{editMember.email}</p>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-foreground">
                  Role
                </label>
                <RolePicker
                  selectedRole={editRole}
                  onSelect={setEditRole}
                  disabled={isSavingEdit || isEditingSelfOwner}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-2">
            <button
              onClick={() => setEditOpen(false)}
              disabled={isSavingEdit}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/60 px-4 py-2.5 min-h-[44px] text-[13px] font-medium text-foreground transition-all duration-150 hover:bg-secondary/60 active:bg-secondary/80 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={isSavingEdit || isEditingSelfOwner}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 min-h-[44px] text-[13px] font-semibold text-white shadow-sm transition-all duration-150 hover:bg-accent/90 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              {isSavingEdit ? "Saving..." : "Save changes"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite modal */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-[calc(100%-1rem)] sm:max-w-md max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invite team member</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-foreground">
                Email address
              </label>
              <input
                type="email"
                placeholder="colleague@luminaskincare.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={isSending}
                className="h-11 w-full rounded-lg border border-border/60 bg-background px-3 text-[13px] placeholder:text-muted-foreground/50 focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/15 transition-all duration-150 disabled:opacity-50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-foreground">
                Name (optional)
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                disabled={isSending}
                className="h-11 w-full rounded-lg border border-border/60 bg-background px-3 text-[13px] placeholder:text-muted-foreground/50 focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/15 transition-all duration-150 disabled:opacity-50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-foreground">
                Role
              </label>
              <RolePicker
                selectedRole={inviteRole}
                onSelect={setInviteRole}
                disabled={isSending}
              />
            </div>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-2">
            <button
              onClick={() => setInviteOpen(false)}
              disabled={isSending}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/60 px-4 py-2.5 min-h-[44px] text-[13px] font-medium text-foreground transition-all duration-150 hover:bg-secondary/60 active:bg-secondary/80 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              onClick={handleSendInvite}
              disabled={!inviteEmail.trim() || isSending}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 min-h-[44px] text-[13px] font-semibold text-white shadow-sm transition-all duration-150 hover:bg-accent/90 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              <UserPlus className="h-3.5 w-3.5" />
              {isSending ? "Sending..." : "Send invite"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation modal */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-[calc(100%-1rem)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 shrink-0">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </span>
              Remove team member
            </DialogTitle>
            <DialogDescription className="text-[13px]">
              {deleteMember ? (
                <>
                  Are you sure you want to remove <span className="font-medium text-foreground">{deleteMember.name}</span> from the team? This action cannot be undone.
                </>
              ) : (
                "Are you sure you want to remove this member?"
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-2">
            <button
              onClick={() => {
                setDeleteOpen(false)
                setDeleteMember(null)
              }}
              disabled={isDeleting}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/60 px-4 py-2.5 min-h-[44px] text-[13px] font-medium text-foreground transition-all duration-150 hover:bg-secondary/60 active:bg-secondary/80 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 min-h-[44px] text-[13px] font-semibold text-white shadow-sm transition-all duration-150 hover:bg-red-700 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {isDeleting ? "Removing..." : "Remove member"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
