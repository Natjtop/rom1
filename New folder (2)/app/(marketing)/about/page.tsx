"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Sparkles, Users, MessageSquare, Globe } from "lucide-react"

const ease = [0.23, 1, 0.32, 1]

const stats = [
  { value: "50K+", label: "Support tickets resolved", iconKey: "MessageSquare" as const },
  { value: "2,000+", label: "Active stores", iconKey: "Globe" as const },
  { value: "95%", label: "Customer satisfaction", iconKey: "Sparkles" as const },
  { value: "<2 min", label: "Average response time", iconKey: "Users" as const },
]

const values = [
  {
    title: "Customer-first",
    description:
      "Every product decision starts with one question: does this make life easier for the store owner and their customers? We ship features that reduce friction, not features that look good on a pricing page.",
  },
  {
    title: "Transparent pricing",
    description:
      "Flat monthly rates with no per-ticket charges, no surprise overages, and no locked-in annual contracts. You should always know exactly what you're paying and why.",
  },
  {
    title: "Radically simple",
    description:
      "Complexity is the enemy of adoption. We believe the best AI tool is the one your team actually uses -- so we obsess over onboarding, default settings, and removing every unnecessary step.",
  },
]

export default function AboutPage() {
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
            <Users className="h-3.5 w-3.5" />
            About Replyma
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.06, ease }}
            className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Built for the teams that care most.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.12, ease }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          >
            Replyma was built because great e-commerce brands were losing customers not through bad products -- but through slow, generic support. We set out to change that.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.18, ease }}
            className="mt-10 flex w-full flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link href="/register" className="inline-flex h-11 w-full sm:w-auto items-center justify-center rounded-lg bg-foreground px-8 text-sm font-semibold text-background transition-colors hover:bg-foreground/90">
                Get started
            </Link>
            <Link href="/register" className="inline-flex h-11 w-full sm:w-auto items-center justify-center rounded-lg border border-border bg-background px-8 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
                Start free trial
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, ease }}
                className="rounded-2xl border border-border/60 bg-card p-6 text-center transition-shadow duration-300 hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.08)]"
              >
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  {stat.iconKey === "MessageSquare" && <MessageSquare className="h-5 w-5 min-h-5 min-w-5 shrink-0 text-foreground" />}
                  {stat.iconKey === "Globe" && <Globe className="h-5 w-5 min-h-5 min-w-5 shrink-0 text-foreground" />}
                  {stat.iconKey === "Sparkles" && <Sparkles className="h-5 w-5 min-h-5 min-w-5 shrink-0 text-foreground" />}
                  {stat.iconKey === "Users" && <Users className="h-5 w-5 min-h-5 min-w-5 shrink-0 text-foreground" />}
                </div>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + i * 0.08, ease }}
                  className="text-[2rem] font-semibold tracking-[-0.03em] text-foreground"
                >
                  {stat.value}
                </motion.p>
                <p className="mt-1 text-[13px] text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="border-t border-border/40 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-start">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease }}
            >
              <p className="mb-3 text-[13px] font-medium text-accent">
                Our mission
              </p>
              <h2 className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground md:text-[2.5rem]">
                Make world-class support accessible to every store, not just the ones with big teams.
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.08, ease }}
              className="lg:pt-16"
            >
              <p className="text-[16px] leading-[1.8] text-muted-foreground">
                A two-person Shopify store shouldn&apos;t have to choose between sleep and fast reply times. A 50-person brand shouldn&apos;t be paying per-ticket fees that spike every time they run a good promotion.
              </p>
              <p className="mt-5 text-[16px] leading-[1.8] text-muted-foreground">
                We&apos;re a small team obsessed with one outcome: helping e-commerce stores answer every customer question accurately and instantly -- whether that&apos;s at 2 PM on a Tuesday or 3 AM during Black Friday. The AI does the heavy lifting. Your team handles the moments that actually need a human.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-t border-border/40 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="mb-14">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ ease }}
              className="mb-3 text-[13px] font-medium text-accent"
            >
              Values
            </motion.p>
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.06, ease }}
              className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground md:text-[2.5rem]"
            >
              How we make decisions.
            </motion.h2>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {values.map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08, ease }}
                className="group rounded-2xl border border-border/60 bg-card p-8 transition-all duration-300 hover:border-border hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.08)]"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.08, type: "spring", stiffness: 300, damping: 20 }}
                  className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 transition-transform duration-200 group-hover:scale-110"
                >
                  <span className="text-[16px] font-semibold text-accent">
                    {i + 1}
                  </span>
                </motion.div>
                <h3 className="text-[17px] font-semibold tracking-tight text-foreground">
                  {value.title}
                </h3>
                <p className="mt-3 text-[14px] leading-[1.75] text-muted-foreground">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/40 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ ease }}
            className="rounded-2xl border border-border/60 bg-card p-12 text-center shadow-sm md:p-16"
          >
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.06, ease }}
              className="mb-4 text-[13px] font-medium text-accent"
            >
              Get started
            </motion.p>
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, ease }}
              className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground md:text-[2.5rem]"
            >
              Ready to try it?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.14, ease }}
              className="mx-auto mt-4 max-w-md text-[16px] leading-[1.7] text-muted-foreground"
            >
              3-day free trial, no credit card required. Connect your store and have the AI answering tickets in under 10 minutes.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.18, ease }}
              className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
            >
              <Link href="/register" className="cursor-pointer group inline-flex h-12 items-center gap-2 rounded-lg bg-foreground px-7 text-[14px] font-medium text-background transition-all duration-200 hover:bg-foreground/90 shadow-[0_2px_8px_-2px_rgb(0_0_0/0.15)]">
                  Start free trial
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link href="/pricing" className="cursor-pointer inline-flex h-12 items-center gap-2 rounded-lg border border-border bg-background px-7 text-[14px] font-medium text-foreground transition-all duration-200 hover:bg-secondary/60 hover:border-border/80">
                  View pricing
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
