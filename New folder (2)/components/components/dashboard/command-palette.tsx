"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  X,
  Inbox,
  Sparkles,
  FileText,
  Workflow,
  BarChart3,
  Radio,
  Settings,
  ArrowRight,
  Users,
  BookOpen,
  CreditCard,
  Shield,
  Tag,
  Filter,
  GitBranch,
  UserCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { tickets } from "@/lib/api"

export interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

interface ResultItem {
  key: string
  icon: React.ElementType
  label: string
  hint?: string
  action: () => void
}

const navItems = [
  { icon: Inbox, label: "Inbox", href: "/inbox" },
  { icon: Sparkles, label: "AI Agent", href: "/ai" },
  { icon: UserCircle, label: "Customers", href: "/customers" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: FileText, label: "Macros", href: "/macros" },
  { icon: Workflow, label: "Rules", href: "/rules" },
  { icon: GitBranch, label: "Flows", href: "/flows" },
  { icon: BookOpen, label: "Help Center", href: "/helpcenter" },
  { icon: Radio, label: "Channels", href: "/channels/email" },
  { icon: Filter, label: "Segments", href: "/segments" },
  { icon: Tag, label: "Tags", href: "/tags" },
  { icon: Users, label: "Team", href: "/team" },
  { icon: Shield, label: "Audit Log", href: "/audit" },
  { icon: CreditCard, label: "Billing", href: "/billing" },
  { icon: Settings, label: "Settings", href: "/settings" },
]

const actions = [
  { label: "New ticket", icon: FileText, href: "/inbox" },
  { label: "Invite team member", icon: Users, href: "/team" },
  { label: "View analytics", icon: BarChart3, href: "/analytics" },
]

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)
  const [recentTickets, setRecentTickets] = useState<Array<{id: string; label: string; icon: React.ElementType}>>([])
  const router = useRouter()
  const listRef = useRef<HTMLDivElement>(null)

  // Fetch real recent tickets when the palette opens
  useEffect(() => {
    if (!open) return
    async function fetchRecent() {
      try {
        const result = await tickets.list({ limit: "5" })
        setRecentTickets(result.data.map((t: any) => ({
          id: t.id,
          label: `${t.customerName || t.customerEmail} — ${t.intent || t.status}`,
          icon: FileText,
        })))
      } catch {
        // Keep empty
      }
    }
    fetchRecent()
  }, [open])

  function navigateTo(href: string) {
    onClose()
    router.push(href)
  }

  // Filter items based on query
  const lowerQuery = query.toLowerCase().trim()

  const filteredNav = useMemo(
    () =>
      lowerQuery
        ? navItems.filter((item) => item.label.toLowerCase().includes(lowerQuery))
        : navItems,
    [lowerQuery]
  )

  const filteredTickets = useMemo(
    () =>
      lowerQuery
        ? recentTickets.filter(
            (ticket) =>
              ticket.label.toLowerCase().includes(lowerQuery) ||
              ticket.id.toLowerCase().includes(lowerQuery)
          )
        : recentTickets,
    [lowerQuery, recentTickets]
  )

  const filteredActions = useMemo(
    () =>
      lowerQuery
        ? actions.filter((action) => action.label.toLowerCase().includes(lowerQuery))
        : actions,
    [lowerQuery]
  )

  // Build flat list of all results for keyboard navigation
  const allResults: ResultItem[] = useMemo(() => {
    const items: ResultItem[] = []
    for (const item of filteredNav) {
      items.push({
        key: `nav-${item.href}`,
        icon: item.icon,
        label: item.label,
        action: () => navigateTo(item.href),
      })
    }
    for (const ticket of filteredTickets) {
      items.push({
        key: `ticket-${ticket.id}`,
        icon: ticket.icon,
        label: ticket.label,
        hint: ticket.id,
        action: () => {
          onClose()
          toast.info(`Opening ticket ${ticket.id}`, { description: "Navigating to inbox" })
          router.push(`/inbox?ticket=${ticket.id}`)
        },
      })
    }
    for (const action of filteredActions) {
      items.push({
        key: `action-${action.label}`,
        icon: action.icon,
        label: action.label,
        action: () => navigateTo(action.href),
      })
    }
    return items
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredNav, filteredTickets, filteredActions])

  const hasResults = allResults.length > 0

  // Reset active index when query changes
  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  // Keyboard handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
        return
      }
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setActiveIndex((i) => (i + 1) % Math.max(allResults.length, 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setActiveIndex((i) => (i - 1 + allResults.length) % Math.max(allResults.length, 1))
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (allResults[activeIndex]) {
          allResults[activeIndex].action()
        }
      }
    },
    [onClose, allResults, activeIndex]
  )

  useEffect(() => {
    if (open) {
      window.addEventListener("keydown", handleKeyDown)
      setQuery("")
      setActiveIndex(0)
    } else {
      window.removeEventListener("keydown", handleKeyDown)
    }
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, handleKeyDown])

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return
    const activeEl = listRef.current.querySelector(`[data-index="${activeIndex}"]`)
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" })
    }
  }, [activeIndex])

  // Compute section boundaries for rendering
  const navEnd = filteredNav.length
  const ticketEnd = navEnd + filteredTickets.length
  let globalIdx = 0

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[100] bg-foreground/20 backdrop-blur-sm flex items-start justify-center pt-[8vh] sm:pt-[15vh]"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="w-[calc(100%-1.5rem)] sm:w-full max-w-lg mx-3 sm:mx-auto rounded-2xl border border-border/60 bg-background shadow-[0_24px_80px_-16px_rgb(0_0_0/0.15)] overflow-hidden max-h-[85dvh] sm:max-h-none flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-border/60 px-3 sm:px-4 py-2.5 sm:py-3">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                placeholder="Search or jump to..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-[14px] sm:text-[14px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none h-10 sm:h-auto"
              />
              <kbd className="hidden sm:inline-flex items-center rounded border border-border/60 bg-secondary/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/50">
                ESC
              </kbd>
              <button
                onClick={onClose}
                className="inline-flex sm:hidden items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors"
                aria-label="Close command palette"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[calc(100dvh-8vh-8rem)] sm:max-h-[60vh] overflow-y-auto overscroll-contain p-1.5 sm:p-2">

              {!hasResults && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Search className="h-5 w-5 text-muted-foreground/40 mb-2" />
                  <p className="text-[13px] text-muted-foreground">
                    No results for &ldquo;{query}&rdquo;
                  </p>
                </div>
              )}

              {/* Navigation section */}
              {filteredNav.length > 0 && (
                <Section label="Navigation">
                  {filteredNav.map((item) => {
                    const idx = globalIdx++
                    return (
                      <ResultRow
                        key={item.href}
                        dataIndex={idx}
                        icon={<item.icon className="h-4 w-4" />}
                        label={item.label}
                        active={activeIndex === idx}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => navigateTo(item.href)}
                      />
                    )
                  })}
                </Section>
              )}

              {/* Recent tickets section */}
              {filteredTickets.length > 0 && (
                <Section label="Recent tickets">
                  {filteredTickets.map((ticket) => {
                    const idx = globalIdx++
                    return (
                      <ResultRow
                        key={ticket.id}
                        dataIndex={idx}
                        icon={<ticket.icon className="h-4 w-4" />}
                        label={ticket.label}
                        hint={ticket.id}
                        active={activeIndex === idx}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => {
                          onClose()
                          toast.info(`Opening ticket ${ticket.id}`, { description: "Navigating to inbox" })
                          router.push(`/inbox?ticket=${ticket.id}`)
                        }}
                      />
                    )
                  })}
                </Section>
              )}

              {/* Actions section */}
              {filteredActions.length > 0 && (
                <Section label="Actions">
                  {filteredActions.map((action) => {
                    const idx = globalIdx++
                    return (
                      <ResultRow
                        key={action.label}
                        dataIndex={idx}
                        icon={<action.icon className="h-4 w-4" />}
                        label={action.label}
                        active={activeIndex === idx}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => navigateTo(action.href)}
                      />
                    )
                  })}
                </Section>
              )}
            </div>

            {/* Footer hints -- hidden on mobile (no physical keyboard on touch devices) */}
            <div className="hidden sm:flex items-center gap-4 border-t border-border/60 px-4 py-2">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/40">
                <kbd className="rounded border border-border/60 bg-secondary/50 px-1 py-0.5 font-mono text-[9px]">&uarr;</kbd>
                <kbd className="rounded border border-border/60 bg-secondary/50 px-1 py-0.5 font-mono text-[9px]">&darr;</kbd>
                <span>navigate</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/40">
                <kbd className="rounded border border-border/60 bg-secondary/50 px-1.5 py-0.5 font-mono text-[9px]">&#9166;</kbd>
                <span>select</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/40">
                <kbd className="rounded border border-border/60 bg-secondary/50 px-1.5 py-0.5 font-mono text-[9px]">esc</kbd>
                <span>close</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                        */
/* ------------------------------------------------------------------ */

function Section({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-1">
      <p className="px-2.5 sm:px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/60">
        {label}
      </p>
      {children}
    </div>
  )
}

function ResultRow({
  icon,
  label,
  hint,
  active,
  dataIndex,
  onClick,
  onMouseEnter,
}: {
  icon: React.ReactNode
  label: string
  hint?: string
  active?: boolean
  dataIndex: number
  onClick: () => void
  onMouseEnter: () => void
}) {
  return (
    <button
      data-index={dataIndex}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-2.5 sm:px-3 py-2.5 sm:py-2 text-left text-[13px] sm:text-[13px] text-foreground",
        "min-h-[44px] sm:min-h-0",
        "transition-colors duration-100",
        active ? "bg-secondary/80" : "hover:bg-secondary/60"
      )}
    >
      <span className={cn("shrink-0", active ? "text-accent" : "text-muted-foreground")}>{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {hint && (
        <span className="shrink-0 text-[11px] text-muted-foreground/50">{hint}</span>
      )}
      <ArrowRight className={cn("h-3.5 w-3.5 shrink-0 transition-opacity", active ? "text-muted-foreground/60 opacity-100" : "text-muted-foreground/40 opacity-0")} />
    </button>
  )
}
