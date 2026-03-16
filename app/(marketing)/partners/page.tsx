"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import {
  ArrowRight,
  Code,
  Users,
  Percent,
  Gift,
  CheckCircle2,
  Handshake,
} from "lucide-react"

const ease = [0.23, 1, 0.32, 1] as const

const appPartnerBenefits = [
  "API access and developer documentation",
  "Co-marketing opportunities",
  "Featured in our integrations marketplace",
  "Dedicated partner engineering support",
]

const agencyPartnerBenefits = [
  "20% recurring commission on referrals",
  "Dedicated partner manager",
  "Co-branded marketing materials",
  "Priority support for your clients",
]

const commissionSteps = [
  {
    icon: Handshake,
    title: "Refer",
    description:
      "Share your unique partner link with clients who need better customer support. We handle the rest of the sales process.",
  },
  {
    icon: Gift,
    title: "Convert",
    description:
      "When a referred lead signs up for a paid plan, the conversion is automatically attributed to your account.",
  },
  {
    icon: Percent,
    title: "Earn",
    description:
      "Receive 20% recurring commission on every payment your referral makes — for as long as they stay a customer.",
  },
]

function PartnerCard({
  iconKey,
  title,
  description,
  benefits,
  ctaText,
  ctaHref,
  index,
}: {
  iconKey: "Code" | "Users"
  title: string
  description: string
  benefits: string[]
  ctaText: string
  ctaHref: string
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.65, delay: index * 0.08, ease }}
      className="rounded-xl border border-border/60 bg-card p-8 transition-shadow duration-300 hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.08)]"
    >
      <motion.div
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ delay: index * 0.08 + 0.1, type: "spring", stiffness: 300, damping: 14 }}
      >
        {iconKey === "Code" && <Code className="h-5 w-5 min-h-5 min-w-5 shrink-0 text-foreground" />}
        {iconKey === "Users" && <Users className="h-5 w-5 min-h-5 min-w-5 shrink-0 text-foreground" />}
      </motion.div>
      <h3 className="text-[20px] font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <p className="mt-2 text-[15px] leading-[1.7] text-muted-foreground">
        {description}
      </p>
      <ul className="mt-6 space-y-3">
        {benefits.map((benefit, j) => (
          <motion.li
            key={benefit}
            className="flex items-start gap-2.5"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.08 + 0.2 + j * 0.06, ease }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 + 0.25 + j * 0.06, type: "spring", stiffness: 350, damping: 14 }}
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            </motion.div>
            <span className="text-[14px] leading-[1.6] text-muted-foreground">
              {benefit}
            </span>
          </motion.li>
        ))}
      </ul>
      <motion.div
        className="mt-8"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.08 + 0.45, ease }}
      >
        <Link href={ctaHref} className="cursor-pointer group inline-flex w-full sm:w-auto h-11 items-center justify-center gap-2 rounded-lg bg-foreground px-6 text-[14px] font-medium text-background transition-all duration-200 hover:bg-foreground/90">
            {ctaText}
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </motion.div>
    </motion.div>
  )
}

function CommissionStep({ step, index }: { step: (typeof commissionSteps)[number]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: index * 0.08, ease }}
      className="rounded-xl border border-border/60 bg-card p-8 transition-shadow duration-300 hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.08)]"
    >
      <motion.div
        className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-secondary"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1, rotate: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ delay: index * 0.08 + 0.12, type: "spring", stiffness: 200, damping: 15 }}
      >
        <span className="text-[15px] font-semibold text-foreground">
          {index + 1}
        </span>
      </motion.div>
      <h3 className="text-[17px] font-semibold tracking-tight text-foreground">
        {step.title}
      </h3>
      <motion.p
        className="mt-3 text-[14px] leading-[1.75] text-muted-foreground"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.08 + 0.22, ease }}
      >
        {step.description}
      </motion.p>
    </motion.div>
  )
}

export default function PartnersPage() {
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
            <Handshake className="h-4 w-4" />
            Partners
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.06, ease }}
            className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Grow with Replyma.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.12, ease }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          >
            Two programs designed for the people closest to e-commerce brands
            — whether you build integrations or recommend the best tools to
            your clients.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.18, ease }}
            className="mt-10 flex w-full flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link href="/register" className="inline-flex w-full sm:w-auto h-11 items-center justify-center gap-2 rounded-lg bg-foreground px-8 text-sm font-medium text-background transition-all duration-200 hover:bg-foreground/90">
              Apply now
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link href="/about" className="inline-flex w-full sm:w-auto h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-8 text-sm font-medium text-foreground transition-all duration-200 hover:bg-secondary/60 hover:border-border/80">
              Learn about Replyma
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Program Cards */}
      <section className="border-t border-border/40 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <PartnerCard
              iconKey="Code"
              title="App Partners"
              description="Build integrations that connect with Replyma and unlock new workflows for shared customers."
              benefits={appPartnerBenefits}
              ctaText="Apply as App Partner"
              ctaHref="/register"
              index={0}
            />
            <PartnerCard
              iconKey="Users"
              title="Agency Partners"
              description="Refer clients and earn recurring commission every time they pay — for the lifetime of their account."
              benefits={agencyPartnerBenefits}
              ctaText="Apply as Agency Partner"
              ctaHref="/register"
              index={1}
            />
          </div>
        </div>
      </section>

      {/* Commission Structure */}
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
              Commission
            </motion.p>
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.06, ease }}
              className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground md:text-[2.5rem]"
            >
              How commission works.
            </motion.h2>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {commissionSteps.map((step, i) => (
              <CommissionStep key={step.title} step={step} index={i} />
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
              Ready to partner up?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: 0.12, ease }}
              className="mt-4 text-[16px] leading-[1.7] text-muted-foreground"
            >
              Whether you build tools or recommend them, there&apos;s a place
              for you in the Replyma partner ecosystem. Apply today and start
              growing together.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: 0.18, ease }}
              className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
            >
              <Link href="/register" className="cursor-pointer group inline-flex w-full sm:w-auto h-11 items-center justify-center gap-2 rounded-lg bg-foreground px-6 text-[14px] font-medium text-background transition-all duration-200 hover:bg-foreground/90">
                  Apply now
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link href="/about" className="cursor-pointer inline-flex w-full sm:w-auto h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-6 text-[14px] font-medium text-foreground transition-all duration-200 hover:bg-secondary/60 hover:border-border/80">
                  Learn about Replyma
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}
