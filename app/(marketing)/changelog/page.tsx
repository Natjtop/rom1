"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

const ease = [0.23, 1, 0.32, 1] as const

const entries = [
  {
    version: "v2.4",
    date: "March 3, 2026",
    title: "Live chat widget improvements",
    bullets: [
      "Chat widget can be configured to show after a delay or on specific pages. More trigger types (e.g. time on page, exit intent) on the roadmap.",
      "Improved widget appearance and greeting configuration in the dashboard.",
      "Unified inbox: Email and Live Chat in one place with real-time updates.",
    ],
  },
  {
    version: "v2.3",
    date: "Feb 20, 2026",
    title: "WooCommerce deep sync",
    bullets: [
      "Order lookup, refund status, and tracking number retrieval are now fully supported for WooCommerce stores via the REST API.",
      "Customer order history is surfaced directly inside the inbox sidebar, matching the existing Shopify experience.",
      "Webhook support added so inventory and fulfillment changes sync in real-time instead of on a polling schedule.",
    ],
  },
  {
    version: "v2.2",
    date: "Feb 8, 2026",
    title: "AI response speed 2x faster",
    bullets: [
      "Migrated AI inference to a faster model serving layer — median first-token latency dropped from 1.8s to under 0.9s.",
      "Response streaming is now enabled by default in the live chat widget, so customers see answers appear word-by-word without waiting.",
      "Knowledge base retrieval now runs in parallel with generation, eliminating a sequential bottleneck that was adding ~300ms per query.",
    ],
  },
  {
    version: "v2.1",
    date: "Jan 25, 2026",
    title: "Knowledge base RAG improvements",
    bullets: [
      "Switched to a hybrid retrieval strategy combining dense vector search with BM25 keyword scoring — accuracy on ambiguous queries improved by 34% in internal evals.",
      "You can now tag knowledge base articles with topic labels, and the AI will bias retrieval toward articles matching the detected topic of the conversation.",
      "Added a 'Test this article' tool in the knowledge base editor so you can preview how the AI will use the content before publishing.",
    ],
  },
  {
    version: "v2.0",
    date: "Jan 10, 2026",
    title: "Complete UI redesign",
    bullets: [
      "Rebuilt the entire dashboard from scratch — new sidebar structure, inbox layout, and ticket thread view with a focus on keyboard-first navigation.",
      "Introduced the customer detail panel with a collapsible sidebar showing order history, past tickets, and live context next to every conversation.",
      "New onboarding flow reduces time-to-first-AI-reply from an average of 45 minutes to under 8 minutes for new accounts.",
    ],
  },
]

function TimelineEntry({ entry, index }: { entry: (typeof entries)[number]; index: number }) {
  return (
    <motion.div
      key={entry.version}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: index * 0.08, ease }}
      className="relative mb-16 last:mb-0"
    >
      {/* Timeline dot */}
      <motion.span
        className="absolute -left-[2.35rem] top-1 flex h-4 w-4 items-center justify-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ delay: index * 0.08 + 0.15, type: "spring", stiffness: 300, damping: 14 }}
      >
        <span className="h-2.5 w-2.5 rounded-full border-2 border-white/20 bg-black" />
      </motion.span>

      {/* Version + date row */}
      <motion.div
        className="flex flex-wrap items-center gap-3 mb-4"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, delay: index * 0.08 + 0.1, ease }}
      >
        <motion.span
          className="rounded-md bg-white/10 px-2.5 py-1 font-mono text-[12px] font-medium text-white/80"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          {entry.version}
        </motion.span>
        <span className="text-[13px] text-white/40">
          {entry.date}
        </span>
      </motion.div>

      {/* Title */}
      <motion.h2
        className="text-[1.25rem] font-medium leading-snug tracking-[-0.02em] text-white md:text-[1.5rem]"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, delay: index * 0.08 + 0.18, ease }}
      >
        {entry.title}
      </motion.h2>

      {/* Bullets */}
      <ul className="mt-5 flex flex-col gap-3">
        {entry.bullets.map((bullet, j) => (
          <motion.li
            key={j}
            className="flex items-start gap-3"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: index * 0.08 + 0.25 + j * 0.07, ease }}
          >
            <motion.span
              className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-white/20"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: index * 0.08 + 0.3 + j * 0.07, type: "spring", stiffness: 300, damping: 12 }}
            />
            <span className="text-[15px] leading-relaxed text-white/60">
              {bullet}
            </span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  )
}

export default function ChangelogPage() {
  return (
    <div className="bg-transparent text-white">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/10 bg-transparent">
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-16 text-center sm:pt-32 sm:pb-20">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 liquid-glass px-4 py-1.5 text-sm text-white/80"
          >
            Changelog
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.06, ease }}
            className="text-4xl font-medium tracking-tight sm:text-5xl lg:text-6xl"
          >
            What&apos;s new in <span className="font-serif italic text-white/80">Bloom.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.12, ease }}
            className="mx-auto mt-6 max-w-2xl text-lg text-white/60 sm:text-xl"
          >
            Every update, improvement, and fix — in reverse chronological order.
          </motion.p>
        </div>
      </section>

      {/* Entries */}
      <section className="border-t border-white/10 py-24 md:py-32">
        <div className="max-w-[800px] mx-auto px-6">
          <div className="relative border-l border-white/20 pl-8">
            {entries.map((entry, i) => (
              <TimelineEntry key={entry.version} entry={entry} index={i} />
            ))}
          </div>

          {/* Footer CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, ease }}
            className="mt-20 flex flex-col items-start gap-3 border-t border-white/10 pt-12 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-[14px] text-white/60">
              Want early access to upcoming features?{" "}
              <span className="text-white font-medium">Join the beta list.</span>
            </p>
            <Link href="/register" className="cursor-pointer group inline-flex w-full sm:w-auto h-10 items-center justify-center gap-2 rounded-full bg-white px-5 text-[13px] font-medium text-black transition-all duration-200 hover:bg-white/90">
                Start free trial
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

