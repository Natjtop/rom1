"use client"

import { useRef, useEffect, useState } from "react"
import Link from "next/link"
import { motion, useInView, useSpring, useTransform } from "framer-motion"
import { ArrowRight, BarChart3, TrendingUp, TrendingDown, Clock, Bot, Users, ChevronRight } from "lucide-react"

const ease = [0.23, 1, 0.32, 1] as const

const metrics = [
  { label: "AI Resolution Rate", value: "—", delta: "", trend: "up", sub: "Tracked automatically" },
  { label: "First Reply Time", value: "—", delta: "", trend: "up", sub: "Measured in real time" },
  { label: "Tickets This Week", value: "—", delta: "", trend: "neutral", sub: "Updated live" },
  { label: "CSAT Score", value: "—", delta: "", trend: "up", sub: "From customer feedback" },
  { label: "Escalation Rate", value: "—", delta: "", trend: "up", sub: "AI vs human split" },
  { label: "Avg Handle Time", value: "—", delta: "", trend: "up", sub: "Per agent & AI" },
]

const channelBreakdown = [
  { name: "Email", pct: "—", resolved: "—", color: "bg-foreground/80" },
  { name: "Live Chat", pct: "—", resolved: "—", color: "bg-emerald-500" },
]

const weeklyData = [
  { day: "Mon", ai: 80, human: 20 },
  { day: "Tue", ai: 72, human: 18 },
  { day: "Wed", ai: 100, human: 22 },
  { day: "Thu", ai: 95, human: 21 },
  { day: "Fri", ai: 130, human: 25 },
  { day: "Sat", ai: 60, human: 9 },
  { day: "Sun", ai: 47, human: 7 },
]

const maxTotal = Math.max(...weeklyData.map(d => d.ai + d.human))

const heroStats = [
  { value: "6", label: "report categories" },
  { value: "30+", label: "tracked metrics" },
  { value: "Real-time", label: "dashboard updates" },
  { value: "0", label: "setup required" },
]

/* ── Animated counter ──────────────────────────────────────── */
function AnimatedCounter({ value, inView }: { value: string; inView: boolean }) {
  const numericMatch = value.match(/^([^0-9]*)([0-9]+(?:\.[0-9]+)?)(.*)$/)
  if (!numericMatch) return <span>{value}</span>

  const prefix = numericMatch[1]
  const target = parseFloat(numericMatch[2].replace(/,/g, ""))
  const suffix = numericMatch[3]
  const isDecimal = numericMatch[2].includes(".")
  const hasComma = numericMatch[2].includes(",")

  const spring = useSpring(0, { stiffness: 50, damping: 18 })
  const display = useTransform(spring, (v: number) => {
    if (isDecimal) return v.toFixed(1)
    const rounded = Math.round(v)
    return hasComma ? rounded.toLocaleString() : rounded.toString()
  })
  const [displayValue, setDisplayValue] = useState("0")

  useEffect(() => {
    if (inView) spring.set(target)
  }, [inView, spring, target])

  useEffect(() => {
    const unsubscribe = display.on("change", (v: string) => setDisplayValue(v))
    return unsubscribe
  }, [display])

  return (
    <span>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  )
}

/* ── Stagger card ──────────────────────────────────────────── */
function StaggerCard({ children, index, className }: { children: React.ReactNode; index: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.07, ease }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function AnalyticsPage() {
  const metricsRef = useRef<HTMLDivElement>(null)
  const metricsInView = useInView(metricsRef, { once: true })
  const dashRef = useRef<HTMLDivElement>(null)
  const dashInView = useInView(dashRef, { once: true, margin: "-60px" })

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-background to-surface-sunken">
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-16 text-center sm:pt-32 sm:pb-20">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-4 py-1.5 text-sm text-muted-foreground"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Analytics
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.06, duration: 0.65, ease }}
            className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Know exactly how your support is performing.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.12, duration: 0.65, ease }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          >
            Real-time dashboards for AI resolution rates, response times, channel breakdowns, and agent performance. Live from day one — no setup, no data warehousing.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.18, duration: 0.65, ease }}
            className="mt-10 flex w-full flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link href="/register"
              className="inline-flex h-11 w-full sm:w-auto items-center justify-center rounded-lg bg-foreground px-8 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
            >
                Get started
            </Link>
            <Link href="/register"
              className="inline-flex h-11 w-full sm:w-auto items-center justify-center rounded-lg border border-border bg-background px-8 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
                Start free trial
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-6">
          <motion.div
            ref={dashRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.22, duration: 0.65, ease }}
            className="rounded-xl border border-border/60 bg-card shadow-[0_8px_40px_-12px_rgb(0_0_0/0.06)]"
          >
            <div className="border-b border-border/60 px-5 py-3.5 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Support Overview</span>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="text-[11px] text-muted-foreground"
              >
                Last 30 days · Live
              </motion.span>
            </div>
            <div className="p-4">
              {/* Mini bar chart */}
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">Tickets this week</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-foreground/60 inline-block" /><span className="text-[10px] text-muted-foreground">AI</span></div>
                    <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-border inline-block" /><span className="text-[10px] text-muted-foreground">Human</span></div>
                  </div>
                </div>
                <div className="flex items-end gap-1.5 h-24">
                  {weeklyData.map((d, i) => (
                    <div key={d.day} className="flex flex-col items-center gap-0.5 flex-1">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={dashInView ? { height: `${((d.ai + d.human) / maxTotal) * 80}px` } : { height: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 + i * 0.06, ease }}
                        className="flex flex-col w-full gap-0.5 overflow-hidden"
                      >
                        <div className="rounded-t-sm bg-foreground/40 w-full" style={{ height: `${(d.human / (d.ai + d.human)) * 100}%` }} />
                        <div className="rounded-b-sm bg-foreground/60 w-full flex-1" />
                      </motion.div>
                      <span className="text-[9px] text-muted-foreground">{d.day}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Mini metrics */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "AI Resolution", placeholder: "Tracked" },
                  { label: "First Reply", placeholder: "Real-time" },
                  { label: "Escalations", placeholder: "Monitored" },
                  { label: "CSAT Score", placeholder: "Live" },
                ].map((m, i) => (
                  <motion.div
                    key={m.label}
                    initial={{ opacity: 0 }}
                    animate={dashInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 + i * 0.08, ease }}
                    className="rounded-lg border border-border/60 bg-secondary/40 p-3"
                  >
                    <p className="text-[10px] text-muted-foreground">{m.label}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <p className="text-lg font-semibold tracking-[-0.04em] text-foreground">{m.placeholder}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-t border-border/40 py-12">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {heroStats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08, ease }}
                className="text-center"
              >
                <p className="text-3xl font-bold tracking-tight text-foreground">{s.value}</p>
                <p className="mt-1 text-[13px] text-muted-foreground">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* All metrics */}
      <section className="border-t border-border/40 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="mb-14">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease }}
              className="mb-3 text-[13px] font-medium text-accent"
            >
              Key metrics
            </motion.p>
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.06, duration: 0.6, ease }}
              className="text-3xl md:text-[2.5rem] font-semibold tracking-[-0.03em] text-foreground"
            >
              Every number that matters.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.12, duration: 0.6, ease }}
              className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted-foreground"
            >
              Track the metrics that actually drive customer satisfaction and operational efficiency. All data updates in real time.
            </motion.p>
          </div>
          <div ref={metricsRef} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {metrics.map((metric, i) => (
              <StaggerCard key={metric.label} index={i} className="group rounded-xl border border-border/60 bg-card p-7 transition-all duration-300 hover:border-border hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.08)]">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                  {metric.trend === "up" ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1, rotate: 0 }}
                      viewport={{ once: true }}
                      transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.2 + i * 0.07 }}
                    >
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </motion.div>
                  ) : metric.trend === "down" ? (
                    <motion.div
                      initial={{ scale: 0, rotate: 20 }}
                      whileInView={{ opacity: 1, rotate: 0 }}
                      viewport={{ once: true }}
                      transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.2 + i * 0.07 }}
                    >
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    </motion.div>
                  ) : null}
                </div>
                <p className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-foreground">
                  <AnimatedCounter value={metric.value} inView={metricsInView} />
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-sm font-semibold text-emerald-600">{metric.delta}</span>
                  <span className="text-xs text-muted-foreground">{metric.sub}</span>
                </div>
              </StaggerCard>
            ))}
          </div>
        </div>
      </section>

      {/* Channel breakdown */}
      <section className="border-t border-border/40 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease }}
                className="mb-3 text-[13px] font-medium text-accent"
              >
                Per-channel
              </motion.p>
              <motion.h2
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.06, duration: 0.6, ease }}
                className="text-3xl md:text-[2.5rem] font-semibold tracking-[-0.03em] text-foreground"
              >
                AI resolution broken down by channel.
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.12, duration: 0.6, ease }}
                className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted-foreground"
              >
                See exactly where the AI is performing and where humans are still needed. Drill into any channel for ticket-level breakdowns.
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.06, duration: 0.6, ease }}
              className="rounded-xl border border-border/60 bg-card p-7 transition-all duration-300 hover:border-border hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.08)]"
            >
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm font-semibold text-foreground">AI Resolution by Channel</p>
                <span className="text-[11px] text-muted-foreground">Last 30 days</span>
              </div>
              <div className="flex flex-col gap-4">
                {channelBreakdown.map((ch, i) => (
                  <motion.div
                    key={ch.name + i}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease }}
                  >
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{ch.name}</span>
                      <span className="text-xs text-muted-foreground">AI resolution tracked per channel</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: "60%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, delay: 0.2 + i * 0.1, ease }}
                        className={`h-full rounded-full ${ch.color}`}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Report types */}
      <section className="border-t border-border/40 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="mb-14 text-center">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease }}
              className="mb-3 text-[13px] font-medium text-accent"
            >
              Built-in reports
            </motion.p>
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.06, ease }}
              className="text-3xl md:text-[2.5rem] font-semibold tracking-[-0.03em] text-foreground"
            >
              Everything included in every plan.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.12, ease }}
              className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-muted-foreground"
            >
              No add-ons, no premium tiers for reporting. Every dashboard and export ships with every plan.
            </motion.p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { iconKey: "Bot" as const, title: "AI Performance", body: "Resolution rate, accuracy, escalation reasons, top failure categories." },
              { iconKey: "Clock" as const, title: "Response Times", body: "First reply, resolution time, time-in-queue per channel and agent." },
              { iconKey: "Users" as const, title: "Agent Reports", body: "Per-agent ticket count, handle time, CSAT scores, and workload distribution." },
              { iconKey: "BarChart3" as const, title: "Volume Trends", body: "Daily, weekly, and monthly volume with peak hour heatmaps." },
            ].map((item, i) => (
              <StaggerCard key={item.title} index={i} className="group rounded-xl border border-border/60 bg-card p-7 transition-all duration-300 hover:border-border hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.08)]">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  {item.iconKey === "Bot" && <Bot className="h-4.5 w-4.5 min-h-[18px] min-w-[18px] shrink-0 text-foreground" />}
                  {item.iconKey === "Clock" && <Clock className="h-4.5 w-4.5 min-h-[18px] min-w-[18px] shrink-0 text-foreground" />}
                  {item.iconKey === "Users" && <Users className="h-4.5 w-4.5 min-h-[18px] min-w-[18px] shrink-0 text-foreground" />}
                  {item.iconKey === "BarChart3" && <BarChart3 className="h-4.5 w-4.5 min-h-[18px] min-w-[18px] shrink-0 text-foreground" />}
                </div>
                <p className="text-[15px] font-semibold text-foreground">{item.title}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{item.body}</p>
              </StaggerCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative border-t border-border/40 py-24 md:py-32">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-1/2 bottom-0 h-[400px] w-[600px] -translate-x-1/2 translate-y-1/4 rounded-full bg-accent/[0.03] blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-[1200px] px-6 text-center">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="text-3xl md:text-[2.5rem] font-semibold tracking-[-0.03em] text-foreground"
          >
            See your support data in real time.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.06, duration: 0.6, ease }}
            className="mx-auto mt-5 max-w-lg text-[17px] leading-relaxed text-muted-foreground"
          >
            Analytics are live from the moment you connect. No waiting, no setup.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.12, duration: 0.6, ease }}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            <Link href="/register"
              className="group inline-flex items-center gap-2 rounded-xl bg-foreground px-8 py-3.5 text-sm font-semibold text-background transition-all duration-200 hover:bg-foreground/90 hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.12)]"
            >
                Try free for 3 days
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl border border-border/60 px-8 py-3.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:text-foreground hover:border-border hover:bg-secondary"
            >
                See pricing
                <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
