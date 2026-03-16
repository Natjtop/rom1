"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useCallback } from "react"
import { Mail, MessageSquare, Sparkles, CheckCircle2, Clock } from "lucide-react"

const tickets = [
  {
    id: 1,
    customer: "Sarah M.",
    channel: "email",
    icon: Mail,
    subject: "Where is my order #4821?",
    preview: "I placed an order 3 days ago and still...",
    status: "ai_replied" as const,
    time: "2m ago",
  },
  {
    id: 2,
    customer: "James K.",
    channel: "livechat",
    icon: MessageSquare,
    subject: "Do you ship to Canada?",
    preview: "Hey! Love your products. Quick question...",
    status: "ai_replied" as const,
    time: "5m ago",
  },
  {
    id: 3,
    customer: "Emily R.",
    channel: "livechat",
    icon: MessageSquare,
    subject: "Return request for wrong size",
    preview: "Hi, I received a Medium but ordered...",
    status: "open" as const,
    time: "8m ago",
  },
]

const chatByTicketId: Record<number, Array<{ role: "customer" | "ai"; content: string }>> = {
  1: [
    { role: "customer", content: "Hi, where is my order #4821? It's been 3 days and I haven't received shipping updates." },
    { role: "ai", content: "I found order #4821. It shipped yesterday via USPS and is in transit. ETA: tomorrow by 8pm." },
    { role: "customer", content: "Perfect, can you share the tracking link?" },
    { role: "ai", content: "Of course. Tracking: usps.com/track/9400111899223. I will also email it to you now." },
  ],
  2: [
    { role: "customer", content: "Do you ship to Canada? I want to place an order for Toronto." },
    { role: "ai", content: "Yes, we ship to all Canadian provinces. Delivery usually takes 4-7 business days." },
    { role: "customer", content: "Nice. Are duties included at checkout?" },
    { role: "ai", content: "For Canada, duties are calculated and shown at checkout, so there are no surprise fees on delivery." },
  ],
  3: [
    { role: "customer", content: "I received a Medium but ordered a Small. Can I return this?" },
    { role: "ai", content: "Absolutely. I can start a size-exchange right away. Please confirm your order email." },
    { role: "customer", content: "It's emily.r@example.com." },
    { role: "ai", content: "Thanks, Emily. I created return label RMA-3381 and emailed it. Once scanned, we ship your Small within 24h." },
  ],
}

export function InboxMockup() {
  const [activeTicket, setActiveTicket] = useState(0)
  const [visibleMessages, setVisibleMessages] = useState(0)
  const [messageKey, setMessageKey] = useState(0)
  const activeMessages = chatByTicketId[tickets[activeTicket].id] ?? []

  const switchTicket = useCallback((index: number) => {
    setActiveTicket(index)
    setVisibleMessages(0)
    setMessageKey((k) => k + 1)
  }, [])

  useEffect(() => {
    if (visibleMessages >= activeMessages.length) return
    const timer = setTimeout(() => {
      setVisibleMessages((prev) => prev + 1)
    }, 1200)
    return () => clearTimeout(timer)
  }, [visibleMessages, activeMessages.length])

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTicket((prev) => {
        const next = (prev + 1) % tickets.length
        setVisibleMessages(0)
        setMessageKey((k) => k + 1)
        return next
      })
    }, 9000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative mx-auto w-full max-w-4xl">
      {/* Outer glow — hidden on mobile to avoid dark band above mockup */}
      <div
        className="pointer-events-none absolute -inset-4 hidden rounded-3xl opacity-60 sm:block"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, var(--accent) 0%, transparent 60%)",
          opacity: 0.03,
        }}
      />

      {/* Premium shadow/glow container — no top border/shadow ring on mobile to avoid dark line */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 liquid-glass">

        {/* Subtle top border glow — hidden on mobile to avoid dark line */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-20 hidden h-px bg-gradient-to-r from-transparent via-white/20 to-transparent sm:block"
          aria-hidden="true"
        />

        {/* Browser chrome - macOS style */}
        <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-4 py-3">
          <div className="flex gap-1.5" aria-hidden="true">
            <div className="h-3 w-3 rounded-full bg-white/20 transition-all duration-200 hover:bg-white/40" />
            <div className="h-3 w-3 rounded-full bg-white/20 transition-all duration-200 hover:bg-white/40" />
            <div className="h-3 w-3 rounded-full bg-white/20 transition-all duration-200 hover:bg-white/40" />
          </div>

          {/* Traffic light spacer for centering */}
          <div className="flex flex-1 justify-center">
            <div className="flex items-center gap-2 rounded-md bg-white/5 px-4 py-1 border border-white/10">
              <svg className="h-3 w-3 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-[11px] text-white/50 font-medium tracking-wide">[slug].replyma.com/inbox</span>
            </div>
          </div>

          {/* Right side placeholder for symmetry */}
          <div className="flex w-[52px] items-center justify-end gap-1.5" aria-hidden="true">
            <div className="h-2.5 w-2.5 rounded-sm bg-white/10" />
            <div className="h-2.5 w-2.5 rounded-sm bg-white/10" />
          </div>
        </div>

        <div className="flex h-[360px] md:h-[420px]">

          {/* Ticket list */}
          <div className="hidden w-[240px] shrink-0 border-r border-white/10 bg-white/5 sm:block">
            <div className="border-b border-white/10 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">All Tickets</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-black">
                  {tickets.length}
                </span>
              </div>
            </div>
            <div className="flex flex-col">
              {tickets.map((ticket, i) => (
                <button
                  key={ticket.id}
                  onClick={() => switchTicket(i)}
                  className={`flex w-full items-start gap-3 border-b border-white/10 px-4 py-3 text-left transition-all duration-200 ${
                    activeTicket === i
                      ? "bg-white/10 shadow-[inset_2px_0_0_#ffffff]"
                      : "hover:bg-white/5"
                  }`}
                  aria-pressed={activeTicket === i}
                  aria-label={`View ticket from ${ticket.customer}`}
                >
                  <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 ${
                    activeTicket === i ? "bg-white/20" : "bg-white/5"
                  }`}>
                    <ticket.icon className={`h-3.5 w-3.5 transition-colors duration-200 ${
                      activeTicket === i ? "text-white" : "text-white/60"
                    }`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white">{ticket.customer}</span>
                      <span className="text-[10px] text-white/50">{ticket.time}</span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-white/60">{ticket.subject}</p>
                    <div className="mt-1.5">
                      {ticket.status === "ai_replied" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                          <Sparkles className="h-2 w-2" aria-hidden="true" /> AI Resolved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] font-semibold text-white/80">
                          <Clock className="h-2 w-2" aria-hidden="true" /> Open
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat area */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white">
                  <span className="text-xs font-bold text-black">
                    {tickets[activeTicket].customer.charAt(0)}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white">{tickets[activeTicket].customer}</p>
                  <p className="truncate text-[10px] text-white/60">{tickets[activeTicket].subject}</p>
                </div>
              </div>
              {tickets[activeTicket].status === "ai_replied" && (
                <span className="ml-2 hidden shrink-0 items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white sm:flex">
                  <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Resolved by AI
                </span>
              )}
            </div>

            <div className="flex-1 overflow-hidden sm:overflow-y-auto p-4">
              <div className="flex flex-col gap-3">
                <AnimatePresence mode="popLayout" initial={false}>
                  {activeMessages.slice(0, visibleMessages).map((msg, i) => (
                    <motion.div
                      key={`${messageKey}-${i}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className={`flex ${msg.role === "customer" ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                          msg.role === "customer"
                            ? "rounded-bl-md bg-white/10 text-white"
                            : "rounded-br-md bg-white text-black"
                        }`}
                      >
                        {msg.role === "ai" && (
                          <span className="mb-1 flex items-center gap-1 text-[10px] font-medium opacity-60">
                            <Sparkles className="h-2.5 w-2.5" aria-hidden="true" /> Replyma AI
                          </span>
                        )}
                        {msg.content}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {visibleMessages < activeMessages.length && visibleMessages % 2 === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-end"
                  >
                    <div className="flex items-center gap-1 rounded-2xl rounded-br-md bg-white px-4 py-3">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="h-1.5 w-1.5 rounded-full bg-black/40"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
