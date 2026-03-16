"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import {
  motion,
  useInView,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion"
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Zap,
  ChevronRight,
} from "lucide-react"

/* ─── Standard ease curve ─── */
const EASE = [0.23, 1, 0.32, 1] as const

/* ─── Shared transition presets ─── */
const sectionTransition = { duration: 0.7, ease: EASE }
const staggerChildren = { staggerChildren: 0.1 }
const springTransition = { type: "spring", stiffness: 100, damping: 16, mass: 0.8 }

/* ─── Data ─── */
const capabilities = [
  {
    label: "Reads live order data",
    detail:
      "Fetches real Shopify orders in milliseconds. Knows what was ordered, when it shipped, and whether it's been delivered.",
  },
  {
    label: "References your exact policies",
    detail:
      "Paste your policies or add Help Center articles. The AI cites your return policy and knowledge base — no hallucinations.",
  },
  {
    label: "Sends actual replies",
    detail:
      "Doesn't just draft — it sends. Across Email and Live Chat simultaneously.",
  },
  {
    label: "Knows when to escalate",
    detail:
      "If a situation needs a human, the AI flags it, summarizes the context, and routes to the right agent automatically.",
  },
  {
    label: "Powered by your knowledge base",
    detail:
      "Add your policies, FAQs, and product info to the Help Center. The AI uses RAG to reference your exact content in every reply.",
  },
  {
    label: "Runs 24/7, zero latency",
    detail:
      "The median reply time is 4 seconds. Customers at 2 AM get an instant answer, not an autoresponder.",
  },
]

const stats = [
  {
    value: "Up to 80%",
    numericValue: 80,
    suffix: "%",
    label: "potential AI resolution rate",
    sub: "depends on ticket complexity",
  },
  {
    value: "< 5s",
    numericValue: 5,
    suffix: "s",
    label: "typical AI response time",
    sub: "vs. hours for manual replies",
  },
  {
    value: "24/7",
    numericValue: 24,
    suffix: "/7",
    label: "availability",
    sub: "no staffing required",
  },
]

const sampleTicket = {
  customer: "Sarah M.",
  channel: "Email",
  time: "2:14 AM",
  message:
    "Hi, I ordered the wrong size on my jacket (order #58291). Can I exchange it for a medium? I need it before Thursday.",
  aiReply: `Hi Sarah,\n\nI checked order #58291 — your Large jacket shipped yesterday and is arriving Wednesday via UPS (tracking: 1Z8E9V4A). That gives us a tight window, but here's what I can do:\n\nI've flagged your order for our warehouse team to intercept and exchange to a Medium if it hasn't left the distribution center yet. You'll get a confirmation email within the hour.\n\nIf the exchange isn't possible in time, I'll email you a prepaid return label the moment it delivers, and we'll rush the Medium to you with free 2-day shipping.\n\nEither way, you're covered. — Replyma AI for Lumina`,
  tags: ["Order Exchange", "Urgent", "Shopify #58291"],
}

const howItWorks = [
  { iconKey: "ShoppingCart" as const, title: "Live Shopify data", body: "Every reply is grounded in the actual order: status, tracking number, items, delivery window, and past interactions. No guessing." },
  { iconKey: "FileText" as const, title: "Your knowledge base", body: "Policies, FAQs, product details — the AI retrieves the exact relevant passage before responding. RAG means no hallucinated policies." },
  { iconKey: "MessageSquare" as const, title: "Full conversation context", body: "The AI reads the entire thread, not just the last message. It understands escalation patterns and picks up exactly where any previous exchange left off." },
]

const iconSvgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  width: 20,
  height: 20,
  style: { display: "block", flexShrink: 0 },
} as const

function HowItWorksIcon({ iconKey, className }: { iconKey: "ShoppingCart" | "FileText" | "MessageSquare"; className?: string }) {
  const c = className ?? ""
  if (iconKey === "ShoppingCart") {
    return (
      <svg className={c} {...iconSvgProps} aria-hidden>
        <circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
      </svg>
    )
  }
  if (iconKey === "FileText") {
    return (
      <svg className={c} {...iconSvgProps} aria-hidden>
        <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
        <path d="M14 2v5a1 1 0 0 0 1 1h5" />
        <path d="M10 9H8" />
        <path d="M16 13H8" />
        <path d="M16 17H8" />
      </svg>
    )
  }
  return (
    <svg className={c} {...iconSvgProps} aria-hidden>
      <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" />
    </svg>
  )
}

/* ─── Animated counter component ─── */
function AnimatedCounter({
  target,
  suffix,
  duration = 2,
}: {
  target: number
  suffix: string
  duration?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })
  const motionVal = useMotionValue(0)
  const rounded = useTransform(motionVal, (v) => Math.round(v))
  const [display, setDisplay] = useState("0")

  useEffect(() => {
    if (!isInView) return
    const controls = animate(motionVal, target, {
      duration,
      ease: EASE as unknown as [number, number, number, number],
    })
    const unsub = rounded.on("change", (v) => setDisplay(String(v)))
    return () => {
      controls.stop()
      unsub()
    }
  }, [isInView, target, duration, motionVal, rounded])

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  )
}

/* ─── Typing indicator dots ─── */
function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/10">
        <Bot className="h-3 w-3 text-accent" />
      </div>
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="inline-block h-1.5 w-1.5 rounded-full bg-accent/60"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.15, 0.85] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
 }}
          />
        ))}
        <span className="ml-1.5 text-[11px] text-muted-foreground">
          AI is typing...
        </span>
      </div>
    </div>
  )
}

/* ─── Ticket mockup with sequential message reveals (no layout shift) ─── */
function TicketMockup() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-60px" })

  const [phase, setPhase] = useState<
    "idle" | "header" | "customer" | "typing" | "ai" | "resolved"
  >("idle")

  useEffect(() => {
    if (!isInView) return
    const timers: ReturnType<typeof setTimeout>[] = []

    timers.push(setTimeout(() => setPhase("header"), 200))
    timers.push(setTimeout(() => setPhase("customer"), 700))
    timers.push(setTimeout(() => setPhase("typing"), 1600))
    timers.push(setTimeout(() => setPhase("ai"), 3200))
    timers.push(setTimeout(() => setPhase("resolved"), 4000))

    return () => timers.forEach(clearTimeout)
  }, [isInView])

  const show = (minPhase: typeof phase) => {
    const order = ["idle", "header", "customer", "typing", "ai", "resolved"]
    return order.indexOf(phase) >= order.indexOf(minPhase)
  }

  /* All content is always rendered to prevent layout shifts.
     We use opacity to reveal sections instead of conditional rendering. */
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.16, ease: EASE }}
      className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-[0_8px_40px_-12px_rgb(0_0_0/0.06)]"
    >
      {/* Header — always rendered, opacity controlled */}
      <motion.div
        animate={{ opacity: show("header") ? 1 : 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="flex items-center justify-between border-b border-border/40 px-5 py-4"
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ scale: show("header") ? 1 : 0 }}
            transition={{ ...springTransition, delay: 0.1 }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10"
          >
            <span className="text-xs font-semibold text-accent">SM</span>
          </motion.div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {sampleTicket.customer}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {sampleTicket.channel} · {sampleTicket.time}
            </p>
          </div>
        </div>
        <div className="hidden gap-1.5 sm:flex">
          {sampleTicket.tags.map((tag, i) => (
            <motion.span
              key={tag}
              animate={{ opacity: show("header") ? 1 : 0, scale: show("header") ? 1 : 0.8 }}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.08, ease: EASE }}
              className="rounded-full border border-border/60 bg-secondary/50 px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground"
            >
              {tag}
            </motion.span>
          ))}
        </div>
      </motion.div>

      {/* Customer message — always rendered */}
      <motion.div
        animate={{ opacity: show("customer") ? 1 : 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="border-b border-border/40 px-5 py-4"
      >
        <div className="rounded-xl bg-secondary/40 px-4 py-3">
          <p className="text-sm leading-relaxed text-foreground">
            {sampleTicket.message}
          </p>
        </div>
      </motion.div>

      {/* AI reply area — always rendered */}
      <div className="px-5 py-4">
        {/* Typing indicator (overlay, absolute so no layout shift) */}
        <motion.div
          animate={{ opacity: show("typing") && !show("ai") ? 1 : 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className={show("ai") ? "hidden" : ""}
        >
          <TypingIndicator />
        </motion.div>

        {/* AI reply — always in DOM */}
        <motion.div
          animate={{ opacity: show("ai") ? 1 : 0 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <div className="mb-3 flex items-center gap-2">
            <motion.div
              animate={{ scale: show("ai") ? 1 : 0 }}
              transition={springTransition}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/10"
            >
              <Bot className="h-3 w-3 text-accent" />
            </motion.div>
            <motion.span
              animate={{ opacity: show("ai") ? 1 : 0, x: show("ai") ? 0 : -8 }}
              transition={{ duration: 0.4, delay: 0.1, ease: EASE }}
              className="text-[11px] font-semibold text-accent"
            >
              Replyma AI · replied in 3.8s
            </motion.span>
            <motion.span
              animate={{ opacity: show("resolved") ? 1 : 0, scale: show("resolved") ? 1 : 0.6 }}
              transition={{ ...springTransition, delay: 0.2 }}
              className="ml-auto flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600"
            >
              <CheckCircle2 className="h-3 w-3" />
              Resolved
            </motion.span>
          </div>
          <div className="rounded-xl border border-border/60 bg-secondary/20 px-4 py-3">
            <p className="whitespace-pre-line text-[13px] leading-relaxed text-foreground/80">
              {sampleTicket.aiReply}
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

/* ─── Reusable scroll-reveal wrapper ─── */
function ScrollReveal({
  children,
  className,
  delay = 0,
  y = 30,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  y?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ─── Main page component ─── */
export default function AIAgentPage() {
  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-background to-surface-sunken">
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-16 text-center sm:pt-32 sm:pb-20">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-4 py-1.5 text-sm text-muted-foreground"
          >
            <Bot className="h-3.5 w-3.5" />
            AI Agent
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.06, ease: EASE }}
            className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            An agent that reads the ticket, checks the order, and replies.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.12, ease: EASE }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          >
            Not a chatbot with canned answers. A real AI that pulls live
            data from Shopify, cross-references your policies, and sends a
            complete reply in under 5 seconds.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.18, ease: EASE }}
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

      {/* Ticket example mockup */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-6">
          <TicketMockup />
        </div>
      </section>

      {/* Stats with animated counters */}
      <section className="border-t border-border/40">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="grid grid-cols-1 divide-y divide-border/40 md:grid-cols-3 md:divide-x md:divide-y-0">
            {stats.map((s, i) => (
              <motion.div
                key={s.value}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: i * 0.12, ease: EASE }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <span className="text-5xl font-semibold tracking-[-0.04em] text-foreground">
                  <AnimatedCounter
                    target={s.numericValue}
                    suffix={s.suffix}
                    duration={2}
                  />
                </span>
                <motion.span
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 + i * 0.12, ease: EASE }}
                  className="mt-1.5 text-sm font-medium text-foreground/70"
                >
                  {s.label}
                </motion.span>
                <motion.span
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.55 + i * 0.12, ease: EASE }}
                  className="mt-1 text-xs text-muted-foreground"
                >
                  {s.sub}
                </motion.span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How the AI works - spring physics stagger */}
      <section className="border-t border-border/40 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="mb-16">
            <ScrollReveal delay={0}>
              <p className="text-[13px] font-medium text-accent">
                How it works
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.06} y={20}>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-[2.5rem]">
                Three sources. One intelligent reply.
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.12} y={16}>
              <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
                The AI triangulates between real-time order data, your knowledge
                base, and the conversation history before it writes a single word.
              </p>
            </ScrollReveal>
          </div>

          <HowItWorksCards />
        </div>
      </section>

      {/* Capabilities list */}
      <section className="border-t border-border/40 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-start">
            <div>
              <ScrollReveal>
                <p className="text-[13px] font-medium text-accent">
                  Capabilities
                </p>
              </ScrollReveal>
              <ScrollReveal delay={0.06} y={20}>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-[2.5rem]">
                  What &ldquo;autonomous&rdquo; actually means.
                </h2>
              </ScrollReveal>
              <ScrollReveal delay={0.12} y={16}>
                <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                  Autonomous doesn&apos;t mean unsupervised. It means the AI
                  takes meaningful action — then tells you what it did and why.
                </p>
              </ScrollReveal>
            </div>
            <CapabilityCards />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative border-t border-border/40 py-24 md:py-32">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-1/2 bottom-0 h-[400px] w-[600px] -translate-x-1/2 translate-y-1/4 rounded-full bg-accent/[0.03] blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-[1200px] px-6 text-center">
          <ScrollReveal y={24}>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-[2.5rem]">
              Ready to let AI handle the routine?
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.08} y={20}>
            <p className="mx-auto mt-5 max-w-lg text-[17px] leading-relaxed text-muted-foreground">
              Connect Shopify, upload your policy, and the AI starts resolving
              tickets in under 5 minutes.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.16} y={16}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link href="/register"
                  className="group inline-flex items-center gap-2 rounded-xl bg-foreground px-8 py-3.5 text-sm font-semibold text-background transition-all duration-200 hover:bg-foreground/90 hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.12)]"
                >
                  Start free — no card needed
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link href="/pricing"
                  className="inline-flex items-center gap-2 rounded-xl border border-border/60 px-8 py-3.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:text-foreground hover:border-border hover:bg-secondary"
                >
                  See pricing
                  <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}

/* ─── How It Works cards with spring stagger ─── */
function HowItWorksCards() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
     
     
      transition: {
        type: "spring",
        stiffness: 80,
        damping: 14,
        mass: 0.9,
      },
    },
  }

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className="grid grid-cols-1 gap-5 md:grid-cols-3"
    >
      {howItWorks.map((item) => (
        <motion.div
          key={item.title}
          variants={cardVariants}
          className="group rounded-xl border border-border/60 bg-card p-7 transition-all duration-300 hover:border-border hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.08)]"
        >
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10">
            <HowItWorksIcon iconKey={item.iconKey} className="h-5 w-5 min-h-5 min-w-5 shrink-0 text-foreground" />
          </div>
          <h3 className="text-[17px] font-semibold tracking-tight text-foreground">
            {item.title}
          </h3>
          <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
            {item.body}
          </p>
        </motion.div>
      ))}
    </motion.div>
  )
}

/* ─── Capability cards with staggered entrance + hover lift ─── */
function CapabilityCards() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-60px" })

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05,
      },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
     
     
      transition: {
        duration: 0.6,
        ease: EASE,
      },
    },
  }

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className="flex flex-col gap-3"
    >
      {capabilities.map((cap) => (
        <motion.div
          key={cap.label}
          variants={cardVariants}
          className="flex gap-4 rounded-xl border border-border/60 bg-card px-5 py-5 transition-all duration-300 hover:border-border hover:bg-secondary/30 hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.08)]"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { scale: 1 } : { scale: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.3,
 }}
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-accent/10"
          >
            <Zap className="h-3.5 w-3.5 text-accent" />
          </motion.div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {cap.label}
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
              {cap.detail}
            </p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
