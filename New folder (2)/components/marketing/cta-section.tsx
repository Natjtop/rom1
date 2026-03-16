"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

const ease = [0.23, 1, 0.32, 1] as const

export function CTASection() {
  return (
    <section className="relative border-t border-border/40 py-28 md:py-40 overflow-hidden">
      {/* Mesh gradient background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 80% 50% at 50% 0%, var(--foreground), transparent), radial-gradient(ellipse 60% 80% at 80% 50%, var(--foreground), transparent), radial-gradient(ellipse 50% 60% at 20% 60%, var(--foreground), transparent)",
          }}
        />
        {/* Secondary glow */}
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/[0.03] blur-[100px]" />
      </div>

      {/* Dot pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--border) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Subtle top/bottom border glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" aria-hidden="true" />

      <div className="relative mx-auto max-w-[1200px] px-6">
        <div className="mx-auto max-w-2xl text-center">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease }}
            className="text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-[2.5rem] lg:text-[3rem]"
          >
            Your Monday inbox,{" "}
            <span className="text-muted-foreground">
              already handled.
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease }}
            className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            The AI runs overnight. By the time your team logs in, routine
            tickets are already cleared.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/register" className="group relative inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 overflow-hidden rounded-lg bg-foreground px-8 text-sm font-semibold text-background transition-all duration-200 hover:bg-foreground/90">
                {/* Animated gradient background */}
                <motion.div
                  className="absolute inset-0 bg-foreground"
                  aria-hidden="true"
                />
                <motion.div
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      "linear-gradient(90deg, var(--foreground), var(--muted-foreground), var(--foreground))",
                    backgroundSize: "200% 100%",
                  }}
                  aria-hidden="true"
                />
                {/* Shimmer effect */}
                <motion.div
                  animate={{ x: ["-200%", "200%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
                  className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  aria-hidden="true"
                />
                <span className="relative z-10 flex items-center gap-2">
                  Start free trial
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </span>
            </Link>
            <Link href="/pricing" className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-border bg-background px-8 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-secondary">
                See pricing
            </Link>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-5 flex flex-wrap items-center justify-center gap-4 text-[13px] text-muted-foreground/50"
          >
            {["Free 3-day trial", "No credit card", "Cancel anytime"].map((text, i) => (
              <span key={text} className="flex items-center gap-4">
                {i > 0 && <span className="mr-4 h-3 w-px bg-border" />}
                {text}
              </span>
            ))}
          </motion.p>
        </div>
      </div>
    </section>
  )
}
