"use client"

import { useState, useRef, useEffect } from "react"
import {
  Sparkles, PanelRightClose, PanelRight, Send, Paperclip,
  MoreHorizontal, ChevronDown, Check, UserCircle,
  Clock, AlarmClock, Merge, Search, X, Eye, MessageSquare,
  CircleDot, CheckCircle2, AlertTriangle,
} from "lucide-react"
import { cn, getInitials, isRealCustomerEmail } from "@/lib/utils"
import { toast } from "sonner"
import type { UITicket as Ticket } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { subscribeToWorkspace, unsubscribeFromWorkspace, PusherEvents } from "@/lib/pusher-client"

interface TicketThreadProps {
  ticket: Ticket | null
  allTickets?: Ticket[]
  sidebarOpen: boolean
  onToggleSidebar: () => void
  onSendReply?: (content: string, isInternal: boolean) => void
  onStatusChange?: (ticketId: string, status: string) => void
  onTicketUpdate?: (ticketId: string, updates: Partial<Ticket>) => void
  onMergeTicket?: (sourceId: string, targetId: string) => void
}

const statusLabels: Record<string, { label: string; className: string }> = {
  open: { label: "Open", className: "bg-foreground/5 text-foreground/80" },
  pending: { label: "Pending", className: "bg-blue-500/10 text-blue-600" },
  ai_replied: { label: "AI Handled", className: "bg-emerald-500/10 text-emerald-600" },
  escalated: { label: "Escalated", className: "bg-amber-500/10 text-amber-600" },
  snoozed: { label: "Snoozed", className: "bg-foreground/5 text-foreground/60" },
  closed: { label: "Closed", className: "bg-secondary text-muted-foreground" },
}

const statusActions = [
  { key: "open", label: "Mark as open", icon: CircleDot, iconClass: "text-foreground/60" },
  { key: "pending", label: "Mark as pending", icon: Clock, iconClass: "text-blue-500" },
  { key: "closed", label: "Close ticket", icon: CheckCircle2, iconClass: "text-emerald-500" },
  { key: "escalated", label: "Escalate to human", icon: AlertTriangle, iconClass: "text-amber-500" },
] as const

const snoozeOptions = [
  { label: "1 hour", value: "1h" },
  { label: "4 hours", value: "4h" },
  { label: "Tomorrow 9 AM", value: "tomorrow" },
  { label: "Next Monday", value: "monday" },
  { label: "Custom...", value: "custom" },
]

// Regex to detect markdown-style attachment links: [filename](url)
const ATTACHMENT_REGEX = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g
const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i

function MessageContent({ content, isAgent }: { content: string; isAgent: boolean }) {
  // Check if content contains attachment links
  const parts: Array<{ type: "text"; value: string } | { type: "attachment"; name: string; url: string }> = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  const regex = new RegExp(ATTACHMENT_REGEX.source, "g")
  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: content.slice(lastIndex, match.index) })
    }
    parts.push({ type: "attachment", name: match[1], url: match[2] })
    lastIndex = regex.lastIndex
  }
  if (lastIndex < content.length) {
    parts.push({ type: "text", value: content.slice(lastIndex) })
  }

  // If no attachments found, render as plain text
  if (parts.length === 0 || (parts.length === 1 && parts[0].type === "text")) {
    return <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">{content}</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {parts.map((part, i) => {
        if (part.type === "text") {
          const trimmed = part.value.trim()
          if (!trimmed) return null
          return <p key={i} className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">{trimmed}</p>
        }
        const isImage = IMAGE_EXTENSIONS.test(part.name)
        if (isImage) {
          return (
            <a key={i} href={part.url} target="_blank" rel="noopener noreferrer" className="block">
              <img
                src={part.url}
                alt={part.name}
                className="max-h-[240px] max-w-full rounded-lg border border-border/30 object-contain"
                loading="lazy"
              />
              <span className={cn("mt-1 block text-[11px]", isAgent ? "text-background/60" : "text-muted-foreground/60")}>{part.name}</span>
            </a>
          )
        }
        return (
          <a
            key={i}
            href={part.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-2 rounded-lg border p-2.5 transition-colors duration-150",
              isAgent
                ? "border-background/20 hover:bg-background/10"
                : "border-border/40 bg-background/50 hover:bg-background/80"
            )}
          >
            <Paperclip className="h-4 w-4 shrink-0 opacity-60" />
            <span className="min-w-0 truncate text-[12px] font-medium underline decoration-1 underline-offset-2">{part.name}</span>
          </a>
        )
      })}
    </div>
  )
}

export function TicketThread({ ticket, allTickets = [], sidebarOpen, onToggleSidebar, onSendReply, onStatusChange, onTicketUpdate, onMergeTicket }: TicketThreadProps) {
  const [replyText, setReplyText] = useState("")
  const [replyMode, setReplyMode] = useState<"reply" | "note">("reply")
  const [actionMenuOpen, setActionMenuOpen] = useState(false)
  const [assignMenuOpen, setAssignMenuOpen] = useState(false)
  const [snoozeMenuOpen, setSnoozeMenuOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [mergeModalOpen, setMergeModalOpen] = useState(false)
  const [mergeSearch, setMergeSearch] = useState("")
  const [mergeTarget, setMergeTarget] = useState<Ticket | null>(null)
  const [agents, setAgents] = useState<Array<{ id: string; name: string }>>([])
  const [macrosList, setMacrosList] = useState<Array<{ name: string; body: string }>>([])
  const [isUploading, setIsUploading] = useState(false)
  const [macroDropdownOpen, setMacroDropdownOpen] = useState(false)
  const macroDropdownRef = useRef<HTMLDivElement>(null)
  const [typingAgents, setTypingAgents] = useState<Map<string, string>>(new Map())
  const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { workspace, user } = useAuth()

  // Subscribe to agent.typing events via Pusher
  useEffect(() => {
    if (!workspace?.id) return

    const channel = subscribeToWorkspace(workspace.id)

    const handleTyping = (data: { ticketId: string; userId: string; userName: string; isTyping: boolean }) => {
      // Ignore our own typing events
      if (data.userId === user?.id) return
      // Only show typing for the current ticket
      if (data.ticketId !== ticket?.id) return

      setTypingAgents((prev) => {
        const next = new Map(prev)
        if (data.isTyping) {
          next.set(data.userId, data.userName)
        } else {
          next.delete(data.userId)
        }
        return next
      })

      // Auto-clear typing indicator after 5s in case we miss the stop event
      if (data.isTyping) {
        const existing = typingTimeoutsRef.current.get(data.userId)
        if (existing) clearTimeout(existing)
        const timeout = setTimeout(() => {
          setTypingAgents((prev) => {
            const next = new Map(prev)
            next.delete(data.userId)
            return next
          })
          typingTimeoutsRef.current.delete(data.userId)
        }, 5000)
        typingTimeoutsRef.current.set(data.userId, timeout)
      } else {
        const existing = typingTimeoutsRef.current.get(data.userId)
        if (existing) {
          clearTimeout(existing)
          typingTimeoutsRef.current.delete(data.userId)
        }
      }
    }

    channel.bind(PusherEvents.AGENT_TYPING, handleTyping)

    return () => {
      channel.unbind(PusherEvents.AGENT_TYPING, handleTyping)
      // Don't unsubscribe — the parent inbox page manages the workspace subscription
      // Clear all pending timeouts
      typingTimeoutsRef.current.forEach((t) => clearTimeout(t))
      typingTimeoutsRef.current.clear()
    }
  }, [workspace?.id, user?.id, ticket?.id])

  // Clear typing indicators when switching tickets
  useEffect(() => {
    setTypingAgents(new Map())
    typingTimeoutsRef.current.forEach((t) => clearTimeout(t))
    typingTimeoutsRef.current.clear()
  }, [ticket?.id])

  // Load agents from API
  useEffect(() => {
    async function loadAgents() {
      try {
        const { team } = await import("@/lib/api")
        const members = await team.listMembers()
        setAgents(members.map((m: any) => ({ id: m.id, name: m.name })))
      } catch {
        setAgents([{ id: "unassigned", name: "Unassigned" }])
      }
    }
    loadAgents()
  }, [])

  // Load macros from API
  useEffect(() => {
    async function loadMacros() {
      try {
        const { macros } = await import("@/lib/api")
        const list = await macros.list()
        setMacrosList(list.map((m: any) => ({ name: m.name, body: m.body })))
      } catch {
        // Fallback: empty macros list
      }
    }
    loadMacros()
  }, [])

  const actionMenuRef = useRef<HTMLDivElement>(null)
  const assignMenuRef = useRef<HTMLDivElement>(null)
  const snoozeMenuRef = useRef<HTMLDivElement>(null)
  const moreMenuRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setActionMenuOpen(false)
      }
      if (assignMenuRef.current && !assignMenuRef.current.contains(e.target as Node)) {
        setAssignMenuOpen(false)
      }
      if (snoozeMenuRef.current && !snoozeMenuRef.current.contains(e.target as Node)) {
        setSnoozeMenuOpen(false)
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false)
      }
      if (macroDropdownRef.current && !macroDropdownRef.current.contains(e.target as Node)) {
        setMacroDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Reset local state when ticket changes
  useEffect(() => {
    setMergeTarget(null)
    setMergeSearch("")
  }, [ticket?.id])

  // Auto-scroll to bottom on ticket change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" })
  }, [ticket?.id, ticket?.messages.length])

  if (!ticket) {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-background">
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <Sparkles className="h-5 w-5 text-muted-foreground/40" />
          </div>
          <p className="mt-3 text-[13px] text-muted-foreground/50">
            Select a ticket to view
          </p>
        </div>
      </div>
    )
  }

  // Derive status, assign, snooze directly from the ticket prop (source of truth)
  const effectiveStatus = ticket.status
  const statusCfg = statusLabels[effectiveStatus] ?? statusLabels.open
  const assignedTo = ticket.assignedTo ?? null
  const snoozedUntil = ticket.snooze?.label ?? null

  // SLA badge logic
  const sla = ticket.sla
  const slaBadge = sla
    ? sla.breached
      ? { label: "SLA Breached", className: "bg-red-500/10 text-red-600 border-red-500/20" }
      : sla.deadline.includes("m") && !sla.deadline.includes("h")
        ? { label: `SLA: ${sla.deadline}`, className: "bg-amber-500/10 text-amber-600 border-amber-500/20" }
        : { label: `SLA: ${sla.deadline}`, className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" }
    : null

  // Collision detection removed — requires real-time presence tracking (future feature)

  // Merge candidates from actual ticket list (exclude current ticket)
  const mergeCandidates = allTickets.filter((t) => {
    if (t.id === ticket.id) return false
    if (!mergeSearch) return true
    const q = mergeSearch.toLowerCase()
    return t.id.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q) || t.customerName.toLowerCase().includes(q)
  })

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex shrink-0 flex-col gap-2 border-b border-border/60 px-3 py-3 sm:px-5">
        {/* Top row: subject + badges */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <h2 className="max-w-[180px] truncate text-[14px] font-semibold text-foreground sm:max-w-[280px] md:max-w-none">
              {ticket.subject}
            </h2>
            <span className="hidden shrink-0 rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-flex">
              {ticket.id}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                ticket.channel === "livechat"
                  ? "bg-emerald-500/10 text-emerald-700"
                  : "bg-foreground/5 text-foreground/70"
              )}
            >
              {ticket.channel === "livechat" ? "Live Chat" : "Email"}
            </span>
            {/* Status badge — hide when snoozed (snooze badge replaces it) */}
            {effectiveStatus !== "snoozed" && (
              <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors duration-150", statusCfg.className)}>
                {statusCfg.label}
              </span>
            )}
            {/* Snooze badge — shown when status is snoozed, replaces the status badge */}
            {effectiveStatus === "snoozed" && (
              <span className="flex shrink-0 items-center gap-1 rounded-full border border-foreground/10 bg-foreground/5 px-2 py-0.5 text-[10px] font-semibold text-foreground/80">
                <AlarmClock className="h-2.5 w-2.5" />
                {snoozedUntil ? `Snoozed: ${snoozedUntil}` : "Snoozed"}
              </span>
            )}
            {/* SLA badge */}
            {slaBadge && (
              <span className={cn("flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors duration-150", slaBadge.className)}>
                <Clock className="h-2.5 w-2.5" />
                {slaBadge.label}
              </span>
            )}
          </div>
          <p className="mt-1 truncate text-[12px] text-muted-foreground">
            {ticket.customerName}{isRealCustomerEmail(ticket.customerEmail) ? <> · <span className="inline-block max-w-[140px] truncate align-bottom sm:max-w-none">{ticket.customerEmail}</span></> : null}
            {assignedTo && (
              <span className="ml-2 hidden items-center gap-1 rounded-full bg-accent/8 px-2 py-0.5 text-[10px] font-medium text-accent sm:inline-flex">
                <UserCircle className="h-2.5 w-2.5" />
                {assignedTo}
              </span>
            )}
          </p>
        </div>

        {/* Action buttons row */}
        <div className="-mx-3 flex shrink-0 flex-wrap items-center gap-1.5 px-3 pb-0.5 sm:-mx-0 sm:px-0 md:pb-0">
          {/* AI Reply */}
          <button
            onClick={async () => {
              const hasExistingDraft = replyText.trim().length > 0
              toast.info(hasExistingDraft ? "Improving your draft..." : "Generating AI reply...")
              try {
                const { messages: messagesApi } = await import("@/lib/api")
                const result = await messagesApi.aiImprove(ticket.id, replyText.trim())
                if (result.improved) {
                  setReplyText(result.improved)
                  toast.success(hasExistingDraft ? "Draft improved" : "AI reply generated")
                }
              } catch {
                toast.error("Failed to generate AI reply")
              }
            }}
            className="cursor-pointer flex h-[44px] shrink-0 items-center gap-1.5 rounded-lg border border-border/60 bg-background px-3 text-[12px] font-medium text-muted-foreground transition-all duration-150 hover:border-accent/30 hover:text-accent hover:shadow-sm sm:h-8"
          >
            <Sparkles className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
            AI Reply
          </button>

          {/* Snooze dropdown */}
          <div className="relative" ref={snoozeMenuRef}>
            <button
              onClick={() => {
                const next = !snoozeMenuOpen
                setActionMenuOpen(false)
                setAssignMenuOpen(false)
                setMoreMenuOpen(false)
                setSnoozeMenuOpen(next)
              }}
              className={cn(
                "cursor-pointer flex h-[44px] shrink-0 items-center gap-1.5 rounded-lg border px-3 text-[12px] font-medium transition-all duration-150 sm:h-8",
                snoozedUntil
                  ? "border-foreground/10 bg-foreground/[0.04] text-foreground/80 hover:bg-foreground/5"
                  : "border-border/60 bg-background text-muted-foreground hover:border-border hover:text-foreground"
              )}
            >
              <AlarmClock className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
              {snoozedUntil ? "Snoozed" : "Snooze"}
            </button>
            {snoozeMenuOpen && (
              <div className="absolute left-0 top-full z-50 mt-1.5 min-w-[180px] overflow-hidden rounded-xl border border-border/60 bg-card shadow-[0_8px_30px_-8px_rgb(0_0_0/0.12)] sm:left-auto sm:right-0">
                <div className="border-b border-border/40 px-4 py-2.5">
                  <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.08em]">
                    Snooze for
                  </p>
                </div>
                {snoozeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={async () => {
                      if (!ticket || opt.value === "custom") return
                      const now = new Date()
                      let until: Date
                      switch (opt.value) {
                        case "1h": until = new Date(now.getTime() + 3600000); break
                        case "4h": until = new Date(now.getTime() + 14400000); break
                        case "tomorrow": until = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0); break
                        case "monday": {
                          const day = now.getDay()
                          const diff = day === 0 ? 1 : 8 - day
                          until = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff, 9, 0)
                          break
                        }
                        default: until = new Date(now.getTime() + 3600000)
                      }
                      setSnoozeMenuOpen(false)
                      if (onTicketUpdate) onTicketUpdate(ticket.id, {
                        snooze: { until: until.toISOString(), label: opt.label },
                        status: "snoozed" as Ticket["status"],
                      })
                      toast.success("Ticket snoozed", { description: `Will reappear: ${opt.label}` })
                      try {
                        const { tickets: ticketsApi } = await import("@/lib/api")
                        await ticketsApi.snooze(ticket.id, until.toISOString())
                      } catch { toast.error("Failed to snooze ticket") }
                    }}
                    className="cursor-pointer flex h-[44px] w-full items-center gap-2.5 px-4 text-left text-[13px] text-muted-foreground transition-colors duration-100 hover:bg-secondary hover:text-foreground sm:h-auto sm:py-2.5"
                  >
                    <AlarmClock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 sm:h-3 sm:w-3" />
                    {opt.label}
                  </button>
                ))}
                {snoozedUntil && (
                  <>
                    <div className="border-t border-border/40" />
                    <button
                      onClick={async () => {
                        setSnoozeMenuOpen(false)
                        if (onTicketUpdate && ticket) {
                          onTicketUpdate(ticket.id, { snooze: undefined, status: "open" as Ticket["status"] })
                        }
                        toast.success("Snooze removed")
                        try {
                          const { tickets: ticketsApi } = await import("@/lib/api")
                          await ticketsApi.update(ticket.id, { status: "OPEN", snoozeUntil: null } as any)
                        } catch { toast.error("Failed to remove snooze") }
                      }}
                      className="cursor-pointer flex h-[44px] w-full items-center gap-2.5 px-4 text-left text-[13px] text-muted-foreground/60 transition-colors duration-100 hover:bg-secondary hover:text-muted-foreground sm:h-auto sm:py-2.5"
                    >
                      Remove snooze
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Status change dropdown */}
          <div className="relative" ref={actionMenuRef}>
            <button
              onClick={() => {
                const next = !actionMenuOpen
                setSnoozeMenuOpen(false)
                setAssignMenuOpen(false)
                setMoreMenuOpen(false)
                setActionMenuOpen(next)
              }}
              className={cn(
                "cursor-pointer flex h-[44px] shrink-0 items-center gap-1.5 rounded-lg border px-3 text-[12px] font-medium transition-all duration-150 sm:h-8",
                effectiveStatus === "closed"
                  ? "border-emerald-500/30 bg-emerald-500/8 text-emerald-600 hover:bg-emerald-500/12"
                  : effectiveStatus === "escalated"
                    ? "border-amber-500/30 bg-amber-500/8 text-amber-600 hover:bg-amber-500/12"
                    : "border-border/60 bg-background text-muted-foreground hover:border-border hover:text-foreground"
              )}
            >
              {effectiveStatus === "closed"
                ? "Closed"
                : effectiveStatus === "escalated"
                  ? "Escalated"
                  : "Status"}
              <ChevronDown className={cn("h-3 w-3 transition-transform duration-150", actionMenuOpen && "rotate-180")} />
            </button>
            {actionMenuOpen && (
              <div className="absolute left-0 top-full z-50 mt-1.5 min-w-[176px] overflow-hidden rounded-xl border border-border/60 bg-card shadow-[0_8px_30px_-8px_rgb(0_0_0/0.12)] sm:left-auto sm:right-0">
                {statusActions.map((action) => (
                  <button
                    key={action.key}
                    onClick={() => {
                      setActionMenuOpen(false)
                      if (onStatusChange && ticket) {
                        onStatusChange(ticket.id, action.key)
                      }
                      if (onTicketUpdate && ticket) {
                        onTicketUpdate(ticket.id, { status: action.key as Ticket["status"] })
                      }
                      toast.success(action.label, { description: "Ticket status updated" })
                    }}
                    className={cn(
                      "cursor-pointer flex h-[44px] w-full items-center gap-2.5 px-4 text-left text-[13px] transition-colors duration-100 hover:bg-secondary sm:h-auto sm:py-2.5",
                      effectiveStatus === action.key
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    <action.icon className={cn("h-3.5 w-3.5 shrink-0 sm:h-3 sm:w-3", effectiveStatus === action.key ? "text-accent" : action.iconClass)} />
                    <span className="flex-1">{action.label}</span>
                    {effectiveStatus === action.key && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-accent sm:h-3 sm:w-3" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Assign dropdown */}
          <div className="relative" ref={assignMenuRef}>
            <button
              onClick={() => {
                const next = !assignMenuOpen
                setActionMenuOpen(false)
                setSnoozeMenuOpen(false)
                setMoreMenuOpen(false)
                setAssignMenuOpen(next)
              }}
              className={cn(
                "cursor-pointer flex h-[44px] shrink-0 items-center gap-1.5 rounded-lg border px-3 text-[12px] font-medium transition-all duration-150 sm:h-8",
                assignedTo
                  ? "border-accent/25 bg-accent/6 text-accent hover:bg-accent/10"
                  : "border-border/60 bg-background text-muted-foreground hover:border-border hover:text-foreground"
              )}
            >
              <UserCircle className="h-3.5 w-3.5 sm:h-3.5 sm:w-3.5" />
              {assignedTo ? assignedTo.split(" ")[0] : "Assign"}
              <ChevronDown className={cn("h-3 w-3 transition-transform duration-150", assignMenuOpen && "rotate-180")} />
            </button>
            {assignMenuOpen && (
              <div className="absolute left-0 top-full z-50 mt-1.5 min-w-[168px] overflow-hidden rounded-xl border border-border/60 bg-card shadow-[0_8px_30px_-8px_rgb(0_0_0/0.12)] sm:left-auto sm:right-0">
                <div className="border-b border-border/40 px-4 py-2.5">
                  <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.08em]">
                    Assign to
                  </p>
                </div>
                {agents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={async () => {
                      setAssignMenuOpen(false)
                      if (onTicketUpdate && ticket) {
                        onTicketUpdate(ticket.id, { assignedTo: agent.name } as Partial<Ticket>)
                      }
                      try {
                        const { tickets: ticketsApi } = await import("@/lib/api")
                        await ticketsApi.assign(ticket.id, { agentId: agent.id })
                      } catch {
                        // Assignment already reflected locally
                      }
                      toast.success(`Assigned to ${agent.name}`, { description: ticket.subject })
                    }}
                    className={cn(
                      "cursor-pointer flex h-[44px] w-full items-center gap-2.5 px-4 text-left text-[13px] transition-colors duration-100 hover:bg-secondary sm:h-auto sm:py-2.5",
                      assignedTo === agent.name
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-[9px] font-semibold text-foreground sm:h-5 sm:w-5">
                      {agent.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    {agent.name}
                    {assignedTo === agent.name && (
                      <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-accent sm:h-3 sm:w-3" />
                    )}
                  </button>
                ))}
                {assignedTo && (
                  <>
                    <div className="border-t border-border/40" />
                    <button
                      onClick={async () => {
                        setAssignMenuOpen(false)
                        if (onTicketUpdate && ticket) {
                          onTicketUpdate(ticket.id, { assignedTo: undefined } as Partial<Ticket>)
                        }
                        try {
                          const { tickets: ticketsApi } = await import("@/lib/api")
                          await ticketsApi.assign(ticket.id, { agentId: undefined })
                        } catch { /* already reflected locally */ }
                        toast("Agent unassigned")
                      }}
                      className="cursor-pointer flex h-[44px] w-full items-center gap-2.5 px-4 text-left text-[13px] text-muted-foreground/60 transition-colors duration-100 hover:bg-secondary hover:text-muted-foreground sm:h-auto sm:py-2.5"
                    >
                      Unassign
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* More menu with Merge option */}
          <div className="relative" ref={moreMenuRef}>
            <button
              onClick={() => {
                const next = !moreMenuOpen
                setActionMenuOpen(false)
                setAssignMenuOpen(false)
                setSnoozeMenuOpen(false)
                setMoreMenuOpen(next)
              }}
              className="cursor-pointer flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-lg text-muted-foreground/60 transition-all duration-150 hover:bg-secondary hover:text-foreground sm:h-8 sm:w-8"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {moreMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-1.5 min-w-[176px] overflow-hidden rounded-xl border border-border/60 bg-card shadow-[0_8px_30px_-8px_rgb(0_0_0/0.12)]">
                <button
                  onClick={() => {
                    setMoreMenuOpen(false)
                    setMergeModalOpen(true)
                  }}
                  className="cursor-pointer flex h-[44px] w-full items-center gap-2.5 px-4 text-left text-[13px] text-muted-foreground transition-colors duration-100 hover:bg-secondary hover:text-foreground sm:h-auto sm:py-2.5"
                >
                  <Merge className="h-3.5 w-3.5" />
                  Merge ticket
                </button>
                <button
                  onClick={() => {
                    setMoreMenuOpen(false)
                    const url = `${window.location.origin}/inbox?ticket=${ticket.id}`
                    navigator.clipboard.writeText(url).then(() => {
                      toast("Ticket link copied to clipboard")
                    }).catch(() => {
                      toast.error("Failed to copy link")
                    })
                  }}
                  className="cursor-pointer flex h-[44px] w-full items-center gap-2.5 px-4 text-left text-[13px] text-muted-foreground transition-colors duration-100 hover:bg-secondary hover:text-foreground sm:h-auto sm:py-2.5"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Copy link
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onToggleSidebar}
            className="cursor-pointer flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-lg text-muted-foreground/60 transition-all duration-150 hover:bg-secondary hover:text-foreground sm:h-8 sm:w-8"
            aria-label={sidebarOpen ? "Close customer panel" : "Open customer panel"}
          >
            {sidebarOpen ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRight className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-2 py-2 pb-3 sm:px-5 sm:py-5">
        <div className="mx-auto flex max-w-full flex-col gap-2.5 sm:gap-4 lg:max-w-[640px]">
          {ticket.messages.map((msg, msgIndex) => {
            if (msg.role === "system") {
              return (
                <div
                  key={msg.id}
                  className="flex justify-center px-2 py-1.5 sm:py-2"
                >
                  <span className="rounded-full bg-secondary/80 px-3 py-1 text-center text-[10px] text-muted-foreground sm:text-[11px]">
                    {msg.content}
                  </span>
                </div>
              )
            }

            const isCustomer = msg.role === "customer"
            const isAI = msg.role === "ai"
            const isHuman = msg.role === "human"
            const isInternal = Boolean(msg.isInternal)

            return (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2 sm:gap-2.5",
                  isCustomer ? "justify-start" : "justify-end"
                )}
              >
                {/* Customer avatar */}
                {isCustomer && (
                  <div
                    className={cn(
                      "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold sm:h-7 sm:w-7 sm:text-[10px]",
                      ticket.channel === "livechat"
                        ? "bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/20"
                        : "bg-secondary text-muted-foreground"
                    )}
                    aria-label={ticket.channel === "livechat" ? "Live Chat customer avatar" : "Customer avatar"}
                  >
                    {ticket.channel === "livechat" ? (
                      <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    ) : (
                      getInitials(ticket.customerName)
                    )}
                  </div>
                )}

                <div className="max-w-[85%] min-w-0 sm:max-w-[75%]">
                  {/* Sender label */}
                  {isAI && (
                    <div className="mb-0.5 flex items-center justify-end gap-1 sm:mb-1">
                      <Sparkles className="h-3 w-3 text-accent/60" />
                      <span className="text-[10px] font-medium text-accent/70 sm:text-[11px]">Replyma AI</span>
                    </div>
                  )}
                  {isHuman && (
                    <div className="mb-0.5 flex items-center justify-end gap-1 sm:mb-1">
                      <span className={cn("text-[10px] font-medium sm:text-[11px]", isInternal ? "text-amber-700" : "text-foreground/60")}>
                        {isInternal ? "Internal Note" : "Agent"}
                      </span>
                    </div>
                  )}
                  {isCustomer && (
                    <div className="mb-0.5 flex items-center gap-1 sm:mb-1">
                      <span className="text-[10px] font-medium text-foreground/60 sm:text-[11px]">{ticket.customerName.split(" ")[0]}</span>
                      {ticket.channel === "livechat" && (
                        <span className="rounded-full bg-emerald-500/10 px-1.5 py-px text-[9px] font-semibold text-emerald-700">
                          Live Chat
                        </span>
                      )}
                    </div>
                  )}

                  <div
                    className={cn(
                      "rounded-2xl px-3 py-2 transition-colors duration-150 sm:px-4 sm:py-3",
                      isCustomer
                        ? "rounded-tl-md bg-secondary/80 text-foreground"
                        : isAI
                          ? "rounded-tr-md border border-accent/15 bg-accent/[0.05] text-foreground shadow-sm"
                          : isInternal
                            ? "rounded-tr-md border border-amber-500/35 bg-amber-100/70 text-amber-900 shadow-sm"
                            : "rounded-tr-md bg-foreground text-background shadow-sm"
                    )}
                  >
                    <MessageContent content={msg.content} isAgent={isHuman} />
                  </div>
                  {/* Relative-style timestamp */}
                  <p className={cn(
                    "mt-1 text-[9px] tabular-nums sm:mt-1.5 sm:text-[10px]",
                    isCustomer ? "text-muted-foreground/40" : "text-right text-muted-foreground/40"
                  )}>
                    {msg.timestamp}
                  </p>
                </div>

                {/* Human agent avatar */}
                {isHuman && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground text-[9px] font-semibold text-background mt-1 sm:h-7 sm:w-7 sm:text-[10px]">
                    {user?.name ? getInitials(user.name) : "A"}
                  </div>
                )}

                {/* AI avatar */}
                {isAI && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent mt-1 sm:h-7 sm:w-7">
                    <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </div>
                )}
              </div>
            )
          })}
          {/* Agent typing indicator */}
          {typingAgents.size > 0 && (
            <div className="flex items-center gap-2 px-2 py-1.5 animate-in fade-in slide-in-from-bottom-1 duration-200">
              <div className="flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "0ms" }} />
                <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "150ms" }} />
                <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-[11px] text-muted-foreground/60">
                {Array.from(typingAgents.values()).join(", ")}{" "}
                {typingAgents.size === 1 ? "is" : "are"} typing...
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-border/60 p-2 sm:p-4">
        <div className="mx-auto max-w-full lg:max-w-[640px]">
          {/* Mode tabs */}
          <div className="mb-1.5 flex items-center gap-0.5 sm:mb-2.5">
            {(["reply", "note"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setReplyMode(mode)}
                className={cn(
                  "min-h-[44px] rounded-md px-3 py-1.5 text-[12px] font-medium transition-all duration-150 sm:min-h-0",
                  replyMode === mode
                    ? mode === "note"
                      ? "bg-amber-500/10 text-amber-700"
                      : "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                )}
              >
                {mode === "reply" ? "Reply" : "Internal Note"}
              </button>
            ))}
          </div>

          {/* Textarea box */}
          <div
            className={cn(
              "rounded-xl border p-2.5 transition-all duration-200 sm:p-3",
              replyMode === "note"
                ? "border-amber-400/30 bg-amber-50/50 shadow-sm"
                : "border-border/60 bg-card focus-within:border-accent/30 focus-within:ring-2 focus-within:ring-accent/10 focus-within:shadow-sm"
            )}
          >
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={
                replyMode === "note"
                  ? "Internal note -- only visible to your team..."
                  : "Write a reply..."
              }
              className="min-h-[56px] w-full resize-y bg-transparent text-[13px] leading-relaxed text-foreground placeholder:text-muted-foreground/40 focus:outline-none sm:min-h-[72px]"
              rows={2}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/30 mt-1">
              <div className="flex flex-wrap items-center gap-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    if (file.size > 10 * 1024 * 1024) {
                      toast.error("File too large", { description: "Maximum file size is 10 MB" })
                      e.target.value = ""
                      return
                    }
                    setIsUploading(true)
                    try {
                      const { attachments: attachmentsApi } = await import("@/lib/api")
                      const result = await attachmentsApi.upload(file)
                      setReplyText((prev) => {
                        const attachment = `[${result.filename}](${result.url})`
                        return prev ? `${prev}\n${attachment}` : attachment
                      })
                      toast.success("File uploaded", { description: result.filename })
                    } catch {
                      toast.error("Upload failed", { description: "Please try again" })
                    } finally {
                      setIsUploading(false)
                      e.target.value = ""
                    }
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className={cn(
                    "flex h-[44px] w-[44px] items-center justify-center rounded-md transition-all duration-150 hover:bg-secondary hover:text-foreground sm:h-7 sm:w-7",
                    isUploading ? "animate-pulse text-accent" : "text-muted-foreground/50"
                  )}
                >
                  <Paperclip className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                </button>
                <div className="relative" ref={macroDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setMacroDropdownOpen((v) => !v)}
                    className={cn(
                      "flex h-[44px] items-center gap-1 rounded-md border border-border/50 bg-transparent px-2.5 text-[12px] text-muted-foreground transition-colors duration-150 hover:border-accent/30 hover:text-foreground sm:h-7",
                      macroDropdownOpen && "border-accent/30 text-foreground"
                    )}
                  >
                    Insert macro...
                    <ChevronDown className={cn("h-3 w-3 transition-transform duration-150", macroDropdownOpen && "rotate-180")} />
                  </button>
                  {macroDropdownOpen && macrosList.length > 0 && (
                    <div className="absolute bottom-full left-0 z-50 mb-1.5 max-h-[200px] min-w-[200px] overflow-y-auto rounded-xl border border-border/60 bg-card shadow-[0_8px_30px_-8px_rgb(0_0_0/0.12)]">
                      {macrosList.map((m) => (
                        <button
                          key={m.name}
                          type="button"
                          onClick={() => {
                            setReplyText((prev) => prev ? prev + "\n" + m.body : m.body)
                            setMacroDropdownOpen(false)
                            toast.success(`Macro inserted: ${m.name}`)
                          }}
                          className="flex w-full items-center px-3 text-left text-[13px] text-foreground transition-colors duration-100 hover:bg-secondary/60 first:rounded-t-xl last:rounded-b-xl min-h-[44px] sm:min-h-0 sm:py-2.5 sm:text-[12px]"
                        >
                          {m.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {macroDropdownOpen && macrosList.length === 0 && (
                    <div className="absolute bottom-full left-0 z-50 mb-1.5 min-w-[200px] rounded-xl border border-border/60 bg-card p-3 shadow-[0_8px_30px_-8px_rgb(0_0_0/0.12)]">
                      <p className="text-[12px] text-muted-foreground/60">No macros available</p>
                    </div>
                  )}
                </div>
              </div>
              <button
                className={cn(
                  "flex h-[44px] items-center gap-1.5 rounded-lg px-4 text-[13px] font-medium transition-all duration-150 disabled:opacity-40 sm:h-8 sm:px-3.5 sm:text-[12px]",
                  replyMode === "note"
                    ? "bg-amber-500 text-white hover:bg-amber-500/90"
                    : "bg-accent text-accent-foreground hover:bg-accent/90"
                )}
                disabled={!replyText.trim()}
                onClick={() => {
                  if (!replyText.trim()) return
                  if (onSendReply) {
                    onSendReply(replyText.trim(), replyMode === "note")
                  } else {
                    toast.success(replyMode === "note" ? "Note added" : "Reply sent")
                  }
                  setReplyText("")
                }}
              >
                <Send className="h-4 w-4 sm:h-3 sm:w-3" />
                {replyMode === "note" ? "Add Note" : "Send"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Merge ticket modal */}
      {mergeModalOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm"
            onClick={() => {
              setMergeModalOpen(false)
              setMergeSearch("")
              setMergeTarget(null)
            }}
          />
          <div className="fixed inset-x-3 top-[5%] z-50 mx-auto max-h-[90vh] max-w-md overflow-y-auto rounded-xl border border-border/60 bg-background shadow-[0_24px_80px_-16px_rgb(0_0_0/0.2)] sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:max-h-none sm:-translate-x-1/2 sm:-translate-y-1/2 sm:overflow-visible">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 sm:px-5 sm:py-4">
              <div className="min-w-0 flex-1">
                <h3 className="text-[14px] font-semibold text-foreground">Merge ticket</h3>
                <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                  Merge {ticket.id} into another ticket
                </p>
              </div>
              <button
                onClick={() => {
                  setMergeModalOpen(false)
                  setMergeSearch("")
                  setMergeTarget(null)
                }}
                className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-secondary hover:text-foreground sm:h-8 sm:w-8"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 sm:p-5">
              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={mergeSearch}
                  onChange={(e) => setMergeSearch(e.target.value)}
                  className="h-[44px] w-full rounded-lg border border-border/60 bg-secondary/30 pl-9 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/15 transition-all duration-150 sm:h-9"
                  autoFocus
                />
              </div>

              {/* Ticket list */}
              <div className="max-h-[40vh] overflow-y-auto rounded-lg border border-border/40 sm:max-h-[200px]">
                {mergeCandidates.length === 0 ? (
                  <p className="px-4 py-6 text-center text-[13px] text-muted-foreground/50">
                    No tickets found
                  </p>
                ) : (
                  mergeCandidates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setMergeTarget(t)}
                      className={cn(
                        "flex min-h-[44px] w-full items-center gap-2 border-b border-border/30 px-3 py-2.5 text-left transition-all duration-150 last:border-0 sm:gap-3 sm:px-4 sm:py-3",
                        mergeTarget?.id === t.id
                          ? "bg-accent/8"
                          : "hover:bg-secondary/50"
                      )}
                    >
                      <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                        {t.id}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-medium text-foreground">{t.subject}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{t.customerName}</p>
                      </div>
                      {mergeTarget?.id === t.id && (
                        <Check className="h-3.5 w-3.5 shrink-0 text-accent" />
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Merge preview */}
              {mergeTarget && (
                <div className="mt-3 rounded-lg border border-accent/20 bg-accent/5 px-3 py-2.5 sm:px-4 sm:py-3">
                  <p className="text-[11px] font-medium text-accent">
                    Will merge into
                  </p>
                  <p className="mt-1 truncate text-[12px] font-medium text-foreground">
                    {mergeTarget.id}: {mergeTarget.subject}
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-border/60 px-4 py-3 sm:px-5 sm:py-4">
              <button
                onClick={() => {
                  setMergeModalOpen(false)
                  setMergeSearch("")
                  setMergeTarget(null)
                }}
                className="cursor-pointer flex h-[44px] items-center rounded-lg border border-border/60 px-4 text-[13px] font-medium text-foreground transition-colors hover:bg-secondary/60 sm:h-auto sm:py-2"
              >
                Cancel
              </button>
              <button
                disabled={!mergeTarget}
                onClick={() => {
                  if (onMergeTicket && mergeTarget) {
                    onMergeTicket(ticket.id, mergeTarget.id)
                  }
                  setMergeModalOpen(false)
                  setMergeSearch("")
                  setMergeTarget(null)
                }}
                className="cursor-pointer flex h-[44px] items-center rounded-lg bg-accent px-4 text-[13px] font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-40 sm:h-auto sm:py-2"
              >
                <span className="flex items-center gap-1.5">
                  <Merge className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
                  Merge
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
