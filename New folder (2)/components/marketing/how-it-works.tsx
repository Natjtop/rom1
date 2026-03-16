"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import { Check, Link as LinkIcon, FileText, Rocket } from "lucide-react"

const steps = [
  {
    number: "1",
    title: "Connect your store",
    description:
      "One-click Shopify install or paste a WooCommerce API key. Orders, customers, and products sync automatically.",
    detail: "Shopify + WooCommerce",
    icon: LinkIcon,
  },
  {
    number: "2",
    title: "Upload your policies",
    description:
      "Paste your return policy or FAQ text, or add Help Center articles. The AI reads and references them in every reply.",
    detail: "Paste text or Help Center",
    icon: FileText,
  },
  {
    number: "3",
    title: "Turn on auto-pilot",
    description:
      "The AI answers routine questions automatically. Your team only sees the escalations that actually need a human.",
    detail: "80% resolved autonomously",
    icon: Rocket,
  },
]

const ease = [0.23, 1, 0.32, 1] as const

function AnimatedStepNumber({ number, inView, delay }: { number: string; inView: boolean; delay: number }) {
  const [done, setDone] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)")
    setIsDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  useEffect(() => {
    if (!inView || !isDesktop) return
    const t = setTimeout(() => setDone(true), delay + 800)
    return () => clearTimeout(t)
  }, [inView, delay, isDesktop])

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={inView ? { scale: 1, rotate: 0 } : {}}
      transition={{ delay: delay / 1000, type: "spring", stiffness: 300, damping: 15 }}
      className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/[0.08] text-[14px] font-bold text-accent ring-1 ring-accent/15"
    >
      <motion.span
        animate={done ? { scale: [1, 1.2, 0] } : {}}
        transition={{ duration: 0.3 }}
      >
        {!done && number}
      </motion.span>
      {done && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          <Check className="h-5 w-5 text-emerald-500" />
        </motion.div>
      )}
      {done && (
        <motion.div
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 rounded-2xl border-2 border-emerald-500"
        />
      )}
    </motion.div>
  )
}

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section id="how-it-works" className="relative border-t border-border/40 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px] px-6">
        {/* Header */}
        <div className="mb-14">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease }}
            className="mb-3 text-[13px] font-medium text-accent"
          >
            How it works
          </motion.p>
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease }}
            className="text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-[2.5rem]"
          >
            Running in five minutes.
          </motion.h2>
        </div>

        {/* Steps grid */}
        <div ref={ref} className="relative grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-0">
          {/* Connecting line - horizontal on desktop */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : {}}
            transition={{ duration: 0.8, ease }}
            style={{ transformOrigin: "left" }}
            className="absolute left-[16.67%] right-[16.67%] top-[38px] z-0 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block"
            aria-hidden="true"
          />

          {/* Connecting line - vertical on mobile */}
          <motion.div
            initial={{ scaleY: 0 }}
            animate={inView ? { scaleY: 1 } : {}}
            transition={{ duration: 0.8, ease }}
            style={{ transformOrigin: "top" }}
            className="absolute bottom-0 left-6 top-0 z-0 w-px bg-gradient-to-b from-transparent via-border to-transparent md:hidden"
            aria-hidden="true"
          />

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: i * 0.15, duration: 0.5, ease }}
              className="group relative z-10"
            >
              <div className="relative rounded-xl border border-border/60 bg-card p-8 transition-all duration-300 hover:border-border hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.08)] hover:-translate-y-1 md:rounded-none md:border-x-0 md:border-t-0 md:border-b-0 md:first:rounded-l-xl md:first:border-l md:last:rounded-r-xl md:last:border-r md:[&:not(:last-child)]:border-r md:border-t md:border-b">
                {/* Step number badge + icon */}
                <div className="mb-6 flex items-center gap-4">
                  <AnimatedStepNumber number={step.number} inView={inView} delay={i * 180} />
                  <motion.div
                    initial={{ opacity: 0.5 }}
                    animate={inView ? { opacity: 1 } : {}}
                    transition={{ delay: i * 0.18 + 0.15, duration: 0.4, ease }}
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/60 text-muted-foreground transition-colors duration-300 group-hover:bg-accent/[0.06] group-hover:text-accent"
                  >
                    <step.icon className="h-5 w-5" />
                  </motion.div>
                </div>

                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ delay: i * 0.15 + 0.1, duration: 0.5, ease }}
                  className="text-[17px] font-semibold tracking-tight text-foreground"
                >
                  {step.title}
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ delay: i * 0.15 + 0.15, duration: 0.5, ease }}
                  className="mt-2.5 text-[14px] leading-[1.7] text-muted-foreground"
                >
                  {step.description}
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ delay: i * 0.15 + 0.2, duration: 0.5, ease }}
                  className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-accent/15 bg-accent/[0.04] px-3 py-1 text-[12px] font-medium text-accent/70"
                >
                  {step.detail}
                </motion.p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
