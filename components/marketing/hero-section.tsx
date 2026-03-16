"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { InboxMockup } from "@/components/marketing/inbox-mockup"
import dynamic from "next/dynamic"

const Hero3DElement = dynamic(() => import("@/components/marketing/hero-3d-element").then(mod => mod.Hero3DElement), { ssr: false })

const ease = [0.23, 1, 0.32, 1] as const

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-44 md:pb-28 min-h-screen flex flex-col justify-center">
      <Hero3DElement />
      <div className="relative mx-auto max-w-[1200px] px-6 w-full">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="mb-7 inline-flex items-center gap-2 rounded-full liquid-glass px-4 py-1.5 text-[13px] font-medium text-white/80"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
            </span>
            80% of tickets resolved without a human
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05, ease }}
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-medium tracking-tight text-white"
          >
            Your <em className="font-serif italic text-white/80">e-commerce</em> support,
            <br className="hidden sm:block" />
            answered by AI.
          </motion.h1>

          {/* Subhead */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease }}
            className="mt-6 text-lg sm:text-xl text-white/60 max-w-2xl mx-auto font-light"
          >
            Replyma reads your order data and store policies to reply across
            Email and Live Chat. Your team handles
            escalations — the AI handles everything else.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease }}
            className="mt-10 flex w-full flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/register" className="group relative inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 overflow-hidden rounded-full bg-white px-8 text-sm font-medium text-black transition-transform duration-200 hover:scale-105 active:scale-95">
                Start free trial
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link href="/features/ai-agent" className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-full liquid-glass px-8 text-sm font-medium text-white transition-transform duration-200 hover:scale-105 active:scale-95">
                See how it works
            </Link>
          </motion.div>

          {/* Proof points */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.25, ease }}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:gap-x-6 text-[11px] sm:text-[13px] text-white/50 uppercase tracking-widest"
          >
            {["No credit card", "5-min setup", "Cancel anytime"].map((text, i) => (
              <span key={text} className="flex items-center shrink-0">
                {i > 0 && <span className="mr-3 sm:mr-6 h-1 w-1 rounded-full bg-white/20 shrink-0" aria-hidden="true" />}
                {text}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Product demo */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease }}
          className="relative mt-20 md:mt-24 liquid-glass-strong rounded-2xl p-2 sm:p-4"
        >
          <div className="relative z-[1] rounded-xl overflow-hidden">
            <InboxMockup />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
