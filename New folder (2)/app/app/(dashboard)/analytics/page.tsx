"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { BarChart3, Clock, Sparkles, DollarSign, TrendingUp, TrendingDown, Minus, Star, Users, Award, Radio } from "lucide-react"
import { toast } from "sonner"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { motion, AnimatePresence } from "framer-motion"
import { Skeleton, SkeletonStats } from "@/components/dashboard/skeleton"
import { EmptyState } from "@/components/dashboard/empty-state"
import { analytics as analyticsApi } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { subscribeToWorkspace, unsubscribeFromWorkspace, PusherEvents } from "@/lib/pusher-client"

const RANGE_OPTIONS = ["7d", "30d", "90d"] as const
type Range = (typeof RANGE_OPTIONS)[number]

function formatSeconds(s: number): string {
  if (s < 60) return `${Math.round(s)}s`
  return `${(s / 60).toFixed(1)}m`
}

// --- Shared tooltip style -------------------------------------------------------

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  color: "hsl(var(--foreground))",
}

/** Tooltip style for bar charts: solid background so it doesn't blend with purple bars, fixed at top so it doesn't overlap */
const barChartTooltipStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
  padding: "8px 12px",
  boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
  color: "hsl(var(--foreground))",
}

const FADE_UP_NONE = {
  initial: { opacity: 1, y: 0 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0 },
  viewport: { once: true },
}

// --- Helper to safely extract arrays from API data -----------------------------

function extractArray<T>(data: Record<string, unknown> | null, key: string): T[] {
  if (!data || !Array.isArray(data[key])) return []
  return data[key] as T[]
}

// --- Page -----------------------------------------------------------------------

interface LiveMetrics {
  openTickets: number
  agentsOnline: number
  queueDepth: Record<string, number>
  timestamp: string
}

export default function AnalyticsPage() {
  const { workspace } = useAuth()
  const [range, setRange] = useState<Range>("7d")
  const [loading, setLoading] = useState(true)
  const [apiData, setApiData] = useState<Record<string, unknown> | null>(null)
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics | null>(null)

  // No entrance animations — avoids flash/proomyhuvannia on mobile reload
  const fadeUp = FADE_UP_NONE
  const contentEnter = { initial: { opacity: 1 }, animate: { opacity: 1 }, transition: { duration: 0 } }
  const cardEnter = { initial: { opacity: 1, y: 0 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 0 }, viewport: { once: true } }
  const cardEnterDelay = () => ({ initial: { opacity: 1, y: 0 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 0 }, viewport: { once: true } })

  // Fetch analytics from multiple API endpoints
  const fetchAnalytics = useCallback(async (r: Range) => {
    try {
      setLoading(true)
      const params = { range: r }
      const [overview, volume, channels, agents, csat, revenue] = await Promise.allSettled([
        analyticsApi.overview(params),
        analyticsApi.volume(params),
        analyticsApi.channels(params),
        analyticsApi.agents(params),
        analyticsApi.csat(params),
        analyticsApi.revenue(params),
      ])
      const ov = overview.status === "fulfilled" ? overview.value : {} as Record<string, unknown>
      const vol = volume.status === "fulfilled" ? volume.value : { data: [] }
      const ch = channels.status === "fulfilled" ? channels.value : { data: [] }
      const ag = agents.status === "fulfilled" ? agents.value : { data: [] }
      const cs = csat.status === "fulfilled" ? csat.value : {} as Record<string, unknown>
      const rev = revenue.status === "fulfilled" ? revenue.value : { revenueAttributed: 0, revenueByChannel: [], revenueTimeline: [] }

      // Construct resolution breakdown from overview data
      const ovData = ov as Record<string, unknown>
      const aiRate = Number(ovData.aiResolutionRate) || 0
      const escalationRate = Number(ovData.escalationRate) || 0
      const humanRate = Math.max(0, 100 - aiRate - escalationRate)
      const resolutionBreakdown = [
        { name: "AI Resolved", value: aiRate, color: "#10b981" },
        { name: "Human Resolved", value: humanRate, color: "#6366f1" },
        { name: "Escalated", value: escalationRate, color: "#f59e0b" },
      ].filter((d) => d.value > 0)

      // Construct CSAT distribution from avg score
      const avgCsatScore = Number((cs as Record<string, unknown>).averageScore) || 0
      const totalSurveys = Number((cs as Record<string, unknown>).totalSurveys) || 0
      const responseRate = Number((cs as Record<string, unknown>).responseRate) || 0

      setApiData({
        ...ovData,
        ticketVolume: vol.data ?? [],
        channelData: (ch.data ?? []).map((c: { channel: string; count: number }) => ({ channel: c.channel, tickets: c.count })),
        agentPerformance: (ag.data ?? []).map((a: { name: string; ticketsHandled: number }) => ({ name: a.name, resolved: a.ticketsHandled, avgResponseSec: 0, csat: 0, revenue: 0 })),
        resolutionData: resolutionBreakdown,
        avgCsat: avgCsatScore,
        csatResponses: totalSurveys,
        csatResponseRate: responseRate,
        csatSatisfied: avgCsatScore >= 4 ? Math.round(avgCsatScore * 20) : 0,
        revenueData: (rev.revenueTimeline ?? []).map((r: { date: string; revenue: number }) => ({ date: r.date, revenue: r.revenue })),
        revenueByChannel: (rev.revenueByChannel ?? []).map((r: { channel: string; revenue: number }) => ({ channel: r.channel, revenue: r.revenue })),
        totalRevenue: rev.revenueAttributed ?? 0,
      } as unknown as Record<string, unknown>)
    } catch (err) {
      console.error("Failed to fetch analytics:", err)
      toast.error("Failed to load analytics data")
      setApiData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalytics(range)
  }, [range, fetchAnalytics])

  // Subscribe to real-time analytics updates via Pusher
  useEffect(() => {
    if (!workspace?.id) return

    const channel = subscribeToWorkspace(workspace.id)

    channel.bind(PusherEvents.ANALYTICS_LIVE, (data: LiveMetrics) => {
      setLiveMetrics(data)
    })

    return () => {
      channel.unbind(PusherEvents.ANALYTICS_LIVE)
      unsubscribeFromWorkspace(workspace.id)
    }
  }, [workspace?.id])

  // Extract data from API response
  const ticketVolumeData = useMemo(() =>
    extractArray<{ date: string; total: number; aiResolved: number }>(apiData, "ticketVolume"),
    [apiData]
  )

  const channelData = useMemo(() =>
    extractArray<{ channel: string; tickets: number }>(apiData, "channelData"),
    [apiData]
  )

  const resolutionData = useMemo(() =>
    extractArray<{ name: string; value: number; color: string }>(apiData, "resolutionData"),
    [apiData]
  )

  const revenueData = useMemo(() =>
    extractArray<{ date: string; revenue: number }>(apiData, "revenueData"),
    [apiData]
  )

  const csatData = useMemo(() =>
    extractArray<{ rating: string; count: number }>(apiData, "csatData"),
    [apiData]
  )

  const csatTrendData = useMemo(() =>
    extractArray<{ date: string; score: number }>(apiData, "csatTrend"),
    [apiData]
  )

  const agentPerformanceData = useMemo(() =>
    extractArray<{ name: string; resolved: number; avgResponseSec: number; csat: number; revenue: number }>(apiData, "agentPerformance")
      .map((a) => ({
        ...a,
        avgResponse: formatSeconds(a.avgResponseSec),
      })),
    [apiData]
  )

  const revenueByChannel = useMemo(() =>
    extractArray<{ channel: string; revenue: number }>(apiData, "revenueByChannel"),
    [apiData]
  )

  // Define stat definitions on frontend (not dependent on backend icon names)
  const STAT_DEFS = useMemo(() => [
    { label: "Ticket Volume", icon: BarChart3, key: "totalTickets", format: "int" as const, iconBg: "bg-foreground/5", iconColor: "text-foreground/80" },
    { label: "AI Resolution Rate", icon: Sparkles, key: "aiResolutionRate", format: "pct" as const, iconBg: "bg-emerald-500/10", iconColor: "text-emerald-600" },
    { label: "Avg. First Response", icon: Clock, key: "avgResponseTime", format: "time" as const, iconBg: "bg-foreground/5", iconColor: "text-foreground/80" },
    { label: "Revenue Attributed", icon: DollarSign, key: "revenueAttributed", format: "usd" as const, iconBg: "bg-amber-500/10", iconColor: "text-amber-600" },
  ], [])

  const stats = useMemo(() => {
    if (!apiData) return []

    function formatValue(raw: unknown, format: "int" | "pct" | "time" | "usd"): string {
      if (raw === undefined || raw === null) return "--"
      const num = typeof raw === "number" ? raw : Number(raw)
      if (isNaN(num)) return String(raw)
      switch (format) {
        case "int": return num.toLocaleString()
        case "pct": return `${num}%`
        case "time": return formatSeconds(num)
        case "usd": return `$${num.toLocaleString()}`
      }
    }

    const changes = (apiData.changes ?? {}) as Record<string, string>

    return STAT_DEFS.map(def => {
      const changeStr = changes[def.key] || ""
      const changeNum = parseFloat(changeStr.replace(/[^0-9.\-]/g, ""))
      let trend: "up" | "down" | "neutral" = "neutral"
      if (!isNaN(changeNum)) {
        if (changeNum > 0) trend = "up"
        else if (changeNum < 0) trend = "down"
      }
      return {
        ...def,
        value: formatValue(apiData[def.key], def.format),
        change: changeStr,
        trend,
      }
    })
  }, [apiData, STAT_DEFS])

  const hasData = apiData !== null

  // Brief loading flash on range change + API re-fetch
  const handleRangeChange = useCallback((r: Range) => {
    if (r === range) return
    setRange(r)
    fetchAnalytics(r)
  }, [range, fetchAnalytics])

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">

        {/* Page header */}
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-start sm:justify-between sm:gap-4" {...fadeUp}>
          <div>
            <h1 className="text-[20px] sm:text-[22px] font-semibold text-foreground tracking-tight">Analytics</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Track performance across all channels and AI resolution.
            </p>
          </div>

          {/* Time-range selector */}
          <div className="flex shrink-0 flex-wrap items-center self-start rounded-lg border border-border/60 bg-card p-0.5">
            {RANGE_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => handleRangeChange(r)}
                className={`cursor-pointer rounded-md px-3 py-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-[12px] sm:min-h-0 sm:min-w-0 font-medium transition-all duration-150 ${
                  range === r
                    ? "bg-secondary text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Live metrics strip from Pusher */}
        {liveMetrics && (
          <div className="mb-6 sm:mb-8 flex flex-wrap items-center gap-3 sm:gap-4 rounded-xl border border-accent/20 bg-accent/[0.03] px-4 py-3 sm:px-5 sm:py-4">
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-accent">
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              Live
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] text-muted-foreground">Open Tickets</span>
              <span className="text-[13px] font-bold tabular-nums text-foreground">{liveMetrics.openTickets}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] text-muted-foreground">Agents Online</span>
              <span className="text-[13px] font-bold tabular-nums text-foreground">{liveMetrics.agentsOnline}</span>
            </div>
            {Object.entries(liveMetrics.queueDepth).map(([queue, depth]) => (
              <div key={queue} className="flex items-center gap-1.5">
                <span className="text-[12px] text-muted-foreground">{queue}</span>
                <span className="text-[13px] font-bold tabular-nums text-foreground">{depth}</span>
              </div>
            ))}
            <span className="ml-auto text-[10px] tabular-nums text-muted-foreground/50">
              {new Date(liveMetrics.timestamp).toLocaleTimeString()}
            </span>
          </div>
        )}

        {/* Empty state -- no analytics data */}
        {!loading && !hasData && (
          <EmptyState
            icon={BarChart3}
            title="No analytics data yet"
            description="Start resolving tickets to see performance insights here."
          />
        )}

        {/* Stats cards */}
        {(loading || hasData) && (
        <div className="mb-6 sm:mb-8">
          {loading ? (
            <SkeletonStats />
          ) : stats.length > 0 ? (
            <AnimatePresence>
              <motion.div
                {...contentEnter}
                className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
              >
                {stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    className="group rounded-xl border border-border/60 bg-card p-3 sm:p-5 transition-all duration-200 hover:border-border hover:shadow-[0_2px_8px_-2px_rgb(0_0_0/0.06)]"
                    {...cardEnterDelay()}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg ${stat.iconBg} transition-transform duration-200 group-hover:scale-105`}>
                        <stat.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${stat.iconColor}`} />
                      </div>
                      <div
                        className={`flex items-center gap-1 rounded-full px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold ${
                          stat.trend === "up" ? "bg-emerald-500/10 text-emerald-600" : stat.trend === "down" ? "bg-red-500/10 text-red-500" : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {stat.trend === "up" ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : stat.trend === "down" ? (
                          <TrendingDown className="h-3 w-3" />
                        ) : (
                          <Minus className="h-3 w-3" />
                        )}
                        {stat.change}
                      </div>
                    </div>
                    <p className="mt-2 sm:mt-3 text-[22px] sm:text-[28px] font-bold tracking-tight text-foreground tabular-nums">{stat.value}</p>
                    <p className="mt-0.5 text-[12px] sm:text-[13px] text-muted-foreground">{stat.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          ) : null}
        </div>
        )}

        {/* Charts grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-border/60 bg-card p-3 sm:p-5 lg:col-span-2">
              <Skeleton className="mb-4 h-4 w-48" />
              <Skeleton className="h-[220px] sm:h-[260px] w-full rounded-lg" />
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-3 sm:p-5">
              <Skeleton className="mb-4 h-4 w-36" />
              <Skeleton className="mx-auto h-[160px] w-[160px] sm:h-[180px] sm:w-[180px] rounded-full" />
              <div className="mt-3 flex flex-col gap-2.5">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-3 sm:p-5 lg:col-span-3">
              <Skeleton className="mb-4 h-4 w-36" />
              <Skeleton className="h-[180px] sm:h-[220px] w-full rounded-lg" />
            </div>
          </div>
        ) : hasData && (ticketVolumeData.length > 0 || channelData.length > 0 || resolutionData.length > 0) ? (
          <AnimatePresence>
            <motion.div
              {...contentEnter}
              className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3"
            >

              {/* Ticket volume area chart -- spans 2 cols */}
              {ticketVolumeData.length > 0 && (
              <motion.div
                className="min-w-0 rounded-xl border border-border/60 bg-card p-3 sm:p-5 transition-all duration-200 hover:shadow-[0_2px_8px_-2px_rgb(0_0_0/0.06)] lg:col-span-2"
                {...cardEnterDelay()}
              >
                <div className="mb-3 sm:mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[13px] sm:text-[14px] font-semibold text-foreground">
                    Ticket Volume &amp; AI Resolution
                  </p>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-2 w-2 rounded-full bg-[#6366f1]" />
                      <span className="text-[11px] sm:text-[12px] text-muted-foreground">Total</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-2 w-2 rounded-full bg-[#10b981]" />
                      <span className="text-[11px] sm:text-[12px] text-muted-foreground">AI Resolved</span>
                    </div>
                  </div>
                </div>
                <div className="h-[220px] sm:h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ticketVolumeData} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
                    <defs>
                      <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradAI" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#10b981" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }} />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#6366f1"
                      fill="url(#gradTotal)"
                      strokeWidth={2}
                      dot={false}
                      name="Total Tickets"
                    />
                    <Area
                      type="monotone"
                      dataKey="aiResolved"
                      stroke="#10b981"
                      fill="url(#gradAI)"
                      strokeWidth={2}
                      dot={false}
                      name="AI Resolved"
                    />
                  </AreaChart>
                </ResponsiveContainer>
                </div>
              </motion.div>
              )}

              {/* Resolution breakdown donut */}
              {resolutionData.length > 0 && (
              <motion.div
                className="min-w-0 rounded-xl border border-border/60 bg-card p-3 sm:p-5 transition-all duration-200 hover:shadow-[0_2px_8px_-2px_rgb(0_0_0/0.06)]"
                {...cardEnterDelay()}
              >
                <p className="mb-3 sm:mb-4 text-[13px] sm:text-[14px] font-semibold text-foreground">Resolution Breakdown</p>
                <div className="h-[160px] sm:h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={resolutionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={76}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {resolutionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number) => [`${value}%`, ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  {resolutionData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-[12px] sm:text-[13px] text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="text-[12px] sm:text-[13px] font-semibold text-foreground tabular-nums">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </motion.div>
              )}

              {/* Tickets by channel bar chart -- full width */}
              {channelData.length > 0 && (
              <motion.div
                className="min-w-0 rounded-xl border border-border/60 bg-card p-3 sm:p-5 transition-all duration-200 hover:shadow-[0_2px_8px_-2px_rgb(0_0_0/0.06)] lg:col-span-3"
                {...cardEnterDelay()}
              >
                <p className="mb-3 sm:mb-4 text-[13px] sm:text-[14px] font-semibold text-foreground">Tickets by Channel</p>
                <div className="h-[180px] sm:h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={channelData} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} vertical={false} />
                    <XAxis
                      dataKey="channel"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={barChartTooltipStyle}
                      wrapperStyle={{ zIndex: 1000 }}
                      position={{ y: 0 }}
                      cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                      formatter={(value: number, name: string, props: { payload?: { channel?: string } }) => [
                        `${value} ticket${value === 1 ? "" : "s"}`,
                        props.payload?.channel ?? name,
                      ]}
                      labelFormatter={(label) => (label ? `${label}` : "")}
                    />
                    <Bar
                      dataKey="tickets"
                      fill="#6366f1"
                      radius={[4, 4, 0, 0]}
                      name="Tickets"
                      maxBarSize={48}
                    />
                  </BarChart>
                </ResponsiveContainer>
                </div>
              </motion.div>
              )}

            </motion.div>
          </AnimatePresence>
        ) : null}

        {/* Revenue Tracking Section */}
        {!loading && hasData && (revenueData.length > 0 || revenueByChannel.length > 0) && (
          <div className="mt-6 sm:mt-8">
            <div {...fadeUp} className="mb-6">
              <h2 className="text-[16px] sm:text-[18px] font-semibold text-foreground tracking-tight">Revenue Tracking</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Revenue attributed from support interactions -- pre-sale chats that led to conversions.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
              {/* Revenue over time */}
              {revenueData.length > 0 && (
              <motion.div
                className="min-w-0 rounded-xl border border-border/60 bg-card p-3 sm:p-5 transition-all duration-200 hover:shadow-[0_2px_8px_-2px_rgb(0_0_0/0.06)] lg:col-span-2"
                {...cardEnter}
              >
                <p className="mb-3 sm:mb-4 text-[13px] sm:text-[14px] font-semibold text-foreground">Revenue Over Time</p>
                <div className="h-[180px] sm:h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
                    <defs>
                      <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]} />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#gradRevenue)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
                </div>
              </motion.div>
              )}

              {/* Revenue by channel */}
              {revenueByChannel.length > 0 && (
              <motion.div
                className="min-w-0 rounded-xl border border-border/60 bg-card p-3 sm:p-5 transition-all duration-200 hover:shadow-[0_2px_8px_-2px_rgb(0_0_0/0.06)]"
                {...cardEnterDelay()}
              >
                <p className="mb-3 sm:mb-4 text-[13px] sm:text-[14px] font-semibold text-foreground">Revenue by Channel</p>
                <div className="flex flex-col gap-3">
                  {revenueByChannel.map((ch) => {
                    const max = Math.max(...revenueByChannel.map((c) => c.revenue))
                    return (
                      <div key={ch.channel}>
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-[12px] text-muted-foreground">{ch.channel}</span>
                          <span className="text-[12px] font-semibold text-foreground tabular-nums">${ch.revenue.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-700 ease-out"
                            style={{ width: `${(ch.revenue / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
              )}
            </div>
          </div>
        )}

        {/* CSAT Analytics Section */}
        {!loading && hasData && (csatData.length > 0 || csatTrendData.length > 0) && (
          <div className="mt-6 sm:mt-8">
            <div {...fadeUp} className="mb-6">
              <h2 className="text-[16px] sm:text-[18px] font-semibold text-foreground tracking-tight">Customer Satisfaction</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                CSAT scores from post-ticket surveys.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
              {/* CSAT stats */}
              <motion.div
                className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-1"
                {...cardEnter}
              >
                {[
                  { icon: Star, iconColor: "text-amber-400", iconBg: "bg-amber-500/10", value: apiData?.avgCsat ? String(apiData.avgCsat) : "--", label: "Avg CSAT" },
                  { icon: Users, iconColor: "text-foreground/70", iconBg: "bg-foreground/5", value: apiData?.csatResponses ? String(apiData.csatResponses) : "--", label: "Responses" },
                  { icon: TrendingUp, iconColor: "text-emerald-600", iconBg: "bg-emerald-500/10", value: apiData?.csatSatisfied ? `${apiData.csatSatisfied}%` : "--", label: "Satisfied (4-5)" },
                  { icon: Award, iconColor: "text-accent", iconBg: "bg-accent/10", value: apiData?.csatResponseRate ? `${apiData.csatResponseRate}%` : "--", label: "Response Rate" },
                ].map((item) => (
                  <div key={item.label} className="group rounded-xl border border-border/60 bg-card p-3 sm:p-5 transition-all duration-200 hover:border-border hover:shadow-[0_2px_8px_-2px_rgb(0_0_0/0.06)]">
                    <div className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg ${item.iconBg} transition-transform duration-200 group-hover:scale-105`}>
                      <item.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${item.iconColor}`} />
                    </div>
                    <p className="mt-2 sm:mt-3 text-[20px] sm:text-[24px] font-bold text-foreground tabular-nums">{item.value}</p>
                    <p className="mt-0.5 text-[11px] sm:text-[12px] text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </motion.div>

              {/* CSAT distribution */}
              {csatData.length > 0 && (
              <motion.div
                className="min-w-0 rounded-xl border border-border/60 bg-card p-3 sm:p-5 transition-all duration-200 hover:shadow-[0_2px_8px_-2px_rgb(0_0_0/0.06)]"
                {...cardEnterDelay()}
              >
                <p className="mb-3 sm:mb-4 text-[13px] sm:text-[14px] font-semibold text-foreground">Score Distribution</p>
                <div className="h-[170px] sm:h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={csatData} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} vertical={false} />
                    <XAxis dataKey="rating" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={48} name="Responses" />
                  </BarChart>
                </ResponsiveContainer>
                </div>
              </motion.div>
              )}

              {/* CSAT trend */}
              {csatTrendData.length > 0 && (
              <motion.div
                className="min-w-0 rounded-xl border border-border/60 bg-card p-3 sm:p-5 transition-all duration-200 hover:shadow-[0_2px_8px_-2px_rgb(0_0_0/0.06)]"
                {...cardEnterDelay()}
              >
                <p className="mb-3 sm:mb-4 text-[13px] sm:text-[14px] font-semibold text-foreground">CSAT Trend</p>
                <div className="h-[170px] sm:h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={csatTrendData} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
                    <defs>
                      <linearGradient id="gradCsat" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[3, 5]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="score" stroke="#f59e0b" fill="url(#gradCsat)" strokeWidth={2} dot={false} name="Avg Score" />
                  </AreaChart>
                </ResponsiveContainer>
                </div>
              </motion.div>
              )}
            </div>
          </div>
        )}

        {/* Agent Performance Section */}
        {!loading && hasData && agentPerformanceData.length > 0 && (
          <div className="mt-6 sm:mt-8 mb-6 sm:mb-8">
            <div {...fadeUp} className="mb-6">
              <h2 className="text-[16px] sm:text-[18px] font-semibold text-foreground tracking-tight">Agent Performance</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Per-agent metrics -- tickets resolved, response time, satisfaction, and revenue.
              </p>
            </div>

            <motion.div
              className="min-w-0 rounded-xl border border-border/60 bg-card transition-all duration-200 hover:shadow-[0_2px_8px_-2px_rgb(0_0_0/0.06)]"
              {...cardEnter}
            >
              <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
                <table className="w-full min-w-[600px] text-[13px]">
                  <thead>
                    <tr className="border-b border-border/60">
                      <th className="px-3 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50 sm:px-5">Rank</th>
                      <th className="px-3 py-3.5 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50 sm:px-5">Agent</th>
                      <th className="px-3 py-3.5 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50 sm:px-5">Resolved</th>
                      <th className="px-3 py-3.5 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50 sm:px-5">Avg Response</th>
                      <th className="px-3 py-3.5 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50 sm:px-5">CSAT</th>
                      <th className="px-3 py-3.5 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50 sm:px-5">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {agentPerformanceData.map((agent, i) => (
                      <tr key={agent.name} className="transition-colors duration-150 hover:bg-secondary/30">
                        <td className="px-3 py-3.5 sm:px-5">
                          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                            i === 0 ? "bg-amber-500/10 text-amber-600" :
                            i === 1 ? "bg-secondary text-muted-foreground" :
                            i === 2 ? "bg-orange-500/10 text-orange-600" :
                            "text-muted-foreground"
                          }`}>
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 sm:px-5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-foreground">
                              {agent.name.split(" ").map((n) => n[0]).join("")}
                            </div>
                            <span className="font-medium text-foreground whitespace-nowrap">{agent.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3.5 text-right tabular-nums font-semibold text-foreground sm:px-5">{agent.resolved}</td>
                        <td className="px-3 py-3.5 text-right tabular-nums text-muted-foreground sm:px-5">{agent.avgResponse}</td>
                        <td className="px-3 py-3.5 text-right sm:px-5">
                          <span className={`inline-flex items-center gap-1 ${
                            agent.csat >= 4.5 ? "text-emerald-600" :
                            agent.csat >= 4.0 ? "text-foreground" :
                            "text-amber-600"
                          }`}>
                            <Star className="h-3 w-3 fill-current" />
                            {agent.csat}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-right tabular-nums font-semibold text-emerald-600 sm:px-5">${agent.revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}

      </div>
    </div>
  )
}
