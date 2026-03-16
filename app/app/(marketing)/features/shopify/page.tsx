"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { motion, useInView } from "framer-motion"
import { ArrowRight, ShoppingCart, Package, ChevronRight, CheckCircle2 } from "lucide-react"

/* ─── Constants ─────────────────────────────────────────────── */

const EASE = [0.23, 1, 0.32, 1] as const

const actions = [
  { iconKey: "RefreshCw" as const, label: "Issue refund", time: "1 click", desc: "Full or partial refund processed instantly via Shopify. Customer gets a confirmation email automatically." },
  { iconKey: "Package" as const, label: "Cancel order", time: "1 click", desc: "Cancel any unfulfilled order before it ships. Stock is automatically restocked." },
  { iconKey: "MapPin" as const, label: "Update address", time: "1 click", desc: "Change the shipping address on any order that hasn't left the warehouse yet." },
]

const iconSvgProps = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", width: 20, height: 20, style: { display: "block", flexShrink: 0 } } as const

function ActionIcon({ iconKey, className }: { iconKey: "RefreshCw" | "Package" | "MapPin"; className?: string }) {
  const c = className ?? ""
  if (iconKey === "RefreshCw") {
    return (
      <svg className={c} {...iconSvgProps} aria-hidden>
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
        <path d="M8 16H3v5" />
      </svg>
    )
  }
  if (iconKey === "Package") {
    return (
      <svg className={c} {...iconSvgProps} aria-hidden>
        <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
        <path d="M12 22V12" />
        <polyline points="3.29 7 12 12 20.71 7" />
        <path d="m7.5 4.27 9 5.15" />
      </svg>
    )
  }
  return (
    <svg className={c} {...iconSvgProps} aria-hidden>
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

const orderCard = {
  id: "#58291",
  customer: "Sarah M.",
  email: "sarah.m@example.com",
  items: [{ name: "Alpine Jacket — Large", price: "$189.00", qty: 1 }],
  status: "Shipped",
  tracking: "1Z8E9V4A03",
  carrier: "UPS",
  eta: "Wed Mar 5",
  total: "$189.00",
}

const apiTraceLines = [
  { text: "// Fetching order #58291", className: "text-muted-foreground", indent: false },
  { text: "GET /admin/api/orders/58291.json", className: "text-accent", indent: false },
  { text: "// Response:", className: "text-muted-foreground", indent: false },
  { text: "{", className: "text-foreground/80", indent: false },
  { text: '"order_number": 58291,', className: "text-foreground/80", indent: true },
  { text: '"fulfillment_status": "shipped",', className: "text-foreground/80", indent: true },
  { text: '"tracking_number": "1Z8E9V4A03",', className: "text-foreground/80", indent: true },
  { text: '"estimated_delivery": "2026-03-05"', className: "text-foreground/80", indent: true },
  { text: "}", className: "text-foreground/80", indent: false },
]

/* ─── Animated counter hook ─────────────────────────────────── */

function useAnimatedPrice(target: number, shouldStart: boolean) {
  const [display, setDisplay] = useState("$0.00")

  useEffect(() => {
    if (!shouldStart) return
    let frame: number
    const start = performance.now()
    const duration = 1200

    function tick() {
      const elapsed = performance.now() - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const value = target * eased
      setDisplay(`$${value.toFixed(2)}`)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [shouldStart, target])

  return display
}

/* ─── Typing line component ─────────────────────────────────── */

function TypedLine({
  text,
  className,
  indent,
  delay,
  inView,
}: {
  text: string
  className: string
  indent: boolean
  delay: number
  inView: boolean
}) {
  const [displayed, setDisplayed] = useState("")
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (!inView) return
    const timeout = setTimeout(() => setStarted(true), delay * 1000)
    return () => clearTimeout(timeout)
  }, [inView, delay])

  useEffect(() => {
    if (!started) return
    let i = 0
    const interval = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) clearInterval(interval)
    }, 18)
    return () => clearInterval(interval)
  }, [started, text])

  return (
    <p className={`${className} ${indent ? "pl-4" : ""}`}>
      {displayed}
      {started && displayed.length < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ repeat: Infinity, duration: 0.6 }}
          className="inline-block w-[6px] h-[14px] bg-accent ml-0.5 align-middle"
        />
      )}
    </p>
  )
}

/* ─── Main page ─────────────────────────────────────────────── */

export default function ShopifyPage() {
  /* ── Scroll-trigger refs ── */
  const heroRef = useRef<HTMLDivElement>(null)
  const actionsRef = useRef<HTMLDivElement>(null)
  const syncRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  const heroInView = useInView(heroRef, { once: true, margin: "-80px" })
  const actionsInView = useInView(actionsRef, { once: true, margin: "-80px" })
  const syncInView = useInView(syncRef, { once: true, margin: "-80px" })
  const ctaInView = useInView(ctaRef, { once: true, margin: "-80px" })

  /* ── Order card animation states ── */
  const [cardReady, setCardReady] = useState(false)
  const animatedPrice = useAnimatedPrice(189.0, cardReady)

  useEffect(() => {
    if (heroInView) {
      const t = setTimeout(() => setCardReady(true), 500)
      return () => clearTimeout(t)
    }
  }, [heroInView])

  return (
    <div className="bg-background">
      {/* ═══════════════════════════ Hero ═══════════════════════════ */}
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-background to-surface-sunken" ref={heroRef}>
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-16 text-center sm:pt-32 sm:pb-20">
          <motion.div
            initial={{ opacity: 0 }}
            animate={heroInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, ease: EASE }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-4 py-1.5 text-sm text-muted-foreground"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Shopify Integration
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={heroInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.7, ease: EASE, delay: 0.06 }}
            className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Your Shopify admin, inside the ticket.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={heroInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.7, ease: EASE, delay: 0.12 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          >
            Issue refunds, cancel orders, edit addresses, and apply discounts — all without leaving the inbox. Real-time order data appears in every ticket automatically.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={heroInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.7, ease: EASE, delay: 0.18 }}
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

      {/* Order card mockup */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-xl px-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={heroInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
            className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-xl shadow-black/[0.03]"
            >
              {/* Header with animated badge */}
              <div className="border-b border-border/60 px-5 py-3.5 flex items-center justify-between">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={cardReady ? { opacity: 1 } : {}}
                  transition={{ duration: 0.5, ease: EASE }}
                >
                  <p className="text-sm font-semibold text-foreground">Order {orderCard.id}</p>
                  <p className="text-xs text-muted-foreground">{orderCard.customer} · {orderCard.email}</p>
                </motion.div>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={cardReady ? { opacity: 1 } : {}}
                  transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.3 }}
                  className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600"
                >
                  {orderCard.status}
                </motion.span>
              </div>

              {/* Product row sliding in */}
              <div className="px-5 py-4 border-b border-border/60">
                {orderCard.items.map((item) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0 }}
                    animate={cardReady ? { opacity: 1 } : {}}
                    transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={cardReady ? { rotate: 0 } : {}}
                        transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.25 }}
                        className="h-10 w-10 rounded-lg border border-border/60 bg-secondary flex items-center justify-center"
                      >
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </motion.div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.qty}</p>
                      </div>
                    </div>
                    {/* Price counting up */}
                    <p className="text-sm font-semibold text-foreground">
                      {animatedPrice}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Shipping info grid */}
              <div className="px-5 py-4 border-b border-border/60 grid grid-cols-3 gap-3">
                {[
                  { label: "Carrier", value: orderCard.carrier },
                  { label: "ETA", value: orderCard.eta },
                  { label: "Tracking", value: orderCard.tracking, accent: true },
                ].map((field, i) => (
                  <motion.div
                    key={field.label}
                    initial={{ opacity: 0 }}
                    animate={cardReady ? { opacity: 1 } : {}}
                    transition={{ duration: 0.5, ease: EASE, delay: 0.4 + i * 0.08 }}
                  >
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{field.label}</p>
                    <p className={`mt-1 text-sm font-semibold ${field.accent ? "text-accent" : "text-foreground"}`}>{field.value}</p>
                  </motion.div>
                ))}
              </div>

              {/* Quick actions with staggered spring bounce */}
              <div className="px-5 py-3.5">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={cardReady ? { opacity: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.55 }}
                  className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Quick actions
                </motion.p>
                <div className="flex flex-wrap gap-2">
                  {["Refund", "Cancel", "Edit address", "Store credit"].map((action, i) => (
                    <motion.button
                      key={action}
                      initial={{ opacity: 0 }}
                      animate={cardReady ? { opacity: 1 } : {}}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 17,
                        delay: 0.65 + i * 0.08,
 }}
                      className="rounded-lg border border-border/60 bg-secondary/50 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                    >
                      {action}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
        </div>
      </section>

      {/* ═══════════════════════ One-click actions ══════════════════ */}
      <section className="relative border-t border-border/40 py-24 md:py-32" ref={actionsRef}>
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute right-1/4 top-1/2 h-[400px] w-[500px] -translate-y-1/2 rounded-full bg-accent/[0.02] blur-[80px]" />
        </div>
        <div className="relative mx-auto max-w-[1200px] px-6">
          <div className="mb-14 max-w-xl">
            <motion.p
              initial={{ opacity: 0 }}
              animate={actionsInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, ease: EASE }}
              className="mb-3 text-[13px] font-semibold uppercase tracking-widest text-accent"
            >
              One-click actions
            </motion.p>
            <motion.h2
              initial={{ opacity: 0 }}
              animate={actionsInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, ease: EASE, delay: 0.06 }}
              className="text-3xl md:text-[2.5rem] font-semibold tracking-[-0.03em] leading-[1.12] text-foreground"
            >
              Stop copying order IDs into Shopify admin.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={actionsInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, ease: EASE, delay: 0.12 }}
              className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted-foreground"
            >
              Every Shopify action is available directly in the ticket. Your agents stay in one tab. The AI can trigger any of these autonomously based on your policies.
            </motion.p>
          </div>

          {/* Feature cards with stagger + hover */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {actions.map((action, i) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0 }}
                animate={actionsInView ? { opacity: 1 } : {}}
                transition={{
                  duration: 0.6,
                  ease: EASE,
                  delay: 0.15 + i * 0.07,
 }}
                className="group rounded-xl border border-border/60 bg-card p-7 transition-all duration-300 hover:border-border hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.08)]"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary transition-colors duration-300 group-hover:bg-accent/10">
                    <ActionIcon iconKey={action.iconKey} className="h-5 w-5 min-h-5 min-w-5 shrink-0 text-foreground transition-colors duration-300 group-hover:text-accent" />
                  </div>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={actionsInView ? { opacity: 1 } : {}}
                    transition={{ duration: 0.5, ease: EASE, delay: 0.3 + i * 0.07 }}
                    className="rounded-lg bg-secondary px-2.5 py-1 text-[11px] font-semibold text-muted-foreground"
                  >
                    {action.time}
                  </motion.span>
                </div>
                <p className="text-sm font-semibold text-foreground">{action.label}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{action.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ Data sync ══════════════════════════ */}
      <section className="relative border-t border-border/40 py-24 md:py-32" ref={syncRef}>
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-1/3 bottom-0 h-[350px] w-[500px] rounded-full bg-accent/[0.02] blur-[80px]" />
        </div>
        <div className="relative mx-auto max-w-[1200px] px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={syncInView ? { opacity: 1 } : {}}
                transition={{ duration: 0.6, ease: EASE }}
                className="mb-3 text-[13px] font-semibold uppercase tracking-widest text-accent"
              >
                Live sync
              </motion.p>
              <motion.h2
                initial={{ opacity: 0 }}
                animate={syncInView ? { opacity: 1 } : {}}
                transition={{ duration: 0.6, ease: EASE, delay: 0.06 }}
                className="text-3xl md:text-[2.5rem] font-semibold tracking-[-0.03em] leading-[1.12] text-foreground"
              >
                Real-time.{" "}
                <span className="bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent">Not cached.</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={syncInView ? { opacity: 1 } : {}}
                transition={{ duration: 0.6, ease: EASE, delay: 0.12 }}
                className="mt-3 text-[15px] leading-relaxed text-muted-foreground"
              >
                When a customer asks &quot;where&apos;s my order&quot;, the AI fetches the live status from Shopify at the moment of reply — not from a snapshot from an hour ago.
              </motion.p>
              <div className="mt-8 flex flex-col gap-3">
                {["Orders & fulfillment status", "Customer profiles & order history", "Product catalog & inventory", "Refund and payment records", "Shipping carrier tracking data"].map((item, i) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0 }}
                    animate={syncInView ? { opacity: 1 } : {}}
                    transition={{
                      duration: 0.5,
                      ease: EASE,
                      delay: 0.2 + i * 0.06,
 }}
                    className="flex items-center gap-3"
                  >
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={syncInView ? { scale: 1 } : {}}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 20,
                        delay: 0.35 + i * 0.06,
 }}
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    </motion.div>
                    <span className="text-sm text-foreground">{item}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* API trace with typing animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={syncInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
              className="rounded-xl border border-border/60 bg-card p-7 shadow-xl shadow-black/[0.03]"
            >
              <div className="flex items-center justify-between mb-4">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={syncInView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="text-sm font-semibold text-foreground"
                >
                  API call trace
                </motion.p>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={syncInView ? { opacity: 1 } : {}}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    delay: 0.4 + apiTraceLines.length * 0.15,
 }}
                  className="font-mono text-[11px] text-emerald-600"
                >
                  200 OK · 48ms
                </motion.span>
              </div>
              <div className="rounded-xl bg-secondary/60 p-4 font-mono text-[12px] leading-relaxed space-y-0.5">
                {apiTraceLines.map((line, i) => {
                  const isGap = i === 1 || i === 2
                  return (
                    <div key={i} className={isGap ? "mt-2" : i === 3 ? "mt-3" : ""}>
                      <TypedLine
                        text={line.text}
                        className={line.className}
                        indent={line.indent}
                        delay={0.4 + i * 0.18}
                        inView={syncInView}
                      />
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ CTA ════════════════════════════════ */}
      <section className="relative border-t border-border/40 py-24 md:py-32" ref={ctaRef}>
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/[0.03] blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-[1200px] px-6 text-center">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={ctaInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.7, ease: EASE }}
            className="text-3xl md:text-[2.5rem] font-semibold tracking-[-0.03em] leading-[1.12] text-foreground"
          >
            Connect Shopify in one click.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={ctaInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.7, ease: EASE, delay: 0.08 }}
            className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground"
          >
            OAuth install via the official Shopify App. No developer, no API keys, no configuration.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={ctaInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.7, ease: EASE, delay: 0.16 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link href="/register"
                className="group inline-flex items-center gap-2 rounded-lg bg-foreground px-8 py-3.5 text-sm font-semibold text-background transition-all duration-200 hover:bg-foreground/90 hover:shadow-lg hover:shadow-foreground/10"
              >
                Install from Shopify App Store
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
