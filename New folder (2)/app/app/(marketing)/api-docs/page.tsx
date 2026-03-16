"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Key, BookOpen, ChevronRight, Copy, CheckCircle2 } from "lucide-react"

const ease = [0.23, 1, 0.32, 1] as const

const endpoints = [
  { method: "GET", path: "/api/v1/tickets", desc: "List all tickets with filters and pagination" },
  { method: "GET", path: "/api/v1/tickets/{id}", desc: "Retrieve a single ticket with messages" },
  { method: "POST", path: "/api/v1/tickets", desc: "Create a new ticket with initial message" },
  { method: "PATCH", path: "/api/v1/tickets/{id}", desc: "Update ticket status, priority, tags, or assignment" },
  { method: "POST", path: "/api/v1/messages/tickets/{id}/messages", desc: "Send a reply to a ticket" },
  { method: "GET", path: "/api/v1/customers/{email}", desc: "Retrieve customer profile with orders and CSAT" },
  { method: "GET", path: "/api/v1/analytics/overview", desc: "Analytics overview (AI rate, CSAT, volume)" },
  { method: "POST", path: "/api/v1/tickets/{id}/shopify/refund", desc: "Issue a Shopify refund from a ticket" },
  { method: "GET", path: "/api/v1/helpcenter/articles", desc: "List all help center articles" },
  { method: "POST", path: "/api/v1/settings/webhooks", desc: "Register a webhook endpoint" },
]

const webhookEvents = [
  { event: "ticket.created", desc: "Fires when a new ticket arrives from any channel" },
  { event: "ticket.resolved", desc: "Fires when the AI or agent marks a ticket resolved" },
  { event: "ticket.escalated", desc: "Fires when the AI escalates to a human agent" },
  { event: "message.sent", desc: "Fires when any reply is sent (AI or human)" },
  { event: "customer.csat_submitted", desc: "Fires when a CSAT survey response arrives" },
]

const methodColors: Record<string, string> = {
  GET: "bg-emerald-500/8 text-emerald-600",
  POST: "bg-accent/8 text-accent",
  PATCH: "bg-amber-500/8 text-amber-600",
  DELETE: "bg-destructive/10 text-destructive",
}

const sdks = [
  { name: "cURL", install: "# Authenticate with your API key via x-api-key header", snippet: `curl https://api.replyma.com/api/v1/tickets \\
  -H "x-api-key: rk_your_api_key_here" \\
  -H "Content-Type: application/json"` },
  { name: "Node.js", install: "# No SDK needed — use fetch or any HTTP client", snippet: `const res = await fetch("https://api.replyma.com/api/v1/tickets", {
  headers: {
    "x-api-key": process.env.REPLYMA_API_KEY,
    "Content-Type": "application/json",
  },
});

const { data, hasMore } = await res.json();
console.log(data[0].status);` },
  { name: "Python", install: "# No SDK needed — use requests", snippet: `import requests, os

res = requests.get(
    "https://api.replyma.com/api/v1/tickets",
    headers={"x-api-key": os.environ["REPLYMA_API_KEY"]},
)

tickets = res.json()["data"]
print(tickets[0]["status"])` },
]

export default function ApiDocsPage() {
  const [activeSDK, setActiveSDK] = useState("Node.js")
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const sdk = sdks.find(s => s.name === activeSDK)
    if (sdk) {
      navigator.clipboard.writeText(sdk.snippet).catch(() => {})
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-24">
        <div className="mx-auto max-w-[1200px] px-6">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease }}
            className="mb-4 text-[13px] font-medium text-accent"
          >
            API Documentation
          </motion.p>
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.06, duration: 0.6, ease }}
                className="text-[2.75rem] font-semibold leading-[1.08] tracking-[-0.035em] text-foreground md:text-[3.25rem]"
              >
                Build on top of{" "}
                <span className="text-h1-muted">Replyma.</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.12, duration: 0.6, ease }}
                className="mt-5 max-w-lg text-[17px] leading-[1.7] text-muted-foreground"
              >
                REST API and webhooks to manage tickets, trigger actions, stream real-time events, and build custom integrations. Authenticate with a simple API key.
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.18, duration: 0.6, ease }}
                className="mt-7 grid grid-cols-3 gap-4"
              >
                {[
                  { value: "48ms", label: "Median latency" },
                  { value: "99.97%", label: "API uptime" },
                  { value: "v1", label: "Stable version" },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.22 + i * 0.06, duration: 0.5, ease }}
                    className="rounded-xl border border-border/60 bg-card p-4 text-center transition-shadow duration-200 hover:border-border hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.08)]"
                  >
                    <p className="text-xl font-semibold tracking-[-0.04em] text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                  </motion.div>
                ))}
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.24, duration: 0.6, ease }}
                className="mt-7 flex flex-wrap gap-3"
              >
                <Link href="/register" className="group inline-flex items-center gap-2 rounded-lg bg-foreground px-7 py-3 text-sm font-medium text-background transition-all duration-200 hover:bg-foreground/90">
                    Get API key
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.35, type: "spring", stiffness: 300, damping: 14 }}
                    >
                      <Key className="h-4 w-4" />
                    </motion.span>
                </Link>
                <Link href="/help-center" className="inline-flex items-center gap-2 rounded-lg border border-border px-7 py-3 text-sm font-medium text-foreground transition-all duration-200 hover:bg-secondary/50 hover:border-border/80">
                    Help center
                    <ChevronRight className="h-4 w-4" />
                </Link>
              </motion.div>
            </div>

            {/* Code example */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6, ease }}
              className="overflow-hidden rounded-xl border border-border/60 bg-card transition-shadow duration-300 hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.08)]"
            >
              <div className="flex items-center justify-between border-b border-border/40 px-5 py-3.5">
                <div className="flex gap-2">
                  {sdks.map((sdk) => (
                    <button
                      key={sdk.name}
                      onClick={() => setActiveSDK(sdk.name)}
                      className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                        activeSDK === sdk.name
                          ? "bg-foreground text-background shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      }`}
                    >
                      {sdk.name}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              {sdks.filter(s => s.name === activeSDK).map((sdk) => (
                <div key={sdk.name}>
                  <div className="border-b border-border/30 px-5 py-3 bg-secondary/30">
                    <p className="font-mono text-xs text-muted-foreground">{sdk.install}</p>
                  </div>
                  <pre className="overflow-x-auto bg-secondary/20 p-5 text-[12px] leading-relaxed">
                    <code className="font-mono text-foreground/80">{sdk.snippet}</code>
                  </pre>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Endpoints */}
      <section className="relative border-t border-border/40 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="mb-10">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease }}
              className="mb-3 text-[13px] font-medium text-accent"
            >
              REST API
            </motion.p>
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.06, duration: 0.6, ease }}
              className="text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-[2.5rem]"
            >
              Core endpoints
            </motion.h2>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease }}
            className="overflow-hidden rounded-xl border border-border/60 bg-card"
          >
            {endpoints.map((ep, i) => (
              <motion.div
                key={ep.path}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.5, ease }}
                className="group flex items-center gap-4 border-b border-border/30 px-5 py-4 last:border-0 hover:bg-secondary/20 cursor-pointer transition-all duration-200"
              >
                <motion.span
                  className={`shrink-0 rounded-md px-2.5 py-0.5 text-[10px] font-bold font-mono ${methodColors[ep.method]}`}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 + 0.05, type: "spring", stiffness: 300, damping: 16 }}
                >
                  {ep.method}
                </motion.span>
                <code className="flex-1 font-mono text-sm text-foreground">{ep.path}</code>
                <p className="hidden text-sm text-muted-foreground md:block">{ep.desc}</p>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Webhooks */}
      <section className="relative border-t border-border/40 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-2 lg:items-start">
            <div>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease }}
                className="mb-3 text-[13px] font-medium text-accent"
              >
                Webhooks
              </motion.p>
              <motion.h2
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.06, duration: 0.6, ease }}
                className="text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-[2.5rem]"
              >
                Real-time event streaming.
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.12, duration: 0.6, ease }}
                className="mt-4 text-[15px] leading-relaxed text-muted-foreground"
              >
                Register a URL and we&apos;ll POST to it every time something meaningful happens. Events are signed with HMAC-SHA256 and include a retry policy for failed deliveries.
              </motion.p>
              <div className="mt-7 flex flex-col gap-2.5">
                {webhookEvents.map((ev, i) => (
                  <motion.div
                    key={ev.event}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07, duration: 0.5, ease }}
                    className="group flex gap-3 rounded-xl border border-border/60 bg-card px-5 py-3.5 transition-all duration-200 hover:border-border hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.08)]"
                  >
                    <code className="text-xs font-mono font-semibold text-accent shrink-0">{ev.event}</code>
                    <p className="text-xs text-muted-foreground">{ev.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.6, ease }}
              className="rounded-xl border border-border/60 bg-card overflow-hidden transition-shadow duration-300 hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.08)]"
            >
              <div className="border-b border-border/40 px-5 py-3.5 flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <span className="text-sm font-semibold text-foreground">Example payload</span>
              </div>
              <pre className="p-5 text-[12px] leading-relaxed overflow-x-auto bg-secondary/20">
                <code className="font-mono text-foreground/75">{`POST https://yourdomain.com/webhook
X-Replyma-Signature: sha256=abc...

{
  "event": "ticket.resolved",
  "created_at": "2026-03-02T14:22:18Z",
  "data": {
    "ticket_id": "tkt_58291",
    "resolved_by": "ai_agent",
    "resolution_time_ms": 3820,
    "channel": "email",
    "customer": {
      "id": "cust_7821",
      "email": "sarah@example.com"
    }
  }
}`}</code>
              </pre>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative border-t border-border/40 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="mx-auto max-w-2xl text-center">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease }}
              className="text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-[2.5rem]"
            >
              Start building today.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.06, duration: 0.6, ease }}
              className="mt-5 text-[17px] leading-[1.7] text-muted-foreground"
            >
              Free API access on all plans. Production keys available immediately after signup.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.12, duration: 0.6, ease }}
              className="mt-10 flex flex-wrap items-center justify-center gap-3"
            >
              <Link href="/register" className="group inline-flex items-center gap-2 rounded-lg bg-foreground px-8 py-3.5 text-sm font-medium text-background transition-all duration-200 hover:bg-foreground/90">
                  Get API key
                  <motion.span
                    initial={{ scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.25, type: "spring", stiffness: 300, damping: 14 }}
                  >
                    <Key className="h-4 w-4" />
                  </motion.span>
              </Link>
              <Link href="/help-center" className="inline-flex items-center gap-2 rounded-lg border border-border px-8 py-3.5 text-sm font-medium text-foreground transition-all duration-200 hover:bg-secondary/50 hover:border-border/80">
                  Read full docs
                  <BookOpen className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}
