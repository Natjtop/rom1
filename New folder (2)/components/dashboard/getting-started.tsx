"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Circle, ChevronUp, ChevronDown, X, Mail, FileText, Inbox, Sparkles, Rocket, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

const STORAGE_KEY = "replyma_getting_started"

interface Step {
  id: string
  label: string
  href: string
  icon: React.ElementType
}

const steps: Step[] = [
  { id: "connect-channel", label: "Connect a channel", href: "/channels/email", icon: Mail },
  { id: "upload-policy", label: "Upload return policy", href: "/ai", icon: FileText },
  { id: "send-test-ticket", label: "Send a test ticket", href: "/channels/email", icon: Inbox },
  { id: "enable-ai", label: "Enable AI auto-reply", href: "/ai", icon: Sparkles },
]

interface State {
  dismissed: boolean
  completed: string[]
  collapsed: boolean
}

function load(): State {
  if (typeof window === "undefined") return { dismissed: false, completed: [], collapsed: false }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const p = JSON.parse(raw)
      return { dismissed: !!p.dismissed, completed: Array.isArray(p.completed) ? p.completed : [], collapsed: !!p.collapsed }
    }
  } catch { /* ignore */ }
  return { dismissed: false, completed: [], collapsed: false }
}

function save(s: State) {
  if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

/**
 * Stripe-style floating setup checklist.
 * Fixed bottom-right corner, collapsible, compact.
 */
export function GettingStarted() {
  const router = useRouter()
  const [state, setState] = useState<State>({ dismissed: false, completed: [], collapsed: false })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setState(load())
    setMounted(true)
  }, [])

  if (!mounted || state.dismissed) return null

  const done = state.completed.length
  const total = steps.length
  const allDone = done === total
  const pct = Math.round((done / total) * 100)

  const toggle = (id: string) => {
    setState(prev => {
      const has = prev.completed.includes(id)
      const next = { ...prev, completed: has ? prev.completed.filter(s => s !== id) : [...prev.completed, id] }
      save(next)
      return next
    })
  }

  const collapse = () => {
    setState(prev => {
      const next = { ...prev, collapsed: !prev.collapsed }
      save(next)
      return next
    })
  }

  const dismiss = () => {
    const next = { ...state, dismissed: true }
    save(next)
    setState(next)
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[300px] sm:w-[320px] max-w-[calc(100vw-2rem)] pb-[env(safe-area-inset-bottom)]">
      <div className="rounded-xl border border-border/60 bg-card shadow-[0_8px_40px_-12px_rgb(0_0_0/0.15)] overflow-hidden">
        {/* Header — always visible, clickable to collapse/expand */}
        <button
          onClick={collapse}
          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/30"
        >
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
            {/* Circular progress ring */}
            <svg className="h-8 w-8 -rotate-90" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="14" fill="none" stroke="var(--border)" strokeWidth="2.5" />
              <circle
                cx="16" cy="16" r="14" fill="none"
                stroke="var(--foreground)" strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={`${pct * 0.88} 88`}
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <Rocket className="absolute h-3.5 w-3.5 text-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground">Setup guide</p>
            <p className="text-[11px] text-muted-foreground">{done}/{total} completed</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {!allDone && (
              <button
                onClick={(e) => { e.stopPropagation(); dismiss() }}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/40 hover:bg-secondary hover:text-muted-foreground transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            {state.collapsed ? <ChevronUp className="h-4 w-4 text-muted-foreground/50" /> : <ChevronDown className="h-4 w-4 text-muted-foreground/50" />}
          </div>
        </button>

        {/* Steps — collapsible */}
        {!state.collapsed && (
          <div className="border-t border-border/40">
            {steps.map((step, i) => {
              const isDone = state.completed.includes(step.id)
              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 transition-colors",
                    i < steps.length - 1 && "border-b border-border/30",
                    isDone ? "opacity-50" : "hover:bg-secondary/30"
                  )}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggle(step.id)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center touch-manipulation"
                    aria-label={isDone ? `Unmark ${step.label}` : `Mark ${step.label} done`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-[18px] w-[18px] text-emerald-500" />
                    ) : (
                      <Circle className="h-[18px] w-[18px] text-border" />
                    )}
                  </button>

                  {/* Label + navigate */}
                  <button
                    onClick={() => router.push(step.href)}
                    className={cn(
                      "flex flex-1 items-center justify-between gap-2 text-left min-w-0",
                      isDone && "pointer-events-none"
                    )}
                  >
                    <span className={cn(
                      "text-[13px] font-medium truncate",
                      isDone ? "text-muted-foreground line-through" : "text-foreground"
                    )}>
                      {step.label}
                    </span>
                    {!isDone && (
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30" />
                    )}
                  </button>
                </div>
              )
            })}

            {/* All done */}
            {allDone && (
              <div className="px-4 py-3 text-center border-t border-border/30">
                <p className="text-[12px] font-medium text-emerald-600">All set! Your workspace is ready.</p>
                <button
                  onClick={dismiss}
                  className="mt-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
