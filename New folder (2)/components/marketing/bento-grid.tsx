"use client"

import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { useState, useEffect } from "react"

const ease = [0.23, 1, 0.32, 1] as const

/* ─── Mini product UI previews ───────────────────────────── */

const inboxTickets = [
  { name: "Sarah M.", ch: "\u{1F4E7}", msg: "Where is my order #4821?", time: "2m", ai: true },
  { name: "James L.", ch: "\u{1F4F7}", msg: "Want to return the blue hoodie", time: "5m", ai: true },
  { name: "Ana T.", ch: "\u{1F4AC}", msg: "Do you ship to Canada?", time: "8m", ai: false },
]

const tabs = ["All", "Email", "Email", "Chat"]

function InboxPreview() {
  const [inView, setInView] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [activeRow, setActiveRow] = useState(-1)

  useEffect(() => {
    if (!inView) return
    // Stagger rows appearing
    const timers: ReturnType<typeof setTimeout>[] = []
    inboxTickets.forEach((_, i) => {
      timers.push(setTimeout(() => setActiveRow(i), 400 + i * 300))
    })
    // Auto-cycle tabs
    let tabIdx = 0
    const tabTimer = setInterval(() => {
      tabIdx = (tabIdx + 1) % tabs.length
      setActiveTab(tabIdx)
    }, 3000)
    return () => {
      timers.forEach(clearTimeout)
      clearInterval(tabTimer)
    }
  }, [inView])

  return (
    <motion.div
      onViewportEnter={() => setInView(true)}
      viewport={{ once: true, margin: "-60px" }}
      className="h-full overflow-hidden rounded-lg border border-border/60 bg-background text-[11px]"
    >
      {/* Tab bar */}
      <div className="flex items-center gap-3 border-b border-border/40 px-4 py-2">
        {tabs.map((tab, i) => (
          <motion.span
            key={tab}
            animate={{
              backgroundColor: activeTab === i ? "var(--foreground)" : "transparent",
              color: activeTab === i ? "var(--background)" : "var(--muted-foreground)",
            }}
            transition={{ duration: 0.25 }}
            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
          >
            {tab}
          </motion.span>
        ))}
        <motion.span
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.3 }}
          className="ml-auto text-[10px] text-muted-foreground/40"
        >
          12 open
        </motion.span>
      </div>

      {/* Ticket rows */}
      <AnimatePresence>
        {inboxTickets.map((t, i) => (
          activeRow >= i && (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, ease }}
              className={`flex items-center gap-3 px-4 py-2.5 ${i === 0 ? "bg-secondary/30" : ""} ${i < 2 ? "border-b border-border/30" : ""}`}
            >
              <span className="text-[12px]">{t.ch}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-medium text-foreground">{t.name}</span>
                  {t.ai && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delatype: "spring", stiffness: 300, damping: 15 }}
                      className="rounded bg-emerald-500/10 px-1.5 py-px text-[9px] font-semibold text-emerald-600"
                    >
                      AI
                    </motion.span>
                  )}
                </div>
                <p className="truncate text-muted-foreground/60">{t.msg}</p>
              </div>
              <span className="shrink-0 text-[10px] text-muted-foreground/40">{t.time}</span>
            </motion.div>
          )
        ))}
      </AnimatePresence>
    </motion.div>
  )
}

function ShopifyPreview() {
  const [inView, setInView] = useState(false)
  const [showRefund, setShowRefund] = useState(false)
  const [refundDone, setRefundDone] = useState(false)

  useEffect(() => {
    if (!inView) return
    const t1 = setTimeout(() => setShowRefund(true), 1800)
    const t2 = setTimeout(() => setRefundDone(true), 3200)
    const t3 = setTimeout(() => {
      setShowRefund(false)
      setRefundDone(false)
    }, 6000)
    // Loop the animation
    const loop = setInterval(() => {
      setShowRefund(false)
      setRefundDone(false)
      setTimeout(() => setShowRefund(true), 1800)
      setTimeout(() => setRefundDone(true), 3200)
      setTimeout(() => {
        setShowRefund(false)
        setRefundDone(false)
      }, 6000)
    }, 7000)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearInterval(loop)
    }
  }, [inView])

  return (
    <motion.div
      onViewportEnter={() => setInView(true)}
      viewport={{ once: true, margin: "-60px" }}
      className="h-full overflow-hidden rounded-lg border border-border/60 bg-background p-4 text-[11px]"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5, ease }}
        className="flex items-center justify-between"
      >
        <span className="text-[12px] font-medium text-foreground">Order #4821</span>
        <motion.span
          animate={refundDone ? { backgroundColor: "rgb(239 68 68 / 0.1)" } : { backgroundColor: "rgb(16 185 129 / 0.1)" }}
          transition={{ duration: 0.3 }}
          className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
        >
          <motion.span
            animate={refundDone ? { color: "rgb(239 68 68)" } : { color: "rgb(5 150 105)" }}
            transition={{ duration: 0.3 }}
          >
            {refundDone ? "Refunded" : "Shipped"}
          </motion.span>
        </motion.span>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5, ease, delay: 0.15 }}
        className="mt-3 flex items-center gap-3 rounded-md bg-secondary/50 p-2.5"
      >
        <div className="h-8 w-8 rounded bg-secondary" />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium text-foreground">Blue Hoodie</p>
          <p className="text-muted-foreground/60">Size M · Qty 1</p>
        </div>
        <span className="text-[12px] font-medium text-foreground">$49</span>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5, ease, delay: 0.3 }}
        className="mt-3 flex gap-2 relative"
      >
        <motion.button
          animate={showRefund ? { scale: 1.05 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="flex-1 rounded-md bg-accent/10 py-1.5 text-[10px] font-semibold text-accent relative overflow-hidden"
        >
          {showRefund && !refundDone && (
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 1.2, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/10 to-transparent"
            />
          )}
          {refundDone ? "\u2713 Done" : "Refund"}
        </motion.button>
        <button
          className="flex-1 rounded-md bg-secondary py-1.5 text-[10px] font-medium text-muted-foreground"
        >
          Edit order
        </button>
      </motion.div>
    </motion.div>
  )
}

const aiMessages = [
  { role: "customer" as const, content: "Can I return my order? It doesn't fit." },
  { role: "ai" as const, content: "Of course! Your order #4821 is eligible for a free return within 30 days." },
]

function AIPreview() {
  const [inView, setInView] = useState(false)
  const [visibleMessages, setVisibleMessages] = useState(0)
  const [showSources, setShowSources] = useState(false)
  const [cycle, setCycle] = useState(0)

  useEffect(() => {
    if (!inView) return
    setVisibleMessages(0)
    setShowSources(false)

    const t1 = setTimeout(() => setVisibleMessages(1), 500)
    const t2 = setTimeout(() => setVisibleMessages(2), 2000)
    const t3 = setTimeout(() => setShowSources(true), 2800)

    // Re-cycle
    const loop = setTimeout(() => {
      setVisibleMessages(0)
      setShowSources(false)
      setCycle(c => c + 1)
    }, 8000)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(loop)
    }
  }, [inView, cycle])

  return (
    <motion.div
      onViewportEnter={() => setInView(true)}
      viewport={{ once: true, margin: "-60px" }}
      className="h-full overflow-hidden rounded-lg border border-border/60 bg-background text-[11px]"
    >
      <div className="space-y-2.5 p-4 min-h-[120px]">
        <AnimatePresence mode="popLayout">
          {visibleMessages >= 1 && (
            <motion.div
              key={`customer-${cycle}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, ease }}
              className="flex gap-2"
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[8px] font-bold text-muted-foreground">
                S
              </div>
              <div className="rounded-lg bg-secondary/60 px-3 py-2">
                <p className="text-foreground">{aiMessages[0].content}</p>
              </div>
            </motion.div>
          )}

          {visibleMessages >= 2 ? (
            <motion.div
              key={`ai-${cycle}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, ease }}
              className="flex gap-2"
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[8px] font-bold text-accent">
                AI
              </div>
              <div className="rounded-lg border border-accent/10 bg-accent/[0.03] px-3 py-2">
                <p className="text-foreground">{aiMessages[1].content}</p>
              </div>
            </motion.div>
          ) : visibleMessages >= 1 ? (
            <motion.div
              key={`typing-${cycle}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex gap-2"
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[8px] font-bold text-accent">
                AI
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-accent/10 bg-accent/[0.03] px-3 py-2.5">
                {[0, 1, 2].map((d) => (
                  <motion.div
                    key={d}
                    className="h-1 w-1 rounded-full bg-accent/40"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: d * 0.15 }}
                  />
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Sources bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={showSources ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5, ease }}
        className="overflow-hidden"
      >
        <div className="flex items-center gap-2 border-t border-border/40 bg-secondary/20 px-4 py-2">
          <span className="text-[9px] text-muted-foreground/50">Sources:</span>
          {["Return policy", "Order #4821"].map((src, i) => (
            <motion.span
              key={src}
              initial={{ opacity: 0.8 }}
              animate={showSources ? { opacity: 1 } : {}}
              transition={{ delay: i * 0.15, type: "spring", stiffness: 300, damping: 15 }}
              className="rounded border border-border/40 bg-background px-1.5 py-0.5 text-[9px] text-muted-foreground"
            >
              {src}
            </motion.span>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

const rules = [
  { type: "IF", text: "Channel is Email", color: "text-foreground/80 bg-foreground/5" },
  { type: "AND", text: 'Contains "return"', color: "text-amber-600 bg-amber-500/10" },
  { type: "THEN", text: "Assign to AI Agent", color: "text-emerald-600 bg-emerald-500/10" },
]

function AutomationPreview() {
  const [inView, setInView] = useState(false)
  const [visibleRules, setVisibleRules] = useState(0)
  const [showStatus, setShowStatus] = useState(false)
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    if (!inView) return
    const timers = rules.map((_, i) =>
      setTimeout(() => setVisibleRules(i + 1), 500 + i * 500)
    )
    const t1 = setTimeout(() => setShowStatus(true), 2200)
    const t2 = setTimeout(() => setPulse(true), 2600)

    // Pulse loop
    const pulseLoop = setInterval(() => {
      setPulse(false)
      setTimeout(() => setPulse(true), 100)
    }, 3000)

    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(t1)
      clearTimeout(t2)
      clearInterval(pulseLoop)
    }
  }, [inView])

  return (
    <motion.div
      onViewportEnter={() => setInView(true)}
      viewport={{ once: true, margin: "-60px" }}
      className="h-full overflow-hidden rounded-lg border border-border/60 bg-background p-4 text-[11px]"
    >
      <div className="space-y-1.5">
        {rules.map((rule, i) => (
          <div key={i}>
            {i > 0 && (
              <motion.div
                initial={{ scaleY: 0 }}
                animate={visibleRules > i ? { scaleY: 1 } : { scaleY: 0 }}
                transition={{ duration: 0.2 }}
                style={{ transformOrigin: "top" }}
                className="ml-[18px] h-2 w-px bg-border"
              />
            )}
            <motion.div
              initial={{ opacity: 0 }}
              animate={visibleRules > i ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, ease }}
              className="flex items-center gap-2.5"
            >
              <span className={`w-[38px] shrink-0 rounded px-1.5 py-0.5 text-center text-[9px] font-bold ${rule.color}`}>
                {rule.type}
              </span>
              <span className="text-[12px] text-foreground">{rule.text}</span>
            </motion.div>
          </div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={showStatus ? { opacity: 1 } : {}}
        transition={{ duration: 0.5, ease }}
        className="mt-4 flex items-center justify-between rounded-md bg-secondary/40 px-3 py-2"
      >
        <span className="text-[10px] text-muted-foreground/60">Fires in &lt; 100ms</span>
        <span className="relative rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-600">
          {pulse && (
            <motion.span
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 rounded-full bg-emerald-500/20"
            />
          )}
          Active
        </span>
      </motion.div>
    </motion.div>
  )
}

function LiveChatPreview() {
  const [inView, setInView] = useState(false)
  const [showTrigger, setShowTrigger] = useState(false)
  const [showMsg1, setShowMsg1] = useState(false)
  const [showMsg2, setShowMsg2] = useState(false)
  const [cycle, setCycle] = useState(0)

  useEffect(() => {
    if (!inView) return
    setShowTrigger(false)
    setShowMsg1(false)
    setShowMsg2(false)

    const t1 = setTimeout(() => setShowTrigger(true), 400)
    const t2 = setTimeout(() => setShowMsg1(true), 1200)
    const t3 = setTimeout(() => setShowMsg2(true), 2200)

    const loop = setTimeout(() => {
      setShowTrigger(false)
      setShowMsg1(false)
      setShowMsg2(false)
      setCycle(c => c + 1)
    }, 7000)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(loop)
    }
  }, [inView, cycle])

  return (
    <motion.div
      onViewportEnter={() => setInView(true)}
      viewport={{ once: true, margin: "-60px" }}
      className="h-full overflow-hidden rounded-lg border border-border/60 bg-background text-[11px]"
    >
      <motion.div
        animate={{ opacity: showTrigger ? 1 : 0 }}
        initial={{ opacity: 0 }}
        transition={{ duration: 0.5, ease }}
        className="overflow-hidden border-b border-border/40 bg-amber-500/[0.04]"
      >
        <motion.div
          animate={{ opacity: showTrigger ? 1 : 0 }}
          transition={{ duration: 0.5, ease }}
          className="px-4 py-2"
        >
          <span className="text-[10px] font-medium text-amber-700">
            \u26A1 Trigger: Cart &gt; $150 + idle 60s
          </span>
        </motion.div>
      </motion.div>
      <div className="space-y-2 p-4 min-h-[108px]">
        <AnimatePresence>
          {showMsg1 && (
            <motion.div
              key={`msg1-${cycle}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, ease }}
              className="ml-auto w-fit rounded-lg bg-accent px-3 py-2 text-white"
            >
              Still deciding? Here&apos;s 10% off your order
            </motion.div>
          )}
          {showMsg2 && (
            <motion.div
              key={`msg2-${cycle}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, ease }}
              className="ml-auto w-fit rounded-lg bg-accent/90 px-3 py-2 text-[10px] text-white"
            >
              Code: <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="font-semibold underline"
              >
                SAVE10
              </motion.span> — auto-applied at checkout
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

const statsData = [
  { label: "Resolution", value: 80, suffix: "%" },
  { label: "Avg reply", value: 4, suffix: "s" },
  { label: "CSAT", value: 97, suffix: "%" },
]

const barHeights = [35, 50, 40, 60, 75, 65, 80, 85, 70, 82, 90, 80]

function AnimatedCounter({ value, suffix, inView }: { value: number; suffix: string; inView: boolean }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) return
    let start = 0
    const duration = 1200
    const step = 16
    const increment = value / (duration / step)
    const timer = setInterval(() => {
      start += increment
      if (start >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, step)
    return () => clearInterval(timer)
  }, [inView, value])

  return <>{count}{suffix}</>
}

function AnalyticsPreview() {
  const [inView, setInView] = useState(false)

  return (
    <motion.div
      onViewportEnter={() => setInView(true)}
      viewport={{ once: true, margin: "-60px" }}
      className="h-full overflow-hidden rounded-lg border border-border/60 bg-background p-4 text-[11px]"
    >
      <div className="grid grid-cols-3 gap-3">
        {statsData.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.2 + i * 0.15, duration: 0.5, ease }}
          >
            <p className="text-[10px] text-muted-foreground/50">{s.label}</p>
            <p className="text-lg font-semibold tracking-tight text-foreground">
              <AnimatedCounter value={s.value} suffix={s.suffix} inView={inView} />
            </p>
          </motion.div>
        ))}
      </div>
      <div className="mt-3 flex items-end gap-[3px] h-10">
        {barHeights.map((h, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, height: "8%" }}
            animate={inView ? { opacity: 1, height: `${h}%` } : { opacity: 0, height: "8%" }}
            transition={{
              delay: 0.6 + i * 0.06,
              duration: 0.5,
              ease,
            }}
            className="flex-1 rounded-sm bg-accent/20"
          />
        ))}
      </div>
    </motion.div>
  )
}

/* ─── Feature data ───────────────────────────────────────── */

const features = [
  {
    eyebrow: "Unified inbox",
    title: "Two channels, one place.",
    description:
      "Email and Live Chat \u2014 all in a single view.",
    href: "/features/inbox",
    preview: InboxPreview,
    span: "lg:col-span-2",
  },
  {
    eyebrow: "Shopify integration",
    title: "Refund without leaving the ticket.",
    description:
      "Real-time order lookups, one-click refunds, address changes, cancellations.",
    href: "/features/shopify",
    preview: ShopifyPreview,
    span: "",
  },
  {
    eyebrow: "AI agent",
    title: "Trained on your policies.",
    description:
      "Upload your return policy. The AI references your exact rules in every reply.",
    href: "/features/ai-agent",
    preview: AIPreview,
    span: "",
  },
  {
    eyebrow: "Automation",
    title: "Rules, not code.",
    description:
      "Route, tag, and assign tickets automatically with a visual rule builder.",
    href: "/features/macros",
    preview: AutomationPreview,
    span: "",
  },
  {
    eyebrow: "Live chat",
    title: "Catch them before they leave.",
    description:
      "Trigger messages based on cart value, page time, or abandonment signals.",
    href: "/features/live-chat",
    preview: LiveChatPreview,
    span: "",
  },
  {
    eyebrow: "Analytics",
    title: "Every metric, live.",
    description:
      "AI resolution rate, first reply time, CSAT \u2014 no warehouse, no setup.",
    href: "/features/analytics",
    preview: AnalyticsPreview,
    span: "",
  },
]

/* ─── Component ──────────────────────────────────────────── */

export function BentoGrid() {
  return (
    <section id="features" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-[1200px] px-6">
        {/* Section header */}
        <div className="mb-14">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease }}
            className="mb-3 text-[13px] font-medium text-accent"
          >
            Features
          </motion.p>
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease }}
            className="max-w-md text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-[2.5rem]"
          >
            Built for e-commerce support.
          </motion.h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.06, duration: 0.5, ease }}
              className={`group ${f.span}`}
            >
              <Link href={f.href} className="block h-full">
                <div className="flex h-full flex-col rounded-xl border border-border/60 bg-card p-6 transition-all duration-200 hover:border-border hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.08)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent/70">
                    {f.eyebrow}
                  </p>
                  <h3 className="mt-2 text-[16px] font-semibold tracking-tight text-foreground">
                    {f.title}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                    {f.description}
                  </p>
                  <div className="mt-auto h-[190px] overflow-hidden">
                    <f.preview />
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-[12px] font-medium text-accent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    Learn more <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
