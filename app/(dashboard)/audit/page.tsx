"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  Shield, Search, Filter, User, Clock, Loader2,
  Settings, Tag, MessageSquare, Inbox, Workflow,
  ChevronDown, RefreshCw, Calendar,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn, inputClass } from "@/lib/utils"
import type { AuditLog } from "@/lib/types"
import { toast } from "sonner"
import { auditLog as auditLogApi, team as teamApi } from "@/lib/api"

const ease = [0.23, 1, 0.32, 1]

const ACTION_ICONS: Record<string, typeof Inbox> = {
  "ticket": Inbox,
  "ai": MessageSquare,
  "rule": Workflow,
  "macro": Tag,
  "team": User,
  "channel": Settings,
  "settings": Settings,
  "helpcenter": MessageSquare,
}

const ENTITY_TYPES = ["All", "Ticket", "Message", "Rule", "Macro", "User", "Channel", "Workspace", "HelpArticle"]

const ACTION_COLORS: Record<string, { bg: string; text: string }> = {
  "created": { bg: "bg-emerald-500/10", text: "text-emerald-600" },
  "published": { bg: "bg-emerald-500/10", text: "text-emerald-600" },
  "deleted": { bg: "bg-red-500/10", text: "text-red-600" },
  "removed": { bg: "bg-red-500/10", text: "text-red-600" },
  "updated": { bg: "bg-foreground/5", text: "text-foreground/80" },
  "configured": { bg: "bg-foreground/5", text: "text-foreground/80" },
  "assigned": { bg: "bg-foreground/5", text: "text-foreground/80" },
  "invited": { bg: "bg-foreground/5", text: "text-foreground/80" },
  "closed": { bg: "bg-muted", text: "text-muted-foreground" },
  "reopened": { bg: "bg-amber-500/10", text: "text-amber-600" },
  "ai": { bg: "bg-accent/10", text: "text-accent" },
}

function getActionIcon(action: string) {
  const prefix = action.split(".")[0]
  return ACTION_ICONS[prefix ?? ""] ?? Shield
}

function getActionColor(action: string): { bg: string; text: string } {
  const verb = action.split(".")[1] ?? ""
  const prefix = action.split(".")[0] ?? ""
  if (ACTION_COLORS[verb]) return ACTION_COLORS[verb]
  if (prefix === "ai") return ACTION_COLORS["ai"]
  return { bg: "bg-secondary", text: "text-muted-foreground" }
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function ActionBadge({ action }: { action: string }) {
  const color = getActionColor(action)
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold", color.bg, color.text)}>
      {action.replace(".", " ")}
    </span>
  )
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export default function AuditLogPage() {
  const [userMap, setUserMap] = useState<Record<string, { name: string; initials: string }>>({})

  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [entityFilter, setEntityFilter] = useState("All")
  const [filterOpen, setFilterOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      const result = await auditLogApi.list({ limit: "50" })
      const data = Array.isArray(result.data) ? result.data : []
      setLogs(data)
      setCursor(result.nextCursor ?? null)
      setHasMore(result.hasMore ?? false)
    } catch {
      toast.error("Failed to load audit logs")
      setLogs([])
      setCursor(null)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  // Fetch team members to build user map dynamically
  useEffect(() => {
    async function fetchTeamMembers() {
      try {
        const members = await teamApi.listMembers()
        const map: Record<string, { name: string; initials: string }> = {}
        for (const member of Array.isArray(members) ? members : []) {
          if (member.id && member.name) {
            map[member.id] = { name: member.name, initials: getInitials(member.name) }
          }
        }
        setUserMap(map)
      } catch {
        // Team API unavailable -- fall back to showing raw IDs
      }
    }
    fetchTeamMembers()
  }, [])

  // Close filter dropdown when clicking outside
  useEffect(() => {
    if (!filterOpen) return
    function handleClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [filterOpen])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const result = await auditLogApi.list({ limit: "50" })
      const data = Array.isArray(result.data) ? result.data : []
      if (data.length > 0) {
        const newLogs = data.filter((nl) => !logs.some((pl) => pl.id === nl.id))
        if (newLogs.length > 0) {
          setLogs((prev) => [...newLogs, ...prev])
          toast.success(`${newLogs.length} new event${newLogs.length > 1 ? "s" : ""} found`)
        } else {
          toast.info("Audit log is up to date")
        }
        setCursor(result.nextCursor ?? null)
        setHasMore(result.hasMore ?? false)
      } else {
        toast.info("Audit log is up to date")
      }
    } catch {
      toast.error("Failed to refresh audit log")
    } finally {
      setRefreshing(false)
    }
  }

  const handleLoadMore = async () => {
    if (!cursor || loadingMore) return
    setLoadingMore(true)
    try {
      const result = await auditLogApi.list({ cursor, limit: "50" })
      const data = Array.isArray(result.data) ? result.data : []
      setLogs((prev) => [...prev, ...data])
      setCursor(result.nextCursor ?? null)
      setHasMore(result.hasMore ?? false)
    } catch {
      toast.error("Failed to load more events")
    } finally {
      setLoadingMore(false)
    }
  }

  const filtered = logs.filter((log) => {
    if (entityFilter !== "All" && log.entityType !== entityFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        log.action.toLowerCase().includes(q) ||
        log.entityType.toLowerCase().includes(q) ||
        (log.entityId?.toLowerCase().includes(q) ?? false) ||
        JSON.stringify(log.metadata ?? {}).toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease }}
          className="mb-6 sm:mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
        >
          <div>
            <h1 className="text-[22px] font-semibold text-foreground tracking-tight">Audit Log</h1>
            <p className="mt-1 text-[14px] text-muted-foreground">
              Track all workspace activity -- who did what and when.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/60 px-3 py-2.5 sm:py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground disabled:opacity-50 cursor-pointer min-h-[44px] sm:min-h-0 w-full sm:w-auto"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            Refresh
          </button>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.04, ease }}
          className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3"
        >
          {[
            { label: "Total events", value: logs.length.toString(), icon: Shield },
            { label: "Today", value: logs.filter(l => Date.now() - new Date(l.createdAt).getTime() < 86400000).length.toString(), icon: Calendar },
            { label: "Entity types", value: new Set(logs.map(l => l.entityType)).size.toString(), icon: Tag },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 + i * 0.04, ease }}
              className={cn("rounded-xl border border-border/60 bg-card p-4", i === 2 && "col-span-2 sm:col-span-1")}
            >
              <div className="flex items-center gap-2 text-muted-foreground/50">
                <stat.icon className="h-3.5 w-3.5" />
                <span className="text-[11px] font-medium uppercase tracking-wider">{stat.label}</span>
              </div>
              <p className="mt-1 text-[20px] font-semibold text-foreground">{stat.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08, ease }}
          className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
            <input
              type="text"
              placeholder="Search actions, entities, metadata..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(inputClass, "pl-9 h-11 sm:h-9")}
            />
          </div>
          <div ref={filterRef} className="relative">
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className="flex h-11 sm:h-9 items-center gap-2 rounded-lg border border-border/60 bg-background px-3.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/40 min-h-[44px] sm:min-h-0 w-full sm:w-auto justify-between sm:justify-start"
            >
              <Filter className="h-3.5 w-3.5" />
              {entityFilter === "All" ? "All types" : entityFilter}
              <ChevronDown className={cn("h-3 w-3 transition-transform", filterOpen && "rotate-180")} />
            </button>
            <AnimatePresence>
              {filterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 sm:left-auto sm:right-0 top-full z-50 mt-1.5 w-full sm:min-w-[180px] overflow-hidden rounded-xl border border-border/60 bg-card shadow-[0_12px_40px_-8px_rgb(0_0_0/0.15)]"
                >
                  {ENTITY_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setEntityFilter(type)
                        setFilterOpen(false)
                      }}
                      className={cn(
                        "flex w-full items-center px-4 py-3 sm:py-2.5 text-left text-[13px] transition-colors hover:bg-secondary/60 min-h-[44px] sm:min-h-0",
                        entityFilter === type ? "font-semibold text-foreground bg-secondary/40" : "text-muted-foreground"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.12, ease }}
          className="rounded-2xl border border-border/60 bg-card overflow-hidden"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 sm:py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
              <p className="text-[13px] text-muted-foreground/50">Loading audit logs...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-16 sm:py-20 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                <Shield className="h-6 w-6 text-muted-foreground/40" />
              </div>
              {logs.length === 0 ? (
                <>
                  <p className="text-[14px] font-medium text-foreground/60">No audit logs yet</p>
                  <p className="mt-1 text-[12px] text-muted-foreground/40 max-w-xs mx-auto">
                    Workspace activity will be recorded here as your team uses the platform.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[14px] font-medium text-foreground">No audit logs found</p>
                  <p className="mt-1 text-[13px] text-muted-foreground/50">Try adjusting your search or filters.</p>
                </>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {filtered.map((log, i) => {
                const Icon = getActionIcon(log.action)
                const color = getActionColor(log.action)
                const userInfo = log.userId ? userMap[log.userId] : null
                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: i * 0.02, ease }}
                    className="group px-4 sm:px-5 py-4 transition-colors hover:bg-secondary/20"
                  >
                    {/* Desktop layout: single row */}
                    <div className="hidden sm:flex items-start gap-4">
                      {/* Icon */}
                      <div className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", color.bg)}>
                        <Icon className={cn("h-4 w-4", color.text)} />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <ActionBadge action={log.action} />
                          {log.entityId && (
                            <span className="max-w-[140px] truncate rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                              {log.entityId}
                            </span>
                          )}
                        </div>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed truncate">
                            {Object.entries(log.metadata)
                              .slice(0, 3)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(" / ")}
                          </p>
                        )}
                      </div>

                      {/* User + timestamp (desktop) */}
                      <div className="shrink-0 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Clock className="h-3 w-3 text-muted-foreground/30" />
                          <p className="text-[11px] font-medium text-muted-foreground/60">{formatTimeAgo(log.createdAt)}</p>
                        </div>
                        {userInfo ? (
                          <div className="mt-1.5 flex items-center justify-end gap-1.5">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[9px] font-semibold text-muted-foreground">
                              {userInfo.initials}
                            </div>
                            <span className="text-[11px] text-muted-foreground/50">{userInfo.name}</span>
                          </div>
                        ) : log.userId === null ? (
                          <div className="mt-1.5 flex items-center justify-end gap-1.5">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/10 text-[9px] font-semibold text-accent">
                              AI
                            </div>
                            <span className="text-[11px] text-muted-foreground/50">System</span>
                          </div>
                        ) : (
                          <p className="mt-1 text-[10px] text-muted-foreground/30">
                            {log.userId?.slice(0, 8)}
                          </p>
                        )}
                        <p className="mt-0.5 text-[10px] text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity">
                          {formatFullDate(log.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Mobile layout: stacked */}
                    <div className="flex sm:hidden items-start gap-3">
                      {/* Icon */}
                      <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", color.bg)}>
                        <Icon className={cn("h-3.5 w-3.5", color.text)} />
                      </div>

                      {/* Content + meta stacked */}
                      <div className="min-w-0 flex-1">
                        {/* Action badge + entity ID */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <ActionBadge action={log.action} />
                          {log.entityId && (
                            <span className="max-w-[100px] truncate rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                              {log.entityId}
                            </span>
                          )}
                        </div>

                        {/* Metadata */}
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed line-clamp-2">
                            {Object.entries(log.metadata)
                              .slice(0, 3)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(" / ")}
                          </p>
                        )}

                        {/* User + timestamp row on mobile */}
                        <div className="mt-2 flex items-center justify-between gap-2">
                          {/* User */}
                          {userInfo ? (
                            <div className="flex items-center gap-1.5">
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[9px] font-semibold text-muted-foreground">
                                {userInfo.initials}
                              </div>
                              <span className="text-[11px] text-muted-foreground/50 truncate max-w-[100px]">{userInfo.name}</span>
                            </div>
                          ) : log.userId === null ? (
                            <div className="flex items-center gap-1.5">
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/10 text-[9px] font-semibold text-accent">
                                AI
                              </div>
                              <span className="text-[11px] text-muted-foreground/50">System</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/30">
                              {log.userId?.slice(0, 8)}
                            </span>
                          )}

                          {/* Timestamp */}
                          <div className="flex items-center gap-1 shrink-0">
                            <Clock className="h-3 w-3 text-muted-foreground/30" />
                            <span className="text-[11px] font-medium text-muted-foreground/60">{formatTimeAgo(log.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Pagination hint + Load More */}
        {filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, ease }}
            className="mt-4 pb-2 flex flex-col items-center gap-2"
          >
            <p className="text-[12px] text-muted-foreground/40">
              Showing {filtered.length} of {logs.length} events
            </p>
            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/60 px-4 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground disabled:opacity-50 cursor-pointer min-h-[44px] sm:min-h-0"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load more"
                )}
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
