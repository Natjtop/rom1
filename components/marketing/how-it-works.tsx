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
      className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[14px] font-bold text-white ring-1 ring-white/20"
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
          className="absolute inset-0 flex items-center justify-center"
        >
          <Check className="h-5 w-5 text-white" />
        </motion.div>
      )}
      {done && (
        <motion.div
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 rounded-2xl border-2 border-white"
        />
      )}
    </motion.div>
  )
}

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section id="how-it-works" className="relative py-24 md:py-32">
      <div className="absolute inset-0 border-t border-white/10" />
      <div className="mx-auto max-w-[1200px] px-6 relative z-10">
        {/* Header */}
        <div className="mb-14">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease }}
            className="mb-3 text-[13px] font-medium text-white/50 uppercase tracking-widest"
          >
            How it works
          </motion.p>
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease }}
            className="text-3xl font-medium tracking-tight text-white md:text-[2.5rem]"
          >
            Running in <em className="font-serif italic text-white/80">five minutes</em>.
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
            className="absolute left-[16.67%] right-[16.67%] top-[38px] z-0 hidden h-px bg-gradient-to-r from-transparent via-white/20 to-transparent md:block"
            aria-hidden="true"
          />

          {/* Connecting line - vertical on mobile */}
          <motion.div
            initial={{ scaleY: 0 }}
            animate={inView ? { scaleY: 1 } : {}}
            transition={{ duration: 0.8, ease }}
            style={{ transformOrigin: "top" }}
            className="absolute bottom-0 left-6 top-0 z-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent md:hidden"
            aria-hidden="true"
          />

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.15, duration: 0.5, ease }}
              className="group relative z-10"
            >
              <div className="relative rounded-2xl liquid-glass p-8 transition-all duration-300 hover:scale-[1.02] md:rounded-none md:border-x-0 md:border-t-0 md:border-b-0 md:first:rounded-l-2xl md:first:border-l md:last:rounded-r-2xl md:last:border-r md:[&:not(:last-child)]:border-r md:border-t md:border-b border-white/10">
                {/* Step number badge + icon */}
                <div className="mb-6 flex items-center gap-4">
                  <AnimatedStepNumber number={step.number} inView={inView} delay={i * 180} />
                  <motion.div
                    initial={{ opacity: 0.5 }}
                    animate={inView ? { opacity: 1 } : {}}
                    transition={{ delay: i * 0.18 + 0.15, duration: 0.4, ease }}
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-white/60 transition-colors duration-300 group-hover:bg-white/10 group-hover:text-white"
                  >
                    <step.icon className="h-5 w-5" />
                  </motion.div>
                </div>

                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ delay: i * 0.15 + 0.1, duration: 0.5, ease }}
                  className="text-[17px] font-medium tracking-tight text-white"
                >
                  {step.title}
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ delay: i * 0.15 + 0.15, duration: 0.5, ease }}
                  className="mt-2.5 text-[14px] leading-[1.7] text-white/60 font-light"
                >
                  {step.description}
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : {}}
                  transition={{ delay: i * 0.15 + 0.2, duration: 0.5, ease }}
                  className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[12px] font-medium text-white/70"
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
