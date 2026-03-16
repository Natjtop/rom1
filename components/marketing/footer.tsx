"use client"

import { useState } from "react"
import Link from "next/link"
import { ReplymaLogo } from "@/components/marketing/logo"
import { motion } from "framer-motion"
import { toast } from "sonner"

const ease = [0.23, 1, 0.32, 1] as const

const footerLinks = {
  Product: [
    { label: "AI Agent",           href: "/features/ai-agent" },
    { label: "Unified Inbox",  href: "/features/inbox" },
    { label: "Shopify Integration",href: "/features/shopify" },
    { label: "Macros & Rules",     href: "/features/macros" },
    { label: "Live Chat",          href: "/features/live-chat" },
    { label: "Analytics",          href: "/features/analytics" },
    { label: "Shopping Assistant",  href: "/features/shopping-assistant" },
  ],
  Platform: [
    { label: "Pricing",      href: "/pricing" },
    { label: "Integrations", href: "/integrations" },
    { label: "vs Gorgias",   href: "/vs-gorgias" },
    { label: "vs Zendesk",   href: "/vs-zendesk" },
    { label: "Case Studies",  href: "/case-studies" },
    { label: "Changelog",    href: "/changelog" },
  ],
  Resources: [
    { label: "Blog",        href: "/blog" },
    { label: "Help Center", href: "/help-center" },
    { label: "API Docs",    href: "/api-docs" },
    { label: "Start free trial", href: "/register" },
    { label: "Partners",    href: "/partners" },
    { label: "Status",      href: "/status" },
  ],
  Company: [
    { label: "About",    href: "/about" },
    { label: "Careers",  href: "/careers" },
    { label: "Privacy",  href: "/privacy" },
    { label: "Terms",    href: "/terms" },
  ],
}

const columnVariants = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease, delay: 0.1 + i * 0.08 },
  }),
}

const linkVariants = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease, delay: i * 0.03 },
  }),
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

export function MarketingFooter() {
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)

  return (
    <footer className="relative border-t border-white/10 bg-transparent">
      <div className="mx-auto max-w-[1200px] px-6 py-16 md:py-20 relative z-10">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-6 lg:gap-12">
          {/* Brand */}
          <motion.div
            className="col-span-2"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease }}
          >
            <Link href="/" className="inline-flex items-center">
              <ReplymaLogo className="h-9 w-9 text-white" />
            </Link>
            <p className="mt-4 max-w-[210px] text-[14px] leading-relaxed text-white/60 font-light">
              AI support for e-commerce teams that want to stop drowning in tickets.
            </p>
            <div className="mt-5 flex items-center gap-4">
              <motion.div
                initial={{ opacity: 0.6 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.25 }}
              >
                <Link href="https://x.com/replyma" className="flex h-11 w-11 items-center justify-center rounded-md text-white/40 transition-colors duration-200 hover:text-white hover:bg-white/10" aria-label="X (Twitter)">
                  <XIcon className="h-4 w-4" />
                </Link>
              </motion.div>
              <motion.div
                initial={{ opacity: 0.6 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.35 }}
              >
                <Link href="https://linkedin.com/company/replyma" className="flex h-11 w-11 items-center justify-center rounded-md text-white/40 transition-colors duration-200 hover:text-white hover:bg-white/10" aria-label="LinkedIn">
                  <LinkedInIcon className="h-4 w-4" />
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links], columnIndex) => (
            <motion.div
              key={category}
              variants={columnVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={columnIndex}
            >
              <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">
                {category}
              </h3>
              <ul className="flex flex-col gap-0">
                {links.map((link, linkIndex) => (
                  <motion.li
                    key={link.label}
                    variants={linkVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    custom={linkIndex}
                  >
                    <Link
                      href={link.href}
                      className="inline-flex items-center h-11 text-[14px] text-white/60 font-light transition-colors duration-200 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Newsletter */}
        <motion.div
          className="mt-12 flex flex-col items-start gap-4 rounded-2xl liquid-glass p-6 sm:flex-row sm:items-center sm:justify-between border-white/10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease, delay: 0.2 }}
        >
          <div>
            <p className="text-[14px] font-medium text-white">Stay in the loop</p>
            <p className="mt-1 text-[13px] text-white/60 font-light">Get product updates and tips for support teams.</p>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            {subscribed ? (
              <p className="flex h-11 items-center text-[13px] font-medium text-white/80">
                Thanks for subscribing!
              </p>
            ) : (
              <>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && email.includes("@")) {
                      setSubscribed(true)
                      toast.success("Subscribed!")
                      setEmail("")
                    }
                  }}
                  className="h-11 w-full rounded-lg border border-white/20 bg-white/5 px-3 text-[13px] text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none focus:ring-1 focus:ring-white/20 transition-colors sm:w-[240px]"
                />
                <button
                  onClick={() => {
                    if (email.includes("@")) {
                      setSubscribed(true)
                      toast.success("Subscribed!")
                      setEmail("")
                    } else {
                      toast.error("Please enter a valid email address")
                    }
                  }}
                  className="inline-flex h-11 shrink-0 items-center rounded-lg bg-white px-4 text-[13px] font-medium text-black transition-colors hover:bg-white/90"
                >
                  Subscribe
                </button>
              </>
            )}
          </div>
        </motion.div>

        {/* Bottom bar */}
        <motion.div
          className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-8 md:flex-row md:items-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease, delay: 0.3 }}
        >
          <p className="text-[13px] text-white/40 font-light">
            &copy; 2026 DECODS LLC. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/status" className="inline-flex items-center h-11 px-2 text-[13px] text-white/40 font-light transition-colors duration-200 hover:text-white">
              Status
            </Link>
            <Link href="/changelog" className="inline-flex items-center h-11 px-2 text-[13px] text-white/40 font-light transition-colors duration-200 hover:text-white">
              Changelog
            </Link>
            <span className="flex items-center gap-1.5 text-[13px] text-white/40 font-light">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/40 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white/60" />
              </span>
              All systems operational
            </span>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
