"use client"

import { motion } from "framer-motion"

const brands = [
  "Shopify",
  "WooCommerce",
  "Klaviyo",
  "Email",
  "Live Chat",
  "AWS SES",
  "Shopify",
  "Gmail",
  "Slack",
]

const itemClass =
  "inline-flex shrink-0 items-center px-8 text-[14px] font-semibold tracking-tight text-muted-foreground/20 transition-colors duration-300 hover:text-muted-foreground/50 cursor-default"

function MarqueeTrack({ names }: { names: string[] }) {
  return (
    <div className="flex shrink-0 items-center whitespace-nowrap" aria-hidden>
      {names.map((name, i) => (
        <span key={`${name}-${i}`} className={itemClass}>
          {name}
        </span>
      ))}
    </div>
  )
}

export function LogoMarquee() {
  return (
    <section
      className="relative overflow-hidden border-y border-border/40 py-10"
      aria-label="Platforms we integrate with"
    >
      <p className="mb-6 text-center text-[13px] font-medium text-muted-foreground/50">
        Trusted by hundreds of e-commerce brands
      </p>
      <p className="mb-8 text-center text-[12px] font-medium tracking-wide text-muted-foreground/40">
        Integrates with the tools your store already runs on
      </p>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="relative"
      >
        <div
          className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24"
          style={{ background: "linear-gradient(to right, var(--background), transparent)" }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24"
          style={{ background: "linear-gradient(to left, var(--background), transparent)" }}
          aria-hidden="true"
        />

        <div className="flex w-max animate-marquee items-center">
          <MarqueeTrack names={brands} />
          <MarqueeTrack names={brands} />
        </div>
      </motion.div>
    </section>
  )
}
