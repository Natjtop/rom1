"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { BookOpen, Clock } from "lucide-react"

const ease = [0.23, 1, 0.32, 1]

const featuredPost = {
  category: "Strategy",
  title: "How we cut first response time from 4 hours to 4 seconds — without adding headcount",
  excerpt: "The complete breakdown of how Lumina Skincare deployed Replyma AI and what actually happened to their support metrics after the first 90 days.",
  readTime: "8 min read",
  author: "Marcus Reilly",
  role: "Head of Product",
  date: "Feb 28, 2026",
}

const posts = [
  {
    category: "Guide",
    title: "Writing a return policy the AI can actually understand",
    excerpt: "Not all policy documents are equal. Here's the exact format and language that makes RAG-based AI dramatically more accurate.",
    readTime: "5 min read",
    date: "Feb 22, 2026",
  },
  {
    category: "Case Study",
    title: "Black Friday on autopilot: 4x ticket volume, zero extra headcount",
    excerpt: "How Freshleaf Co. handled their biggest sales period using Replyma's AI — and what the data actually looked like at the end.",
    readTime: "6 min read",
    date: "Feb 15, 2026",
  },
  {
    category: "Product",
    title: "New: Proactive live chat triggers based on cart abandonment signals",
    excerpt: "We shipped four new behavior-based trigger types for the live chat widget. Here's what they do and when to use each one.",
    readTime: "3 min read",
    date: "Feb 10, 2026",
  },
  {
    category: "Guide",
    title: "Shopify refund policies that AI can execute autonomously",
    excerpt: "The difference between a policy the AI 'understands' and one it can act on autonomously — and how to close that gap.",
    readTime: "7 min read",
    date: "Feb 3, 2026",
  },
  {
    category: "Strategy",
    title: "The hidden cost of per-ticket pricing during holiday peaks",
    excerpt: "A financial model showing exactly what happens to your support budget when you use volume-based pricing and have a good Q4.",
    readTime: "4 min read",
    date: "Jan 27, 2026",
  },
  {
    category: "Product",
    title: "WooCommerce integration: what's possible and what's coming",
    excerpt: "Full breakdown of the current WooCommerce integration depth, limits, and the roadmap items shipping in Q2.",
    readTime: "4 min read",
    date: "Jan 20, 2026",
  },
]

const categoryColors: Record<string, string> = {
  Strategy: "bg-accent/8 text-accent",
  Guide: "bg-secondary text-muted-foreground",
  "Case Study": "bg-secondary text-muted-foreground",
  Product: "bg-secondary text-muted-foreground",
}

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("All")
  const filteredPosts = activeCategory === "All"
    ? posts
    : posts.filter((post) => post.category === activeCategory)

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-background to-surface-sunken">
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-16 text-center sm:pt-32 sm:pb-20">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ease }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-4 py-1.5 text-sm text-muted-foreground"
          >
            <BookOpen className="h-4 w-4" />
            Blog
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.06, duration: 0.5, ease }}
            className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Writing for e-commerce{" "}
            <span className="text-h1-muted">support teams.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.12, duration: 0.5, ease }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          >
            Guides, case studies, and product updates from the Replyma team. No filler, no SEO fluff.
          </motion.p>
        </div>
      </section>

      {/* Featured post */}
      <section className="relative border-t border-border/40 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="overflow-hidden rounded-xl border border-border/60 bg-card transition-shadow duration-300 hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.08)]"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Content side */}
              <div className="flex flex-col justify-between p-8 md:p-10">
                <div>
                  <motion.span
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2, ease }}
                    className={`mb-5 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${categoryColors[featuredPost.category]}`}
                  >
                    {featuredPost.category}
                  </motion.span>
                  <h2 className="text-xl font-semibold leading-snug tracking-[-0.02em] text-foreground md:text-2xl">
                    {featuredPost.title}
                  </h2>
                  <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                    {featuredPost.excerpt}
                  </p>
                </div>
                <div className="mt-8 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 400, damping: 15 }}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary"
                    >
                      <span className="text-[10px] font-semibold text-foreground">
                        {featuredPost.author.split(" ").map(n => n[0]).join("")}
                      </span>
                    </motion.div>
                    <div>
                      <p className="text-[13px] font-medium text-foreground">{featuredPost.author}</p>
                      <p className="text-[12px] text-muted-foreground">{featuredPost.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                    <Clock className="h-3.5 w-3.5" />
                    {featuredPost.readTime}
                    <span className="text-border/60">·</span>
                    {featuredPost.date}
                  </div>
                </div>
              </div>
              {/* Action side */}
              <div className="flex flex-col items-center justify-center border-t border-border/40 bg-secondary/30 p-8 md:border-l md:border-t-0 md:p-10">
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.25, ease }}
                >
                  <BookOpen className="h-10 w-10 text-muted-foreground/30" />
                </motion.div>
                <p className="mt-4 text-center text-sm text-muted-foreground">Featured article</p>
                <span className="mt-6 inline-flex items-center gap-2 rounded-lg bg-foreground px-6 py-2.5 text-sm font-medium text-background">
                    Coming soon
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Post grid */}
      <section className="relative border-t border-border/40 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ ease }}
            className="mb-10 flex items-center justify-between"
          >
            <p className="text-sm font-semibold text-foreground">All articles</p>
            <div className="flex gap-2">
              {["All", "Strategy", "Guide", "Case Study", "Product"].map((cat, i) => (
                <motion.button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04, ease }}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                    activeCategory === cat
                      ? "bg-foreground text-background shadow-sm"
                      : "border border-border/40 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  {cat}
                </motion.button>
              ))}
            </div>
          </motion.div>
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease }}
            className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
          >
            {filteredPosts.map((post, i) => (
              <motion.div
                key={post.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.5, ease }}
              >
                  <div className="h-full rounded-xl border border-border/60 bg-card p-7 transition-all duration-300 hover:border-border hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.08)]">
                    <motion.span
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 + i * 0.07, ease }}
                      className={`mb-5 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${categoryColors[post.category]}`}
                    >
                      {post.category}
                    </motion.span>
                    <h3 className="text-[15px] font-semibold leading-snug tracking-tight text-foreground">
                      {post.title}
                    </h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground/60">
                      <Clock className="h-3 w-3" />
                      {post.readTime}
                      <span className="text-border/60">·</span>
                      {post.date}
                    </div>
                  </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="relative border-t border-border/40 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="mx-auto max-w-2xl text-center">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ ease }}
              className="text-[13px] font-medium text-accent"
            >
              Newsletter
            </motion.p>
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.06, ease }}
              className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-[2.5rem]"
            >
              New article every Tuesday.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.12, ease }}
              className="mt-4 text-[15px] leading-relaxed text-muted-foreground"
            >
              One short, practical piece for e-commerce support leads. No marketing, no padding.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.18, ease }}
              className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
            >
              <input
                type="email"
                placeholder="your@email.com"
                className="h-11 w-full max-w-xs rounded-lg border border-border/60 bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 sm:w-64"
              />
              <button
                className="h-11 rounded-lg bg-foreground px-6 text-sm font-medium text-background transition-all duration-200 hover:bg-foreground/90"
              >
                Subscribe
              </button>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}
