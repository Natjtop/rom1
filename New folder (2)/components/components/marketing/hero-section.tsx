"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { InboxMockup } from "@/components/marketing/inbox-mockup"

const ease = [0.23, 1, 0.32, 1] as const

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-44 md:pb-28">
      {/* Background glow — hidden on mobile (blur causes black flash on mobile GPUs) */}
      <div className="pointer-events-none absolute inset-0 hidden sm:block" aria-hidden="true">
        <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-foreground/[0.02] blur-[120px]" />
        <div className="absolute right-1/4 top-1/3 h-[300px] w-[300px] rounded-full bg-foreground/[0.015] blur-[80px]" />
      </div>
      <div className="relative mx-auto max-w-[1200px] px-6">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge — opacity only, no y shift */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-3.5 py-1 text-[13px] font-medium text-muted-foreground"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-foreground opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-foreground" />
            </span>
            80% of tickets resolved without a human
          </motion.div>

          {/* Headline — "answered by AI" renders immediately, no delay */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.05, ease }}
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-foreground"
          >
            Your{" "}
            <span className="text-h1-muted">e-commerce</span>
            {" "}support,{" "}
            <br className="hidden sm:block" />
            answered by AI.
          </motion.h1>

          {/* Subhead — opacity only */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease }}
            className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Replyma reads your order data and store policies to reply across
            Email and Live Chat. Your team handles
            escalations — the AI handles everything else.
          </motion.p>

          {/* CTAs — opacity only */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.15, ease }}
            className="mt-10 flex w-full flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/register" className="group relative inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 overflow-hidden rounded-lg bg-foreground px-8 text-sm font-semibold text-background transition-colors duration-200 hover:bg-foreground/90">
                {/* Shimmer */}
                <motion.div
                  animate={{ x: ["-200%", "200%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 3 }}
                  className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                />
                Start free trial
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link href="/features/ai-agent" className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-border bg-background px-8 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-secondary">
                See how it works
            </Link>
          </motion.div>

          {/* Proof points — single row on all screens, compact on mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.25, ease }}
            className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 sm:gap-x-6 text-[11px] sm:text-[13px] text-muted-foreground/60"
          >
            {["No credit card", "5-min setup", "Cancel anytime"].map((text, i) => (
              <span key={text} className="flex items-center shrink-0">
                {i > 0 && <span className="mr-3 sm:mr-6 h-2.5 sm:h-3 w-px bg-border shrink-0" aria-hidden="true" />}
                {text}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Product demo — opacity only, no y/scale shift */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease }}
          className="relative mt-20 md:mt-24"
        >
          <div className="relative z-[1]">
            <InboxMockup />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
