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
  "inline-flex shrink-0 items-center px-8 text-[14px] font-medium tracking-widest uppercase text-white/30 transition-colors duration-300 hover:text-white/80 cursor-default"

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
      className="relative overflow-hidden py-16"
      aria-label="Platforms we integrate with"
    >
      <div className="absolute inset-0 border-y border-white/10" />
      <p className="mb-6 text-center text-[13px] font-light text-white/60">
        Trusted by hundreds of e-commerce brands
      </p>
      <p className="mb-8 text-center text-[12px] font-light tracking-widest uppercase text-white/40">
        Integrates with the tools your store already runs on
      </p>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="relative"
        style={{
          maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)"
        }}
      >
        <div className="flex w-max animate-marquee items-center">
          <MarqueeTrack names={brands} />
          <MarqueeTrack names={brands} />
        </div>
      </motion.div>
    </section>
  )
}
