"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Search, FileQuestion, ChevronRight, BookOpen, ArrowRight, Bot, MessageSquare, ShoppingCart, Zap, BarChart3, CreditCard, Users, Settings, Puzzle } from "lucide-react"
import { categories, allArticles, type CategoryIconKey } from "./articles"

function CategoryIcon({ iconKey, className }: { iconKey: CategoryIconKey; className?: string }) {
  switch (iconKey) {
    case "Bot": return <Bot className={className} />
    case "MessageSquare": return <MessageSquare className={className} />
    case "ShoppingCart": return <ShoppingCart className={className} />
    case "Zap": return <Zap className={className} />
    case "BarChart3": return <BarChart3 className={className} />
    case "BookOpen": return <BookOpen className={className} />
    case "CreditCard": return <CreditCard className={className} />
    case "Users": return <Users className={className} />
    case "Settings": return <Settings className={className} />
    case "Puzzle": return <Puzzle className={className} />
    default: return null
  }
}

const ease = [0.23, 1, 0.32, 1] as const

const popularSlugs = [
  "setting-up-ai-agent",
  "building-first-rule",
  "one-click-refunds",
  "connecting-email",
  "ai-resolution-rate",
]

const popularArticles = popularSlugs
  .map(slug => allArticles.find(a => a.slug === slug))
  .filter(Boolean) as typeof allArticles

export default function HelpCenterPage() {
  const [query, setQuery] = useState("")
  const lowerQuery = query.toLowerCase().trim()

  const filteredCategories = lowerQuery
    ? categories
        .map(cat => ({
          ...cat,
          articles: cat.articles.filter(a =>
            a.title.toLowerCase().includes(lowerQuery) || a.content.toLowerCase().includes(lowerQuery)
          ),
        }))
        .filter(cat => cat.articles.length > 0 || cat.title.toLowerCase().includes(lowerQuery))
    : categories

  const filteredPopular = lowerQuery
    ? popularArticles.filter(a =>
        a.title.toLowerCase().includes(lowerQuery) || a.category.toLowerCase().includes(lowerQuery)
      )
    : popularArticles

  const totalArticles = allArticles.length

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
            <BookOpen className="h-4 w-4" />
            Help Center
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.06, duration: 0.6, ease }}
            className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            How can we help?
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.12, duration: 0.6, ease }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          >
            Search our knowledge base or browse by category below.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.18, duration: 0.6, ease }}
            className="mx-auto mt-10 max-w-xl"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground/40" />
              <input
                type="search"
                placeholder={`Search ${totalArticles} articles...`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-12 w-full rounded-xl border border-border/60 bg-card pl-12 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-border focus:outline-none focus:ring-2 focus:ring-border/20 transition-shadow duration-200 hover:shadow-[0_4px_20px_-8px_rgb(0_0_0/0.06)]"
              />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.24, duration: 0.6, ease }}
            className="mt-4 flex flex-wrap items-center justify-center gap-2"
          >
            {["Shopify refunds", "Connect Email", "AI escalation", "WISMO replies"].map((s, i) => (
              <motion.button
                key={s}
                onClick={() => setQuery(s)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.28 + i * 0.06, duration: 0.5, ease }}
                className="rounded-full border border-border/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-200 hover:border-border hover:text-foreground hover:shadow-[0_4px_20px_-8px_rgb(0_0_0/0.06)]"
              >
                {s}
              </motion.button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="relative border-t border-border/40 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="mb-10">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease }}
              className="text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-[2.5rem]"
            >
              Browse by category
            </motion.h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCategories.length === 0 && (
              <p className="col-span-full text-center text-sm text-muted-foreground py-8">
                No articles match your search. Try a different query.
              </p>
            )}
            {filteredCategories.map((cat, i) => (
              <motion.div
                key={cat.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.6, ease }}
                className="group rounded-xl border border-border/60 bg-card p-6 transition-shadow duration-300 hover:border-border hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.08)]"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-secondary/50 transition-colors duration-200 group-hover:border-accent/20 group-hover:bg-accent/8">
                    <CategoryIcon iconKey={cat.iconKey} className="h-4.5 w-4.5 min-h-[18px] min-w-[18px] shrink-0 text-foreground transition-colors duration-200 group-hover:text-accent" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground/60">
                    {cat.articles.length} {cat.articles.length === 1 ? "article" : "articles"}
                  </span>
                </div>
                <p className="text-[15px] font-semibold text-foreground">{cat.title}</p>
                <ul className="mt-3 flex flex-col gap-2">
                  {cat.articles.slice(0, 4).map(article => (
                    <li key={article.slug}>
                      <Link
                        href={`/help-center/${article.slug}`}
                        className="flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors duration-200 hover:text-foreground"
                      >
                        <ChevronRight className="h-3 w-3 shrink-0" />
                        {article.title}
                      </Link>
                    </li>
                  ))}
                </ul>
                {cat.articles.length > 4 && (
                  <p className="mt-3 text-[12px] text-muted-foreground/50">
                    + {cat.articles.length - 4} more articles
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular + Support */}
      <section className="relative border-t border-border/40 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-2">
            <div>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease }}
                className="mb-3 text-[13px] font-medium text-accent"
              >
                Popular
              </motion.p>
              <motion.h2
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.06, duration: 0.6, ease }}
                className="text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-[2.5rem] mb-7"
              >
                Most viewed
              </motion.h2>
              <div className="flex flex-col gap-2.5">
                {filteredPopular.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4">No articles match your search.</p>
                )}
                {filteredPopular.map((article, i) => (
                  <motion.div
                    key={article.slug}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07, duration: 0.5, ease }}
                  >
                    <Link
                      href={`/help-center/${article.slug}`}
                      className="group flex items-center gap-4 rounded-xl border border-border/60 bg-card px-5 py-4 transition-all duration-200 hover:border-border hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.08)]"
                    >
                      <span className="text-xl font-semibold tracking-tighter text-border/40 w-6 shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground transition-colors duration-200 group-hover:text-accent truncate">
                          {article.title}
                        </p>
                        <span className="text-[10px] font-medium text-muted-foreground/60">{article.category}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>

            <div>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease }}
                className="mb-3 text-[13px] font-medium text-accent"
              >
                Support
              </motion.p>
              <motion.h2
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.06, duration: 0.6, ease }}
                className="text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-[2.5rem] mb-7"
              >
                Still need help?
              </motion.h2>
              <div className="flex flex-col gap-3">
                {[
                  { title: "Email us", sub: "support@replyma.com — replies within 2 hours", action: "Send email", href: "mailto:support@replyma.com" },
                  { title: "API Documentation", sub: "REST API reference, webhooks, and SDKs", action: "View docs", href: "/api-docs" },
                ].map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.6, ease }}
                  >
                    <Link
                      href={item.href}
                      className="group flex items-center gap-4 rounded-xl border border-border/60 bg-card px-6 py-5 transition-all duration-200 hover:border-border hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.08)]"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-secondary/50 transition-colors duration-200 group-hover:border-accent/20 group-hover:bg-accent/8">
                        {item.title === "Email us" && <FileQuestion className="h-5 w-5 text-foreground/70 transition-colors duration-200 group-hover:text-accent" />}
                        {item.title === "API Documentation" && <BookOpen className="h-5 w-5 text-foreground/70 transition-colors duration-200 group-hover:text-accent" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
                      </div>
                      <span className="text-xs font-semibold text-accent opacity-0 transition-all duration-200 group-hover:opacity-100">
                        {item.action}
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
