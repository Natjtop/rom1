"use client"

import { useMemo, useState, useEffect, useCallback, useRef } from "react"
import { InboxSkeleton } from "@/components/dashboard/skeleton"
import { TicketFilters } from "@/components/dashboard/inbox/ticket-filters"
import { TicketList } from "@/components/dashboard/inbox/ticket-list"
import { TicketThread } from "@/components/dashboard/inbox/ticket-thread"
import { CustomerSidebar } from "@/components/dashboard/inbox/customer-sidebar"
import { CommandPalette } from "@/components/dashboard/command-palette"
import { toast } from "sonner"
import { Inbox, MessageSquare, User, Loader2, ChevronLeft, AlertCircle, RefreshCw, SlidersHorizontal, X, ArrowUpDown, Search, Keyboard } from "lucide-react"
import type { UITicket as Ticket, UITicketChannel as TicketChannel, UITicketStatus as TicketStatus, UIMessage as Message } from "@/lib/types"
import { tickets as ticketsApi, messages as messagesApi, tags as tagsApi } from "@/lib/api"
import type { Ticket as ApiTicket, Message as ApiMessage } from "@/lib/types"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { subscribeToWorkspace, unsubscribeFromWorkspace, PusherEvents } from "@/lib/pusher-client"
import { cn } from "@/lib/utils"

type MobileView = "list" | "thread" | "customer"

/**
 * Derive ticket subject from email subject metadata or first message content.
 * For EMAIL tickets, prefer the email Subject header stored in message metadata.
 * For other channels, use the first message content truncated to 60 chars.
 */
function deriveTicketSubject(t: ApiTicket, msgs: Message[]): string {
  // Check first CUSTOMER message metadata for email subject
  const firstCustomerMsg = (t.messages ?? []).find((m) => m.role === "CUSTOMER")
  const emailSubject = (firstCustomerMsg?.metadata as Record<string, unknown> | null)?.subject as string | undefined
  if (emailSubject && emailSubject.trim()) return emailSubject.trim().slice(0, 80)

  // Fallback: first message content
  const firstContent = msgs[0]?.content
  if (firstContent) return firstContent.slice(0, 60)

  return "No subject"
}

/** Format a date as "now" / "Xm ago" / "Xh ago" / "Xd ago" for list display. */
function formatAgo(dateOrTs: Date | number): string {
  const ts = typeof dateOrTs === "number" ? dateOrTs : dateOrTs.getTime()
  const now = Date.now()
  const diffMs = now - ts
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "now"
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`
  return `${Math.floor(diffMin / 1440)}d ago`
}

function formatSnoozeLabel(isoDate: string): string {
  const d = new Date(isoDate)
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  if (diffMs <= 0) return "expired"
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 60) return `${diffMin}m`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h`
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  if (d.toDateString() === tomorrow.toDateString()) return `Tomorrow ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
  return d.toLocaleDateString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}

// Transform API ticket to component format
function transformTicket(t: ApiTicket): Ticket {
  const statusMap: Record<string, TicketStatus> = {
    OPEN: "open",
    PENDING: "pending",
    AI_REPLIED: "ai_replied",
    ESCALATED: "escalated",
    SNOOZED: "snoozed",
    CLOSED: "closed",
    MERGED: "closed",
  }

  const channelMap: Record<string, TicketChannel> = {
    EMAIL: "email",
    LIVE_CHAT: "livechat",
  }

  const priorityMap: Record<string, "low" | "medium" | "high"> = {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    URGENT: "high",
  }

  const msgs: Message[] = (t.messages ?? []).map((m) => ({
    id: m.id,
    role: m.role.toLowerCase() as Message["role"],
    content: m.content,
    timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    isInternal: m.isInternal,
    source: ((m.metadata as Record<string, unknown> | null)?.source as string | undefined) ?? undefined,
  }))

  // Use last message date for "X ago" in list (backend sends lastMessageAt; else from messages or ticket updatedAt)
  const lastMessageAtApi = (t as ApiTicket).lastMessageAt
  const rawMessages = t.messages ?? []
  const lastMessageAtFromMsgs =
    rawMessages.length > 0
      ? Math.max(...rawMessages.map((m) => new Date(m.createdAt).getTime()))
      : 0
  const dateForAgo = lastMessageAtApi
    ? new Date(lastMessageAtApi).getTime()
    : lastMessageAtFromMsgs > 0
      ? lastMessageAtFromMsgs
      : new Date((t as ApiTicket).updatedAt ?? t.createdAt).getTime()
  const createdAt = formatAgo(dateForAgo)

  return {
    id: t.id,
    customerName: t.customerName ?? t.customerEmail,
    customerEmail: t.customerEmail,
    channel: channelMap[t.channel] ?? "email",
    status: statusMap[t.status] ?? "open",
    subject: deriveTicketSubject(t, msgs),
    priority: priorityMap[t.priority] ?? "medium",
    orderId: t.orderId ?? undefined,
    messages: msgs,
    createdAt,
    ltv: (t as unknown as Record<string, unknown>).ltv as number ?? 0,
    totalOrders: (t as unknown as Record<string, unknown>).totalOrders as number ?? 0,
    tags: t.tags ?? undefined,
    snooze: t.snoozeUntil ? { until: t.snoozeUntil, label: formatSnoozeLabel(t.snoozeUntil) } : undefined,
    assignedTo: (t as unknown as Record<string, unknown>).assignedAgent
      ? ((t as unknown as Record<string, unknown>).assignedAgent as { name: string }).name
      : undefined,
  }
}

export default function InboxPage() {
  const { workspace } = useAuth()
  const searchParams = useSearchParams()
  const ticketIdFromUrl = searchParams.get("ticket")
  const [filter, setFilter]               = useState("all")
  const [allTickets, setAllTickets]        = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [sidebarOpen, setSidebarOpen]     = useState(true)
  const [cmdOpen, setCmdOpen]             = useState(false)
  const [mobileView, setMobileView]       = useState<MobileView>("list")
  const [selectedIds, setSelectedIds]     = useState<Set<string>>(new Set())
  const [loading, setLoading]             = useState(true)
  const [fetchError, setFetchError]       = useState(false)
  const [countsFromApi, setCountsFromApi] = useState<Record<string, number> | null>(null)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [nextCursor, setNextCursor]       = useState<string | null>(null)
  const [hasMore, setHasMore]             = useState(false)
  const [loadingMore, setLoadingMore]     = useState(false)
  const [isRefreshing, setIsRefreshing]   = useState(false)
  const [threadLoading, setThreadLoading] = useState(false)
  const refreshInFlightRef = useRef(false)

  // Search with debounce
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sort options
  const [sortBy, setSortBy] = useState<"createdAt" | "updatedAt" | "priority">("createdAt")
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc")
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  // Keyboard shortcuts overlay
  const [showShortcuts, setShowShortcuts] = useState(false)

  // Advanced filters
  const [advFilters, setAdvFilters] = useState({
    channel: "",
    priority: "",
    assignee: "",
    tags: [] as string[],
  })
  const [showAdvFilters, setShowAdvFilters] = useState(false)
  const urlTicketAppliedRef = useRef<string | null>(null)
  const internalNoteLockTicketIdRef = useRef<string | null>(null)

  // Debounce search input (300ms)
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    }
  }, [search])

  // Fetch tickets: by default backend excludes CLOSED/MERGED so "deleted" tickets don't reappear on refresh.
  // When filter is "closed", request status=CLOSED. Counts come from GET /tickets/counts for sidebar.
  const fetchTickets = useCallback(async (cursor?: string) => {
    if (!cursor) {
      setFetchError(false)
    } else {
      setLoadingMore(true)
    }

    try {
      const params: Record<string, string> = { limit: "50" }
      if (filter === "closed") params.status = "CLOSED"
      if (advFilters.channel) {
        const rawChannel = String(advFilters.channel).trim()
        const normalizedChannel = rawChannel.toLowerCase().replace(/[_\s-]/g, "")
        const channelMap: Record<string, string> = {
          email: "EMAIL",
          livechat: "LIVE_CHAT",
        }
        params.channel = channelMap[normalizedChannel] ?? rawChannel.toUpperCase()
      }
      if (advFilters.priority) params.priority = advFilters.priority.toUpperCase()
      if (advFilters.assignee) params.assignedAgentId = advFilters.assignee
      if (debouncedSearch) params.search = debouncedSearch
      if (sortBy !== "createdAt" || sortOrder !== "desc") {
        params.sortBy = sortBy
        params.sortOrder = sortOrder
      }
      if (cursor) params.cursor = cursor

      const res = await ticketsApi.list(params)
      const transformed = res.data.map(transformTicket)

      if (cursor) {
        setAllTickets((prev) => [...prev, ...transformed])
      } else {
        // Merge fresh API data with existing state to preserve already-loaded messages.
        setAllTickets((prev) => {
          const merged = transformed.map((fresh) => {
            const existing = prev.find((t) => t.id === fresh.id)
            if (existing && existing.messages.length > 1) {
              return { ...fresh, messages: existing.messages, subject: existing.subject }
            }
            return fresh
          })
          return merged
        })
        setSelectedTicket((prev) => {
          if (prev) return prev
          return transformed[0] ?? null
        })
      }
      setNextCursor(res.nextCursor ?? null)
      setHasMore(res.hasMore ?? false)
    } catch {
      if (!cursor) {
        setAllTickets([])
        setSelectedTicket(null)
        setFetchError(true)
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [advFilters, debouncedSearch, sortBy, sortOrder, filter])

  const fetchCounts = useCallback(async () => {
    try {
      const c = await ticketsApi.counts()
      setCountsFromApi(c)
    } catch {
      setCountsFromApi(null)
    }
  }, [])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  useEffect(() => {
    fetchCounts()
  }, [fetchCounts])

  const refreshTickets = useCallback(async () => {
    if (refreshInFlightRef.current) return
    refreshInFlightRef.current = true
    setIsRefreshing(true)
    try {
      await fetchTickets()
    } finally {
      setIsRefreshing(false)
      refreshInFlightRef.current = false
    }
  }, [fetchTickets])

  useEffect(() => {
    const intervalId = setInterval(() => {
      refreshTickets()
    }, 30000)
    return () => clearInterval(intervalId)
  }, [refreshTickets])

  // Select ticket from URL query param (e.g., /inbox?ticket=abc123).
  // Apply only once per query value so list updates don't override agent's current selection.
  useEffect(() => {
    if (!ticketIdFromUrl) {
      urlTicketAppliedRef.current = null
      return
    }
    if (urlTicketAppliedRef.current === ticketIdFromUrl) return
    if (allTickets.length > 0) {
      const match = allTickets.find((t) => t.id === ticketIdFromUrl)
      if (match) {
        setSelectedTicket(match)
        urlTicketAppliedRef.current = ticketIdFromUrl
      }
    }
  }, [ticketIdFromUrl, allTickets])

  // Auto-load full messages when selectedTicket changes and has only a preview (1 message).
  // This covers: initial page load auto-select, URL param select, keyboard nav.
  const loadingMessagesRef = useRef<string | null>(null)
  useEffect(() => {
    if (!selectedTicket) return
    // Skip if we already have full messages or already loading this ticket
    if (selectedTicket.messages.length > 1) return
    if (loadingMessagesRef.current === selectedTicket.id) return
    loadingMessagesRef.current = selectedTicket.id
    setThreadLoading(true)

    const ticketId = selectedTicket.id
    messagesApi.list(ticketId).then((result) => {
      const apiMsgs: ApiMessage[] = Array.isArray(result) ? result : (result as { data?: ApiMessage[] }).data ?? []
      const msgs = apiMsgs.map((m: ApiMessage) => ({
        id: m.id,
        role: m.role.toLowerCase() as Message["role"],
        content: m.content,
        timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
        isInternal: m.isInternal,
        source: ((m.metadata as Record<string, unknown> | null)?.source as string | undefined) ?? undefined,
      }))
      if (msgs.length > 0) {
        const firstCustomerMsg = apiMsgs.find((m) => m.role === "CUSTOMER")
        const emailSubject = (firstCustomerMsg?.metadata as Record<string, unknown> | null)?.subject as string | undefined
        const subject = (emailSubject?.trim()) || msgs[0]?.content.slice(0, 60) || selectedTicket.subject

        setSelectedTicket(prev => prev?.id === ticketId ? { ...prev, messages: msgs, subject } : prev)
        setAllTickets(prev => prev.map(t => t.id === ticketId ? { ...t, messages: msgs, subject } : t))
      }
    }).catch(() => {
      // Keep preview message if fetch fails
    }).finally(() => {
      if (loadingMessagesRef.current === ticketId) loadingMessagesRef.current = null
      setThreadLoading(false)
    })
  }, [selectedTicket?.id, selectedTicket?.messages.length])

  // Real-time updates via Pusher
  useEffect(() => {
    if (!workspace?.id) return

    const channel = subscribeToWorkspace(workspace.id)

    // TICKET_CREATED — backend sends { ticket: { id, customerEmail, ... } }
    channel.bind(PusherEvents.TICKET_CREATED, (data: { ticket?: ApiTicket } & Partial<ApiTicket>) => {
      // Handle both { ticket: {...} } and direct ticket format
      const ticketData = data.ticket ?? data
      if (!ticketData.id || !ticketData.customerEmail) return // guard against malformed data
      const transformed = transformTicket(ticketData as ApiTicket)
      setAllTickets((prev) => {
        // Avoid duplicate if ticket already exists
        if (prev.some((t) => t.id === transformed.id)) return prev
        return [transformed, ...prev]
      })
      toast("New ticket", { description: `${ticketData.customerName ?? ""}: ${ticketData.customerEmail}` })
    })

    // TICKET_UPDATED — backend sends { ticketId: "xxx", changes: { status, priority, ... } }
    // Merge changes into existing ticket instead of replacing it
    channel.bind(PusherEvents.TICKET_UPDATED, (data: { ticketId?: string; changes?: Record<string, unknown> } & Partial<ApiTicket>) => {
      const ticketId = data.ticketId ?? data.id
      if (!ticketId) return

      const statusMap: Record<string, TicketStatus> = {
        OPEN: "open", PENDING: "pending", AI_REPLIED: "ai_replied",
        ESCALATED: "escalated", SNOOZED: "snoozed", CLOSED: "closed", MERGED: "closed",
      }
      const priorityMap: Record<string, "low" | "medium" | "high"> = {
        LOW: "low", MEDIUM: "medium", HIGH: "high", URGENT: "high",
      }

      // Build partial UI update from changes
      const changes = data.changes ?? {}
      const uiUpdates: Partial<Ticket> = {}
      if (typeof changes.status === "string") uiUpdates.status = statusMap[changes.status] ?? (changes.status.toLowerCase() as TicketStatus)
      if (typeof changes.priority === "string") uiUpdates.priority = priorityMap[changes.priority] ?? "medium"
      if (typeof changes.assignedAgentId === "string") uiUpdates.assignedTo = changes.assignedAgentId
      if (typeof changes.snoozeUntil === "string") uiUpdates.snooze = { until: changes.snoozeUntil, label: "Snoozed" }
      if (changes.snoozeUntil === null) uiUpdates.snooze = undefined
      if (Array.isArray(changes.tags)) uiUpdates.tags = changes.tags as string[]

      setAllTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, ...uiUpdates } : t))
      setSelectedTicket((prev) => prev?.id === ticketId ? { ...prev, ...uiUpdates } : prev)
    })

    // MESSAGE_NEW — backend sends { ticketId, message: { id, role, content, createdAt } }
    channel.bind(PusherEvents.MESSAGE_NEW, (data: { ticketId: string; message: ApiMessage }) => {
      const msg: Message = {
        id: data.message.id,
        role: data.message.role.toLowerCase() as Message["role"],
        content: data.message.content,
        timestamp: new Date(data.message.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
        isInternal: data.message.isInternal,
        source: ((data.message.metadata as Record<string, unknown> | null)?.source as string | undefined) ?? undefined,
      }
      const newCreatedAt = formatAgo(new Date(data.message.createdAt))
      setAllTickets((prev) => {
        const updated = prev.map((t) => {
          if (t.id !== data.ticketId) return t
          if (t.messages.some((m) => m.id === msg.id)) return t
          return { ...t, messages: [...t.messages, msg], createdAt: newCreatedAt }
        })
        const ticket = updated.find((t) => t.id === data.ticketId)
        if (!ticket || updated.indexOf(ticket) === 0) return updated
        return [ticket, ...updated.filter((t) => t.id !== data.ticketId)]
      })
      setSelectedTicket((prev) => {
        if (prev?.id !== data.ticketId) return prev
        if (prev.messages.some((m) => m.id === msg.id)) return prev
        return { ...prev, messages: [...prev.messages, msg], createdAt: newCreatedAt }
      })
    })

    return () => {
      unsubscribeFromWorkspace(workspace.id)
    }
  }, [workspace?.id])

  const filteredTickets = useMemo(() => {
    let filtered = allTickets
    if (filter !== "all") {
      filtered = filtered.filter((t) => t.status === filter)
    }
    // Apply tag filter client-side
    if (advFilters.tags.length > 0) {
      filtered = filtered.filter((t) =>
        advFilters.tags.every((tag) => t.tags?.includes(tag))
      )
    }
    return filtered
  }, [filter, allTickets, advFilters.tags])

  const counts = useMemo(() => {
    if (countsFromApi) {
      return { ...countsFromApi, all: countsFromApi.all ?? Object.values(countsFromApi).reduce((a, b) => a + b, 0) }
    }
    const result: Record<string, number> = { all: allTickets.length }
    for (const t of allTickets) {
      result[t.status] = (result[t.status] ?? 0) + 1
    }
    return result
  }, [allTickets, countsFromApi])

  const handleFilterChange = (f: string) => {
    setFilter(f)
    setSelectedIds(new Set())
    setMobileFiltersOpen(false)
    // Auto-select first visible ticket after filter change
    const visible = f === "all" ? allTickets : allTickets.filter((t) => t.status === f)
    if (visible.length > 0 && (!selectedTicket || !visible.find((t) => t.id === selectedTicket.id))) {
      setSelectedTicket(visible[0])
    }
  }

  useEffect(() => {
    if (selectedTicket && window.innerWidth < 768) {
      setMobileView("thread")
    }
  }, [selectedTicket])

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1280) {
      setSidebarOpen(false)
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      const isTyping = tag === "TEXTAREA" || tag === "INPUT" || (e.target as HTMLElement).isContentEditable

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setCmdOpen(true)
        return
      }

      if (isTyping) return

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault()
        const idx = selectedTicket ? filteredTickets.findIndex((t) => t.id === selectedTicket.id) : -1
        const next = filteredTickets[idx + 1]
        if (next) {
          setSelectedTicket(next)
          toast("Ticket " + next.id, { description: next.subject, duration: 1500 })
        }
        return
      }

      if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault()
        const idx = selectedTicket ? filteredTickets.findIndex((t) => t.id === selectedTicket.id) : filteredTickets.length
        const prev = filteredTickets[idx - 1]
        if (prev) {
          setSelectedTicket(prev)
          toast("Ticket " + prev.id, { description: prev.subject, duration: 1500 })
        }
        return
      }

      if (e.key === "?") {
        e.preventDefault()
        setShowShortcuts((prev) => !prev)
      }
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [filteredTickets, selectedTicket])

  const handleSelectTicket = useCallback(async (ticket: Ticket) => {
    if (window.innerWidth < 768) {
      setMobileView("thread")
    }
    // If ticket already has full messages loaded in this session (>1), show immediately — no loading
    if (ticket.messages.length > 1) {
      setSelectedTicket(ticket)
      setThreadLoading(false)
      return
    }
    // Otherwise show loading until messages are fetched
    setSelectedTicket({ ...ticket, messages: [] })
    setThreadLoading(true)
    try {
      const result = await messagesApi.list(ticket.id)
      const apiMsgs: ApiMessage[] = Array.isArray(result) ? result : (result as { data?: ApiMessage[] }).data ?? []
      const msgs = apiMsgs.map((m: ApiMessage) => ({
        id: m.id,
        role: m.role.toLowerCase() as Message["role"],
        content: m.content,
        timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
        isInternal: m.isInternal,
        source: ((m.metadata as Record<string, unknown> | null)?.source as string | undefined) ?? undefined,
      }))
      if (msgs.length > 0) {
        const firstCustomerMsg = apiMsgs.find((m) => m.role === "CUSTOMER")
        const emailSubject = (firstCustomerMsg?.metadata as Record<string, unknown> | null)?.subject as string | undefined
        const subject = (emailSubject?.trim()) || msgs[0]?.content.slice(0, 60) || ticket.subject

        setSelectedTicket(prev => prev?.id === ticket.id ? { ...prev, messages: msgs, subject } : prev)
        setAllTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, messages: msgs, subject } : t))
      }
    } catch {
      // Keep preview message if full fetch fails
    } finally {
      setThreadLoading(false)
    }
  }, [])

  // Send reply handler
  const handleSendReply = useCallback(async (content: string, isInternal: boolean) => {
    if (!selectedTicket) return
    const ticketId = selectedTicket.id

    try {
      if (isInternal) {
        // Keep current selection pinned while internal note save + realtime updates settle.
        internalNoteLockTicketIdRef.current = ticketId
        setTimeout(() => {
          if (internalNoteLockTicketIdRef.current === ticketId) internalNoteLockTicketIdRef.current = null
        }, 2500)
      }
      const created = await messagesApi.send(ticketId, { content, isInternal })
      const newMsg: Message = {
        id: created.id,
        role: "human",
        content,
        timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
        isInternal,
        source: isInternal ? "internal_note" : undefined,
      }
      const newCreatedAt = formatAgo(Date.now())
      setAllTickets((prev) => {
        const updated = prev.map((t) => {
          if (t.id !== ticketId) return t
          if (t.messages.some((m) => m.id === newMsg.id)) return t
          return { ...t, messages: [...t.messages, newMsg], createdAt: newCreatedAt }
        })
        const ticket = updated.find((t) => t.id === ticketId)
        if (!ticket || updated.indexOf(ticket) === 0) return updated
        return [ticket, ...updated.filter((t) => t.id !== ticketId)]
      })
      setSelectedTicket((prev) => {
        if (!prev || prev.id !== ticketId) return prev
        if (prev.messages.some((m) => m.id === newMsg.id)) return prev
        return { ...prev, messages: [...prev.messages, newMsg], createdAt: newCreatedAt }
      })
      toast.success(isInternal ? "Note added" : "Reply sent")
    } catch (err) {
      console.error("Failed to send message:", err)
      toast.error("Failed to send reply")
    }
  }, [selectedTicket])

  // Guard against accidental ticket switch right after posting an internal note.
  useEffect(() => {
    const lockedTicketId = internalNoteLockTicketIdRef.current
    if (!lockedTicketId) return
    if (selectedTicket?.id === lockedTicketId) return
    const lockedTicket = allTickets.find((t) => t.id === lockedTicketId)
    if (lockedTicket) setSelectedTicket(lockedTicket)
  }, [allTickets, selectedTicket?.id])

  // Update ticket status handler -- updates local state immediately
  const handleStatusChange = useCallback(async (ticketId: string, status: string) => {
    const validStatus = status as TicketStatus
    // Optimistically update local ticket list
    setAllTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: validStatus } : t))
    )
    setSelectedTicket((prev) =>
      prev?.id === ticketId ? { ...prev, status: validStatus } : prev
    )

    const statusMap: Record<string, string> = {
      open: "OPEN",
      pending: "PENDING",
      escalated: "ESCALATED",
      snoozed: "SNOOZED",
      closed: "CLOSED",
    }

    try {
      await ticketsApi.update(ticketId, { status: statusMap[status] ?? status })
    } catch {
      // Revert optimistic update on failure
      toast.error("Failed to update ticket status")
      fetchTickets()
    }
  }, [])

  // Update ticket locally (for assign, snooze, merge, etc.)
  const handleTicketUpdate = useCallback((ticketId: string, updates: Partial<Ticket>) => {
    setAllTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, ...updates } : t))
    )
    setSelectedTicket((prev) =>
      prev?.id === ticketId ? { ...prev, ...updates } : prev
    )
  }, [])

  // Merge tickets handler
  const handleMergeTicket = useCallback(async (sourceId: string, targetId: string) => {
    try {
      await ticketsApi.merge(sourceId, targetId)
      setAllTickets((prev) => {
        const source = prev.find((t) => t.id === sourceId)
        const target = prev.find((t) => t.id === targetId)
        if (!source || !target) return prev
        // Merge messages from source into target, remove source
        const merged = {
          ...target,
          messages: [...target.messages, ...source.messages],
        }
        return prev
          .map((t) => (t.id === targetId ? merged : t))
          .filter((t) => t.id !== sourceId)
      })
      // Select the target ticket after merge
      setSelectedTicket((prev) => {
        if (prev?.id === sourceId) {
          const target = allTickets.find((t) => t.id === targetId)
          return target ?? prev
        }
        return prev
      })
      toast.success("Tickets merged")
    } catch {
      toast.error("Failed to merge tickets")
    }
  }, [allTickets])

  // Bulk close selected tickets (remove from list so they don't reappear; backend excludes CLOSED by default)
  const handleBulkClose = useCallback(async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    const closedSet = new Set(ids)
    setAllTickets((prev) => prev.filter((t) => !closedSet.has(t.id)))
    setSelectedIds(new Set())
    setSelectedTicket((prev) => (prev && closedSet.has(prev.id) ? null : prev))
    toast.success(`${ids.length} ticket${ids.length > 1 ? "s" : ""} closed`)
    try {
      await ticketsApi.bulk({ ticketIds: ids, action: "close" })
      fetchCounts()
    } catch {
      toast.error("Failed to close some tickets")
      fetchTickets()
    }
  }, [selectedIds, fetchCounts, fetchTickets])

  // Bulk snooze selected tickets
  const handleBulkSnooze = useCallback(async (duration: string) => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    const now = new Date()
    let until: Date
    switch (duration) {
      case "1h": until = new Date(now.getTime() + 60 * 60 * 1000); break
      case "4h": until = new Date(now.getTime() + 4 * 60 * 60 * 1000); break
      case "tomorrow": until = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0); break
      case "next_week": until = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 9, 0); break
      default: until = new Date(now.getTime() + 60 * 60 * 1000)
    }
    const untilStr = until.toISOString()
    // Optimistic update
    setAllTickets((prev) =>
      prev.map((t) =>
        selectedIds.has(t.id) ? { ...t, status: "snoozed" as TicketStatus, snooze: { until: untilStr, label: duration } } : t
      )
    )
    setSelectedIds(new Set())
    const labels: Record<string, string> = { "1h": "1 hour", "4h": "4 hours", "tomorrow": "tomorrow", "next_week": "next week" }
    toast.success(`${ids.length} ticket${ids.length > 1 ? "s" : ""} snoozed until ${labels[duration] ?? duration}`)
    try {
      await ticketsApi.bulk({ ticketIds: ids, action: "snooze", value: untilStr })
    } catch {
      toast.error("Failed to snooze some tickets")
    }
  }, [selectedIds])

  // Bulk add tag
  const handleBulkAddTag = useCallback(async (tagName: string) => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0 || !tagName) return
    // Optimistic update
    setAllTickets((prev) =>
      prev.map((t) =>
        selectedIds.has(t.id)
          ? { ...t, tags: [...new Set([...(t.tags ?? []), tagName])] }
          : t
      )
    )
    setSelectedIds(new Set())
    toast.success(`Tag "${tagName}" added to ${ids.length} ticket${ids.length > 1 ? "s" : ""}`)
    try {
      await ticketsApi.bulk({ ticketIds: ids, action: "tag", value: tagName })
    } catch {
      toast.error("Failed to add tag to some tickets")
    }
  }, [selectedIds])

  // Bulk delete selected tickets (soft-delete: closes and removes from list)
  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    const deletedSet = new Set(ids)
    // Optimistic: remove from list and clear selection
    setAllTickets((prev) => prev.filter((t) => !deletedSet.has(t.id)))
    setSelectedIds(new Set())
    setSelectedTicket((prev) => (prev && deletedSet.has(prev.id) ? null : prev))
    toast.success(`${ids.length} ticket${ids.length > 1 ? "s" : ""} deleted`)
    try {
      await ticketsApi.bulk({ ticketIds: ids, action: "delete" })
      fetchCounts()
    } catch {
      toast.error("Failed to delete some tickets")
      // Restore by refetching
      fetchTickets()
    }
  }, [selectedIds, fetchTickets, fetchCounts])

  // Handler for applying a saved view's full filter set
  const handleApplySavedView = useCallback((filters: Record<string, unknown>) => {
    if (filters.status) setFilter(filters.status as string)
    if (typeof filters.search === "string") setSearch(filters.search)
    if (filters.sortBy) setSortBy(filters.sortBy as "createdAt" | "updatedAt" | "priority")
    if (filters.sortOrder) setSortOrder(filters.sortOrder as "desc" | "asc")
    setAdvFilters({
      channel: (filters.channel as string) ?? "",
      priority: (filters.priority as string) ?? "",
      assignee: (filters.assignee as string) ?? "",
      tags: [],
    })
    setSelectedIds(new Set())
  }, [])

  // Current filter state for saved views
  const currentFilters = useMemo(() => ({
    status: filter,
    channel: advFilters.channel,
    priority: advFilters.priority,
    assignee: advFilters.assignee,
    search,
    sortBy,
    sortOrder,
  }), [filter, advFilters, search, sortBy, sortOrder])

  // Sort label for display
  const sortLabel = useMemo(() => {
    if (sortBy === "createdAt" && sortOrder === "desc") return "Newest first"
    if (sortBy === "createdAt" && sortOrder === "asc") return "Oldest first"
    if (sortBy === "priority") return "Priority"
    if (sortBy === "updatedAt") return "Last updated"
    return "Newest first"
  }, [sortBy, sortOrder])

  const mobileTabs: { id: MobileView; label: string; icon: typeof Inbox }[] = [
    { id: "list",     label: "List",     icon: Inbox },
    { id: "thread",   label: "Thread",   icon: MessageSquare },
    { id: "customer", label: "Customer", icon: User },
  ]

  // Loading state — same skeleton as inbox/loading.tsx so no flash when segment loads then data loads.
  if (loading && allTickets.length === 0) {
    return (
      <div className="flex h-full w-full">
        <InboxSkeleton />
      </div>
    )
  }

  // Empty inbox — only when there are truly no tickets at all (no filter active, no search)
  if (allTickets.length === 0 && !loading && !debouncedSearch && fetchError) {
    return (
      <div className="flex flex-col items-center gap-6 py-8 px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
            <AlertCircle className="h-6 w-6 text-muted-foreground/40" />
          </div>
          <p className="text-[14px] font-medium text-foreground/60">Could not load tickets</p>
          <p className="text-[12px] text-muted-foreground/40 max-w-xs">
            Check your connection and try again.
          </p>
          <button
            onClick={() => fetchTickets()}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:bg-secondary transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* ───────────────────── Mobile layout (<1024px) ───────────────────── */}
      <div className="flex h-full flex-col overflow-hidden md:hidden">
        {/* Mobile tab bar: show only in list mode to maximize visible thread area */}
        {mobileView === "list" && (
          <div className="flex shrink-0 items-stretch border-b border-border/60 bg-background">
            {mobileTabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setMobileView(id)}
                className={cn(
                  "relative flex flex-1 items-center justify-center gap-1.5 min-h-[44px] py-2.5 text-[13px] font-medium transition-colors",
                  mobileView === id
                    ? "text-foreground"
                    : "text-muted-foreground active:bg-secondary/60"
                )}
              >
                <Icon className={cn(
                  "h-4 w-4",
                  mobileView === id ? "text-accent" : "text-muted-foreground/60"
                )} />
                <span>{label}</span>
                {mobileView === id && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-t-full bg-accent" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Mobile panel content -- single panel at a time */}
        <div className="min-h-0 flex-1 overflow-hidden">
          {/* ── List view ── */}
          {mobileView === "list" && (
            <div className="flex h-full flex-col overflow-hidden">
              {/* Mobile filter toggle bar */}
              <div className="flex min-h-[44px] shrink-0 items-center gap-2 border-b border-border/60 bg-secondary/20 px-3 py-2">
                <button
                  onClick={() => setMobileFiltersOpen((o) => !o)}
                  className="flex min-h-[36px] flex-1 items-center gap-2 text-[12px] font-medium text-muted-foreground active:bg-secondary/40"
                >
                  <Inbox className="h-3.5 w-3.5" />
                  <span className="capitalize">{filter === "all" ? "All tickets" : filter.replace("_", " ")}</span>
                  <span className="ml-auto rounded-full bg-accent/10 px-1.5 py-px text-[10px] font-semibold text-accent tabular-nums">
                    {counts[filter] ?? 0}
                  </span>
                </button>
                <button
                  onClick={refreshTickets}
                  disabled={isRefreshing}
                  className="inline-flex min-h-[36px] items-center gap-1 rounded-md border border-border/60 bg-background px-2 py-1 text-[11px] font-medium text-foreground disabled:opacity-50"
                >
                  <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
                  Refresh
                </button>
              </div>

              {/* Collapsible filters for small mobile */}
              {mobileFiltersOpen && (
                <div className="shrink-0 border-b border-border/60 bg-background">
                  <TicketFilters
                    activeFilter={filter}
                    onFilterChange={handleFilterChange}
                    counts={counts}
                    mobile
                    currentFilters={currentFilters}
                    onApplySavedView={handleApplySavedView}
                  />
                </div>
              )}

              {/* Mobile list panel */}
              <div className="flex min-h-0 flex-1 overflow-hidden">
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  <TicketList
                    tickets={filteredTickets}
                    selectedTicket={selectedTicket}
                    onSelectTicket={handleSelectTicket}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    onTicketUpdate={handleTicketUpdate}
                    onBulkClose={handleBulkClose}
                    onBulkSnooze={handleBulkSnooze}
                    onBulkAddTag={handleBulkAddTag}
                    onBulkDelete={handleBulkDelete}
                  />
                  {hasMore && (
                    <div className="shrink-0 border-t border-border/60 p-2">
                      <button
                        onClick={() => fetchTickets(nextCursor ?? undefined)}
                        disabled={loadingMore}
                        className="w-full rounded-lg border border-border/60 bg-secondary/50 px-3 py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50 min-h-[44px]"
                      >
                        {loadingMore ? "Loading..." : "Load more tickets"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Thread view ── */}
          {mobileView === "thread" && (
            <div className="flex h-full flex-col overflow-hidden">
              {/* Back to list button (mobile only) — no border on mobile to avoid dark line above thread */}
              <button
                onClick={() => setMobileView("list")}
                className="flex min-h-[44px] shrink-0 items-center gap-1.5 bg-background px-3 py-2 text-[13px] font-medium text-muted-foreground active:bg-secondary/40"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to list
              </button>
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                {selectedTicket && threadLoading ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="text-[13px]">Loading conversation...</span>
                  </div>
                ) : (
                  <TicketThread
                    ticket={selectedTicket}
                    allTickets={allTickets}
                    sidebarOpen={false}
                    onToggleSidebar={() => setMobileView("customer")}
                    onSendReply={handleSendReply}
                    onStatusChange={handleStatusChange}
                    onTicketUpdate={handleTicketUpdate}
                    onMergeTicket={handleMergeTicket}
                  />
                )}
              </div>
            </div>
          )}

          {/* ── Customer view ── */}
          {mobileView === "customer" && (
            <div className="flex h-full flex-col overflow-hidden">
              {/* Back to thread button (mobile only) */}
              <button
                onClick={() => setMobileView("thread")}
                className="flex min-h-[44px] shrink-0 items-center gap-1.5 border-b border-border/60 bg-background px-3 py-2 text-[13px] font-medium text-muted-foreground active:bg-secondary/40"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to thread
              </button>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {selectedTicket ? (
                  <CustomerSidebar ticket={selectedTicket} />
                ) : (
                  <div className="flex h-full items-center justify-center p-6 text-center text-[14px] text-muted-foreground">
                    Select a ticket to see customer details.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ───────────────────── Desktop layout (>=1024px) ──────────────────── */}
      <div className="hidden h-full overflow-hidden md:flex md:flex-row">
        {/* Filters panel -- fixed width */}
        <div className="hidden h-full shrink-0 lg:block">
          <TicketFilters
            activeFilter={filter}
            onFilterChange={handleFilterChange}
            counts={counts}
            currentFilters={currentFilters}
            onApplySavedView={handleApplySavedView}
          />
        </div>

        {/* Ticket list -- fixed width, min-w-0 prevents overflow */}
        <div className="flex h-full w-[260px] shrink-0 min-w-0 flex-col overflow-hidden lg:w-[280px] xl:w-[320px]">
          {/* Search bar */}
          <div className="shrink-0 border-b border-border/60 px-2.5 py-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
              <input
                type="search"
                placeholder="Search tickets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-border/60 bg-secondary/30 py-1.5 pl-8 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/15 transition-all duration-150"
              />
            </div>
          </div>

          {/* Sort + Filter toolbar */}
          <div className="shrink-0 flex items-center border-b border-border/60">
            {/* Sort dropdown */}
            <div className="relative flex-1">
              <button
                onClick={() => setShowSortDropdown((o) => !o)}
                className="flex w-full items-center gap-1.5 px-3 py-2 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                {sortLabel}
              </button>
              {showSortDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSortDropdown(false)} />
                  <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-xl border border-border/60 bg-popover shadow-[0_8px_30px_-8px_rgb(0_0_0/0.12)]">
                    {[
                      { label: "Newest first", by: "createdAt" as const, order: "desc" as const },
                      { label: "Oldest first", by: "createdAt" as const, order: "asc" as const },
                      { label: "Priority", by: "priority" as const, order: "desc" as const },
                      { label: "Last updated", by: "updatedAt" as const, order: "desc" as const },
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => {
                          setSortBy(opt.by)
                          setSortOrder(opt.order)
                          setShowSortDropdown(false)
                        }}
                        className={cn(
                          "flex w-full items-center px-3 py-2 text-[12px] transition-colors duration-100 first:rounded-t-xl last:rounded-b-xl",
                          sortBy === opt.by && sortOrder === opt.order
                            ? "bg-accent/10 text-accent font-medium"
                            : "text-foreground hover:bg-secondary/60"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Filters toggle */}
            <button
              onClick={() => setShowAdvFilters((o) => !o)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium transition-colors",
                showAdvFilters || advFilters.channel || advFilters.priority || advFilters.assignee
                  ? "text-accent"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {(advFilters.channel || advFilters.priority || advFilters.assignee) && (
                <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                  {[advFilters.channel, advFilters.priority, advFilters.assignee].filter(Boolean).length}
                </span>
              )}
            </button>

            {/* Keyboard shortcuts hint */}
            <button
              onClick={() => setShowShortcuts((prev) => !prev)}
              className="flex items-center justify-center px-2 py-2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              aria-label="Keyboard shortcuts"
              title="Keyboard shortcuts (?)"
            >
              <Keyboard className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={refreshTickets}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              title="Refresh inbox"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
              Refresh
            </button>
          </div>

          {/* Expanded advanced filters */}
          {showAdvFilters && (
            <div className="shrink-0 border-b border-border/60">
              <div className="flex flex-col gap-2 px-3 py-2.5">
                <select
                  value={advFilters.channel}
                  onChange={(e) => setAdvFilters((f) => ({ ...f, channel: e.target.value }))}
                  className="h-8 w-full rounded-md border border-border/60 bg-background px-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-accent/30"
                >
                  <option value="">All channels</option>
                  <option value="email">Email</option>
                  <option value="livechat">Live Chat</option>
                </select>
                <select
                  value={advFilters.priority}
                  onChange={(e) => setAdvFilters((f) => ({ ...f, priority: e.target.value }))}
                  className="h-8 w-full rounded-md border border-border/60 bg-background px-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-accent/30"
                >
                  <option value="">All priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                {(advFilters.channel || advFilters.priority || advFilters.assignee) && (
                  <button
                    onClick={() => setAdvFilters({ channel: "", priority: "", assignee: "", tags: [] })}
                    className="flex items-center gap-1 self-start rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-3 w-3" />
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          )}
          <TicketList
            tickets={filteredTickets}
            selectedTicket={selectedTicket}
            onSelectTicket={setSelectedTicket}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onTicketUpdate={handleTicketUpdate}
            onBulkClose={handleBulkClose}
            onBulkSnooze={handleBulkSnooze}
            onBulkAddTag={handleBulkAddTag}
            onBulkDelete={handleBulkDelete}
          />
          {hasMore && (
            <div className="shrink-0 border-t border-border/60 p-2">
              <button
                onClick={() => fetchTickets(nextCursor ?? undefined)}
                disabled={loadingMore}
                className="w-full rounded-lg border border-border/60 bg-secondary/50 px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load more tickets"}
              </button>
            </div>
          )}
        </div>

        {/* Thread panel -- takes remaining space, min-w-0 prevents overflow */}
        <div className="flex h-full min-w-0 flex-1 flex-col min-h-0">
          {selectedTicket && threadLoading ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-[13px]">Loading conversation...</span>
            </div>
          ) : (
            <TicketThread
              ticket={selectedTicket}
              allTickets={allTickets}
              sidebarOpen={sidebarOpen}
              onToggleSidebar={() => setSidebarOpen((o) => !o)}
              onSendReply={handleSendReply}
              onStatusChange={handleStatusChange}
              onTicketUpdate={handleTicketUpdate}
              onMergeTicket={handleMergeTicket}
            />
          )}
        </div>

        {/* Customer sidebar -- fixed width, conditionally shown */}
        {sidebarOpen && selectedTicket && (
          <div className="hidden h-full w-[240px] shrink-0 xl:block xl:w-[260px]">
            <CustomerSidebar ticket={selectedTicket} />
          </div>
        )}
      </div>

      {sidebarOpen && selectedTicket && (
        <>
          <button
            className="fixed inset-0 z-40 hidden bg-foreground/20 backdrop-blur-[1px] md:block xl:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close customer panel"
          />
          <aside className="fixed right-0 top-0 z-50 hidden h-full w-full max-w-[360px] border-l border-border/60 bg-background shadow-[0_16px_56px_-16px_rgb(0_0_0/0.35)] md:block xl:hidden">
            <div className="flex h-[44px] items-center justify-between border-b border-border/60 px-3">
              <span className="text-[12px] font-semibold text-foreground">Customer</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="inline-flex h-8 items-center rounded-md px-2 text-[12px] text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              >
                Close
              </button>
            </div>
            <div className="h-[calc(100%-44px)] overflow-y-auto">
              <CustomerSidebar ticket={selectedTicket} />
            </div>
          </aside>
        </>
      )}

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />

      {/* Keyboard shortcuts overlay */}
      {showShortcuts && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-foreground/20 backdrop-blur-sm"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-border/60 bg-background p-6 shadow-[0_24px_80px_-16px_rgb(0_0_0/0.15)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-foreground">Keyboard Shortcuts</h3>
              <button
                onClick={() => setShowShortcuts(false)}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col gap-2.5">
              {[
                { keys: ["J", "Down"], desc: "Next ticket" },
                { keys: ["K", "Up"], desc: "Previous ticket" },
                { keys: ["Cmd", "K"], desc: "Open command palette" },
                { keys: ["?"], desc: "Toggle this overlay" },
              ].map((shortcut) => (
                <div key={shortcut.desc} className="flex items-center justify-between">
                  <span className="text-[13px] text-foreground/80">{shortcut.desc}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key) => (
                      <kbd
                        key={key}
                        className="rounded border border-border/60 bg-secondary/50 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
