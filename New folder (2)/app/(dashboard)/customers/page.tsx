"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import {
  Search, Users, DollarSign, ShoppingBag, Mail,
  ChevronRight, X, Tag, MessageSquare, ArrowLeft, Loader2, Download,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn, getInitials, inputClass, btnAccent } from "@/lib/utils"
import { EmptyState } from "@/components/dashboard/empty-state"
import { customers as customersApi, getAuthBearerToken } from "@/lib/api"
import { toast } from "sonner"

interface CustomerRow {
  email: string
  name: string | null
  ticketCount: number
  ltv: number
}

interface CustomerDetail {
  email: string
  name: string | null
  tickets: Array<{
    id: string
    channel: string
    status: string
    intent: string | null
    createdAt: string
    closedAt: string | null
  }>
  shopify: {
    id: string
    email: string
    firstName: string
    lastName: string
    ordersCount: number
    totalSpent: string
    tags: string[]
  } | null
  orders: Array<{
    id: string
    name: string
    status: string
    totalPrice: string
    trackingNumber?: string
    items: string[]
    createdAt: string
  }>
  csatHistory: Array<{
    rating: number | null
    feedback: string | null
    sentAt: string
  }>
}

const statusColors: Record<string, string> = {
  OPEN: "bg-foreground/5 text-foreground/80",
  PENDING: "bg-foreground/5 text-foreground/80",
  AI_REPLIED: "bg-emerald-500/10 text-emerald-600",
  ESCALATED: "bg-amber-500/10 text-amber-600",
  CLOSED: "bg-secondary text-muted-foreground",
  SNOOZED: "bg-foreground/5 text-foreground/80",
}

// Avatar color palette for variety
const avatarColors = [
  "bg-foreground/5 text-foreground/80",
  "bg-emerald-500/10 text-emerald-600",
  "bg-foreground/5 text-foreground/80",
  "bg-amber-500/10 text-amber-600",
  "bg-pink-500/10 text-pink-600",
  "bg-cyan-500/10 text-cyan-600",
  "bg-orange-500/10 text-orange-600",
  "bg-rose-500/10 text-rose-600",
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [detail, setDetail] = useState<CustomerDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const handleExport = async () => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"
      const token = await getAuthBearerToken()
      const res = await fetch(`${API_BASE}/settings/export/customers`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error(`Export failed: ${res.status}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Customers exported")
    } catch (err) {
      toast.error("Failed to export customers")
    }
  }

  // Fetch customers from API on mount
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true)
      const result = await customersApi.list()
      setCustomers(result.data ?? [])
    } catch (err) {
      console.error("Failed to fetch customers:", err)
      toast.error("Failed to load customers")
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  // Detect mobile breakpoint
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1023px)")
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(e.matches)
    handler(mql)
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [])

  // Lock body scroll on mobile when detail panel is open
  useEffect(() => {
    if (isMobile && selectedEmail) {
      document.body.style.overflow = "hidden"
      return () => { document.body.style.overflow = "" }
    }
  }, [isMobile, selectedEmail])

  // Fetch customer detail when selectedEmail changes
  useEffect(() => {
    if (!selectedEmail) {
      setDetail(null)
      return
    }
    let cancelled = false
    const fetchDetail = async () => {
      setDetailLoading(true)
      try {
        const result = await customersApi.get(selectedEmail)
        if (cancelled) return
        const row = customers.find((c) => c.email === selectedEmail)
        const apiResult = result as unknown as Record<string, unknown>
        setDetail({
          email: result.email ?? selectedEmail,
          name: result.name ?? row?.name ?? null,
          tickets: (result.tickets ?? []).map((t) => ({
            id: t.id ?? "",
            channel: (t as unknown as Record<string, string>).channel ?? "EMAIL",
            status: t.status ?? "OPEN",
            intent: (t as unknown as Record<string, string | null>).intent ?? null,
            createdAt: t.createdAt ?? new Date().toISOString(),
            closedAt: (t as unknown as Record<string, string | null>).closedAt ?? null,
          })),
          shopify: (result.shopifyData as CustomerDetail["shopify"]) ?? null,
          orders: (Array.isArray(apiResult.orders) ? apiResult.orders : []) as CustomerDetail["orders"],
          csatHistory: (Array.isArray(apiResult.csatHistory) ? apiResult.csatHistory : []) as CustomerDetail["csatHistory"],
        })
      } catch {
        if (cancelled) return
        const row = customers.find((c) => c.email === selectedEmail)
        setDetail({
          email: selectedEmail,
          name: row?.name ?? null,
          tickets: [],
          shopify: null,
          orders: [],
          csatHistory: [],
        })
      } finally {
        if (!cancelled) setDetailLoading(false)
      }
    }
    fetchDetail()
    return () => { cancelled = true }
  }, [selectedEmail, customers])

  const filtered = customers.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.email.toLowerCase().includes(q) ||
      (c.name?.toLowerCase().includes(q) ?? false)
    )
  })

  const totalLtv = customers.reduce((sum, c) => sum + c.ltv, 0)
  const totalTickets = customers.reduce((sum, c) => sum + c.ticketCount, 0)

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main list -- hidden on mobile when detail is open */}
      <div className={cn(
        "flex flex-1 flex-col overflow-hidden",
        selectedEmail && "hidden lg:flex"
      )}>
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-6 sm:py-8">
            {/* Header -- stacks on mobile */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div>
                <h1 className="text-[22px] font-semibold text-foreground tracking-tight">Customers</h1>
                <p className="mt-1 text-[13px] text-muted-foreground">Browse and manage all customers across channels.</p>
              </div>
              <button
                onClick={handleExport}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border/60 px-4 py-2 text-[13px] font-medium text-muted-foreground hover:bg-secondary transition-colors w-full sm:w-auto min-h-[44px] sm:min-h-0"
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </button>
            </motion.div>

            {/* Stats -- 2 cols on mobile, 3 cols on sm+ */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="mb-5 grid grid-cols-2 gap-3 sm:mb-6 sm:grid-cols-3 sm:gap-4"
            >
              {[
                { label: "Total customers", value: customers.length, icon: Users, iconBg: "bg-foreground/5", iconColor: "text-foreground/80" },
                { label: "Total LTV", value: `$${totalLtv.toLocaleString()}`, icon: DollarSign, iconBg: "bg-emerald-500/10", iconColor: "text-emerald-600" },
                { label: "Total tickets", value: totalTickets, icon: MessageSquare, iconBg: "bg-foreground/5", iconColor: "text-foreground/80" },
              ].map((stat) => (
                <div key={stat.label} className="group rounded-xl border border-border/60 bg-card p-3.5 transition-all duration-200 hover:border-border hover:shadow-[0_2px_8px_-2px_rgb(0_0_0/0.06)] sm:p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground sm:text-[13px]">{stat.label}</p>
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${stat.iconBg} transition-transform duration-200 group-hover:scale-105 sm:h-8 sm:w-8`}>
                      <stat.icon className={`h-3.5 w-3.5 ${stat.iconColor} sm:h-4 sm:w-4`} />
                    </div>
                  </div>
                  <p className="mt-1.5 text-[22px] font-bold text-foreground tracking-tight tabular-nums sm:mt-2 sm:text-[28px]">{stat.value}</p>
                </div>
              ))}
            </motion.div>

            {/* Search + Export -- full-width, taller on mobile */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.08 }}
              className="mb-4"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50 sm:h-3.5 sm:w-3.5" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={cn(inputClass, "h-11 pl-10 focus:ring-2 focus:ring-accent/15 sm:h-9 sm:pl-9")}
                />
              </div>
            </motion.div>

            {/* Empty state -- no customers loaded */}
            {customers.length === 0 && !loading && (
              <EmptyState
                icon={Users}
                title="No customers yet"
                description="Customers will appear here once they start reaching out via any channel."
              />
            )}

            {/* Customer list -- cards on mobile, table on sm+ */}
            {loading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-border/60 bg-card p-4 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-secondary" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-32 rounded bg-secondary" />
                        <div className="h-2 w-48 rounded bg-secondary" />
                      </div>
                      <div className="h-3 w-12 rounded bg-secondary" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {/* Desktop table */}
              <div className="hidden rounded-xl border border-border/60 bg-card sm:block">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-[13px]">
                    <thead>
                      <tr className="border-b border-border/60">
                        <th className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50">Customer</th>
                        <th className="hidden px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50 md:table-cell">Email</th>
                        <th className="px-5 py-3.5 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50">Tickets</th>
                        <th className="px-5 py-3.5 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50">LTV</th>
                        <th className="w-8" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {filtered.map((customer) => {
                        const isActive = selectedEmail === customer.email
                        return (
                          <tr
                            key={customer.email}
                            onClick={() => setSelectedEmail(customer.email)}
                            className={cn(
                              "group cursor-pointer transition-all duration-150",
                              isActive
                                ? "bg-secondary/60"
                                : "hover:bg-secondary/30"
                            )}
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-transform duration-150 group-hover:scale-105",
                                  getAvatarColor(customer.name || customer.email)
                                )}>
                                  {getInitials(customer.name || customer.email)}
                                </div>
                                <div className="min-w-0">
                                  <span className="block truncate font-medium text-foreground">{customer.name || "Unknown"}</span>
                                  <span className="block truncate text-[11px] text-muted-foreground md:hidden">{customer.email}</span>
                                </div>
                              </div>
                            </td>
                            <td className="hidden px-5 py-3.5 text-muted-foreground md:table-cell">
                              <span className="block max-w-[200px] truncate">{customer.email}</span>
                            </td>
                            <td className="px-5 py-3.5 text-right tabular-nums text-foreground">
                              <span className="inline-flex items-center justify-center rounded-full bg-secondary/80 px-2 py-0.5 text-[11px] font-medium">
                                {customer.ticketCount}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right tabular-nums font-semibold text-foreground">${customer.ltv.toLocaleString()}</td>
                            <td className="pr-4">
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 transition-all duration-150 group-hover:text-muted-foreground/60 group-hover:translate-x-0.5" />
                            </td>
                          </tr>
                        )
                      })}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-muted-foreground/50">
                            No customers found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile card list */}
              <div className="flex flex-col gap-2 sm:hidden">
                {filtered.map((customer) => {
                  const isActive = selectedEmail === customer.email
                  return (
                    <button
                      key={customer.email}
                      type="button"
                      onClick={() => setSelectedEmail(customer.email)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border border-border/60 bg-card p-3.5 text-left transition-all duration-150 active:scale-[0.98]",
                        isActive
                          ? "border-accent/30 bg-secondary/60"
                          : "hover:bg-secondary/30"
                      )}
                      style={{ minHeight: 64 }}
                    >
                      <div className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold",
                        getAvatarColor(customer.name || customer.email)
                      )}>
                        {getInitials(customer.name || customer.email)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-medium text-foreground">{customer.name || "Unknown"}</p>
                        <p className="truncate text-[12px] text-muted-foreground">{customer.email}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-[14px] font-semibold tabular-nums text-foreground">${customer.ltv.toLocaleString()}</span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <MessageSquare className="h-3 w-3" />
                          {customer.ticketCount}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/30" />
                    </button>
                  )
                })}
                {filtered.length === 0 && (
                  <div className="flex flex-col items-center justify-center px-6 py-16">
                    <Users className="mb-3 h-10 w-10 text-muted-foreground/20" />
                    <p className="text-[14px] font-medium text-muted-foreground/60">No customers found</p>
                    <p className="mt-1 text-[12px] text-muted-foreground/40">Try adjusting your search</p>
                  </div>
                )}
              </div>
            </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Detail sidebar -- full screen overlay on mobile, side panel on desktop */}
      <AnimatePresence>
        {selectedEmail && detail && (
          <>
            {/* Mobile: full-screen slide-in from right */}
            <motion.div
              key="detail-mobile"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background lg:hidden"
            >
              {/* Mobile header with back button */}
              <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur-sm">
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition-colors active:bg-secondary"
                  aria-label="Go back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h3 className="text-[15px] font-semibold text-foreground">Customer Profile</h3>
              </div>

              {/* Mobile profile -- centered */}
              <div className="border-b border-border/60 px-4 py-6">
                <div className="flex flex-col items-center text-center">
                  <div className={cn(
                    "flex h-16 w-16 items-center justify-center rounded-full text-[20px] font-semibold",
                    getAvatarColor(detail.name || detail.email)
                  )}>
                    {getInitials(detail.name || detail.email)}
                  </div>
                  <p className="mt-3 text-[17px] font-semibold text-foreground">{detail.name || "Unknown"}</p>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">{detail.email}</p>
                </div>
              </div>

              {/* Mobile Shopify */}
              {detail.shopify && (
                <div className="border-b border-border/60 px-4 py-5">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50">
                    Shopify Profile
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border/40 p-3">
                      <p className="text-[11px] text-muted-foreground">Orders</p>
                      <p className="mt-0.5 text-[18px] font-bold tabular-nums text-foreground">{detail.shopify.ordersCount}</p>
                    </div>
                    <div className="rounded-lg border border-border/40 p-3">
                      <p className="text-[11px] text-muted-foreground">Total Spent</p>
                      <p className="mt-0.5 text-[18px] font-bold tabular-nums text-foreground">${detail.shopify.totalSpent}</p>
                    </div>
                  </div>
                  {detail.shopify.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {detail.shopify.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Mobile Orders */}
              {detail.orders.length > 0 && (
                <div className="border-b border-border/60 px-4 py-5">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50">
                    Recent Orders
                  </p>
                  <div className="flex flex-col gap-2.5">
                    {detail.orders.map((order) => (
                      <div key={order.id} className="rounded-xl border border-border/40 p-4 transition-all duration-150 hover:border-border/60">
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-medium text-foreground">{order.name}</span>
                          <span className="text-[14px] font-bold text-foreground tabular-nums">${order.totalPrice}</span>
                        </div>
                        <p className="mt-1.5 text-[12px] text-muted-foreground">{order.status}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground/50">{order.createdAt}</p>
                        {order.items.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {order.items.map((item, idx) => (
                              <span key={idx} className="rounded-md bg-secondary/80 px-2 py-0.5 text-[10px] text-muted-foreground">{item}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile Ticket History */}
              <div className="border-b border-border/60 px-4 py-5">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50">
                  Ticket History
                </p>
                <div className="flex flex-col gap-2">
                  {detail.tickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between rounded-xl border border-border/40 px-4 py-3 transition-all duration-150 active:bg-secondary/30" style={{ minHeight: 52 }}>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[12px] text-muted-foreground">{ticket.id}</span>
                          <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold", statusColors[ticket.status] ?? "bg-secondary text-muted-foreground")}>
                            {ticket.status}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[12px] text-muted-foreground">{ticket.channel} · {ticket.intent ?? "general"}</p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30" />
                    </div>
                  ))}
                  {detail.tickets.length === 0 && (
                    <div className="flex flex-col items-center py-8">
                      <MessageSquare className="mb-2 h-8 w-8 text-muted-foreground/20" />
                      <p className="text-[13px] text-muted-foreground/50">No tickets yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile CSAT */}
              {detail.csatHistory.length > 0 && (
                <div className="px-4 py-5 pb-8">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50">
                    CSAT Ratings
                  </p>
                  <div className="flex flex-col gap-2.5">
                    {detail.csatHistory.map((csat, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-xl border border-border/40 p-3.5">
                        <div className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[16px] font-bold",
                          (csat.rating ?? 0) >= 4 ? "bg-emerald-500/10 text-emerald-600" :
                          (csat.rating ?? 0) === 3 ? "bg-amber-500/10 text-amber-600" :
                          "bg-red-500/10 text-red-600"
                        )}>
                          {csat.rating ?? "--"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] text-foreground">{csat.feedback || "No feedback"}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground/50">{new Date(csat.sentAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Desktop: side panel */}
            <motion.div
              key="detail-desktop"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="hidden w-[360px] shrink-0 flex-col overflow-y-auto border-l border-border/60 bg-background lg:flex"
            >
              {/* Desktop header */}
              <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
                <h3 className="text-[14px] font-semibold text-foreground">Customer Profile</h3>
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground/60 transition-all duration-150 hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Desktop profile */}
              <div className="border-b border-border/60 p-5">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full text-[15px] font-semibold",
                    getAvatarColor(detail.name || detail.email)
                  )}>
                    {getInitials(detail.name || detail.email)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-foreground">{detail.name || "Unknown"}</p>
                    <p className="truncate text-[12px] text-muted-foreground">{detail.email}</p>
                  </div>
                </div>
              </div>

              {/* Desktop Shopify */}
              {detail.shopify && (
                <div className="border-b border-border/60 p-5">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50">
                    Shopify Profile
                  </p>
                  <div className="flex flex-col gap-2.5">
                    <div className="flex justify-between text-[13px]">
                      <span className="text-muted-foreground">Orders</span>
                      <span className="font-semibold text-foreground tabular-nums">{detail.shopify.ordersCount}</span>
                    </div>
                    <div className="h-px bg-border/40" />
                    <div className="flex justify-between text-[13px]">
                      <span className="text-muted-foreground">Total Spent</span>
                      <span className="font-semibold text-foreground tabular-nums">${detail.shopify.totalSpent}</span>
                    </div>
                    {detail.shopify.tags.length > 0 && (
                      <>
                        <div className="h-px bg-border/40" />
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {detail.shopify.tags.map((tag) => (
                            <span key={tag} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Desktop Orders */}
              {detail.orders.length > 0 && (
                <div className="border-b border-border/60 p-5">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50">
                    Recent Orders
                  </p>
                  <div className="flex flex-col gap-2">
                    {detail.orders.map((order) => (
                      <div key={order.id} className="rounded-lg border border-border/40 p-3 transition-all duration-150 hover:border-border/60 hover:shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-medium text-foreground">{order.name}</span>
                          <span className="text-[12px] font-bold text-foreground tabular-nums">${order.totalPrice}</span>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">{order.status}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground/50">{order.createdAt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Desktop Ticket History */}
              <div className="border-b border-border/60 p-5">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50">
                  Ticket History
                </p>
                <div className="flex flex-col gap-2">
                  {detail.tickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2.5 transition-all duration-150 hover:border-border/60 hover:shadow-sm">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-muted-foreground">{ticket.id}</span>
                          <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-semibold", statusColors[ticket.status] ?? "bg-secondary text-muted-foreground")}>
                            {ticket.status}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{ticket.channel} · {ticket.intent ?? "general"}</p>
                      </div>
                      <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
                    </div>
                  ))}
                  {detail.tickets.length === 0 && (
                    <p className="py-4 text-center text-[12px] text-muted-foreground/50">No tickets yet</p>
                  )}
                </div>
              </div>

              {/* Desktop CSAT */}
              {detail.csatHistory.length > 0 && (
                <div className="p-5">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50">
                    CSAT Ratings
                  </p>
                  <div className="flex flex-col gap-2">
                    {detail.csatHistory.map((csat, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg text-[14px] font-bold",
                          (csat.rating ?? 0) >= 4 ? "bg-emerald-500/10 text-emerald-600" :
                          (csat.rating ?? 0) === 3 ? "bg-amber-500/10 text-amber-600" :
                          "bg-red-500/10 text-red-600"
                        )}>
                          {csat.rating ?? "--"}
                        </div>
                        <div>
                          <p className="text-[12px] text-foreground">{csat.feedback || "No feedback"}</p>
                          <p className="text-[10px] text-muted-foreground/50">{new Date(csat.sentAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
