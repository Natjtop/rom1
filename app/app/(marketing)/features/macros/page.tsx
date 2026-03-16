"use client"

import { useRef } from "react"
import Link from "next/link"
import { motion, useInView } from "framer-motion"
import { ArrowRight, Zap, GitBranch, Tag, ChevronRight, Play, AlertTriangle } from "lucide-react"

const ease = [0.23, 1, 0.32, 1] as const

const macroExamples = [
  { title: "WISMO auto-reply", trigger: "Subject contains 'where is my order' OR 'track'", action: "AI fetches order status and sends tracking link", saves: "~3 min each" },
  { title: "Refund approval under $50", trigger: "Refund request AND order total < $50", action: "Issue refund immediately, send confirmation", saves: "~5 min each" },
  { title: "VIP fast-track", trigger: "Lifetime order value > $500", action: "Assign to senior agent, set priority: High", saves: "Reduces churn" },
  { title: "Post-holiday surge filter", trigger: "Order placed between Dec 24–Jan 3", action: "Add label 'holiday-order', skip SLA timer", saves: "Reduce backlog stress" },
]

const ruleBuilder = {
  trigger: "Ticket received",
  conditions: [
    { field: "Channel", op: "is", value: "Email" },
    { field: "Subject", op: "contains", value: "refund" },
    { field: "Order value", op: "less than", value: "$50.00" },
  ],
  actions: [
    { step: "Run AI reply", detail: "Using 'Refund Policy' knowledge base" },
    { step: "Issue refund via Shopify", detail: "Full amount to original payment" },
    { step: "Close ticket", detail: "After confirmation email sent" },
  ],
}

/* ── Stagger card with hover lift ──────────────────────────── */
function StaggerCard({ children, index, className }: { children: React.ReactNode; index: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.07, ease }}
      className={`${className} transition-all duration-300 hover:border-border hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.08)]`}
    >
      {children}
    </motion.div>
  )
}

export default function MacrosPage() {
  const mockupRef = useRef<HTMLDivElement>(null)
  const mockupInView = useInView(mockupRef, { once: true, margin: "-60px" })

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
            <Zap className="h-3.5 w-3.5" />
            Macros & Rules
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.06, duration: 0.65, ease }}
            className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Automate the repetitive. Build once, runs forever.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.12, duration: 0.65, ease }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          >
            Build visual IF/THEN rules in minutes. No code, no YAML, no webhooks. When a rule matches a ticket, the automation runs instantly — including Shopify actions.
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

      {/* Rule builder mockup */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-2xl px-6">
          <motion.div
            ref={mockupRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.22, duration: 0.65, ease }}
            className="rounded-xl border border-border/60 bg-card shadow-xl shadow-black/[0.03]"
            >
              <div className="border-b border-border/60 px-5 py-3.5 flex items-center gap-2">
                <motion.div
                  initial={{ rotate: -20, scale: 0 }}
                  animate={{ rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.3 }}
                >
                  <GitBranch className="h-4 w-4 text-accent" />
                </motion.div>
                <span className="text-sm font-semibold text-foreground">Rule: Auto-refund under $50</span>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.5, ease }}
                  className="ml-auto rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600"
                >
                  Active
                </motion.span>
              </div>
              {/* Trigger */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={mockupInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.5, delay: 0.3, ease }}
                className="px-5 py-4 border-b border-border/60"
              >
                <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">When</p>
                <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2">
                  <Play className="h-3.5 w-3.5 text-accent" />
                  <span className="text-sm text-foreground">Ticket received</span>
                </div>
              </motion.div>
              {/* Conditions */}
              <div className="px-5 py-4 border-b border-border/60">
                <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">If all conditions match</p>
                <div className="flex flex-col gap-2">
                  {ruleBuilder.conditions.map((c, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={mockupInView ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ duration: 0.4, delay: 0.4 + i * 0.12, ease }}
                      className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-foreground">{c.field}</span>
                      <span className="text-muted-foreground">{c.op}</span>
                      <span className="rounded-md bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">{c.value}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
              {/* Actions */}
              <div className="px-5 py-4">
                <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Then</p>
                <div className="flex flex-col gap-2">
                  {ruleBuilder.actions.map((a, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={mockupInView ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ duration: 0.4, delay: 0.7 + i * 0.12, ease }}
                      className="flex items-center gap-3 rounded-lg bg-secondary/40 px-3 py-2"
                    >
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={mockupInView ? { scale: 1 } : { scale: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.8 + i * 0.12 }}
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent"
                      >
                        {i + 1}
                      </motion.span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{a.step}</p>
                        <p className="text-[11px] text-muted-foreground">{a.detail}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
        </div>
      </section>

      {/* Example automations */}
      <section className="relative border-t border-border/40 py-24 md:py-32">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute right-1/4 top-1/2 h-[400px] w-[500px] -translate-y-1/2 rounded-full bg-accent/[0.02] blur-[80px]" />
        </div>
        <div className="relative mx-auto max-w-[1200px] px-6">
          <div className="mb-14 max-w-xl">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease }}
              className="mb-3 text-[13px] font-semibold uppercase tracking-widest text-accent"
            >
              Macro library
            </motion.p>
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.06, duration: 0.6, ease }}
              className="text-3xl md:text-[2.5rem] font-semibold tracking-[-0.03em] leading-[1.12] text-foreground"
            >
              Start with templates. Customize everything.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.12, duration: 0.6, ease }}
              className="mt-4 text-base leading-relaxed text-muted-foreground"
            >
              Pre-built automations for the most common e-commerce workflows. Deploy in seconds, then tweak to match your store.
            </motion.p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {macroExamples.map((macro, i) => (
              <StaggerCard key={macro.title} index={i} className="rounded-xl border border-border/60 bg-card p-7">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-semibold text-foreground">{macro.title}</p>
                  <span className="shrink-0 rounded-lg bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600">Saves {macro.saves}</span>
                </div>
                <div className="mt-4 flex flex-col gap-2.5">
                  <div className="rounded-lg border border-border/60 bg-secondary/30 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Trigger</p>
                    <p className="text-xs text-foreground">{macro.trigger}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-accent/[0.04] px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-accent mb-1">Action</p>
                    <p className="text-xs text-foreground">{macro.action}</p>
                  </div>
                </div>
              </StaggerCard>
            ))}
          </div>
        </div>
      </section>

      {/* Feature list */}
      <section className="relative border-t border-border/40 py-24 md:py-32">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-1/3 bottom-0 h-[350px] w-[500px] rounded-full bg-accent/[0.02] blur-[80px]" />
        </div>
        <div className="relative mx-auto max-w-[1200px] px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-start">
            <div>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease }}
                className="mb-3 text-[13px] font-semibold uppercase tracking-widest text-accent"
              >
                What you can build
              </motion.p>
              <motion.h2
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.06, duration: 0.6, ease }}
                className="text-3xl md:text-[2.5rem] font-semibold tracking-[-0.03em] leading-[1.12] text-foreground"
              >
                Rules. Macros. Saved replies.
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.12, duration: 0.6, ease }}
                className="mt-3 text-base leading-relaxed text-muted-foreground"
              >
                Three tools for three jobs: automate routing and actions with Rules, one-click bulk responses with Macros, approved language with Saved Replies.
              </motion.p>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { iconKey: "GitBranch" as const, title: "Rules", body: "IF/THEN automation triggered by ticket properties, channel, Shopify data, or keywords. Runs in under 100ms after ticket creation.", tag: "Automated" },
                { iconKey: "Zap" as const, title: "Macros", body: "One-click actions that apply labels, send a reply, update Shopify, and close a ticket simultaneously. Build a library your team reuses.", tag: "Agent tool" },
                { iconKey: "Tag" as const, title: "Saved Replies", body: "Pre-approved message templates your agents and the AI can insert into any ticket. Version-controlled and searchable.", tag: "Template" },
                { iconKey: "AlertTriangle" as const, title: "Escalation rules", body: "Set automatic escalation paths for specific keywords, frustrated sentiment, or VIP customers — before a ticket sits too long.", tag: "Smart" },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07, duration: 0.6, ease }}
                  className="group flex gap-4 rounded-xl border border-border/60 bg-card px-5 py-4 transition-all duration-300 hover:border-border hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.08)]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-secondary transition-colors duration-300 group-hover:bg-accent/10 group-hover:border-accent/20">
                    {item.iconKey === "GitBranch" && <GitBranch className="h-4 w-4 min-h-4 min-w-4 shrink-0 text-foreground transition-colors duration-300 group-hover:text-accent" />}
                    {item.iconKey === "Zap" && <Zap className="h-4 w-4 min-h-4 min-w-4 shrink-0 text-foreground transition-colors duration-300 group-hover:text-accent" />}
                    {item.iconKey === "Tag" && <Tag className="h-4 w-4 min-h-4 min-w-4 shrink-0 text-foreground transition-colors duration-300 group-hover:text-accent" />}
                    {item.iconKey === "AlertTriangle" && <AlertTriangle className="h-4 w-4 min-h-4 min-w-4 shrink-0 text-foreground transition-colors duration-300 group-hover:text-accent" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{item.tag}</span>
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{item.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative border-t border-border/40 py-24 md:py-32">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/[0.03] blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-[1200px] px-6 text-center">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="text-3xl md:text-[2.5rem] font-semibold tracking-[-0.03em] leading-[1.12] text-foreground"
          >
            Build your first rule in 2 minutes.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.06, duration: 0.6, ease }}
            className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted-foreground"
          >
            No code. No documentation. Just point, click, and automate.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.12, duration: 0.6, ease }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link href="/register"
              className="group inline-flex items-center gap-2 rounded-lg bg-foreground px-8 py-3.5 text-sm font-semibold text-background transition-all duration-200 hover:bg-foreground/90 hover:shadow-lg hover:shadow-foreground/10"
            >
                Start free trial
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
