"use client"

import { useEffect, useRef, useState, memo } from "react"
import Link from "next/link"
import { motion, useInView } from "framer-motion"
import { ArrowRight, Inbox, ChevronRight, Filter, Tag, User, Clock } from "lucide-react"

const channels = [
  { iconKey: "Mail" as const, name: "Email", color: "text-foreground/70", bg: "bg-foreground/5", count: 142, badge: "Most volume" },
  { iconKey: "MessageSquare" as const, name: "Live Chat", color: "text-accent", bg: "bg-accent/10", count: 67, badge: "Real-time" },
]

const channelIconSvgProps = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", width: 20, height: 20, style: { display: "block", flexShrink: 0 } } as const

function ChannelIcon({ iconKey, className }: { iconKey: "Mail" | "MessageSquare"; className?: string }) {
  const c = className ?? ""
  if (iconKey === "Mail") {
    return (
      <svg className={c} {...channelIconSvgProps} aria-hidden>
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    )
  }
  return (
    <svg className={c} {...channelIconSvgProps} aria-hidden>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

const mockTickets = [
  { id: "#59201", customer: "Lucas B.", channel: "Email", subject: "Wrong item delivered", time: "2m ago", status: "Open", priority: "high" },
  { id: "#59200", customer: "Mia K.", channel: "Live Chat", subject: "Order status update", time: "5m ago", status: "AI Resolved", priority: "low" },
  { id: "#59199", customer: "James T.", channel: "Email", subject: "Can I exchange sizes?", time: "8m ago", status: "AI Resolved", priority: "low" },
  { id: "#59198", customer: "Priya S.", channel: "Live Chat", subject: "Checkout discount code", time: "12m ago", status: "Open", priority: "medium" },
  { id: "#59197", customer: "Chen W.", channel: "Email", subject: "Refund not received", time: "18m ago", status: "Escalated", priority: "high" },
]

const ease = [0.23, 1, 0.32, 1] as const

const heroStats = [
  { value: "2", label: "channels supported" },
  { value: "Unified", label: "inbox view" },
  { value: "Real-time", label: "first reply" },
  { value: "AI-powered", label: "resolution" },
]

// Animated counter component for stats/metrics
const AnimatedCounter = memo(function AnimatedCounter({ value, suffix = "", prefix = "" }: { value: string; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-50px" })
  const [displayed, setDisplayed] = useState("0")

  useEffect(() => {
    if (!inView) return

    // Extract numeric part from value like "3.8s", "81%", "4.8/5", "19%"
    const numericMatch = value.match(/[\d.]+/)
    if (!numericMatch) {
      setDisplayed(value)
      return
    }

    const target = parseFloat(numericMatch[0])
    const isDecimal = value.includes(".")
    const afterNumber = value.slice(numericMatch.index! + numericMatch[0].length)
    const beforeNumber = value.slice(0, numericMatch.index!)
    const duration = 1200
    const startTime = performance.now()

    function update(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = target * eased

      if (isDecimal) {
        const decimals = (numericMatch![0].split(".")[1] || "").length
        setDisplayed(`${beforeNumber}${current.toFixed(decimals)}${afterNumber}`)
      } else {
        setDisplayed(`${beforeNumber}${Math.round(current)}${afterNumber}`)
      }

      if (progress < 1) {
        requestAnimationFrame(update)
      } else {
        setDisplayed(value)
      }
    }

    requestAnimationFrame(update)
  }, [inView, value])

  return (
    <span ref={ref}>
      {prefix}{displayed}{suffix}
    </span>
  )
})

export default function InboxPage() {
  // Refs for scroll-triggered sections
  const heroRef = useRef(null)
  const channelSectionRef = useRef(null)
  const featuresSectionRef = useRef(null)
  const ctaSectionRef = useRef(null)
  const inboxMockupRef = useRef(null)

  const heroInView = useInView(heroRef, { once: true, margin: "-100px" })
  const channelSectionInView = useInView(channelSectionRef, { once: true, margin: "-100px" })
  const featuresSectionInView = useInView(featuresSectionRef, { once: true, margin: "-100px" })
  const ctaInView = useInView(ctaSectionRef, { once: true, margin: "-100px" })
  const inboxInView = useInView(inboxMockupRef, { once: true, margin: "-50px" })

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-background to-surface-sunken" ref={heroRef}>
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-16 text-center sm:pt-32 sm:pb-20">
          <motion.div
            initial={{ opacity: 0 }}
            animate={heroInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, ease }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-4 py-1.5 text-sm text-muted-foreground"
          >
            <Inbox className="h-3.5 w-3.5" />
            Unified Inbox
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={heroInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.06, duration: 0.7, ease }}
            className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Two channels. Zero context-switching.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={heroInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.12, duration: 0.7, ease }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          >
            Email and Live Chat — all in a single view. Every thread has the full customer history, regardless of which channel it came from.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={heroInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.18, duration: 0.7, ease }}
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

      {/* Inbox mockup */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-6">
          <motion.div
            ref={inboxMockupRef}
              initial={{ opacity: 0 }}
              animate={heroInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.25, duration: 0.8, ease }}
              className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-[0_8px_40px_-12px_rgb(0_0_0/0.06)]"
            >
              {/* Toolbar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={inboxInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.4, duration: 0.5, ease }}
                className="flex items-center justify-between border-b border-border/40 px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <Inbox className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">All Channels</span>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={inboxInView ? { scale: 1 } : {}}
                    transition={{ delay: 0.7, type: "spring", stiffness: 500, damping: 20 }}
                    className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground"
                  >
                    338 open
                  </motion.span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1 rounded-lg border border-border/60 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary">
                    <Filter className="h-3 w-3" /> Filter
                  </button>
                  <button className="flex items-center gap-1 rounded-lg border border-border/60 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary">
                    <Tag className="h-3 w-3" /> Labels
                  </button>
                </div>
              </motion.div>
              {/* Channel pills */}
              <div className="flex gap-1.5 overflow-x-auto border-b border-border/40 px-4 py-2.5">
                {channels.map((ch, i) => (
                  <motion.button
                    key={ch.name}
                    layout
                    initial={{ opacity: 0 }}
                    animate={inboxInView ? { opacity: 1 } : {}}
                    transition={{
                      delay: 0.5 + i * 0.06,
                      type: "spring",
                      stiffness: 350,
                      damping: 20,
 }}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${ch.name === "Email" ? "bg-foreground text-background" : "border border-border/60 text-muted-foreground hover:bg-secondary"}`}
                  >
                    <ChannelIcon iconKey={ch.iconKey} className="h-3 w-3" />
                    {ch.name}
                    <span className="opacity-60">{ch.count}</span>
                  </motion.button>
                ))}
              </div>
              {/* Ticket list - tickets slide in from the left sequentially */}
              <div className="divide-y divide-border/40">
                {mockTickets.map((ticket, i) => (
                  <motion.div
                    key={ticket.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={inboxInView ? { opacity: 1 } : {}}
                    transition={{
                      delay: 0.7 + i * 0.1,
                      duration: 0.6,
                      ease,
 }}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-150 hover:bg-secondary/30"
                  >
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={inboxInView ? { scale: 1 } : {}}
                      transition={{
                        delay: 0.85 + i * 0.1,
                        type: "spring",
                        stiffness: 500,
                        damping: 20,
 }}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground"
                    >
                      {ticket.customer.split(" ").map(n => n[0]).join("")}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate">{ticket.customer}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{ticket.channel}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{ticket.subject}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{ticket.time}</span>
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={inboxInView ? { opacity: 1 } : {}}
                        transition={{
                          delay: 1.0 + i * 0.1,
                          type: "spring",
                          stiffness: 400,
                          damping: 15,
 }}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          ticket.status === "AI Resolved" ? "bg-emerald-500/10 text-emerald-600" :
                          ticket.status === "Escalated" ? "bg-destructive/10 text-destructive" :
                          "bg-amber-500/10 text-amber-600"
                        }`}
                      >
                        {ticket.status}
                      </motion.span>
                    </div>
                  </motion.div>
                ))}
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

      {/* Channel breakdown */}
      <section className="border-t border-border/40 py-24 md:py-32" ref={channelSectionRef}>
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="mb-14 grid grid-cols-1 gap-6 md:grid-cols-2 md:items-end">
            <div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={channelSectionInView ? { opacity: 1 } : {}}
                transition={{ duration: 0.6, ease }}
                className="text-[13px] font-medium text-accent mb-3"
              >
                Two channels
              </motion.p>
              <motion.h2
                initial={{ opacity: 0 }}
                animate={channelSectionInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.06, duration: 0.7, ease }}
                className="text-3xl md:text-[2.5rem] font-semibold tracking-[-0.03em] text-foreground"
              >
                Every place your customers message you.
              </motion.h2>
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={channelSectionInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.12, duration: 0.7, ease }}
              className="text-[15px] leading-relaxed text-muted-foreground md:text-right"
            >
              One agent handles all of them. The AI doesn't care which platform the message arrived on — it responds with full context either way.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {channels.map((ch, i) => (
              <motion.div
                key={ch.name}
                initial={{ opacity: 0 }}
                animate={channelSectionInView ? { opacity: 1 } : {}}
                transition={{
                  delay: 0.15 + i * 0.08,
                  duration: 0.6,
                  ease,
 }}
                className="group rounded-xl border border-border/60 bg-card p-7 transition-all duration-300 hover:border-border hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.08)]"
              >
                <div className="flex items-start justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${ch.bg}`}>
                    <ChannelIcon iconKey={ch.iconKey} className={`h-5 w-5 min-h-5 min-w-5 shrink-0 ${ch.color}`} />
                  </div>
                  {ch.badge && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={channelSectionInView ? { opacity: 1 } : {}}
                      transition={{ delay: 0.5 + i * 0.08, duration: 0.4, ease }}
                      className="rounded-full border border-border/60 bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
                    >
                      {ch.badge}
                    </motion.span>
                  )}
                </div>
                <p className="mt-4 text-base font-semibold text-foreground">{ch.name}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {ch.name === "Email" && "Connect any email address. Full thread history, drafts, and sends handled automatically."}
                  {ch.name === "Live Chat" && "Live Chat Widget API. Works at scale — no 24-hour window issues."}
                  {ch.name === "Live Chat" && "Embedded chat widget with cart-recovery triggers and proactive messaging."}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/40 py-24 md:py-32" ref={featuresSectionRef}>
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="mb-14">
            <motion.p
              initial={{ opacity: 0 }}
              animate={featuresSectionInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, ease }}
              className="text-[13px] font-medium text-accent mb-3"
            >
              Inbox features
            </motion.p>
            <motion.h2
              initial={{ opacity: 0 }}
              animate={featuresSectionInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.06, duration: 0.7, ease }}
              className="text-3xl md:text-[2.5rem] font-semibold tracking-[-0.03em] text-foreground"
            >
              Built for speed, not for clicking around.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={featuresSectionInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.12, duration: 0.7, ease }}
              className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted-foreground"
            >
              Every feature in the inbox is designed to reduce clicks and get agents to resolution faster.
            </motion.p>
          </div>
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-2 lg:items-center">
            <div className="flex flex-col gap-5">
              {[
                { iconKey: "User" as const, title: "Unified customer timeline", body: "See every interaction across every channel in a single chronological view. If a customer emailed three months ago then DMed today, you see the full history." },
                { iconKey: "Filter" as const, title: "Smart triage and routing", body: "Auto-assign by channel, keyword, product, or sentiment. VIP customers and high-value orders get routed to senior agents automatically." },
                { iconKey: "Tag" as const, title: "Labels and saved replies", body: "Tag tickets by type, product, or issue. Build a library of approved replies your team can use as templates or the AI can pull from." },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0 }}
                  animate={featuresSectionInView ? { opacity: 1 } : {}}
                  transition={{
                    delay: 0.15 + i * 0.12,
                    duration: 0.7,
                    ease,
 }}
                  className="group flex gap-5 rounded-xl border border-border/60 bg-card p-6 transition-all duration-300 hover:border-border hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.08)]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                    {item.iconKey === "User" && <User className="h-4.5 w-4.5 min-h-[18px] min-w-[18px] shrink-0 text-foreground" />}
                    {item.iconKey === "Filter" && <Filter className="h-4.5 w-4.5 min-h-[18px] min-w-[18px] shrink-0 text-foreground" />}
                    {item.iconKey === "Tag" && <Tag className="h-4.5 w-4.5 min-h-[18px] min-w-[18px] shrink-0 text-foreground" />}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={featuresSectionInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.2, duration: 0.8, ease }}
              className="rounded-xl border border-border/60 bg-card p-7 shadow-[0_8px_40px_-12px_rgb(0_0_0/0.06)]"
            >
              <motion.p
                initial={{ opacity: 0 }}
                animate={featuresSectionInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.35, duration: 0.5, ease }}
                className="mb-4 text-sm font-semibold text-foreground"
              >
                Inbox performance — last 30 days
              </motion.p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "First reply time", value: "Real-time", delta: "AI responds instantly", good: true },
                  { label: "AI resolution rate", value: "Tracked", delta: "Measured per channel", good: true },
                  { label: "Human escalations", value: "Monitored", delta: "Smart routing", good: true },
                  { label: "CSAT score", value: "Live", delta: "Customer feedback", good: true },
                ].map((metric, i) => (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0 }}
                    animate={featuresSectionInView ? { opacity: 1 } : {}}
                    transition={{
                      delay: 0.4 + i * 0.1,
                      duration: 0.6,
                      ease,
 }}
                    className="rounded-xl border border-border/60 bg-secondary/40 p-4"
                  >
                    <p className="text-xs text-muted-foreground">{metric.label}</p>
                    <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                      <AnimatedCounter value={metric.value} />
                    </p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={featuresSectionInView ? { opacity: 1 } : {}}
                      transition={{ delay: 0.8 + i * 0.1, duration: 0.5, ease }}
                      className="mt-0.5 text-[11px] font-medium text-emerald-600"
                    >
                      {metric.delta}
                    </motion.p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative border-t border-border/40 py-24 md:py-32" ref={ctaSectionRef}>
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-1/2 bottom-0 h-[400px] w-[600px] -translate-x-1/2 translate-y-1/4 rounded-full bg-accent/[0.03] blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-[1200px] px-6 text-center">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={ctaInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.7, ease }}
            className="text-3xl md:text-[2.5rem] font-semibold tracking-[-0.03em] text-foreground"
          >
            Consolidate every channel today.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={ctaInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.06, duration: 0.7, ease }}
            className="mx-auto mt-5 max-w-lg text-[17px] leading-relaxed text-muted-foreground"
          >
            Connect Email and Live Chat in under 10 minutes. No developer required.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={ctaInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.12, duration: 0.7, ease }}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            <Link href="/register"
                className="group inline-flex items-center gap-2 rounded-xl bg-foreground px-8 py-3.5 text-sm font-semibold text-background transition-all duration-200 hover:bg-foreground/90 hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.12)]"
              >
                Try free for 3 days
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link href="/integrations"
                className="inline-flex items-center gap-2 rounded-xl border border-border/60 px-8 py-3.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:text-foreground hover:border-border hover:bg-secondary"
              >
                See integrations
                <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
