"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { GettingStarted } from "@/components/dashboard/getting-started"
import {
  Inbox, Sparkles, FileText, Workflow, BookOpen, BarChart3,
  Radio, Settings, PanelLeftClose, PanelLeft,
  Bell, Users, CreditCard, X, Menu, CheckCircle2, AlertTriangle,
  Filter, LogOut, Puzzle, Tag, Shield, UserCircle, GitBranch, Search, ChevronDown, Check, Loader2, Clock,
} from "lucide-react"
import { cn, getInitials } from "@/lib/utils"
import { ReplymaLogo } from "@/components/marketing/logo"
import { CommandPalette } from "@/components/dashboard/command-palette"
import { PricingModal } from "@/components/dashboard/pricing-modal"
import { AnimatePresence, motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { useShopify } from "@/lib/shopify-context"
import { toast } from "sonner"
import { notifications } from "@/lib/api"
import { subscribeToWorkspace, unsubscribeFromWorkspace, PusherEvents } from "@/lib/pusher-client"

function formatTimeAgo(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

const mainNav = [
  { href: "/inbox",         label: "Inbox",       icon: Inbox },
  { href: "/ai",            label: "AI Agent",    icon: Sparkles },
  { href: "/customers",     label: "Customers",   icon: UserCircle },
  { href: "/macros",        label: "Macros",      icon: FileText },
  { href: "/rules",         label: "Rules",       icon: Workflow },
  { href: "/flows",         label: "Flows",       icon: GitBranch },
  { href: "/helpcenter",    label: "Help Center", icon: BookOpen },
  { href: "/analytics",     label: "Analytics",   icon: BarChart3 },
  { href: "/channels/email",label: "Channels",    icon: Radio },
  { href: "/segments",      label: "Segments",    icon: Filter },
  { href: "/tags",          label: "Tags",        icon: Tag },
  { href: "/team",          label: "Team",        icon: Users },
  { href: "/audit",         label: "Audit Log",   icon: Shield },
  { href: "/settings/integrations", label: "Integrations",icon: Puzzle },
]

const bottomNav = [
  { href: "/billing",  label: "Billing",  icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/settings/account", label: "Account", icon: UserCircle },
]

const initialNotifications: NotificationItem[] = []

/* ──────────────────────────────────────────────────────── */

interface NotificationItem {
  id: number
  icon: React.ElementType
  title: string
  desc: string
  time: string
  unread: boolean
}

/* ── Notification Panel (shared between sidebar & top bar) ── */
interface NotificationPanelProps {
  open: boolean
  onClose: () => void
  onMarkAllRead: () => void
  items: NotificationItem[]
  /** Positioning variant */
  variant: "sidebar-expanded" | "sidebar-collapsed" | "mobile-topbar" | "mobile-sidebar"
}

function NotificationPanel({ open, onClose, onMarkAllRead, items, variant }: NotificationPanelProps) {
  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[59]" onClick={onClose} />
      <div
        className={cn(
          "flex flex-col overflow-hidden rounded-xl border border-border/60 bg-background shadow-[0_16px_48px_-8px_rgb(0_0_0/0.12)] animate-in fade-in slide-in-from-top-2 duration-150",
          variant === "mobile-sidebar" && "absolute left-3 right-3 top-14 z-[60]",
          variant === "sidebar-expanded" && "fixed left-[220px] top-3 w-[340px] z-[60]",
          variant === "sidebar-collapsed" && "fixed left-[60px] top-3 w-[320px] z-[60]",
          variant === "mobile-topbar" && "fixed left-3 right-3 top-[58px] z-[60] sm:left-auto sm:right-3 sm:w-[360px]"
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-semibold text-foreground">Notifications</p>
            {items.filter(n => n.unread).length > 0 && (
              <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent">{items.filter(n => n.unread).length}</span>
            )}
          </div>
          <button onClick={onClose} className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground sm:min-h-0 sm:min-w-0 sm:p-1">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[300px] overflow-y-auto overscroll-contain">
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="mx-auto h-5 w-5 text-muted-foreground/30" />
              <p className="mt-2 text-[12px] text-muted-foreground/50">No notifications yet</p>
            </div>
          ) : items.slice(0, 5).map((n) => (
            <div key={n.id} className={cn("flex min-h-[48px] items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-secondary/50 sm:px-4", n.unread && "bg-accent/[0.03]")}>
              <div className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full", n.unread ? "bg-accent/10" : "bg-secondary")}>
                <n.icon className={cn("h-3.5 w-3.5", n.unread ? "text-accent" : "text-muted-foreground/60")} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-medium text-foreground">{n.title}</p>
                <p className="truncate text-[11px] text-muted-foreground">{n.desc}</p>
              </div>
              <span className="shrink-0 pt-0.5 text-[10px] text-muted-foreground/50">{n.time}</span>
              {n.unread && <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
            </div>
          ))}
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-border/60 px-3 sm:px-4">
          <button
            onClick={(e) => { e.stopPropagation(); onMarkAllRead(); toast.success("All notifications marked as read") }}
            className="flex min-h-[44px] items-center text-[12px] font-medium text-accent transition-colors hover:text-accent/80"
          >
            Mark all as read
          </button>
          <Link
            href="/notifications"
            onClick={(e) => { e.stopPropagation(); onClose() }}
            className="flex min-h-[44px] items-center text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            View all
          </Link>
        </div>
      </div>
    </>
  )
}

/* ──────────────────────────────────────────────────────── */

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  ADMIN: { label: "Admin", className: "bg-foreground/8 text-foreground/70" },
  AGENT: { label: "Agent", className: "bg-blue-500/10 text-blue-600" },
  VIEWER: { label: "Read", className: "bg-emerald-500/10 text-emerald-600" },
}

function WorkspaceSwitcher({ workspaceName, mobile }: { workspaceName: string; mobile?: boolean }) {
  const [open, setOpen] = useState(false)
  const [workspaces, setWorkspaces] = useState<Array<{ workspaceId: string; workspaceName: string; workspaceSlug: string; role: string; isCurrent: boolean; isOwner?: boolean }>>([])
  const [leaveConfirm, setLeaveConfirm] = useState(false)
  const [leaveLoading, setLeaveLoading] = useState(false)
  const [switching, setSwitching] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    import("@/lib/api").then(({ auth }) => {
      auth.listWorkspaces().then((r) => setWorkspaces(r.workspaces)).catch(() => {})
    })
  }, [])

  useEffect(() => {
    if (!open) return
    setLeaveConfirm(false)
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const t = setTimeout(() => document.addEventListener("mousedown", handleClick), 10)
    return () => { clearTimeout(t); document.removeEventListener("mousedown", handleClick) }
  }, [open])

  const hasMultiple = workspaces.length > 1
  const currentWs = workspaces.find((w) => w.isCurrent)
  const currentRole = currentWs?.role ?? "ADMIN"
  const badge = ROLE_BADGE[currentRole] ?? ROLE_BADGE.ADMIN

  async function handleSwitch(ws: typeof workspaces[0]) {
    if (ws.isCurrent || switching) { setOpen(false); return }
    setSwitching(ws.workspaceId)
    try {
      const { auth: authApi, setTokens } = await import("@/lib/api")
      const res = await authApi.switchWorkspace(ws.workspaceId)
      setTokens(res.accessToken, res.refreshToken)
      localStorage.setItem("replyma_user", JSON.stringify(res.user))
      localStorage.setItem("replyma_workspace", JSON.stringify(res.workspace))
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "replyma.com"
      const authPayload = encodeURIComponent(JSON.stringify({
        accessToken: res.accessToken, refreshToken: res.refreshToken,
        user: res.user, workspace: res.workspace,
      }))
      window.location.href = `https://${ws.workspaceSlug}.${rootDomain}/inbox#auth=${authPayload}`
    } catch {
      toast.error("Failed to switch workspace")
      setSwitching(null)
    }
  }

  async function handleLeave() {
    setLeaveLoading(true)
    try {
      const { auth: authApi, clearTokens } = await import("@/lib/api")
      const res = await authApi.leaveWorkspace()
      clearTokens()
      toast.success("You left " + workspaceName)
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "replyma.com"
      if (res.redirectWorkspace) {
        window.location.href = `https://${res.redirectWorkspace.slug}.${rootDomain}/inbox`
      } else {
        window.location.href = `https://${rootDomain}/login`
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to leave workspace")
      setLeaveLoading(false)
      setLeaveConfirm(false)
    }
  }

  return (
    <div className="relative border-b border-border/60 px-2 py-1.5" ref={ref}>
      {/* Trigger button */}
      <button
        onClick={() => hasMultiple && setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg px-2 text-left transition-colors",
          mobile ? "min-h-[48px] py-1.5" : "py-1.5",
          hasMultiple ? "hover:bg-secondary/50 cursor-pointer" : "cursor-default"
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-[13px] font-bold text-accent">
          {workspaceName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="truncate text-[13px] font-semibold text-foreground leading-tight">{workspaceName}</p>
          <span className={cn("mt-0.5 inline-flex items-center rounded px-1 py-px text-[9px] font-semibold leading-none", badge.className)}>
            {badge.label}
          </span>
        </div>
        {hasMultiple && <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform duration-200", open && "rotate-180")} />}
      </button>

      {/* Dropdown */}
      {open && (
        <div className={cn(
          "absolute z-50 mt-1 overflow-hidden rounded-xl border border-border/60 bg-card shadow-[0_8px_30px_-8px_rgb(0_0_0/0.12)]",
          /* On mobile sidebar (280px wide), go edge-to-edge minus padding */
          "left-2 right-2",
          /* Prevent dropdown from being taller than viewport */
          "max-h-[min(400px,calc(100vh-120px))] overflow-y-auto overscroll-contain"
        )}>
          <div className="sticky top-0 z-10 border-b border-border/40 bg-card/95 backdrop-blur-sm px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50">
              Switch workspace
            </p>
          </div>

          <div className="py-1">
            {workspaces.map((ws) => {
              const wsBadge = ROLE_BADGE[ws.role] ?? ROLE_BADGE.AGENT
              const isSwitching = switching === ws.workspaceId
              return (
                <button
                  key={ws.workspaceId}
                  onClick={() => handleSwitch(ws)}
                  disabled={!!switching}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 text-left transition-colors disabled:opacity-60",
                    mobile ? "min-h-[52px] py-2.5" : "py-2",
                    ws.isCurrent ? "bg-accent/[0.04]" : "hover:bg-secondary/50"
                  )}
                >
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold",
                    ws.isCurrent ? "bg-accent text-white" : "bg-accent/10 text-accent"
                  )}>
                    {(ws.isCurrent ? workspaceName : ws.workspaceName).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="truncate text-[12px] font-medium text-foreground">{ws.isCurrent ? workspaceName : ws.workspaceName}</p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className={cn("inline-flex shrink-0 items-center rounded px-1 py-px text-[8px] font-semibold leading-none", wsBadge.className)}>
                        {wsBadge.label}
                      </span>
                      <span className="truncate text-[9px] text-muted-foreground/40">{ws.workspaceSlug}</span>
                    </div>
                  </div>
                  {isSwitching && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-accent" />}
                  {ws.isCurrent && !switching && <Check className="h-3.5 w-3.5 shrink-0 text-accent" />}
                </button>
              )
            })}
          </div>

          {/* Leave workspace — only for workspaces user was invited to, not their own */}
          {currentWs && !currentWs.isOwner && <div className="border-t border-border/40">
            {!leaveConfirm ? (
              <button
                onClick={() => setLeaveConfirm(true)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 text-[11px] text-muted-foreground/50 transition-colors hover:bg-red-500/5 hover:text-red-500",
                  mobile ? "min-h-[44px]" : "py-2"
                )}
              >
                <LogOut className="h-3 w-3" />
                Leave workspace
              </button>
            ) : (
              <div className="p-3 space-y-2">
                <p className="text-[11px] text-red-600 font-medium">Leave {workspaceName}?</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">You'll lose access to this workspace. An admin can re-invite you later.</p>
                <div className="flex gap-2">
                  <button onClick={() => setLeaveConfirm(false)} className="flex-1 rounded-lg border border-border/60 py-1.5 text-[11px] font-medium text-foreground transition-colors hover:bg-secondary">Cancel</button>
                  <button disabled={leaveLoading} onClick={handleLeave} className="flex-1 rounded-lg bg-red-500 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50">
                    {leaveLoading ? "Leaving..." : "Leave"}
                  </button>
                </div>
              </div>
            )}
          </div>}
        </div>
      )}
    </div>
  )
}

function TrialBanner({ mobile, onOpenPricing, plan, trialEndsAt }: { mobile?: boolean; onOpenPricing?: () => void; plan?: string; trialEndsAt?: string | null }) {
  if (!plan) return null

  // Free plan — show "Start free trial"
  if (plan === "free") {
    return (
      <div className="shrink-0 px-3 pb-1">
        <button
          onClick={() => onOpenPricing?.()}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg bg-gradient-to-r from-accent to-accent/80 px-3 text-[13px] font-medium text-white transition-all hover:shadow-md hover:shadow-accent/20 active:scale-[0.98]",
            mobile ? "min-h-[44px]" : "py-2"
          )}
        >
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>Start free trial</span>
        </button>
      </div>
    )
  }

  // Trial active — show days remaining
  if (trialEndsAt) {
    const end = new Date(trialEndsAt)
    const now = new Date()
    const diffMs = end.getTime() - now.getTime()
    const daysLeft = Math.max(0, Math.ceil(diffMs / 86400000))

    if (daysLeft > 0) {
      return (
        <div className="shrink-0 px-3 pb-1">
          <div className={cn(
            "flex w-full items-center gap-2.5 rounded-lg border px-3",
            mobile ? "min-h-[44px]" : "py-2",
            daysLeft <= 1 ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
          )}>
            <Clock className={cn("h-4 w-4 shrink-0", daysLeft <= 1 ? "text-red-500" : "text-amber-500")} />
            <div className="min-w-0 flex-1">
              <p className={cn("text-[11px] font-semibold", daysLeft <= 1 ? "text-red-700" : "text-amber-700")}>
                {daysLeft} {daysLeft === 1 ? "day" : "days"} left in trial
              </p>
              <p className="text-[10px] text-muted-foreground">
                {plan.charAt(0).toUpperCase() + plan.slice(1)} plan
              </p>
            </div>
          </div>
        </div>
      )
    }

    // Trial expired
    return (
      <div className="shrink-0 px-3 pb-1">
        <button
          onClick={() => onOpenPricing?.()}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3 text-left",
            mobile ? "min-h-[44px]" : "py-2"
          )}
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-red-700">Trial expired</p>
            <p className="text-[10px] text-red-500">Upgrade to continue</p>
          </div>
        </button>
      </div>
    )
  }

  // Paid plan — no banner
  return null
}

interface SidebarProps {
  collapsed: boolean
  mobile?: boolean
  onCollapse: () => void
  onClose?: () => void
  notifOpen: boolean
  onToggleNotif: () => void
  onCloseNotif: () => void
  unreadCount: number
  userName: string
  userRole: string
  workspaceName: string
  onLogout: () => void
  onMarkAllRead: () => void
  notifItems: NotificationItem[]
  onOpenCmd?: () => void
  onOpenPricing?: () => void
  plan?: string
  trialEndsAt?: string | null
  inboxCount?: number
}

function SidebarInner({
  collapsed, mobile = false, onCollapse, onClose,
  notifOpen, onToggleNotif, onCloseNotif, unreadCount,
  userName, userRole, workspaceName, onLogout, onMarkAllRead, notifItems,
  onOpenCmd, onOpenPricing, plan: planProp, trialEndsAt: trialEndsAtProp, inboxCount = 0,
}: SidebarProps) {
  const pathname = usePathname()

  const isActive = useCallback(
    (href: string) =>
      pathname === href ||
      (href === "/channels/email" && pathname?.startsWith("/channels")) ||
      (href === "/segments" && pathname?.startsWith("/segments")) ||
      (href === "/team" && pathname?.startsWith("/team")) ||
      (href === "/customers" && pathname?.startsWith("/customers")) ||
      (href === "/flows" && pathname?.startsWith("/flows")) ||
      (href === "/tags" && pathname?.startsWith("/tags")) ||
      (href === "/audit" && pathname?.startsWith("/audit")) ||
      (href === "/billing" && pathname?.startsWith("/billing")) ||
      (href === "/settings/integrations" && pathname?.startsWith("/settings/integrations")) ||
      (href === "/settings/account" && pathname?.startsWith("/settings/account")) ||
      (href === "/settings" && pathname?.startsWith("/settings") && !pathname?.startsWith("/settings/account")),
    [pathname]
  )

  const show = mobile || !collapsed

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className={cn(
        "flex h-14 shrink-0 items-center border-b border-border/60",
        !show ? "justify-center gap-0 px-2" : "justify-between px-3 sm:px-4"
      )}>
        {show ? (
          <>
            <Link href="/inbox" className="flex min-w-0 items-center">
              <ReplymaLogo className="h-8 w-8 shrink-0" />
            </Link>
            <div className="flex shrink-0 items-center gap-0.5">
              {/* Notification bell -- 44x44 touch target on mobile */}
              <div className="relative">
                <button
                  onClick={onToggleNotif}
                  className={cn(
                    "relative flex items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-secondary hover:text-foreground",
                    mobile ? "min-h-[44px] min-w-[44px]" : "h-8 w-8"
                  )}
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute right-0.5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent text-[8px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
              {mobile ? (
                <button
                  onClick={onClose}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-muted-foreground/50 hover:bg-secondary hover:text-foreground"
                  aria-label="Close sidebar"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={onCollapse}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground/50 hover:bg-secondary hover:text-foreground"
                  aria-label="Collapse sidebar"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Link href="/inbox" aria-label="Home"><ReplymaLogo className="h-6 w-6" /></Link>
          </div>
        )}
      </div>

      {/* Collapsed expand + bell */}
      {!mobile && collapsed && (
        <div className="flex flex-col items-center gap-1 pt-2">
          <button
            onClick={onCollapse}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground/50 hover:bg-secondary hover:text-foreground"
            aria-label="Expand sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
          <div className="relative">
            <button
              onClick={onToggleNotif}
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground/60 hover:bg-secondary hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute right-0 top-0 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent text-[8px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Workspace name + switcher */}
      {show && (
        <WorkspaceSwitcher workspaceName={workspaceName} mobile={mobile} />
      )}

      {/* Quick search (Cmd+K) */}
      {show && onOpenCmd && (
        <div className="px-3 pb-1 pt-2">
          <button
            onClick={onOpenCmd}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg border border-border/60 bg-secondary/30 px-3 text-[12px] text-muted-foreground/60 transition-colors hover:bg-secondary/60 hover:text-muted-foreground",
              mobile ? "min-h-[44px]" : "py-1.5"
            )}
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 text-left">Search...</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border/60 bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/50">
              <span className="text-[10px]">&#8984;</span>K
            </kbd>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav
        className={cn(
          "flex flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain py-2",
          !show ? "items-center px-1.5" : "px-2"
        )}
        aria-label="Dashboard navigation"
      >
        {mainNav.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={!show ? item.label : undefined}
              onClick={() => mobile && onClose?.()}
              className={cn(
                "group relative flex items-center rounded-lg text-[13px] transition-all duration-150",
                !show
                  ? "h-9 w-9 justify-center"
                  : mobile
                    ? "min-h-[44px] gap-2.5 px-2.5"
                    : "h-8 gap-2.5 px-2.5",
                active
                  ? "bg-secondary font-medium text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              )}
            >
              {active && show && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-accent" />
              )}
              <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-accent" : "text-muted-foreground/70")} />
              {show && <span className="flex-1 truncate">{item.label}</span>}
              {show && "badge" in item && (item as { badge?: string }).badge ? (
                <span className="ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent/10 px-1.5 text-[10px] font-semibold text-accent tabular-nums">
                  {String((item as { badge?: string }).badge)}
                </span>
              ) : null}
              {show && item.href === "/inbox" && inboxCount > 0 && (
                <span className="ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent/10 px-1.5 text-[10px] font-semibold text-accent tabular-nums">
                  {inboxCount > 50 ? "50+" : inboxCount}
                </span>
              )}
            </Link>
          )
        })}

        <div className={cn("my-1.5 h-px bg-border/40", show ? "mx-2.5" : "mx-1")} />

        {bottomNav.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={!show ? item.label : undefined}
              onClick={() => mobile && onClose?.()}
              className={cn(
                "group relative flex items-center rounded-lg text-[13px] transition-all duration-150",
                !show
                  ? "h-9 w-9 justify-center"
                  : mobile
                    ? "min-h-[44px] gap-2.5 px-2.5"
                    : "h-8 gap-2.5 px-2.5",
                active
                  ? "bg-secondary font-medium text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              )}
            >
              {active && show && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-accent" />
              )}
              <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-accent" : "text-muted-foreground/70")} />
              {show && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Trial CTA / Trial status */}
      {show && <TrialBanner mobile={mobile} onOpenPricing={onOpenPricing} plan={planProp} trialEndsAt={trialEndsAtProp} />}

      {/* User section */}
      {show && (
        <div className="shrink-0 border-t border-border/60 px-3 py-2">
          <div className={cn(
            "flex items-center gap-2.5 rounded-lg px-2.5 transition-colors hover:bg-secondary/50",
            mobile ? "min-h-[48px] py-1.5" : "py-2"
          )}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[11px] font-semibold text-accent">
              {getInitials(userName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-foreground">{userName}</p>
              <p className="truncate text-[11px] text-muted-foreground capitalize">{userRole.toLowerCase()}</p>
            </div>
            <button
              onClick={onLogout}
              className={cn(
                "flex shrink-0 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-secondary hover:text-foreground",
                mobile ? "min-h-[44px] min-w-[44px]" : "h-8 w-8"
              )}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Notification panel (sidebar context) */}
      <NotificationPanel
        open={notifOpen}
        onClose={onCloseNotif}
        onMarkAllRead={onMarkAllRead}
        items={notifItems}
        variant={mobile ? "mobile-sidebar" : show ? "sidebar-expanded" : "sidebar-collapsed"}
      />
    </div>
  )
}

/* ──────────────────────────────────────────────────────── */

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, workspace, isLoading, isAuthenticated, logout, reloadSessionFromStorage } = useAuth()
  const { isEmbedded } = useShopify()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [collapsed, setCollapsed]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen, setNotifOpen]   = useState(false)
  const [notifItems, setNotifItems] = useState(initialNotifications)
  const [cmdOpen, setCmdOpen]       = useState(false)
  const [pricingOpen, setPricingOpen] = useState(false)
  const [planData, setPlanData] = useState<{ plan: string; trialEndsAt: string | null }>({ plan: "", trialEndsAt: null })
  useEffect(() => {
    import("@/lib/api").then(({ billing: b }) => {
      b.getPlan().then((r) => setPlanData({ plan: r.plan, trialEndsAt: r.trialEndsAt })).catch(() => {})
    })
  }, [])
  const [inboxCount, setInboxCount] = useState(0)
  const unreadCount = notifItems.filter((n) => n.unread).length

  // Fetch real notifications (server returns unread from User.notificationsReadAt)
  useEffect(() => {
    async function loadNotifications() {
      try {
        const result = await notifications.recent()
        const items = (result.data ?? []).map((n: { id: string; title: string; description: string; time: string; unread: boolean }, idx: number) => ({
          id: idx + 1,
          icon: n.unread ? Bell : CheckCircle2,
          title: n.title,
          desc: n.description,
          time: formatTimeAgo(n.time),
          unread: n.unread,
        }))
        setNotifItems(items)
      } catch {
        // Keep empty on API failure
      }
    }
    loadNotifications()
  }, [])

  // Fetch open ticket count for Inbox badge
  useEffect(() => {
    async function loadInboxCount() {
      try {
        const { tickets } = await import("@/lib/api")
        const result = await tickets.list({ status: "OPEN", limit: "50" })
        const count = result.data?.length ?? 0
        setInboxCount(result.hasMore ? count + 1 : count)
      } catch {}
    }
    loadInboxCount()
  }, [])

  // Pusher real-time subscription for inbox count and notifications
  useEffect(() => {
    if (!workspace?.id) return
    const channel = subscribeToWorkspace(workspace.id)

    // Update inbox count when new ticket arrives
    channel.bind(PusherEvents.TICKET_CREATED, () => {
      setInboxCount(prev => prev + 1)
    })

    // Update when ticket is closed or merged (decrease count)
    channel.bind(PusherEvents.TICKET_UPDATED, (data: { changes?: { status?: string } }) => {
      if (data.changes?.status === "CLOSED" || data.changes?.status === "MERGED") {
        setInboxCount(prev => Math.max(0, prev - 1))
      }
    })

    // Add notification when ticket is escalated
    channel.bind(PusherEvents.TICKET_ESCALATED, (data: { ticketId: string; reason: string }) => {
      setNotifItems(prev => [{
        id: Date.now(),
        icon: AlertTriangle,
        title: "Ticket escalated",
        desc: data.reason || "A ticket needs human attention",
        time: "now",
        unread: true,
      }, ...prev].slice(0, 20))
    })

    return () => {
      unsubscribeFromWorkspace(workspace.id)
    }
  }, [workspace?.id])

  const handleMarkAllRead = useCallback(async () => {
    try {
      await notifications.markAllRead()
      setNotifItems((prev) => prev.map((n) => ({ ...n, unread: false, icon: CheckCircle2 })))
      if (typeof window !== "undefined") {
        localStorage.setItem("replyma_notif_read_at", new Date().toISOString())
      }
    } catch {
      // keep UI optimistic; toast on layout is shown by NotificationPanel
    }
  }, [])

  const handleToggleNotif = useCallback(() => {
    setNotifOpen((o) => !o)
  }, [])

  const handleCloseNotif = useCallback(() => {
    setNotifOpen(false)
  }, [])

  // Close mobile sidebar on route change
  const pathname = usePathname()
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Close notification panel on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && notifOpen) {
        setNotifOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [notifOpen])

  // Global Cmd+K / Ctrl+K listener for command palette
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setCmdOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Redirect: if on root domain and authenticated → go to workspace subdomain (skip when user came from login "already signed in" to avoid redirect loop)
  useEffect(() => {
    if (!isLoading && isAuthenticated && workspace?.slug) {
      if (typeof window !== "undefined" && window.sessionStorage.getItem("replyma_from_login_redirect") === "1") {
        window.sessionStorage.removeItem("replyma_from_login_redirect")
        return
      }
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "replyma.com"
      const hostname = typeof window !== "undefined" ? window.location.hostname : ""
      if (hostname === rootDomain || hostname === `www.${rootDomain}`) {
        window.location.href = `https://${workspace.slug}.${rootDomain}${window.location.pathname}`
        return
      }
    }
  }, [isLoading, isAuthenticated, workspace])

  // Redirect to login if not authenticated.
  // When URL has from_login=1 (redirect from login page to subdomain), sessionStorage is empty on subdomain so we
  // strip the param, re-read session from cookies via reloadSessionFromStorage(), and skip redirect once to avoid loop (see docs/AUTH_REDIRECT_LOOP_ANALYSIS.md).
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const fromLogin = typeof window !== "undefined" ? searchParams.get("from_login") === "1" : false
      if (fromLogin) {
        const pathname = typeof window !== "undefined" ? window.location.pathname : "/inbox"
        const next = new URLSearchParams(searchParams.toString())
        next.delete("from_login")
        const q = next.toString()
        router.replace(pathname + (q ? "?" + q : ""))
        reloadSessionFromStorage()
        return
      }
      if (typeof window !== "undefined" && window.sessionStorage.getItem("replyma_from_login_redirect") === "1") {
        window.sessionStorage.removeItem("replyma_from_login_redirect")
        return
      }
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "replyma.com"
      if (typeof window !== "undefined" && window.location.hostname !== rootDomain && window.location.hostname !== "localhost") {
        window.location.href = `https://${rootDomain}/login`
      } else {
        router.push("/login")
      }
    }
  }, [isLoading, isAuthenticated, router, searchParams, reloadSessionFromStorage])

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [mobileOpen])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background px-3 sm:px-4 lg:px-6">
        <div className="flex flex-col items-center gap-4">
          <ReplymaLogo className="h-8 w-8 animate-pulse" />
          <div className="flex flex-col items-center gap-2">
            <div className="h-2 w-32 max-w-[80vw] rounded-full bg-secondary animate-pulse" />
            <div className="h-2 w-20 rounded-full bg-secondary animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  const userName = user?.name || "User"
  const userRole = user?.role || "AGENT"
  const workspaceName = workspace?.name || "Workspace"

  // When embedded in Shopify Admin, hide sidebar and top bar.
  // App Bridge provides its own navigation chrome.
  if (isEmbedded) {
    return (
      <div className="flex h-[100dvh] overflow-hidden bg-background">
        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden animate-in fade-in duration-200">
            {children}
          </div>
        </main>
        <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
      </div>
    )
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background" data-dashboard>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "relative hidden shrink-0 flex-col border-r border-border/60 bg-[var(--surface-sunken)] transition-[width] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] lg:flex",
          collapsed ? "w-[56px]" : "w-[220px]"
        )}
      >
        <SidebarInner
          collapsed={collapsed}
          onCollapse={() => setCollapsed((c) => !c)}
          notifOpen={notifOpen}
          onToggleNotif={handleToggleNotif}
          onCloseNotif={handleCloseNotif}
          unreadCount={unreadCount}
          userName={userName}
          userRole={userRole}
          workspaceName={workspaceName}
          onLogout={logout}
          onMarkAllRead={handleMarkAllRead}
          notifItems={notifItems}
          onOpenCmd={() => setCmdOpen(true)}
          onOpenPricing={() => setPricingOpen(true)}
          plan={planData.plan}
          trialEndsAt={planData.trialEndsAt}
          inboxCount={inboxCount}
        />
      </aside>

      {/* Mobile sidebar overlay — CSS only, no framer-motion for backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/20 lg:hidden transition-opacity duration-200",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMobileOpen(false)}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[calc(100vw-48px)] shrink-0 flex-col border-r border-border/60 bg-background lg:hidden transition-transform duration-250 ease-[cubic-bezier(0.23,1,0.32,1)]",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
            <SidebarInner
              collapsed={false}
              mobile
              onCollapse={() => {}}
              onClose={() => setMobileOpen(false)}
              notifOpen={notifOpen}
              onToggleNotif={handleToggleNotif}
              onCloseNotif={handleCloseNotif}
              unreadCount={unreadCount}
              userName={userName}
              userRole={userRole}
              workspaceName={workspaceName}
              onLogout={logout}
              onMarkAllRead={handleMarkAllRead}
              notifItems={notifItems}
              onOpenCmd={() => { setMobileOpen(false); setCmdOpen(true) }}
              onOpenPricing={() => { setMobileOpen(false); setPricingOpen(true) }}
              plan={planData.plan}
              trialEndsAt={planData.trialEndsAt}
              inboxCount={inboxCount}
            />
      </aside>

      {/* Main content */}
      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 px-3 sm:px-4 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 items-center">
            <ReplymaLogo className="h-7 w-7 shrink-0" />
          </div>
          <button
            onClick={handleToggleNotif}
            className="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Notification panel for mobile top bar (rendered inside main, not sidebar) */}
        <div className="lg:hidden">
          <NotificationPanel
            open={notifOpen && !mobileOpen}
            onClose={handleCloseNotif}
            onMarkAllRead={handleMarkAllRead}
            items={notifItems}
            variant="mobile-topbar"
          />
        </div>

        <div className={cn("flex-1 animate-in fade-in duration-200", pathname === "/onboarding" || pathname === "/notifications" ? "overflow-y-auto" : "overflow-hidden")}>
          {children}
        </div>
      </main>

      {/* Global command palette (Cmd+K / Ctrl+K) */}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />

      {/* Pricing modal */}
      <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} />

      {/* Setup guide — Stripe-style floating checklist */}
      {/* Setup guide — hidden on mobile */}
      <div className="hidden lg:block">
        <GettingStarted />
      </div>
    </div>
  )
}
