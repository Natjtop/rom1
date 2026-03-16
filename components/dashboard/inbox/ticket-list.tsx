"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Search,
  Mail,
  MessageSquare,
  Sparkles,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Pause,
  AlarmClock,
  ChevronDown,
  Tag,
  Trash2,
  XCircle,
} from "lucide-react"
import { cn, getInitials } from "@/lib/utils"
import { toast } from "sonner"
import type { UITicket as Ticket, UITicketChannel as TicketChannel, UITicketStatus as TicketStatus } from "@/lib/types"
import { Checkbox } from "@/components/ui/checkbox"

const channelIcons: Record<TicketChannel, React.ElementType> = {
  email: Mail,
  livechat: MessageSquare,
}

const channelColors: Record<TicketChannel, string> = {
  email: "text-foreground/70",
  livechat: "text-foreground/70",
}

const statusConfig: Record<TicketStatus, { icon: React.ElementType; className: string; badgeBg: string; label: string }> = {
  open: { icon: Clock, className: "text-foreground/80", badgeBg: "bg-foreground/5 text-foreground/80", label: "Open" },
  pending: { icon: Pause, className: "text-blue-600", badgeBg: "bg-blue-500/10 text-blue-600", label: "Pending" },
  ai_replied: { icon: Sparkles, className: "text-emerald-600", badgeBg: "bg-emerald-500/10 text-emerald-600", label: "AI" },
  escalated: { icon: AlertTriangle, className: "text-amber-600", badgeBg: "bg-amber-500/10 text-amber-600", label: "Escalated" },
  snoozed: { icon: AlarmClock, className: "text-foreground/60", badgeBg: "bg-foreground/5 text-foreground/60", label: "Snoozed" },
  closed: { icon: CheckCircle2, className: "text-muted-foreground/50", badgeBg: "bg-secondary text-muted-foreground", label: "Closed" },
}

interface TicketListProps {
  tickets: Ticket[]
  selectedTicket: Ticket | null
  onSelectTicket: (ticket: Ticket) => void
  selectedIds: Set<string>
  onSelectionChange: (ids: Set<string>) => void
  onTicketUpdate?: (ticketId: string, updates: Partial<Ticket>) => void
  onBulkClose?: () => void
  onBulkSnooze?: (duration: string) => void
  onBulkAddTag?: (tagName: string) => void
  onBulkDelete?: () => void
}

export function TicketList({
  tickets,
  selectedTicket,
  onSelectTicket,
  selectedIds,
  onSelectionChange,
  onTicketUpdate,
  onBulkClose,
  onBulkSnooze,
  onBulkAddTag,
  onBulkDelete,
}: TicketListProps) {
  const [search, setSearch] = useState("")
  const [assignDropdownOpen, setAssignDropdownOpen] = useState(false)
  const [snoozeDropdownOpen, setSnoozeDropdownOpen] = useState(false)
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [assignees, setAssignees] = useState<string[]>([])

  // Load team members from API for bulk assign
  useEffect(() => {
    async function loadAssignees() {
      try {
        const { team } = await import("@/lib/api")
        const members = await team.listMembers()
        setAssignees(members.map((m: any) => m.name))
      } catch {
        setAssignees(["Unassigned"])
      }
    }
    loadAssignees()
  }, [])

  // Load tags from API for bulk add tag
  useEffect(() => {
    async function loadTags() {
      try {
        const { tags } = await import("@/lib/api")
        const result = await tags.list()
        setAvailableTags((result.data ?? []).map((t: any) => t.name))
      } catch {
        setAvailableTags([])
      }
    }
    loadTags()
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return tickets
    return tickets.filter(
      (t) =>
        t.customerName.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q)
    )
  }, [tickets, search])

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((t) => selectedIds.has(t.id))
  const someFilteredSelected =
    filtered.some((t) => selectedIds.has(t.id)) && !allFilteredSelected

  function toggleSelectAll() {
    if (allFilteredSelected) {
      const next = new Set(selectedIds)
      filtered.forEach((t) => next.delete(t.id))
      onSelectionChange(next)
    } else {
      const next = new Set(selectedIds)
      filtered.forEach((t) => next.add(t.id))
      onSelectionChange(next)
    }
  }

  function toggleTicket(id: string) {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    onSelectionChange(next)
  }

  async function handleAssign(assignee: string) {
    setAssignDropdownOpen(false)
    const ids = Array.from(selectedIds)
    // Optimistic UI update
    if (onTicketUpdate) {
      ids.forEach((id) => {
        onTicketUpdate(id, { assignedTo: assignee } as Partial<Ticket>)
      })
    }
    onSelectionChange(new Set())
    toast.success(`${ids.length} ticket${ids.length > 1 ? "s" : ""} assigned to ${assignee}`)
    // Persist to API
    try {
      const { tickets: ticketsApi } = await import("@/lib/api")
      await ticketsApi.bulk({ ticketIds: ids, action: "assign", value: assignee })
    } catch {
      toast.error("Failed to assign some tickets")
    }
  }

  const selectionCount = selectedIds.size

  return (
    <div
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col border-r border-border/60 bg-background"
      )}
    >
      {/* ── Search bar ── */}
      <div className="group/search shrink-0 border-b border-border/60 p-2 sm:p-2.5">
        <div className="flex items-center gap-2">
          {/* Select-all checkbox: always visible on mobile (no hover), hover-reveal on desktop */}
          <div
            className={cn(
              "flex shrink-0 items-center justify-center",
              /* 44px touch target on mobile */
              "h-11 w-11 lg:h-auto lg:w-auto",
              /* Always visible on mobile; hover-reveal on desktop */
              "opacity-100 lg:opacity-0 lg:group-hover/search:opacity-100",
              "transition-opacity duration-150"
            )}
          >
            <Checkbox
              checked={allFilteredSelected ? true : someFilteredSelected ? "indeterminate" : false}
              onCheckedChange={toggleSelectAll}
              aria-label="Select all tickets"
            />
          </div>

          {/* Search input: h-11 (44px) on mobile, h-9 on desktop */}
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50 lg:h-3.5 lg:w-3.5" />
            <input
              type="search"
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                "w-full rounded-lg border border-border/60 bg-secondary/30 pl-9 pr-3 text-[14px] text-foreground",
                "placeholder:text-muted-foreground/40",
                "focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/15",
                "transition-all duration-150",
                /* Mobile: 44px height for touch; desktop: 36px */
                "h-11 lg:h-9 lg:pl-8 lg:text-[13px]"
              )}
            />
          </div>
        </div>
      </div>

      {/* ── Bulk action bar ── */}
      {selectionCount > 0 && (
        <div
          className={cn(
            "shrink-0 border-b border-border/60 bg-accent/[0.04]",
            "flex flex-wrap items-center gap-1.5 px-2.5 py-2 sm:gap-2"
          )}
        >
          <span className="mr-auto text-[12px] font-medium text-foreground/80 sm:text-[11px]">
            {selectionCount} selected
          </span>

          {/* Assign dropdown */}
          <div className="relative">
            <button
              onClick={() => setAssignDropdownOpen((o) => !o)}
              className={cn(
                "flex items-center gap-1 rounded-md px-3 text-[12px] font-medium",
                "text-foreground/70 hover:bg-secondary hover:text-foreground",
                "transition-all duration-150",
                /* 44px touch target on mobile */
                "min-h-[44px] sm:min-h-0 sm:px-2 sm:py-1 sm:text-[11px]"
              )}
            >
              Assign to...
              <ChevronDown className="h-3 w-3" />
            </button>
            {assignDropdownOpen && (
              <>
                {/* Backdrop to close dropdown on outside tap */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setAssignDropdownOpen(false)}
                />
                <div
                  className={cn(
                    "absolute z-50 mt-1 w-44 rounded-xl border border-border/60 bg-popover",
                    "shadow-[0_8px_30px_-8px_rgb(0_0_0/0.12)]",
                    /* Position: right-aligned so it stays on-screen on narrow viewports */
                    "right-0 top-full sm:left-0 sm:right-auto"
                  )}
                >
                  {assignees.map((a) => (
                    <button
                      key={a}
                      onClick={() => handleAssign(a)}
                      className={cn(
                        "flex w-full items-center px-3 text-[13px] text-foreground",
                        "hover:bg-secondary/60 transition-colors duration-100",
                        "first:rounded-t-xl last:rounded-b-xl",
                        /* 44px touch rows on mobile */
                        "min-h-[44px] sm:min-h-0 sm:py-2 sm:text-[12px]"
                      )}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Close selected */}
          {onBulkClose && (
            <button
              onClick={onBulkClose}
              className={cn(
                "flex items-center gap-1 rounded-md px-3 text-[12px] font-medium",
                "text-foreground/70 hover:bg-secondary hover:text-foreground",
                "transition-all duration-150",
                "min-h-[44px] sm:min-h-0 sm:px-2 sm:py-1 sm:text-[11px]"
              )}
            >
              <XCircle className="h-3 w-3" />
              Close
            </button>
          )}

          {/* Snooze dropdown */}
          {onBulkSnooze && (
            <div className="relative">
              <button
                onClick={() => setSnoozeDropdownOpen((o) => !o)}
                className={cn(
                  "flex items-center gap-1 rounded-md px-3 text-[12px] font-medium",
                  "text-foreground/70 hover:bg-secondary hover:text-foreground",
                  "transition-all duration-150",
                  "min-h-[44px] sm:min-h-0 sm:px-2 sm:py-1 sm:text-[11px]"
                )}
              >
                <AlarmClock className="h-3 w-3" />
                Snooze
                <ChevronDown className="h-3 w-3" />
              </button>
              {snoozeDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setSnoozeDropdownOpen(false)} />
                  <div className={cn(
                    "absolute z-50 mt-1 w-40 rounded-xl border border-border/60 bg-popover",
                    "shadow-[0_8px_30px_-8px_rgb(0_0_0/0.12)]",
                    "right-0 top-full sm:left-0 sm:right-auto"
                  )}>
                    {[
                      { label: "1 hour", value: "1h" },
                      { label: "4 hours", value: "4h" },
                      { label: "Tomorrow", value: "tomorrow" },
                      { label: "Next week", value: "next_week" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setSnoozeDropdownOpen(false)
                          onBulkSnooze(opt.value)
                        }}
                        className={cn(
                          "flex w-full items-center px-3 text-[13px] text-foreground",
                          "hover:bg-secondary/60 transition-colors duration-100",
                          "first:rounded-t-xl last:rounded-b-xl",
                          "min-h-[44px] sm:min-h-0 sm:py-2 sm:text-[12px]"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Add tag dropdown */}
          {onBulkAddTag && (
            <div className="relative">
              <button
                onClick={() => setTagDropdownOpen((o) => !o)}
                className={cn(
                  "flex items-center gap-1 rounded-md px-3 text-[12px] font-medium",
                  "text-foreground/70 hover:bg-secondary hover:text-foreground",
                  "transition-all duration-150",
                  "min-h-[44px] sm:min-h-0 sm:px-2 sm:py-1 sm:text-[11px]"
                )}
              >
                <Tag className="h-3 w-3" />
                Add tag
                <ChevronDown className="h-3 w-3" />
              </button>
              {tagDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setTagDropdownOpen(false)} />
                  <div className={cn(
                    "absolute z-50 mt-1 w-44 max-h-52 overflow-y-auto rounded-xl border border-border/60 bg-popover",
                    "shadow-[0_8px_30px_-8px_rgb(0_0_0/0.12)]",
                    "right-0 top-full sm:left-0 sm:right-auto"
                  )}>
                    {availableTags.length === 0 ? (
                      <p className="px-3 py-2 text-[12px] text-muted-foreground/60">No tags available</p>
                    ) : (
                      availableTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => {
                            setTagDropdownOpen(false)
                            onBulkAddTag(tag)
                          }}
                          className={cn(
                            "flex w-full items-center px-3 text-[13px] text-foreground",
                            "hover:bg-secondary/60 transition-colors duration-100",
                            "first:rounded-t-xl last:rounded-b-xl",
                            "min-h-[44px] sm:min-h-0 sm:py-2 sm:text-[12px]"
                          )}
                        >
                          {tag}
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Delete selected tickets */}
          {onBulkDelete && (
            <button
              onClick={() => onBulkDelete()}
              className={cn(
                "flex items-center gap-1 rounded-md px-3 text-[12px] font-medium",
                "text-red-600 hover:bg-red-500/10 hover:text-red-700",
                "transition-all duration-150",
                /* 44px touch target on mobile */
                "min-h-[44px] sm:min-h-0 sm:px-2 sm:py-1 sm:text-[11px]"
              )}
              aria-label="Delete selected tickets"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </button>
          )}
        </div>
      )}

      {/* ── Ticket list ── */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {filtered.length === 0 ? (
          /* Empty state: centered, good padding on all screen sizes */
          <div className="flex min-h-[200px] items-center justify-center px-6 py-12">
            <p className="text-center text-[14px] leading-relaxed text-muted-foreground/50 lg:text-[13px]">
              No tickets found
            </p>
          </div>
        ) : (
          filtered.map((ticket) => {
            const ChannelIcon = channelIcons[ticket.channel]
            const channelColor = channelColors[ticket.channel]
            const statusCfg = statusConfig[ticket.status]
            const StatusIcon = statusCfg.icon
            const isSelected = selectedTicket?.id === ticket.id
            const isBulkSelected = selectedIds.has(ticket.id)
            const initials = getInitials(ticket.customerName)

            const lastMessage = [...ticket.messages].reverse().find((m) => !m.isInternal) ?? ticket.messages[ticket.messages.length - 1]

            const visibleTags = ticket.tags?.slice(0, 2) ?? []
            const extraTagCount = (ticket.tags?.length ?? 0) - visibleTags.length

            return (
              <div
                key={ticket.id}
                className={cn(
                  "group relative flex w-full items-start gap-2 border-b border-border/40 text-left transition-all duration-150",
                  /* Mobile: generous padding for touch; desktop: tighter */
                  "px-3 py-3 sm:px-3 sm:py-3",
                  /* Mobile: minimum 56px row height for comfortable touch */
                  "min-h-[56px] lg:min-h-0",
                  isBulkSelected
                    ? "bg-accent/[0.06]"
                    : isSelected
                    ? "bg-secondary/80"
                    : "hover:bg-secondary/40"
                )}
              >
                {/* Active indicator -- left border accent like Linear */}
                {isSelected && !isBulkSelected && (
                  <span className="absolute left-0 top-0 bottom-0 w-[2px] rounded-r-full bg-accent" />
                )}

                {/* Per-row checkbox: visible when unchecked, no heavy outline */}
                <div
                  className={cn(
                    "flex shrink-0 items-center justify-center self-center transition-colors duration-150",
                    "h-11 w-11 lg:h-9 lg:w-9 rounded-md",
                    isBulkSelected ? "bg-accent/5" : "hover:bg-muted/40"
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={isBulkSelected}
                    onCheckedChange={() => toggleTicket(ticket.id)}
                    aria-label={`Select ticket ${ticket.id}`}
                    className={cn(
                      "h-4 w-4 rounded-[4px] border-2 bg-background shadow-none outline-none",
                      "border-muted-foreground/35 data-[state=checked]:border-accent data-[state=checked]:bg-accent",
                      "ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    )}
                  />
                </div>

                {/* Clickable row content -- navigates to ticket */}
                <button
                  onClick={() => onSelectTicket(ticket)}
                  className="flex min-w-0 flex-1 items-start gap-2.5 text-left sm:gap-3"
                >
                  {/* Avatar: 36px on mobile for touch, 32px on desktop */}
                  <div className={cn(
                    "flex shrink-0 items-center justify-center rounded-full font-semibold transition-colors duration-150",
                    "h-9 w-9 text-[12px] sm:h-8 sm:w-8 sm:text-[11px]",
                    ticket.channel === "livechat"
                      ? isSelected
                        ? "bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/25"
                        : "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/15"
                      : isSelected
                        ? "bg-accent/10 text-accent"
                        : "bg-secondary text-muted-foreground"
                  )}>
                    {ticket.channel === "livechat" ? (
                      <MessageSquare className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
                    ) : (
                      initials
                    )}
                  </div>

                  {/* Content area */}
                  <div className="min-w-0 flex-1">
                    {/* Row 1: Name + timestamp */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-[14px] font-medium text-foreground sm:text-[13px]">
                        {ticket.customerName}
                      </span>
                      <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground/50">
                        {ticket.createdAt}
                      </span>
                    </div>

                    {/* Row 2: Subject */}
                    <p className="mt-0.5 truncate text-[13px] font-medium text-foreground/70 sm:text-[12px]">
                      {ticket.subject}
                    </p>

                    {/* Row 3: Message preview */}
                    <p className="mt-0.5 truncate text-[12px] leading-relaxed text-muted-foreground/60">
                      {lastMessage?.content.slice(0, 55)}
                      {lastMessage && lastMessage.content.length > 55 ? "..." : ""}
                    </p>

                    {/* Row 4: Channel + Status + Priority + SLA badges -- flex-wrap to prevent overflow */}
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
                      {/* Channel */}
                      <div className="flex shrink-0 items-center gap-1">
                        <ChannelIcon className={cn("h-3 w-3 shrink-0", channelColor)} />
                        <span className={cn(
                          "text-[11px] font-medium",
                          ticket.channel === "livechat" ? "text-emerald-700" : "text-muted-foreground/50"
                        )}>
                          {ticket.channel === "livechat" ? "Live Chat" : "Email"}
                        </span>
                      </div>

                      {/* Status badge */}
                      <span className={cn(
                        "inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-px text-[10px] font-semibold",
                        statusCfg.badgeBg
                      )}>
                        <StatusIcon className="h-2.5 w-2.5 shrink-0" />
                        {statusCfg.label}
                      </span>

                      {/* Priority badge */}
                      {ticket.priority === "high" && (
                        <span className="shrink-0 rounded-full bg-red-500/10 px-1.5 py-px text-[10px] font-semibold text-red-500">
                          High
                        </span>
                      )}

                      {/* SLA badge */}
                      {ticket.sla && (
                        <span className={cn(
                          "flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-px text-[10px] font-semibold",
                          ticket.sla.breached
                            ? "bg-red-500/10 text-red-600"
                            : ticket.sla.deadline.includes("m") && !ticket.sla.deadline.includes("h")
                              ? "bg-amber-500/10 text-amber-600"
                              : "bg-emerald-500/10 text-emerald-600"
                        )}>
                          <Clock className="h-2.5 w-2.5 shrink-0" />
                          {ticket.sla.breached ? "Breached" : ticket.sla.deadline}
                        </span>
                      )}
                    </div>

                    {/* Row 5: Tags -- flex-wrap for multiple tags */}
                    {visibleTags.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        {visibleTags.map((tag) => (
                          <span
                            key={tag}
                            className="max-w-[120px] truncate rounded-full bg-secondary/80 px-2 py-px text-[10px] font-medium text-muted-foreground transition-colors duration-100"
                          >
                            {tag}
                          </span>
                        ))}
                        {extraTagCount > 0 && (
                          <span className="shrink-0 rounded-full bg-secondary/80 px-2 py-px text-[10px] font-medium text-muted-foreground/60">
                            +{extraTagCount}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
