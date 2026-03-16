"use client"

import { useState, useEffect } from "react"
import { Bell, CheckCircle2, AlertTriangle, Inbox, Sparkles, Loader2, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { notifications as notificationsApi } from "@/lib/api"

interface NotificationItem {
  id: string
  title: string
  description: string
  time: string
  unread: boolean
}

const ICON_MAP: Record<string, React.ElementType> = {
  escalated: AlertTriangle,
  ticket: Inbox,
  ai: Sparkles,
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  if (isNaN(date)) return dateStr
  const diff = now - date
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString([], { month: "short", day: "numeric" })
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await notificationsApi.recent()
        setItems(res.data ?? [])
      } catch {
        // empty
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const unreadCount = items.filter((n) => n.unread).length

  async function handleMarkAllRead() {
    try {
      await notificationsApi.markAllRead()
      setItems((prev) => prev.map((n) => ({ ...n, unread: false })))
      if (typeof window !== "undefined") {
        localStorage.setItem("replyma_notif_read_at", new Date().toISOString())
      }
      toast.success("All notifications marked as read")
    } catch {
      toast.error("Failed to mark as read")
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/50" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-semibold text-foreground">Notifications</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <Check className="h-3.5 w-3.5" />
            Mark all as read
          </button>
        )}
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-card py-16 text-center">
          <Bell className="mx-auto h-8 w-8 text-muted-foreground/20" />
          <p className="mt-3 text-[14px] font-medium text-muted-foreground/50">No notifications yet</p>
          <p className="mt-1 text-[12px] text-muted-foreground/40">Notifications about tickets, team activity, and system events will appear here.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          {items.map((n, i) => {
            const Icon = ICON_MAP[n.title.toLowerCase().includes("escalat") ? "escalated" : n.title.toLowerCase().includes("ai") ? "ai" : "ticket"] ?? Bell
            return (
              <div
                key={n.id || i}
                className={cn(
                  "flex items-start gap-3 px-4 py-3.5 transition-colors",
                  i > 0 && "border-t border-border/40",
                  n.unread ? "bg-accent/[0.02]" : ""
                )}
              >
                <div className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  n.unread ? "bg-accent/10" : "bg-secondary"
                )}>
                  <Icon className={cn("h-4 w-4", n.unread ? "text-accent" : "text-muted-foreground/50")} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-[13px] text-foreground", n.unread && "font-medium")}>{n.title}</p>
                    <span className="shrink-0 text-[11px] text-muted-foreground/50">{formatTimeAgo(n.time)}</span>
                  </div>
                  <p className="mt-0.5 text-[12px] text-muted-foreground leading-relaxed">{n.description}</p>
                </div>
                {n.unread && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
