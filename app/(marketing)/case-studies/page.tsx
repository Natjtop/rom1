"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, TrendingUp, Clock, Users, Star } from "lucide-react"

const ease = [0.23, 1, 0.32, 1] as const

const caseStudies = [
  {
    company: "Lumina Skincare",
    industry: "Beauty & Skincare",
    metrics: [
      { label: "AI resolution", value: "~75%" },
      { label: "CSAT", value: "4.8\u2605" },
      { label: "Response time", value: "< 2min" },
    ],
    story:
      "DTC skincare brand handling 3,000+ tickets/month. Switched from Gorgias, reduced first response time from 4 hours to under 2 minutes.",
    slug: "/case-studies",
  },
  {
    company: "Freshleaf Co",
    industry: "Health & Wellness",
    metrics: [
      { label: "Fewer escalations", value: "~60%" },
      { label: "Avg resolution", value: "< 15min" },
      { label: "Agents freed up", value: "3" },
    ],
    story:
      "Supplement company with complex product questions. AI trained on their knowledge base now handles dosage, ingredient, and compatibility questions autonomously.",
    slug: "/case-studies",
  },
  {
    company: "Thread & Needle",
    industry: "Fashion & Apparel",
    metrics: [
      { label: "AI accuracy", value: "~90%" },
      { label: "Response time", value: "< 1min" },
      { label: "Team reduction", value: "12→5" },
    ],
    story:
      "Fast-fashion retailer processing 8,000 tickets/month. Automated WISMO, returns, and size guide questions. Support team reduced from 12 to 5 agents.",
    slug: "/case-studies",
  },
  {
    company: "Apex Athletics",
    industry: "Sports & Fitness",
    metrics: [
      { label: "Auto-resolved", value: "71%" },
      { label: "CSAT", value: "4.6/5" },
      { label: "Response time", value: "< 30s" },
    ],
    story:
      "Fitness equipment brand with complex warranty and setup questions. AI handles warranty checks, assembly guides, and replacement part orders.",
    slug: "/case-studies",
  },
]

function AnimatedCounter({ value, inViewTrigger }: { value: string; inViewTrigger: boolean }) {
  const [displayValue, setDisplayValue] = useState(value)

  useEffect(() => {
    if (!inViewTrigger) return

    const numMatch = value.match(/[\d.]+/)
    if (!numMatch) {
      setDisplayValue(value)
      return
    }

    const targetNum = parseFloat(numMatch[0])
    const prefix = value.slice(0, numMatch.index)
    const suffix = value.slice((numMatch.index ?? 0) + numMatch[0].length)
    const hasDecimal = numMatch[0].includes(".")
    const decimalPlaces = hasDecimal ? numMatch[0].split(".")[1].length : 0

    let startTime: number
    const duration = 1200

    function animate(currentTime: number) {
      if (!startTime) startTime = currentTime
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = 1 - Math.pow(1 - progress, 3)
      const currentNum = easedProgress * targetNum

      if (hasDecimal) {
        setDisplayValue(`${prefix}${currentNum.toFixed(decimalPlaces)}${suffix}`)
      } else {
        setDisplayValue(`${prefix}${Math.round(currentNum)}${suffix}`)
      }

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setDisplayValue(value)
      }
    }

    requestAnimationFrame(animate)
  }, [inViewTrigger, value])

  return <>{displayValue}</>
}

function CaseStudyCard({ study, index }: { study: (typeof caseStudies)[number]; index: number }) {
  const [hasBeenInView, setHasBeenInView] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.65, delay: index * 0.08, ease }}
      onViewportEnter={() => setHasBeenInView(true)}
      className="rounded-xl border border-border/60 bg-card p-8 transition-shadow duration-300 hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.08)]"
    >
      {/* Industry badge */}
      <motion.span
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.08 + 0.15, ease }}
        className="mb-5 inline-flex rounded-full border border-border/60 bg-secondary px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground"
      >
        {study.industry}
      </motion.span>

      {/* Company name */}
      <h3 className="text-xl font-semibold tracking-[-0.02em] text-foreground">
        {study.company}
      </h3>

      {/* Metrics with animated counters */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        {study.metrics.map((metric, j) => (
          <motion.div
            key={metric.label}
            className="rounded-lg bg-secondary/60 p-3 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.08 + 0.2 + j * 0.07, ease }}
          >
            <p className="text-[17px] font-semibold tracking-[-0.02em] text-foreground">
              <AnimatedCounter value={metric.value} inViewTrigger={hasBeenInView} />
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {metric.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Story */}
      <motion.p
        className="mt-5 text-[14px] leading-[1.75] text-muted-foreground"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.08 + 0.35, ease }}
      >
        {study.story}
      </motion.p>

      {/* Read full story link */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.08 + 0.42, ease }}
      >
        <Link
          href={study.slug}
          className="group mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-accent transition-colors duration-200 hover:text-accent/80"
        >
          Read full story
          <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </motion.div>
    </motion.div>
  )
}

export default function CaseStudiesPage() {
  const [statsInView, setStatsInView] = useState(false)

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
            <TrendingUp className="h-4 w-4" />
            Case Studies
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.06, ease }}
            className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Real results from{" "}
            <span className="text-h1-muted">real stores.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.12, ease }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          >
            See how e-commerce brands use Replyma to automate support, cut
            costs, and keep customers happier than ever.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.18, ease }}
            onViewportEnter={() => setStatsInView(true)}
            className="mt-10 flex flex-wrap items-center justify-center gap-8"
          >
            {[
              { iconKey: "TrendingUp" as const, value: "~75%", label: "avg AI resolution" },
              { iconKey: "Clock" as const, value: "<2min", label: "first response" },
              { iconKey: "Users" as const, value: "4.7", label: "avg CSAT score" },
              { iconKey: "Star" as const, value: "24/7", label: "AI availability" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="flex items-center gap-3"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.07, ease }}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                  {stat.iconKey === "TrendingUp" && <TrendingUp className="h-4 w-4 min-h-4 min-w-4 shrink-0 text-foreground" />}
                  {stat.iconKey === "Clock" && <Clock className="h-4 w-4 min-h-4 min-w-4 shrink-0 text-foreground" />}
                  {stat.iconKey === "Users" && <Users className="h-4 w-4 min-h-4 min-w-4 shrink-0 text-foreground" />}
                  {stat.iconKey === "Star" && <Star className="h-4 w-4 min-h-4 min-w-4 shrink-0 text-foreground" />}
                </div>
                <div className="text-left">
                  <p className="text-[18px] font-semibold tracking-[-0.02em] text-foreground">
                    <AnimatedCounter value={stat.value} inViewTrigger={statsInView} />
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Case Study Cards */}
      <section className="border-t border-border/40 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="mb-12">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease }}
              className="mb-3 text-[13px] font-medium text-accent"
            >
              Featured stories
            </motion.p>
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.06, ease }}
              className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground md:text-[2.5rem]"
            >
              How they did it.
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {caseStudies.map((study, i) => (
              <CaseStudyCard key={study.company} study={study} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/40 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="mx-auto max-w-xl text-center">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, ease }}
              className="mb-4 text-[13px] font-medium text-accent"
            >
              Get started
            </motion.p>
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: 0.06, ease }}
              className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground md:text-[2.5rem]"
            >
              Ready to be the next success story?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: 0.12, ease }}
              className="mt-4 text-[16px] leading-[1.7] text-muted-foreground"
            >
              3-day free trial, no credit card required. Connect your store and
              have the AI answering tickets in under 10 minutes.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: 0.18, ease }}
              className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
            >
              <Link href="/register" className="cursor-pointer group inline-flex w-full sm:w-auto h-11 items-center justify-center gap-2 rounded-lg bg-foreground px-6 text-[14px] font-medium text-background transition-all duration-200 hover:bg-foreground/90">
                  Start free trial
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link href="/pricing" className="cursor-pointer inline-flex w-full sm:w-auto h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-6 text-[14px] font-medium text-foreground transition-all duration-200 hover:bg-secondary/60 hover:border-border/80">
                  View pricing
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}
