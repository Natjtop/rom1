"use client"

import { ReplymaLogo } from "@/components/marketing/logo"
import Link from "next/link"
import {
  Inbox, Sparkles, FileText, Workflow, BookOpen, BarChart3,
  Radio, Settings, Users, CreditCard, Filter, Puzzle,
  Search, Bell, ChevronDown,
} from "lucide-react"

/* Static dashboard mockup data */
const sidebarItems = [
  { icon: Inbox, label: "Inbox", badge: 3, active: true },
  { icon: Sparkles, label: "AI Agent" },
  { icon: FileText, label: "Macros" },
  { icon: Workflow, label: "Rules" },
  { icon: BookOpen, label: "Help Center" },
  { icon: BarChart3, label: "Analytics" },
  { icon: Radio, label: "Channels" },
  { icon: Filter, label: "Segments" },
  { icon: Users, label: "Team" },
  { icon: Puzzle, label: "Integrations" },
]

const sidebarBottom = [
  { icon: CreditCard, label: "Billing" },
  { icon: Settings, label: "Settings" },
]

const mockTickets = [
  { initials: "SM", name: "Sarah M.", subject: "Where is my order #4821?", channel: "Email", time: "2m", status: "open" },
  { initials: "JL", name: "James L.", subject: "Wrong size jacket — need exchange", channel: "Email", time: "14m", status: "ai_replied" },
  { initials: "AP", name: "Aisha P.", subject: "Refund for damaged item", channel: "Live Chat", time: "28m", status: "open" },
  { initials: "DK", name: "David K.", subject: "Discount code not working at checkout", channel: "Email", time: "45m", status: "escalated" },
  { initials: "SW", name: "Sophie W.", subject: "Shipping to Hawaii — is it free?", channel: "Live Chat", time: "1h", status: "ai_replied" },
  { initials: "MC", name: "Marcus C.", subject: "Order #5891 — tracking not updating", channel: "Email", time: "2h", status: "open" },
  { initials: "LO", name: "Liam O.", subject: "Can I change my delivery address?", channel: "Email", time: "3h", status: "ai_replied" },
  { initials: "RT", name: "Rachel T.", subject: "Gift wrapping option available?", channel: "Live Chat", time: "3h", status: "open" },
  { initials: "BN", name: "Brian N.", subject: "Loyalty points not showing up", channel: "Email", time: "4h", status: "escalated" },
  { initials: "KH", name: "Karen H.", subject: "Cancel order #6023 please", channel: "Live Chat", time: "4h", status: "open" },
  { initials: "TP", name: "Tom P.", subject: "Do you ship internationally?", channel: "Email", time: "5h", status: "ai_replied" },
  { initials: "EV", name: "Elena V.", subject: "Product arrived broken — need replacement", channel: "Email", time: "5h", status: "escalated" },
]

/* Desktop-only blurred dashboard background */
function DashboardMockup() {
  return (
    <div className="absolute inset-0 w-screen h-screen overflow-hidden select-none pointer-events-none" aria-hidden="true">
      <div className="flex h-full w-full min-h-screen">
        <div className="hidden lg:flex h-full w-[220px] shrink-0 flex-col border-r border-border/40 bg-card/80">
          <div className="flex items-center px-5 py-4 border-b border-border/30">
            <ReplymaLogo className="h-7 w-7 opacity-70" />
          </div>
          <div className="flex-1 px-3 py-3 space-y-0.5">
            {sidebarItems.map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] ${
                  item.active ? "bg-secondary/80 font-semibold text-foreground/70" : "text-muted-foreground/50"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent/60">{item.badge}</span>
                )}
              </div>
            ))}
          </div>
          <div className="border-t border-border/30 px-3 py-3 space-y-0.5">
            {sidebarBottom.map((item) => (
              <div key={item.label} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-muted-foreground/50">
                <item.icon className="h-4 w-4 shrink-0" /><span>{item.label}</span>
              </div>
            ))}
            <div className="mt-2 flex items-center gap-2.5 rounded-lg px-3 py-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-muted-foreground/50">JD</div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-foreground/50 truncate">Jane Doe</p>
                <p className="text-[10px] text-muted-foreground/40 truncate">jane@lumina.com</p>
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground/30 shrink-0" />
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col min-w-0">
          <div className="flex items-center justify-between border-b border-border/30 px-6 py-3">
            <div className="flex items-center gap-3">
              <h2 className="text-[15px] font-semibold text-foreground/60">Inbox</h2>
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent/50">3 new</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-border/30 bg-secondary/30 px-3 py-1.5">
                <Search className="h-3.5 w-3.5 text-muted-foreground/40" />
                <span className="text-[12px] text-muted-foreground/40">Search...</span>
              </div>
              <div className="relative">
                <Bell className="h-4 w-4 text-muted-foreground/40" />
                <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent/40" />
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="divide-y divide-border/20">
              {mockTickets.map((ticket) => (
                <div key={ticket.name} className={`flex items-center gap-4 px-6 py-4 ${ticket.name === "Sarah M." ? "bg-secondary/40" : ""}`}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/80 text-[11px] font-semibold text-muted-foreground/50">{ticket.initials}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground/60 truncate">{ticket.name}</span>
                      <span className="text-[11px] text-muted-foreground/40 shrink-0">{ticket.time}</span>
                    </div>
                    <p className="text-[13px] text-muted-foreground/50 truncate">{ticket.subject}</p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="rounded-full border border-border/30 px-2.5 py-0.5 text-[11px] text-muted-foreground/40">{ticket.channel}</span>
                    <div className={`h-2.5 w-2.5 rounded-full ${ticket.status === "open" ? "bg-foreground/20" : ticket.status === "ai_replied" ? "bg-emerald-400/40" : "bg-amber-400/40"}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-background overflow-hidden">
      {/* Mobile: clean white background, no mockup */}
      {/* Desktop: blurred dashboard background */}
      <div className="absolute inset-0 hidden sm:block" aria-hidden="true">
        <DashboardMockup />
        <div className="absolute inset-0 backdrop-blur-[5px]" />
      </div>

      {/* Content wrapper */}
      <div className="relative z-10 flex flex-1 flex-col items-center px-5 sm:px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        {/* Logo */}
        <div className="pt-12 sm:pt-0 sm:flex-1 sm:min-h-[80px]" />
        <Link href="/" className="mb-8 sm:mb-6 flex items-center">
          <ReplymaLogo className="h-10 w-10" />
        </Link>

        {/* Card */}
        <div className="w-full max-w-[400px]">
          {children}
        </div>

        {/* Footer */}
        <div className="flex-1 min-h-[40px] sm:min-h-[60px]" />
        <p className="pb-6 sm:pb-8 text-[11px] text-muted-foreground/60">
          &copy; 2026 DECODS LLC. All rights reserved.
        </p>
      </div>
    </div>
  )
}
