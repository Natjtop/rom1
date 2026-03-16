"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Check, X, ArrowRight, Calculator, Star, Quote } from "lucide-react"
import Link from "next/link"

const ease = [0.23, 1, 0.32, 1]

const comparisons = [
  { feature: "Starting price",               replyma: "$49/mo",    gorgias: "$300/mo" },
  { feature: "AI auto-resolution",           replyma: true,        gorgias: "Limited" },
  { feature: "AI auto-reply with order context", replyma: true,     gorgias: true },
  { feature: "Email + Live Chat included",          replyma: true,        gorgias: true },
  { feature: "Knowledge base + RAG",         replyma: true,        gorgias: false },
  { feature: "Gmail OAuth email connection", replyma: true,        gorgias: true },
  { feature: "Visual automation builder",    replyma: true,        gorgias: true },
  { feature: "10K AI resolutions (Scale)",   replyma: true,        gorgias: false },
  { feature: "Shopify Billing API",          replyma: true,        gorgias: true },
  { feature: "Self-hosted real-time (Soketi)", replyma: true,      gorgias: false },
  { feature: "GDPR customer data deletion", replyma: true,        gorgias: true },
  { feature: "Free trial (no CC)",           replyma: true,        gorgias: false },
]

const testimonials = [
  {
    quote: "We switched from Gorgias and saved over $3,000 in the first quarter. The AI resolves 80% of our tickets automatically.",
    author: "Sarah K.",
    role: "Head of CX, fashion brand",
    stars: 5,
  },
  {
    quote: "No more per-ticket surprises during sales events. Replyma just handles it.",
    author: "Mike R.",
    role: "Operations Lead, supplements brand",
    stars: 5,
  },
]

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === "boolean") {
    return value ? (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
        className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10"
      >
        <Check className="h-3.5 w-3.5 text-emerald-600" />
      </motion.div>
    ) : (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
        className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive/10"
      >
        <X className="h-3.5 w-3.5 text-destructive" />
      </motion.div>
    )
  }
  return <span className="text-sm text-muted-foreground">{value}</span>
}

export default function VsGorgiasPage() {
  const [tickets, setTickets] = useState(1000)
  const [agentCost, setAgentCost] = useState(45000)

  const aiResolutionRate = 0.8
  const ticketsHandledByAI = tickets * aiResolutionRate
  const hoursSaved = (ticketsHandledByAI * 8) / 60
  const moneySaved = Math.round(hoursSaved * (agentCost / 2080))
  const softwareSavings = (300 - 99) * 12
  const totalAnnualSavings = moneySaved * 12 + softwareSavings

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-background to-surface-sunken">
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-16 text-center sm:pt-32 sm:pb-20">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-4 py-1.5 text-sm text-muted-foreground"
          >
            Replyma vs Gorgias
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.06, ease }}
            className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Gorgias charges per ticket.
            <br /><span className="text-h1-muted">We don&apos;t.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.12, ease }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          >
            Same job, better AI, more channels, and a flat monthly rate that
            doesn&apos;t spike every time you run a sale.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.18, ease }}
            className="mt-10 flex w-full flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link
              href="/register"
              className="inline-flex w-full sm:w-auto h-11 items-center justify-center gap-2 rounded-lg bg-foreground px-8 text-sm font-medium text-background transition-all duration-200 hover:bg-foreground/90"
            >
              Start free trial
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex w-full sm:w-auto h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-8 text-sm font-medium text-foreground transition-all duration-200 hover:bg-secondary/60 hover:border-border/80"
            >
              Compare plans
            </Link>
          </motion.div>
        </div>
      </section>

      {/* The Gorgias problem */}
      <section className="border-t border-border/40 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="mb-14">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease }}
              className="mb-3 text-[13px] font-medium text-accent"
            >
              The problem
            </motion.p>
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.04, ease }}
              className="max-w-2xl text-balance text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-[2.5rem]"
            >
              Volume-based pricing punishes your best months.
            </motion.h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                number: "01",
                title: "Holiday rush? Prepare to pay.",
                body: "Your Black Friday sales double. Your Gorgias bill doubles too. Volume pricing means your support costs spike exactly when margins are under the most pressure.",
                callout: "2x tickets = 2x bill",
              },
              {
                number: "02",
                title: "Going viral is expensive.",
                body: "A product goes viral on TikTok and your inbox floods overnight. With Gorgias, that's an unexpected bill with no warning. With Replyma, it's just another day.",
                callout: "No overage surprises",
              },
              {
                number: "03",
                title: "Rule-writing is not real AI.",
                body: "Gorgias's automation relies on manually written IF/THEN rules. Replyma uses real RAG-based AI that reads your policies and order data -- no rule writing needed.",
                callout: "AI vs. glorified macros",
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: i * 0.1, ease }}
                className="group relative rounded-2xl border border-border/60 bg-card p-7 transition-all duration-300 hover:border-border hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.08)]"
              >
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 + 0.2, type: "spring", stiffness: 200, damping: 15 }}
                  className="absolute right-5 top-4 text-5xl font-semibold text-border/20 select-none"
                >{card.number}</motion.p>
                <h3 className="mt-6 text-base font-semibold text-foreground">{card.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 + 0.3, duration: 0.5, ease }}
                  className="mt-5 inline-flex rounded-full border border-accent/20 bg-accent/5 px-3.5 py-1.5"
                >
                  <p className="text-[12px] font-semibold text-accent">{card.callout}</p>
                </motion.div>
              </motion.div>
            ))}
          </div>

          {/* Three-way pricing strip */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease }}
            className="mt-6 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"
          >
            <div className="grid grid-cols-1 divide-y divide-border/40 md:grid-cols-3 md:divide-x md:divide-y-0">
              {[
                { label: "2,000 tickets/mo -- Gorgias",   value: "~$300+/mo", sub: "Starter + per-ticket overages",          bad: true },
                { label: "2,000 tickets/mo -- Replyma",   value: "$99/mo",    sub: "Growth plan, flat fee, all channels",    bad: false },
                { label: "Annual savings switching",      value: "$2,412+",   sub: "Software costs alone",                   bad: false },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1, ease }}
                  className={`flex flex-col items-center justify-center px-8 py-8 text-center ${i === 1 ? "bg-accent/[0.03]" : ""}`}
                >
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50">{item.label}</p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 + 0.2, type: "spring", stiffness: 200, damping: 15 }}
                    className={`mt-2 text-4xl font-semibold tracking-[-0.03em] ${item.bad ? "text-destructive" : "text-foreground"}`}
                  >{item.value}</motion.p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.sub}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="border-t border-border/40 py-24 md:py-32">
        <div className="mx-auto max-w-[900px] px-6">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease }}
            className="mb-3 text-[13px] font-medium text-accent"
          >
            Comparison
          </motion.p>
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.06, ease }}
            className="mb-12 text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-[2.5rem]"
          >
            Feature by feature.
          </motion.h2>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease }}
            className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"
          >
            <div className="grid grid-cols-3 border-b border-border/40 px-6 py-4">
              <div className="text-sm font-medium text-muted-foreground">Feature</div>
              <div className="text-center">
                <span className="text-sm font-semibold text-foreground">Replyma</span>
              </div>
              <div className="text-center text-sm font-medium text-muted-foreground">Gorgias</div>
            </div>
            {comparisons.map((row, i) => (
              <motion.div
                key={row.feature}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.04, ease }}
                className={`grid grid-cols-3 items-center border-b border-border/20 px-6 py-4 last:border-0 transition-colors duration-200 hover:bg-secondary/20 ${i % 2 !== 0 ? "bg-secondary/10" : ""}`}
              >
                <div className="text-sm text-muted-foreground">{row.feature}</div>
                <div className="flex justify-center">
                  {typeof row.replyma === "boolean" ? (
                    <CellValue value={row.replyma} />
                  ) : (
                    <span className="text-sm font-semibold text-foreground">{row.replyma}</span>
                  )}
                </div>
                <div className="flex justify-center">
                  {typeof row.gorgias === "boolean" ? (
                    <CellValue value={row.gorgias} />
                  ) : (
                    <span className="text-sm text-muted-foreground">{row.gorgias}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="border-t border-border/40 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease }}
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-3.5 py-1.5"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
                >
                  <Calculator className="h-3.5 w-3.5 text-accent" />
                </motion.div>
                <span className="text-[13px] font-medium text-muted-foreground">ROI Calculator</span>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.06, ease }}
                className="text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-[2.5rem]"
              >
                Calculate your savings.
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.12, ease }}
                className="mt-3 text-[17px] leading-relaxed text-muted-foreground"
              >
                Drag the sliders and see exactly how much Replyma saves you compared to
                per-ticket pricing.
              </motion.p>

              {/* Sliders */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.18, ease }}
                className="mt-8 flex flex-col gap-7"
              >
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">Monthly support tickets</label>
                    <span className="rounded-md bg-accent/10 px-2 py-0.5 text-sm font-semibold text-accent">{tickets.toLocaleString()}</span>
                  </div>
                  <input type="range" min={100} max={10000} step={100} value={tickets}
                    onChange={(e) => setTickets(Number(e.target.value))}
                    className="w-full accent-accent" />
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground/50">
                    <span>100</span><span>10,000</span>
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">Annual agent salary</label>
                    <span className="rounded-md bg-accent/10 px-2 py-0.5 text-sm font-semibold text-accent">${(agentCost / 1000).toFixed(0)}k</span>
                  </div>
                  <input type="range" min={25000} max={80000} step={1000} value={agentCost}
                    onChange={(e) => setAgentCost(Number(e.target.value))}
                    className="w-full accent-accent" />
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground/50">
                    <span>$25k</span><span>$80k</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Results */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1, ease }}
              className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"
            >
              <div className="border-b border-border/40 px-6 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">Savings breakdown</p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">Your savings with Replyma</p>
              </div>
              <div className="flex flex-col divide-y divide-border/40">
                {[
                  { label: "Tickets resolved by AI/mo",  value: `${ticketsHandledByAI.toLocaleString()}` },
                  { label: "Agent hours saved/mo",       value: `${hoursSaved.toFixed(0)}h` },
                  { label: "Software savings (annual)",  value: `$${softwareSavings.toLocaleString()}` },
                ].map((row, i) => (
                  <motion.div
                    key={row.label}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.08, ease }}
                    className="flex items-center justify-between px-6 py-4"
                  >
                    <span className="text-sm text-muted-foreground">{row.label}</span>
                    <motion.span
                      key={row.value}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      className="text-sm font-semibold text-foreground"
                    >{row.value}</motion.span>
                  </motion.div>
                ))}
              </div>
              {/* Total */}
              <div className="border-t border-border/40 bg-accent px-6 py-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white/70">Total annual savings</span>
                  <motion.span
                    key={totalAnnualSavings}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="text-3xl font-semibold tracking-[-0.03em] text-white"
                  >
                    ${totalAnnualSavings.toLocaleString()}
                  </motion.span>
                </div>
                <Link
                  href="/register"
                  className="group mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-8 py-3.5 text-sm font-semibold text-accent transition-all duration-200 hover:bg-white/90 shadow-sm"
                >
                  Start saving today
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-t border-border/40 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="mb-14 text-center">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ ease }}
              className="mb-3 text-[13px] font-medium text-accent"
            >
              Social proof
            </motion.p>
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.06, ease }}
              className="text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-[2.5rem]"
            >
              Brands that made the switch.
            </motion.h2>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, ease }}
                className="rounded-2xl border border-border/60 bg-card p-7 transition-shadow duration-300 hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.08)]"
              >
                <div className="mb-4 flex items-center gap-0.5">
                  {Array.from({ length: t.stars }).map((_, si) => (
                    <Star key={si} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <Quote className="mb-3 h-5 w-5 text-accent/30" />
                <p className="text-[15px] leading-relaxed text-foreground/80">{t.quote}</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-[12px] font-semibold text-accent">
                    {t.author.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">{t.author}</p>
                    <p className="text-[12px] text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-border/40 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ ease }}
            className="rounded-2xl border border-border/60 bg-card p-12 text-center shadow-sm md:p-16"
          >
            <h2 className="text-[1.75rem] font-semibold tracking-[-0.03em] text-foreground md:text-[2rem]">
              Ready to stop paying per ticket?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground">
              3-day free trial, no credit card required. Switch from Gorgias in under 10 minutes.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="group inline-flex h-12 items-center gap-2 rounded-lg bg-foreground px-7 text-[14px] font-medium text-background transition-all duration-200 hover:bg-foreground/90 shadow-[0_2px_8px_-2px_rgb(0_0_0/0.15)]"
              >
                Start free trial
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-12 items-center gap-2 rounded-lg border border-border bg-background px-7 text-[14px] font-medium text-foreground transition-all duration-200 hover:bg-secondary/60"
              >
                Compare plans
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
