"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Check, Minus, ArrowRight, Zap } from "lucide-react"
import Link from "next/link"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { PLANS } from "@/lib/plans"

const ease = [0.23, 1, 0.32, 1]

const planCards = PLANS.filter((p) => p.price > 0).map((p) => ({
  name: p.name,
  price: p.price,
  annualPrice: p.annualPrice,
  description:
    p.key === "starter"
      ? "For small stores just getting started with AI support."
      : p.key === "growth"
        ? "For growing brands that need full AI coverage."
        : "For high-volume stores that need unlimited AI power.",
  features: [
    ...p.features,
    ...(p.key === "starter" ? ["Email support"] : []),
    ...(p.key === "growth" ? ["Priority support"] : []),
    ...(p.key === "scale" ? ["Custom analytics & reports", "Dedicated account manager"] : []),
  ],
  cta: "Get started",
  highlighted: p.key === "growth",
}))

const comparisonFeatures = [
  { name: "AI resolutions/mo", starter: "500", growth: "2,000", scale: "10,000" },
  { name: "Agent seats", starter: "2", growth: "5", scale: "Unlimited" },
  { name: "Stores", starter: "1", growth: "3", scale: "Unlimited" },
  { name: "Channels", starter: "Email + Live Chat", growth: "Email + Live Chat", scale: "Email + Live Chat" },
  { name: "Shopify integration", starter: true, growth: true, scale: true },
  { name: "Knowledge base + RAG", starter: false, growth: true, scale: true },
  { name: "Macros & canned responses", starter: false, growth: true, scale: true },
  { name: "Automation rules", starter: false, growth: true, scale: true },
  { name: "Advanced analytics", starter: false, growth: true, scale: true },
  { name: "Custom AI training", starter: false, growth: false, scale: true },
  { name: "Dedicated onboarding", starter: false, growth: false, scale: true },
  { name: "SLA guarantee", starter: false, growth: false, scale: true },
  { name: "Dedicated account manager", starter: false, growth: false, scale: true },
]

const faqs = [
  {
    question: "Do I need a developer to set this up?",
    answer:
      "Not at all. Replyma connects to Shopify in one click via our official app. You can also connect your Gmail or set up email forwarding. The entire setup takes under 15 minutes with zero code required.",
  },
  {
    question: "How does the AI know my policies?",
    answer:
      "You upload your return policy, FAQ document, or help center articles. Our AI uses RAG (Retrieval-Augmented Generation) to search through your content and craft accurate, contextual responses based on your specific rules.",
  },
  {
    question: "Can humans take over from the AI?",
    answer:
      "Absolutely. The AI handles routine tickets automatically, but any ticket can be escalated to a human agent at any time. Your team can also set rules for when escalation should happen automatically.",
  },
  {
    question: "What counts as an AI resolution?",
    answer:
      "An AI resolution is when the AI agent fully handles a ticket without human intervention. If the AI escalates to a human agent, it does not count as a resolution.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes, all paid plans include a free tier to get started with full access to all features. No credit card required to start.",
  },
  {
    question: "What happens when I hit my AI resolution limit?",
    answer:
      "Tickets will still come in, but the AI will stop auto-replying. Your human agents can continue handling tickets normally. You can upgrade anytime to restore AI capabilities.",
  },
]

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)

  return (
    <div className="bg-transparent text-white">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-16 text-center sm:pt-32 sm:pb-20">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ease }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 liquid-glass px-4 py-1.5 text-sm text-white/60"
          >
            <Zap className="h-3.5 w-3.5" />
            Simple, predictable pricing
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.06, ease }}
            className="text-4xl font-medium tracking-tight sm:text-5xl lg:text-6xl text-white"
          >
            Simple pricing. <span className="font-serif italic text-white/80">Scale</span> as you grow.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.12, ease }}
            className="mx-auto mt-6 max-w-2xl text-lg text-white/60 sm:text-xl"
          >
            Your support bill shouldn&apos;t double just because you ran a good
            promotion. Flat monthly rate, from $49.
          </motion.p>

          {/* Annual toggle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.18, ease }}
            className="mt-10 flex justify-center"
          >
            <div className="relative inline-flex items-center">
              <div className="flex items-center gap-3">
                <span
                  className={`text-[14px] font-medium transition-colors ${!annual ? "text-white" : "text-white/50"}`}
                >
                  Monthly
                </span>
                <button
                  onClick={() => setAnnual(!annual)}
                  className={`relative h-7 w-12 rounded-full border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${annual ? "border-white/20 bg-white/10" : "border-white/10 bg-white/5"}`}
                  aria-label="Toggle annual billing"
                  role="switch"
                  aria-checked={annual}
                >
                  <motion.span
                    animate={{ x: annual ? 20 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-sm"
                  />
                </button>
                <span
                  className={`text-[14px] font-medium transition-colors ${annual ? "text-white" : "text-white/50"}`}
                >
                  Annual
                </span>
              </div>
              <span className="absolute left-full ml-3 rounded-full bg-white/10 px-2.5 py-0.5 text-[12px] font-semibold text-white whitespace-nowrap">
                Save 20%
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Plan cards */}
      <section className="mx-auto max-w-[1200px] px-6 py-12 md:py-16">
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-6 md:grid-cols-3">
          {planCards.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 + i * 0.08, ease, duration: 0.6 }}
              className={`relative flex flex-col rounded-3xl border p-6 sm:p-8 transition-all duration-300 liquid-glass ${
                plan.highlighted
                  ? "border-white/30 shadow-[0_20px_60px_-16px_rgba(255,255,255,0.1)] ring-1 ring-white/10"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              {plan.highlighted && (
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 14 }}
                  className="absolute -top-3.5 left-6 rounded-full bg-white px-4 py-1 text-[12px] font-semibold text-black shadow-sm"
                >
                  Most popular
                </motion.div>
              )}

              <div className={plan.highlighted ? "pt-1" : ""}>
                <p
                  className={`text-[12px] font-semibold uppercase tracking-[0.08em] ${plan.highlighted ? "text-white" : "text-white/60"}`}
                >
                  {plan.name}
                </p>
                <div className="mt-4 flex items-baseline gap-1">
                  <motion.span
                    key={`${plan.name}-${annual}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, ease }}
                    className="text-[48px] font-medium tracking-[-0.04em] text-white"
                  >
                    {plan.price === 0 ? "Free" : `$${annual ? Math.round(plan.annualPrice / 12) : plan.price}`}
                  </motion.span>
                  {plan.price > 0 && <span className="text-[14px] text-white/60">/mo</span>}
                </div>
                {annual && plan.price > 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-0.5 text-[12px] text-white/50"
                  >
                    billed annually at ${plan.annualPrice}/yr
                  </motion.p>
                )}
                <p className="mt-3 text-[14px] leading-relaxed text-white/60">
                  {plan.description}
                </p>

                <Link
                  href="/register"
                  className={`mt-6 flex w-full items-center justify-center rounded-full py-3 text-[14px] font-medium transition-all duration-200 ${
                    plan.highlighted
                      ? "bg-white text-black hover:bg-white/90"
                      : "border border-white/20 bg-transparent text-white hover:bg-white/10"
                  }`}
                >
                  {plan.cta}
                </Link>

                <div className="mt-7 flex-1 border-t border-white/10 pt-7">
                  <p className="mb-4 text-[12px] font-semibold uppercase tracking-wider text-white/50">
                    What&apos;s included
                  </p>
                  <ul className="flex flex-col gap-3">
                    {plan.features.map((feature, fi) => (
                      <motion.li
                        key={feature}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 + i * 0.08 + fi * 0.03, ease }}
                        className="flex items-start gap-2.5"
                      >
                        <motion.div
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.25 + i * 0.08 + fi * 0.03, type: "spring", stiffness: 300, damping: 14 }}
                          className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-white/10"
                        >
                          <Check className="h-2.5 w-2.5 text-white" />
                        </motion.div>
                        <span className="text-[14px] text-white/80">
                          {feature}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, ease }}
          className="mt-10 text-center text-[13px] text-white/50"
        >
          Free plan available. No credit card required to start. Cancel
          anytime.
        </motion.p>
      </section>

      {/* Comparison table */}
      <section className="relative border-t border-white/10 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="mb-14 text-center">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ ease }}
              className="mb-3 text-[13px] font-medium text-white/60"
            >
              Compare plans
            </motion.p>
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.06, ease }}
              className="text-3xl font-medium tracking-[-0.03em] text-white md:text-[2.5rem]"
            >
              Every plan, <span className="font-serif italic text-white/80">side by side</span>.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.12, ease }}
              className="mt-3 text-[15px] text-white/60"
            >
              No asterisks. No fine print.
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6, ease }}
            className="overflow-x-auto rounded-3xl border border-white/10 liquid-glass shadow-sm"
          >
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="w-[40%] px-6 py-4 text-[13px] font-medium text-white/60">
                    Feature
                  </th>
                  <th className="px-6 py-4 text-center text-[13px] font-medium text-white/60">
                    Starter
                  </th>
                  <th className="bg-white/5 px-6 py-4 text-center">
                    <span className="text-[13px] font-semibold text-white">Growth</span>
                    <span className="ml-1.5 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white">
                      Popular
                    </span>
                  </th>
                  <th className="px-6 py-4 text-center text-[13px] font-medium text-white/60">
                    Scale
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((f, i) => (
                  <motion.tr
                    key={f.name}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.03, ease, duration: 0.5 }}
                    className={`border-b border-white/10 transition-colors hover:bg-white/5 ${i % 2 !== 0 ? "bg-white/[0.02]" : ""}`}
                  >
                    <td className="px-6 py-3.5 text-[14px] text-white/80">
                      {f.name}
                    </td>
                    {(["starter", "growth", "scale"] as const).map((plan) => {
                      const val = f[plan]
                      return (
                        <td
                          key={plan}
                          className={`px-6 py-3.5 text-center text-[14px] ${plan === "growth" ? "bg-white/[0.02]" : ""}`}
                        >
                          {typeof val === "boolean" ? (
                            val ? (
                              <div className="flex justify-center">
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              </div>
                            ) : (
                              <Minus className="mx-auto h-4 w-4 text-white/20" />
                            )
                          ) : (
                            <span className="font-medium text-white">
                              {val}
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-white/10 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-start">
            <div className="sticky top-28">
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ ease }}
                className="mb-3 text-[13px] font-medium text-white/60"
              >
                FAQ
              </motion.p>
              <motion.h2
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.06, ease }}
                className="text-3xl font-medium tracking-[-0.03em] text-white md:text-[2.5rem]"
              >
                Questions before you <span className="font-serif italic text-white/80">sign up</span>.
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.12, ease }}
                className="mt-4 text-[15px] leading-relaxed text-white/60"
              >
                If you don&apos;t find it here, chat with us -- bottom right
                corner of your screen.
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.18, ease }}
                className="mt-8"
              >
                <Link
                  href="/register"
                  className="group inline-flex w-full sm:w-auto h-11 items-center justify-center gap-2 rounded-full bg-white px-6 text-[14px] font-medium text-black transition-all duration-200 hover:bg-white/90 hover:scale-105"
                >
                  Get started
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08, ease }}
            >
              <Accordion type="single" collapsible>
                {faqs.map((faq, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06, ease }}
                  >
                    <AccordionItem
                      value={`faq-${i}`}
                      className="border-white/10"
                    >
                      <AccordionTrigger className="py-5 text-[15px] font-medium text-white hover:text-white/80 hover:no-underline">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="pb-5 text-[15px] leading-relaxed text-white/60">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                ))}
              </Accordion>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-white/10 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ ease }}
            className="rounded-3xl border border-white/10 liquid-glass p-12 text-center shadow-sm md:p-16"
          >
            <h2 className="text-[1.75rem] font-medium tracking-[-0.03em] text-white md:text-[2rem]">
              Ready to <span className="font-serif italic text-white/80">simplify</span> your support?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-white/60">
              Free plan available, no credit card required. Connect your store and have the AI answering tickets in under 10 minutes.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="group inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-[14px] font-medium text-black transition-all duration-200 hover:bg-white/90 hover:scale-105"
              >
                Get started
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/register"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-white/20 bg-transparent px-7 text-[14px] font-medium text-white transition-all duration-200 hover:bg-white/10"
              >
                Talk to sales
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
