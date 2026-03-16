"use client"

import { useRef } from "react"
import Link from "next/link"
import { motion, useInView } from "framer-motion"
import {
  ArrowRight,
  ChevronRight,
  ShoppingCart,
  Sparkles,
  Package,
  TrendingUp,
  MessageSquare,
  Target,
} from "lucide-react"

const ease = [0.23, 1, 0.32, 1] as const

const capabilities = [
  { iconKey: "Sparkles" as const, title: "Product recommendations", detail: "AI uses your Shopify catalog to suggest the right products. Promote or exclude by product, tag, or vendor from Settings." },
  { iconKey: "ShoppingCart" as const, title: "Add to cart from chat", detail: "Product cards in the widget include an Add to cart button. Your storefront listens for replyma:addToCart and adds the item via Storefront API." },
  { iconKey: "TrendingUp" as const, title: "Upsell & cross-sell (coming soon)", detail: "Smart triggers to suggest complementary products at the right moment. Roadmap." },
  { iconKey: "Target" as const, title: "Guided shopping", detail: "The AI can ask 1–2 short questions (size, color, budget) before recommending, and show quick-reply chips for faster answers." },
]

function CapabilityIcon({ iconKey, className }: { iconKey: "Sparkles" | "ShoppingCart" | "TrendingUp" | "Target"; className?: string }) {
  if (iconKey === "Sparkles") return <Sparkles className={className} />
  if (iconKey === "ShoppingCart") return <ShoppingCart className={className} />
  if (iconKey === "TrendingUp") return <TrendingUp className={className} />
  return <Target className={className} />
}

const chatMessages = [
  {
    from: "bot",
    text: "I see you\u2019re looking at running shoes! What\u2019s your primary use \u2014 road running, trail, or gym?",
    time: "3:22 PM",
  },
  {
    from: "customer",
    text: "Road running, I do about 30 miles a week",
    time: "3:23 PM",
  },
  {
    from: "bot",
    text: "For high-mileage road running, I\u2019d recommend the CloudStride Pro ($159) or the AirPace Elite ($189). The CloudStride has more cushioning for daily training, while the AirPace is lighter for tempo runs. Want me to check your size?",
    time: "3:23 PM",
  },
  {
    from: "customer",
    text: "CloudStride Pro sounds perfect, size 10",
    time: "3:24 PM",
  },
  {
    from: "bot",
    text: "CloudStride Pro (Size 10) is a great pick. Tap Add to cart below to add it, or open the product page. Customers who bought these also love our Performance Running Socks ($18).",
    time: "3:24 PM",
  },
]

/* ── Stagger card ──────────────────────────────────────────── */
function StaggerCard({ children, index, className }: { children: React.ReactNode; index: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.07, ease }}
      className={`${className} transition-all duration-300 hover:border-border hover:shadow-[0_8px_30px_-12px_rgb(0_0_0/0.08)]`}
    >
      {children}
    </motion.div>
  )
}

export default function ShoppingAssistantPage() {
  const heroChat = useRef<HTMLDivElement>(null)
  const heroChatInView = useInView(heroChat, { once: true, margin: "-80px" })

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
            <ShoppingCart className="h-3.5 w-3.5" />
            Shopping Assistant
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.65, delay: 0.06, ease }}
            className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Turn browsers into buyers with AI.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.65, delay: 0.12, ease }}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          >
            An AI shopping assistant that recommends products from your catalog, shows product cards in chat,
            and lets customers add to cart from the widget &mdash; all inside live chat. Connect Shopify and turn on Shopping Assistant in settings.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.65, delay: 0.18, ease }}
            className="mt-10 flex w-full flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link href="/register"
              className="inline-flex h-11 w-full sm:w-auto items-center justify-center rounded-lg bg-foreground px-8 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
            >
                Start free trial
            </Link>
            <Link href="/pricing"
              className="inline-flex h-11 w-full sm:w-auto items-center justify-center rounded-lg border border-border bg-background px-8 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
                See pricing
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Chat widget mockup */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-sm px-6">
          <motion.div
            ref={heroChat}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.65, delay: 0.22, ease }}
            className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-xl shadow-black/[0.03]"
            >
              <div className="flex items-center gap-3 border-b border-border/60 px-5 py-3.5">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.3 }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary"
                >
                  <MessageSquare className="h-4 w-4 text-foreground" />
                </motion.div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Shopping Assistant
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Typically replies in seconds
                  </p>
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.4 }}
                  className="ml-auto flex h-2 w-2 rounded-full bg-emerald-400"
                />
              </div>
              <div className="flex flex-col gap-3 px-4 py-4">
                {chatMessages.slice(0, 3).map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={heroChatInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + i * 0.2, ease }}
                    className={`flex ${msg.from === "customer" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed ${
                        msg.from === "customer"
                          ? "bg-foreground text-background rounded-br-sm"
                          : "bg-secondary text-foreground rounded-bl-sm border border-border/60"
                      }`}
                    >
                      {msg.text}
                      <p className="mt-1 text-[10px] opacity-50">{msg.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="border-t border-border/60 px-4 py-3">
                <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/50 px-3 py-2">
                  <span className="flex-1 text-sm text-muted-foreground">
                    Type a message...
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </motion.div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="relative border-t border-border/40 py-24 md:py-32">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute right-1/4 top-1/2 h-[400px] w-[500px] -translate-y-1/2 rounded-full bg-accent/[0.02] blur-[80px]" />
        </div>
        <div className="relative mx-auto max-w-[1200px] px-6">
          <div className="mb-14 max-w-xl">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease }}
              className="mb-3 text-[13px] font-semibold uppercase tracking-widest text-accent"
            >
              Capabilities
            </motion.p>
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.06, ease }}
              className="text-3xl md:text-[2.5rem] font-semibold tracking-[-0.03em] leading-[1.12] text-foreground"
            >
              Your best salesperson works 24/7.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.12, ease }}
              className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted-foreground"
            >
              The AI handles product discovery, cart building, and upsells
              autonomously &mdash; so your team can focus on complex requests.
            </motion.p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {capabilities.map((cap, i) => (
              <StaggerCard key={cap.title} index={i} className="rounded-xl border border-border/60 bg-card p-7">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10">
                  <CapabilityIcon iconKey={cap.iconKey} className="h-5 w-5 min-h-5 min-w-5 shrink-0 text-foreground" />
                </div>
                <h3 className="text-[17px] font-semibold tracking-tight text-foreground">
                  {cap.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  {cap.detail}
                </p>
              </StaggerCard>
            ))}
          </div>
        </div>
      </section>

      {/* Example conversation */}
      <section className="relative border-t border-border/40 py-24 md:py-32">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-1/3 bottom-0 h-[350px] w-[500px] rounded-full bg-accent/[0.02] blur-[80px]" />
        </div>
        <div className="relative mx-auto max-w-[1200px] px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease }}
                className="mb-3 text-[13px] font-semibold uppercase tracking-widest text-accent"
              >
                In action
              </motion.p>
              <motion.h2
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.06, ease }}
                className="text-3xl md:text-[2.5rem] font-semibold tracking-[-0.03em] leading-[1.12] text-foreground"
              >
                From &ldquo;just browsing&rdquo; to{" "}
                <span className="bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent">checkout in 90 seconds.</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.12, ease }}
                className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted-foreground"
              >
                The AI asks the right questions, recommends the right product,
                adds it to cart, and lands an upsell &mdash; all in a single
                natural conversation.
              </motion.p>
            </div>

            {/* Full chat widget mockup */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.08, ease }}
              className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-xl shadow-black/[0.03]"
            >
              <div className="flex items-center gap-3 border-b border-border/60 px-5 py-3.5">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.2 }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary"
                >
                  <MessageSquare className="h-4 w-4 text-foreground" />
                </motion.div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Shopping Assistant
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Typically replies in seconds
                  </p>
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.3 }}
                  className="ml-auto flex h-2 w-2 rounded-full bg-emerald-400"
                />
              </div>
              <div className="flex flex-col gap-3 px-4 py-4">
                {chatMessages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.3 + i * 0.18, ease }}
                    className={`flex ${msg.from === "customer" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed ${
                        msg.from === "customer"
                          ? "bg-foreground text-background rounded-br-sm"
                          : "bg-secondary text-foreground rounded-bl-sm border border-border/60"
                      }`}
                    >
                      {msg.text}
                      <p className="mt-1 text-[10px] opacity-50">{msg.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 1.3, ease }}
                className="border-t border-border/60 px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 300, damping: 15, delay: 1.4 }}
                    className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1"
                  >
                    <Package className="h-3 w-3 text-emerald-600" />
                    <span className="text-[10px] font-semibold text-emerald-600">
                      1 item in cart &middot; $159
                    </span>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative border-t border-border/40 py-24 md:py-32">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/[0.03] blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-[1200px] px-6 text-center">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="text-3xl md:text-[2.5rem] font-semibold tracking-[-0.03em] leading-[1.12] text-foreground"
          >
            Be the first to sell through conversations.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.06, ease }}
            className="mx-auto mt-5 max-w-lg text-[17px] leading-relaxed text-muted-foreground"
          >
            Connect your Shopify store, enable Shopping Assistant in Settings, and embed the live chat widget on your storefront. Product recommendations and Add to cart work out of the box.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.12, ease }}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            <Link href="/register"
              className="group inline-flex items-center gap-2 rounded-xl bg-foreground px-8 py-3.5 text-sm font-semibold text-background transition-all duration-200 hover:bg-foreground/90 hover:shadow-lg hover:shadow-foreground/10"
            >
                Get started
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl border border-border/60 px-8 py-3.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-secondary hover:border-border/80"
            >
                See pricing
                <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
