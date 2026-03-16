"use client"

import Link from "next/link"
import { useState, useEffect, useRef, useCallback } from "react"
import {
  Menu, X, ChevronDown,
  Bot, Inbox, Zap, ShoppingCart, MessageSquare, BarChart3,
  BookOpen, FileQuestion, ArrowLeftRight, Plug,
} from "lucide-react"
import { ReplymaLogo } from "@/components/marketing/logo"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface DropdownItem {
  href: string
  icon: React.ElementType
  label: string
  description: string
}
interface NavItem {
  label: string
  href?: string
  dropdown?: DropdownItem[]
}

const navItems: NavItem[] = [
  {
    label: "Features",
    dropdown: [
      { href: "/features/ai-agent",  icon: Bot,          label: "AI Agent",           description: "Autonomous resolution based on your policies" },
      { href: "/features/inbox",     icon: Inbox,        label: "Unified Inbox",  description: "Email & Live Chat in one view" },
      { href: "/features/shopify",   icon: ShoppingCart, label: "Shopify Integration",description: "One-click refunds, edits, tracking" },
      { href: "/features/macros",    icon: Zap,          label: "Macros & Rules",     description: "Automate repetitive workflows" },
      { href: "/features/live-chat", icon: MessageSquare,label: "Live Chat",          description: "Engage customers before they abandon cart" },
      { href: "/features/analytics", icon: BarChart3,    label: "Analytics",          description: "Real-time performance insights" },
      { href: "/features/shopping-assistant", icon: ShoppingCart, label: "Shopping Assistant", description: "AI product recommendations in chat" },
    ],
  },
  { label: "Pricing",      href: "/pricing" },
  { label: "Integrations", href: "/integrations" },
  { label: "Compare",      href: "/vs-gorgias" },
  {
    label: "Resources",
    dropdown: [
      { href: "/blog",        icon: BookOpen,      label: "Blog",               description: "Tips and guides for support teams" },
      { href: "/help-center", icon: FileQuestion,  label: "Help Center",        description: "Docs, tutorials, and API reference" },
      { href: "/api-docs",    icon: Plug,          label: "API Docs",           description: "Build custom integrations" },
      { href: "/changelog",   icon: Zap,           label: "Changelog",          description: "Latest product updates" },
      { href: "/about",       icon: Bot,           label: "About",              description: "Our mission and team" },
      { href: "/register",        icon: MessageSquare,  label: "Start free trial",        description: "Create account and launch in minutes" },
    ],
  },
]

const dropdownVariants = {
  hidden:  { opacity: 0, y: 6, scale: 0.98, transition: { duration: 0.12, ease: "easeIn" } },
  visible: { opacity: 1, y: 0, scale: 1,    transition: { duration: 0.2,  ease: [0.23, 1, 0.32, 1] } },
  exit:    { opacity: 0, y: 4, scale: 0.98, transition: { duration: 0.1,  ease: "easeIn" } },
}
const itemVariants = {
  hidden:  { opacity: 0, x: -4 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.03, duration: 0.2, ease: "easeOut" },
  }),
}

export function MarketingHeader() {
  const [mobileOpen, setMobileOpen]     = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [scrolled, setScrolled]         = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null)
  const headerRef  = useRef<HTMLElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // showPill: only when scrolled AND mobile menu is closed
  const showPill = scrolled && !mobileOpen

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [mobileOpen])

  const openDropdown  = useCallback((label: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setActiveDropdown(label)
  }, [])
  const closeDropdown = useCallback(() => {
    timeoutRef.current = setTimeout(() => setActiveDropdown(null), 150)
  }, [])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node))
        setActiveDropdown(null)
    }
    document.addEventListener("click", onClick)
    return () => document.removeEventListener("click", onClick)
  }, [])

  return (
    <header
      ref={headerRef}
      className={cn(
        "fixed top-0 w-full",
        mobileOpen ? "z-[1000000]" : "z-50",
        // When mobile menu open → solid background covers any scroll state
        mobileOpen && "bg-background"
      )}
    >
      {/* Top accent line — hidden on mobile to avoid flash */}
      <div className="hidden sm:block h-[2px] w-full bg-gradient-to-r from-accent via-accent/50 to-accent/20" />

      {/* ── Nav row ─────────────────────────── */}
      <div
        className={cn(
          "mx-auto transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
          showPill ? "max-w-5xl px-4 pt-3" : "max-w-7xl px-4 sm:px-6"
        )}
      >
        <div
          className={cn(
            "flex items-center rounded-2xl border outline-none transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
            showPill
              ? "h-14 border-border/40 bg-background/75 px-5 shadow-[0_4px_24px_-4px_rgb(0_0_0/0.06),0_0_0_1px_rgb(0_0_0/0.02)] backdrop-blur-2xl"
              : "h-16 border-transparent bg-transparent px-0 shadow-none"
          )}
        >
          {/* Logo */}
          <Link href="/" className="group flex items-center">
            <ReplymaLogo className="h-9 w-9" />
          </Link>

          {/* Desktop nav */}
          <nav className="ml-10 hidden items-center gap-0.5 lg:flex" aria-label="Main navigation">
            {navItems.map((item) =>
              item.dropdown ? (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => openDropdown(item.label)}
                  onMouseLeave={closeDropdown}
                >
                  <button
                    className={cn(
                      "flex items-center gap-1 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200",
                      activeDropdown === item.label
                        ? "bg-secondary/80 text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setActiveDropdown(activeDropdown === item.label ? null : item.label)}
                    aria-expanded={activeDropdown === item.label}
                    aria-haspopup="true"
                  >
                    {item.label}
                    <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", activeDropdown === item.label && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {activeDropdown === item.label && (
                      <motion.div
                        variants={dropdownVariants}
                        initial="hidden" animate="visible" exit="exit"
                        className="absolute left-0 top-full z-50 pt-2"
                        onMouseEnter={() => openDropdown(item.label)}
                        onMouseLeave={closeDropdown}
                      >
                        <div className={cn(
                          "overflow-hidden rounded-xl border border-border/40 bg-popover p-1.5",
                          "shadow-[0_24px_80px_-16px_rgb(0_0_0/0.12),0_0_0_1px_rgb(0_0_0/0.03)]",
                          item.dropdown!.length > 4 ? "w-[520px]" : "w-[440px]"
                        )}>
                          <div className={cn("grid gap-0.5", item.dropdown!.length > 4 ? "grid-cols-2" : "grid-cols-1")}>
                            {item.dropdown!.map((d, i) => (
                              <motion.div key={d.label} custom={i} variants={itemVariants} initial="hidden" animate="visible">
                                <Link
                                  href={d.href}
                                  className="group/item flex items-start gap-3 rounded-lg px-3 py-2.5 transition-all duration-150 hover:bg-secondary/60"
                                  onClick={() => setActiveDropdown(null)}
                                >
                                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-secondary/40 transition-all duration-200 group-hover/item:border-accent/20 group-hover/item:bg-accent/8 group-hover/item:shadow-sm">
                                    <d.icon className="h-3.5 w-3.5 text-muted-foreground transition-colors duration-150 group-hover/item:text-accent" />
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[13px] font-medium text-foreground">{d.label}</span>
                                    <span className="text-[11px] leading-snug text-muted-foreground">{d.description}</span>
                                  </div>
                                </Link>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  key={item.label}
                  href={item.href!}
                  className="rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground transition-all duration-200 hover:text-foreground"
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>

          <div className="flex-1" />

          {/* Desktop CTAs */}
          <div className="hidden items-center gap-2 lg:flex">
            <Link href="/login" className="h-8 px-3 text-[13px] font-medium text-muted-foreground hover:text-foreground inline-flex items-center justify-center rounded-md transition-colors hover:bg-secondary hover:text-foreground">
                Log in
            </Link>
            <Link href="/register" className="relative h-9 overflow-hidden rounded-lg bg-foreground px-5 text-[13px] font-semibold text-background shadow-[0_1px_2px_rgb(0_0_0/0.1),0_0_0_1px_rgb(0_0_0/0.08)] transition-all duration-300 hover:bg-foreground/90 hover:shadow-[0_0_0_1px_rgb(0_0_0/0.08),0_4px_20px_-4px_rgb(0_0_0/0.15)] inline-flex items-center justify-center">
                <span className="relative z-10">Start Free Trial</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent"
                  animate={{ x: ["-200%", "200%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 4 }}
                />
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="relative z-50 flex h-11 w-11 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-secondary/50 lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait">
              {mobileOpen ? (
                <motion.div key="close" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.15 }}>
                  <X className="h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div key="menu" initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -90 }} transition={{ duration: 0.15 }}>
                  <Menu className="h-5 w-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* ── Mobile menu — sibling of pill, NOT inside it ─────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "calc(100dvh - 4rem)" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-y-auto border-t border-border/40 bg-background lg:hidden z-[1000000]"
          >
            <nav className="flex flex-col gap-0.5 px-4 py-4" aria-label="Mobile navigation">
              {navItems.map((item) =>
                item.dropdown ? (
                  <div key={item.label} className="flex flex-col">
                    <button
                      className="flex items-center justify-between rounded-lg px-3 py-3 text-[15px] font-medium text-foreground transition-colors hover:bg-secondary/50"
                      onClick={() => setMobileExpanded(mobileExpanded === item.label ? null : item.label)}
                      aria-expanded={mobileExpanded === item.label}
                    >
                      {item.label}
                      <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", mobileExpanded === item.label && "rotate-180")} />
                    </button>
                    <AnimatePresence>
                      {mobileExpanded === item.label && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-col gap-0.5 pb-2 pl-2">
                            {item.dropdown!.map((d) => (
                              <Link
                                key={d.label}
                                href={d.href}
                                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-secondary/50"
                                onClick={() => setMobileOpen(false)}
                              >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-secondary/40">
                                  <d.icon className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-foreground">{d.label}</span>
                                  <span className="text-xs text-muted-foreground">{d.description}</span>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    key={item.label}
                    href={item.href!}
                    className="rounded-lg px-3 py-3 text-[15px] font-medium text-foreground transition-colors hover:bg-secondary/50"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                )
              )}

              <div className="mt-4 flex flex-col gap-2 border-t border-border/40 pt-4">
                <Link href="/login" onClick={() => setMobileOpen(false)} className="w-full text-sm font-medium inline-flex items-center justify-center rounded-md border border-input bg-background h-10 px-4 py-2 transition-colors hover:bg-secondary hover:text-foreground">
                  Log in
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)} className="w-full bg-foreground text-background text-sm font-semibold inline-flex items-center justify-center rounded-md h-10 px-4 py-2 transition-colors hover:bg-foreground/90">
                  Start Free Trial
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
