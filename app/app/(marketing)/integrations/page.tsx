"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Mail, MessageSquare,
  ShoppingBag, Globe, Zap, BarChart3, ArrowRight,
} from "lucide-react"

const ease = [0.23, 1, 0.32, 1]

type TabKey = "all" | "ecommerce" | "social" | "messaging" | "marketing"

type IntegrationIconKey = "ShoppingBag" | "Globe" | "Mail" | "MessageSquare" | "Zap" | "BarChart3"

interface Integration {
  name: string
  description: string
  iconKey: IntegrationIconKey
  status: "Available" | "Coming Soon"
  badge?: string
  tabs: TabKey[]
  iconColor: string
  iconBg: string
  href: string
}

function IntegrationIcon({ iconKey, className }: { iconKey: IntegrationIconKey; className?: string }) {
  if (iconKey === "ShoppingBag") return <ShoppingBag className={className} />
  if (iconKey === "Globe") return <Globe className={className} />
  if (iconKey === "Mail") return <Mail className={className} />
  if (iconKey === "MessageSquare") return <MessageSquare className={className} />
  if (iconKey === "Zap") return <Zap className={className} />
  return <BarChart3 className={className} />
}

const integrations: Integration[] = [
  { name: "Shopify", description: "Full OAuth integration. Sync orders, customers, products, and trigger one-click refunds or order edits directly from the inbox.", iconKey: "ShoppingBag", status: "Available", badge: "Deep sync", tabs: ["all", "ecommerce"], iconColor: "text-foreground/70", iconBg: "bg-secondary/60", href: "/features/shopify" },
  { name: "WooCommerce", description: "REST API integration for order and customer data sync. Connect your WooCommerce store via API keys.", iconKey: "Globe", status: "Available", tabs: ["all", "ecommerce"], iconColor: "text-foreground/70", iconBg: "bg-secondary/60", href: "/features/shopify" },
  { name: "Email", description: "Connect any email address. AI reads incoming emails, drafts context-aware replies, and sends them via AWS SES.", iconKey: "Mail", status: "Available", tabs: ["all", "messaging"], iconColor: "text-foreground/70", iconBg: "bg-secondary/60", href: "/features/inbox" },
  { name: "Live Chat", description: "Embed the Replyma chat widget on your store. AI handles conversations in real-time with your brand voice.", iconKey: "MessageSquare", status: "Available", tabs: ["all", "messaging"], iconColor: "text-foreground/70", iconBg: "bg-secondary/60", href: "/features/live-chat" },
  { name: "Shopping Assistant", description: "Proactive shopping and cart recovery features. Coming soon.", iconKey: "Zap", status: "Coming Soon", badge: "Coming soon", tabs: ["all", "social"], iconColor: "text-foreground/70", iconBg: "bg-secondary/60", href: "/features/shopping-assistant" },
  { name: "Klaviyo", description: "Sync customer support history with Klaviyo segments. Trigger flows based on ticket outcomes and CSAT scores.", iconKey: "BarChart3", status: "Available", badge: "Segment sync", tabs: ["all", "marketing"], iconColor: "text-foreground/70", iconBg: "bg-secondary/60", href: "/features/analytics" },
]

const tabs: { key: TabKey; label: string }[] = [
  { key: "all",       label: "All" },
  { key: "ecommerce", label: "E-commerce" },
  { key: "social",    label: "Social & Chat" },
  { key: "messaging",  label: "Messaging" },
  { key: "marketing", label: "Marketing" },
]

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("all")
  const filtered = integrations.filter(i => i.tabs.includes(activeTab))

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
            <Globe className="h-4 w-4" />
            Integrations
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.06, ease }}
            className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Works with what your store already runs on.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.12, ease }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          >
            Shopify, WooCommerce, Email, Live Chat — all in one inbox.
            No switching between platforms to reply.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.18, ease }}
            className="mt-10 flex flex-wrap items-center justify-center gap-6"
          >
            {[
              { value: "6", label: "integrations" },
              { value: "1-click", label: "Shopify install" },
              { value: "2", label: "messaging channels" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.22 + i * 0.07, duration: 0.5, ease }}
                className="flex items-baseline gap-2"
              >
                <span className="text-3xl font-semibold text-foreground tracking-[-0.03em]">{s.value}</span>
                <span className="text-sm text-muted-foreground">{s.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Filter + Grid */}
      <section className="border-t border-border/40 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          {/* Tabs */}
          <div className="-mx-6 mb-12 overflow-x-auto px-6 sm:mx-0 sm:overflow-visible sm:px-0">
            <div className="flex gap-2 pb-1 sm:justify-start" role="tablist">
              {tabs.map((tab, i) => (
                <motion.button
                  key={tab.key}
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04, ease }}
                  className={`shrink-0 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors duration-200 ${
                    activeTab === tab.key
                      ? "bg-accent text-white"
                      : "border border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Grid -- no AnimatePresence wrapping layout change */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease }}
            className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {filtered.map((item, i) => (
              <Link key={item.name} href={item.href}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: i * 0.06, ease }}
                className="group relative h-full rounded-xl border border-border/60 bg-background p-7 transition-all duration-300 hover:border-border hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.08)]"
              >
                <div className="flex items-start justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.iconBg}`}>
                    <IntegrationIcon iconKey={item.iconKey} className={`h-5 w-5 min-h-5 min-w-5 shrink-0 ${item.iconColor}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 + i * 0.06, ease }}
                        className="rounded-full border border-border/60 bg-background px-2 py-0.5 text-[10px] font-semibold text-accent"
                      >
                        {item.badge}
                      </motion.span>
                    )}
                    {item.status === "Coming Soon" && (
                      <span className="rounded-full border border-border/60 bg-secondary px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        Coming soon
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="mt-5 text-base font-semibold text-foreground">{item.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-accent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  Learn more
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </motion.div>
              </Link>
            ))}
          </motion.div>
        </div>
      </section>

      {/* API CTA */}
      <section className="border-t border-border/40 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ ease }}
                className="mb-3 text-[13px] font-medium text-accent"
              >
                Open API
              </motion.p>
              <motion.h2
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.06, ease }}
                className="text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-[2.5rem]"
              >
                Not seeing your tool?
                <br />Build it yourself.
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.12, ease }}
                className="mt-4 text-[17px] leading-relaxed text-muted-foreground"
              >
                Our REST API and webhooks connect to anything. Custom integrations
                are available on the Scale plan — or just ask us.
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1, ease }}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <motion.a
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                href="/api-docs"
                className="group inline-flex items-center gap-2 rounded-lg bg-foreground px-8 py-3.5 text-sm font-semibold text-background transition-colors duration-200 hover:bg-foreground/90"
              >
                View API docs
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                href="/register"
                className="inline-flex items-center gap-2 rounded-lg border border-border/60 px-8 py-3.5 text-sm font-semibold text-muted-foreground transition-colors duration-200 hover:border-border hover:text-foreground"
              >
                Request integration
              </motion.a>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}
