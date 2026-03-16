"use client"

import { useRef, useEffect, useState } from "react"
import Link from "next/link"
import { motion, useInView, useSpring, useTransform } from "framer-motion"
import { ArrowRight, MessageSquare, Clock, TrendingUp, ChevronRight, Bell, ShoppingCart, Zap, Sparkles, Send } from "lucide-react"

const ease = [0.23, 1, 0.32, 1] as const

const triggers = [
  { condition: "After a few seconds on page", message: "Need help finding the right size or checking stock? I'm here to help.", timing: "Configurable", badge: "Today" },
  { condition: "On specific pages (e.g. product, checkout)", message: "Having trouble? Ask about shipping, returns, or your order.", timing: "Configurable", badge: "Today" },
  { condition: "Cart value or time on page (planned)", message: "Proactive messages based on behavior. Coming soon.", timing: "Coming soon", badge: "Roadmap" },
  { condition: "Return visitor (planned)", message: "Personalized greeting for returning customers. Coming soon.", timing: "Coming soon", badge: "Roadmap" },
]

const chatMessages = [
  { from: "bot", text: "Hey Sarah! Need help with sizing or stock on the Alpine Jacket? I can look that up for you.", time: "2:14 PM" },
  { from: "customer", text: "Yes! I'm between sizes actually", time: "2:15 PM" },
  { from: "bot", text: "Both Medium and Large are in stock. The Medium runs slightly slim — most customers between sizes go Large. I can also check your past orders to see what you usually pick.", time: "2:15 PM" },
  { from: "customer", text: "Large sounds good, let's do it", time: "2:16 PM" },
  { from: "bot", text: "Perfect! You're all set. If you have a discount code, you can apply it at checkout.", time: "2:16 PM" },
]

const heroStats = [
  { value: "24/7", label: "AI availability" },
  { value: "< 5s", label: "response time" },
  { value: "0", label: "missed chats" },
  { value: "2", label: "channels supported" },
]

const features = [
  { iconKey: "MessageSquare" as const, title: "Contextual AI", body: "The AI uses your knowledge base and ticket context to answer product, shipping, and return questions in your brand voice." },
  { iconKey: "Zap" as const, title: "Instant AI responses", body: "No queue, no wait. The AI responds quickly with contextual answers about products, sizing, shipping, and returns." },
  { iconKey: "Bell" as const, title: "Configurable widget", body: "Choose when the chat appears (e.g. after a few seconds or on specific pages) and set the greeting. More trigger types coming soon." },
]

/* ── Animated counter component ─────────────────────────────── */
function AnimatedCounter({ value, inView }: { value: string; inView: boolean }) {
  const numericMatch = value.match(/^([^0-9]*)([0-9]+(?:\.[0-9]+)?)(.*)$/)
  if (!numericMatch) return <span>{value}</span>

  const prefix = numericMatch[1]
  const target = parseFloat(numericMatch[2])
  const suffix = numericMatch[3]
  const isDecimal = numericMatch[2].includes(".")

  const spring = useSpring(0, { stiffness: 60, damping: 20 })
  const display = useTransform(spring, (v: number) =>
    isDecimal ? v.toFixed(1) : Math.round(v).toLocaleString()
  )
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

/* ── Staggered card wrapper ─────────────────────────────────── */
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

export default function LiveChatPage() {
  const statsRef = useRef<HTMLDivElement>(null)
  const statsInView = useInView(statsRef, { once: true })
  const chatRef = useRef<HTMLDivElement>(null)
  const chatInView = useInView(chatRef, { once: true, margin: "-80px" })
  const [chatVisibleCount, setChatVisibleCount] = useState(0)
  const [chatCycleKey, setChatCycleKey] = useState(0)

  // Infinite chat animation: reveal messages one by one, then restart
  useEffect(() => {
    if (!chatInView) return
    const t = setInterval(() => {
      setChatVisibleCount((c) => {
        const next = c >= 5 ? 0 : c + 1
        if (c === 5 && next === 0) setChatCycleKey((k) => k + 1)
        return next
      })
    }, 1400)
    return () => clearInterval(t)
  }, [chatInView])

  const stats = [
    { value: "24/7", label: "always on" },
    { value: "< 5s", label: "response time" },
    { value: "2", label: "channels" },
  ]

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
            <MessageSquare className="h-3.5 w-3.5" />
            Live Chat
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.65, delay: 0.06, ease }}
            className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Catch customers before they close the tab.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.65, delay: 0.12, ease }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          >
            An embeddable chat widget with AI that handles conversations in real time. Configure when it appears and the greeting; the AI answers with your brand voice.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.65, delay: 0.18, ease }}
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

      {/* Chat widget mockup — matches live-chat-widget design, infinite loop animation */}
      <section className="py-16 md:py-24">
        <div className="mx-auto w-full max-w-[380px] sm:max-w-[400px] px-6">
          <motion.div
            ref={chatRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.65, delay: 0.22, ease }}
            className="overflow-hidden rounded-2xl flex flex-col shadow-[0_1px_2px_rgba(0,0,0,0.03),0_3px_10px_rgba(0,0,0,0.05),0_8px_24px_rgba(0,0,0,0.03)]"
            style={{ backgroundColor: "#f8f9fa" }}
          >
            {/* Header — same as widget: dark bar, icon + online dot, name + subtext */}
            <div className="relative flex items-center gap-3 px-4 py-3 shrink-0 rounded-t-2xl bg-[#0a0a0a]">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.3 }}
                className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm"
              >
                <Sparkles className="h-4 w-4 text-white" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-white/90 border-[#0a0a0a]" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold leading-tight truncate text-white">Lumina Support</p>
                <p className="text-[11px] leading-tight text-white/90">Typically replies in seconds</p>
              </div>
            </div>

            {/* Messages — fixed height so mockup doesn't grow; scroll only on desktop, no scroll on mobile */}
            <div className="flex flex-col gap-0.5 p-4 pb-2 h-[400px] overflow-x-hidden overflow-y-hidden sm:overflow-y-auto" style={{ backgroundColor: "#f8f9fa" }}>
              {chatMessages.map((msg, i) => {
                if (i > chatVisibleCount) return null
                const isCust = msg.from === "customer"
                const isFirst = i === 0 || chatMessages[i - 1]?.from !== msg.from
                const isLast = i === chatMessages.length - 1 || chatMessages[i + 1]?.from !== msg.from
                const bubbleR = (cust: boolean, first: boolean, last: boolean) => {
                  if (first && last) return "rounded-2xl"
                  if (cust) return first ? "rounded-2xl rounded-br-lg" : last ? "rounded-2xl rounded-tr-lg" : "rounded-r-lg rounded-l-2xl"
                  return first ? "rounded-2xl rounded-bl-lg" : last ? "rounded-2xl rounded-tl-lg" : "rounded-r-2xl rounded-l-lg"
                }
                return (
                  <motion.div
                    key={`${chatCycleKey}-${i}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                    className={`flex items-end gap-2 ${isCust ? "justify-end" : "justify-start"} ${isFirst ? "mt-3" : "mt-1"}`}
                  >
                    {!isCust && (
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0a0a0a] ${isLast ? "visible" : "invisible"}`}>
                        <Sparkles className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <div className="flex flex-col max-w-[78%]">
                      <div
                        className={`px-3.5 py-2.5 text-[13.5px] leading-[1.55] whitespace-pre-wrap break-words ${bubbleR(isCust, isFirst, isLast)} ${
                          isCust ? "" : "shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                        }`}
                        style={isCust ? { background: "#0a0a0a", color: "#ffffff" } : { background: "#ffffff", color: "#1a1a1a" }}
                      >
                        {msg.text}
                      </div>
                      {isLast && <span className={`mt-1 text-[10px] text-[#aaa] ${isCust ? "text-right mr-1" : "ml-1"}`}>{msg.time}</span>}
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Input — same as widget: rounded-2xl input + rounded-2xl send button */}
            <div className="border-t border-black/[0.06] p-3 shrink-0" style={{ backgroundColor: "#f8f9fa" }}>
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0 rounded-2xl border-0 px-4 h-11 text-[13.5px] flex items-center bg-[#f5f5f5] text-[#1a1a1a] placeholder:text-[#aaa]">
                  Type your message...
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0a0a0a] text-white">
                  <Send className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 flex items-center justify-center gap-1 text-[10px] text-[#bbb]">
                <Sparkles className="h-2.5 w-2.5" />
                Powered by Replyma
              </p>
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

      {/* Key features */}
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
              Key features
            </motion.p>
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.06, ease }}
              className="text-3xl md:text-[2.5rem] font-semibold tracking-[-0.03em] text-foreground"
            >
              More than a chat bubble.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.12, ease }}
              className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted-foreground"
            >
              A revenue-generating widget that understands your store, your products, and your customers.
            </motion.p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {features.map((item, i) => (
              <StaggerCard key={item.title} index={i} className="group rounded-xl border border-border/60 bg-card p-7 transition-all duration-300 hover:border-border hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.08)]">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10">
                  {item.iconKey === "MessageSquare" && <MessageSquare className="h-5 w-5 min-h-5 min-w-5 shrink-0 text-foreground" />}
                  {item.iconKey === "Zap" && <Zap className="h-5 w-5 min-h-5 min-w-5 shrink-0 text-foreground" />}
                  {item.iconKey === "Bell" && <Bell className="h-5 w-5 min-h-5 min-w-5 shrink-0 text-foreground" />}
                </div>
                <p className="text-[17px] font-semibold tracking-tight text-foreground">{item.title}</p>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </StaggerCard>
            ))}
          </div>
        </div>
      </section>

      {/* Proactive triggers */}
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
              Proactive triggers
            </motion.p>
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.06, ease }}
              className="text-3xl md:text-[2.5rem] font-semibold tracking-[-0.03em] text-foreground"
            >
              The chat fires before the customer even asks.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.12, ease }}
              className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted-foreground"
            >
              Configure when the chat widget appears and what greeting to show. The AI then handles the conversation with your brand voice. More trigger types (e.g. cart value, time on page) coming soon.
            </motion.p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {triggers.map((trigger, i) => (
              <StaggerCard key={trigger.condition} index={i} className="group rounded-xl border border-border/60 bg-card p-7 transition-all duration-300 hover:border-border hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.08)]">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <motion.div
                      initial={{ rotate: -20, scale: 0 }}
                      whileInView={{ opacity: 1, rotate: 0 }}
                      viewport={{ once: true }}
                      transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 + i * 0.07 }}
                    >
                      <Bell className="h-4 w-4 text-accent shrink-0" />
                    </motion.div>
                    <p className="text-sm font-semibold text-foreground">{trigger.condition}</p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">{trigger.badge}</span>
                </div>
                <div className="rounded-xl border border-border/60 bg-secondary/40 px-4 py-3 mb-3">
                  <p className="text-[12.5px] text-foreground italic">&quot;{trigger.message}&quot;</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">{trigger.timing}</span>
                </div>
              </StaggerCard>
            ))}
          </div>
        </div>
      </section>

      {/* Install */}
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
                Installation
              </motion.p>
              <motion.h2
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.06, ease }}
                className="text-3xl md:text-[2.5rem] font-semibold tracking-[-0.03em] text-foreground"
              >
                Paste one line. Deploy instantly.
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.12, ease }}
                className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted-foreground"
              >
                Copy the embed script, paste it before the closing {"</body>"} tag on your store. For Shopify, it{"'"}s one click from Settings {">"} Theme {">"} Edit code.
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.18, ease }}
                className="mt-8 flex flex-wrap gap-3"
              >
                <Link href="/register"
                  className="group inline-flex items-center gap-2 rounded-xl bg-foreground px-7 py-3 text-sm font-semibold text-background transition-all duration-200 hover:bg-foreground/90 hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.12)]"
                >
                    Get embed code <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.08, ease }}
              className="rounded-xl border border-border/60 bg-card p-7 transition-all duration-300 hover:border-border hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.08)]"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Embed script</p>
                <button className="text-xs font-medium text-accent hover:text-accent/80 transition-colors">Copy</button>
              </div>
              <div className="rounded-xl bg-secondary/60 p-4 font-mono text-[12px] leading-relaxed">
                <p className="text-muted-foreground">{"<!-- Add before </body> -->"}</p>
                <p className="mt-2 text-accent">{"<script"}</p>
                <p className="pl-4 text-foreground/80">{'src="https://replyma.com/widget.js?v=20260307-7"'}</p>
                <p className="pl-4 text-foreground/80">{'data-workspace="your-workspace-id"'}</p>
                <p className="text-accent">{">"}</p>
                <p className="text-accent">{"</script>"}</p>
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3, ease }}
                className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2"
              >
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                <p className="text-xs text-emerald-700 font-medium">Start recovering lost revenue from abandoned carts</p>
              </motion.div>
            </motion.div>
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
            Start recovering abandoned carts today.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.06, ease }}
            className="mx-auto mt-5 max-w-lg text-[17px] leading-relaxed text-muted-foreground"
          >
            Set up in 5 minutes. First cart recovered, typically within 24 hours.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.12, ease }}
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
