"use client"

import { useState, useEffect } from "react"
import { Inbox, Sparkles, AlertTriangle, CheckCircle2, Hash, Bookmark, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { savedViews as savedViewsApi } from "@/lib/api"
import type { UITicketStatus as TicketStatus } from "@/lib/types"

const FILTER_DEFS = [
  { id: "all", label: "All tickets", shortLabel: "All", icon: Hash },
  { id: "open", label: "Open", shortLabel: "Open", icon: Inbox },
  { id: "ai_replied", label: "AI Handled", shortLabel: "AI", icon: Sparkles },
  { id: "escalated", label: "Escalated", shortLabel: "Esc.", icon: AlertTriangle },
  { id: "closed", label: "Closed", shortLabel: "Closed", icon: CheckCircle2 },
] as const

type FilterId = "all" | TicketStatus

interface SavedViewLocal {
  id: string
  name: string
  filter: string
  filters?: Record<string, unknown>
}

interface TicketFiltersProps {
  activeFilter: string
  onFilterChange: (filter: string) => void
  counts: Record<string, number>
  /** When true, renders as a compact vertical list for mobile inline display */
  mobile?: boolean
  /** Full current filter state for saving views with all criteria */
  currentFilters?: {
    status: string
    channel: string
    priority: string
    assignee: string
    search: string
    sortBy: string
    sortOrder: string
  }
  /** Called when a saved view is applied with its full filter set */
  onApplySavedView?: (filters: Record<string, unknown>) => void
}

export function TicketFilters({ activeFilter, onFilterChange, counts, mobile, currentFilters, onApplySavedView }: TicketFiltersProps) {
  const [savedViews, setSavedViews] = useState<SavedViewLocal[]>([])
  const [showSaveInput, setShowSaveInput] = useState(false)
  const [newViewName, setNewViewName] = useState("")

  // Load saved views from API on mount
  useEffect(() => {
    async function loadViews() {
      try {
        const result = await savedViewsApi.list()
        setSavedViews(
          (result.data ?? []).map((v: any) => ({
            id: v.id,
            name: v.name,
            filter: (v.filters as any)?.status ?? "all",
            filters: v.filters,
          }))
        )
      } catch {
        // Fall back to empty
      }
    }
    loadViews()
  }, [])

  async function handleSaveView() {
    const name = newViewName.trim()
    if (!name) return
    // Build full filter set from currentFilters or fall back to just status
    const fullFilters: Record<string, unknown> = currentFilters
      ? {
          status: currentFilters.status,
          channel: currentFilters.channel,
          priority: currentFilters.priority,
          assignee: currentFilters.assignee,
          search: currentFilters.search,
          sortBy: currentFilters.sortBy,
          sortOrder: currentFilters.sortOrder,
        }
      : { status: activeFilter }
    try {
      const created = await savedViewsApi.create({
        name,
        filters: fullFilters,
        isShared: false,
      })
      setSavedViews((prev) => [
        ...prev,
        { id: (created as any).id ?? `sv-${Date.now()}`, name, filter: (fullFilters.status as string) ?? activeFilter, filters: fullFilters },
      ])
      setNewViewName("")
      setShowSaveInput(false)
      toast.success("View saved", { description: name })
    } catch {
      // Still add locally as fallback
      setSavedViews((prev) => [
        ...prev,
        { id: `sv-${Date.now()}`, name, filter: (fullFilters.status as string) ?? activeFilter, filters: fullFilters },
      ])
      setNewViewName("")
      setShowSaveInput(false)
      toast.success("View saved", { description: name })
    }
  }

  async function handleDeleteView(id: string) {
    setSavedViews((prev) => prev.filter((v) => v.id !== id))
    toast("View removed")
    try {
      await savedViewsApi.delete(id)
    } catch {
      // Silent fail -- already removed from UI
    }
  }

  // Mobile compact mode: full-width vertical list with 44px touch targets + saved views
  if (mobile) {
    return (
      <div className="flex w-full flex-col bg-background px-2 py-1.5">
        {/* Filter buttons */}
        <nav className="flex flex-col gap-0.5" aria-label="Ticket filters">
          {FILTER_DEFS.map((filter) => {
            const isActive = activeFilter === filter.id
            const count = counts[filter.id] ?? 0
            return (
              <button
                key={filter.id}
                onClick={() => onFilterChange(filter.id)}
                className={cn(
                  "group/filter relative flex min-h-[44px] w-full items-center justify-between rounded-lg px-3 text-[13px] transition-all duration-150",
                  isActive
                    ? "bg-secondary font-medium text-foreground shadow-sm"
                    : "text-muted-foreground active:bg-secondary/50"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[2.5px] rounded-r-full bg-accent" />
                )}
                <div className="flex items-center gap-2.5">
                  <filter.icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors duration-150",
                      isActive ? "text-accent" : "text-muted-foreground/50"
                    )}
                  />
                  <span>{filter.label}</span>
                </div>
                {/* Count badge -- always visible */}
                <span
                  className={cn(
                    "min-w-[24px] rounded-full px-1.5 py-0.5 text-center text-[11px] font-semibold tabular-nums",
                    isActive
                      ? "bg-accent/10 text-accent"
                      : count > 0
                        ? "bg-secondary text-muted-foreground/60"
                        : "text-muted-foreground/30"
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </nav>

        {/* Saved Views section */}
        <div className="mt-3 border-t border-border/40 pt-3">
          <div className="mb-1.5 flex items-center justify-between px-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50">
              Saved Views
            </p>
            <button
              onClick={() => setShowSaveInput(true)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted-foreground/50 transition-all duration-150 active:bg-secondary"
              aria-label="Save current view"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Save input */}
          {showSaveInput && (
            <div className="mb-2 px-1">
              <div className="flex items-center gap-2 rounded-lg border border-accent/30 bg-card px-3 py-2 shadow-sm">
                <input
                  type="text"
                  placeholder="Name..."
                  value={newViewName}
                  maxLength={24}
                  onChange={(e) => setNewViewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveView()
                    if (e.key === "Escape") {
                      setShowSaveInput(false)
                      setNewViewName("")
                    }
                  }}
                  className="min-h-[36px] min-w-0 flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveView}
                  disabled={!newViewName.trim()}
                  className="shrink-0 min-h-[36px] rounded-md px-3 text-[12px] font-medium text-accent transition-colors duration-100 hover:text-accent/80 disabled:opacity-40"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowSaveInput(false)
                    setNewViewName("")
                  }}
                  className="flex shrink-0 min-h-[36px] min-w-[36px] items-center justify-center rounded-md text-muted-foreground/40 transition-colors duration-100 hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <nav className="flex flex-col gap-0.5" aria-label="Saved views">
            {savedViews.map((view) => (
              <div
                key={view.id}
                className="group relative flex min-w-0 items-center"
              >
                <button
                  onClick={() => {
                    if (view.filters && onApplySavedView) {
                      onApplySavedView(view.filters)
                    } else {
                      onFilterChange(view.filter)
                    }
                    toast(`View: ${view.name}`, { duration: 1500 })
                  }}
                  className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2.5 rounded-lg px-3 pr-10 text-[13px] text-muted-foreground transition-all duration-150 active:bg-secondary/50"
                >
                  <Bookmark className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                  <span className="truncate">{view.name}</span>
                </button>
                <button
                  onClick={() => handleDeleteView(view.id)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-muted-foreground/30 transition-all duration-150 hover:bg-red-500/10 hover:text-red-500 active:bg-red-500/10"
                  aria-label={`Remove ${view.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {savedViews.length === 0 && (
              <p className="px-3 py-3 text-[12px] text-muted-foreground/40">
                No saved views yet
              </p>
            )}
          </nav>
        </div>
      </div>
    )
  }

  // Desktop / tablet sidebar: 180px vertical panel.
  // Visibility is controlled by the parent wrapper (hidden sm:flex in mobile, always shown at lg+).
  return (
    <div className="flex h-full w-[180px] shrink-0 flex-col overflow-y-auto border-r border-border/60 bg-background p-2">
      <p className="mb-1.5 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50">
        Views
      </p>
      <nav className="flex flex-col gap-0.5" aria-label="Ticket filters">
        {FILTER_DEFS.map((filter) => {
          const isActive = activeFilter === filter.id
          const count = counts[filter.id] ?? 0
          return (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={cn(
                "group/filter relative flex h-8 items-center justify-between rounded-lg px-2.5 text-[13px] transition-all duration-150",
                isActive
                  ? "bg-secondary font-medium text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              {/* Active accent indicator */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[2px] rounded-r-full bg-accent" />
              )}
              <div className="flex items-center gap-2">
                <filter.icon
                  className={cn(
                    "h-3.5 w-3.5 transition-colors duration-150",
                    isActive ? "text-accent" : "text-muted-foreground/50 group-hover/filter:text-muted-foreground"
                  )}
                />
                <span>{filter.label}</span>
              </div>
              {/* Count badge */}
              <span
                className={cn(
                  "min-w-[20px] rounded-full px-1.5 py-0.5 text-center text-[10px] font-semibold tabular-nums transition-all duration-150",
                  isActive
                    ? "bg-accent/10 text-accent"
                    : count > 0
                      ? "bg-secondary text-muted-foreground/60 group-hover/filter:bg-secondary/80 group-hover/filter:text-muted-foreground"
                      : "text-muted-foreground/30"
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Saved Views */}
      <div className="mt-4 border-t border-border/40 pt-3">
        <div className="mb-1.5 flex items-center justify-between px-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50">
            Saved
          </p>
          <button
            onClick={() => setShowSaveInput(true)}
            className="rounded-md p-1 text-muted-foreground/40 transition-all duration-150 hover:bg-secondary hover:text-foreground"
            aria-label="Save current view"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        {/* Save input */}
        {showSaveInput && (
          <div className="mb-1.5 px-1">
            <div className="flex items-center gap-1 rounded-lg border border-accent/30 bg-card px-2 py-1 shadow-sm">
              <input
                type="text"
                placeholder="Name..."
                value={newViewName}
                maxLength={24}
                onChange={(e) => setNewViewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveView()
                  if (e.key === "Escape") {
                    setShowSaveInput(false)
                    setNewViewName("")
                  }
                }}
                className="h-5 min-w-0 flex-1 bg-transparent text-[11px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                autoFocus
              />
              <button
                onClick={handleSaveView}
                disabled={!newViewName.trim()}
                className="shrink-0 text-[10px] font-medium text-accent transition-colors duration-100 hover:text-accent/80 disabled:opacity-40"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowSaveInput(false)
                  setNewViewName("")
                }}
                className="shrink-0 rounded p-0.5 text-muted-foreground/40 transition-colors duration-100 hover:text-foreground"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          </div>
        )}

        <nav className="flex flex-col gap-0.5" aria-label="Saved views">
          {savedViews.map((view) => (
            <div
              key={view.id}
              className="group relative flex min-w-0 items-center"
            >
              <button
                onClick={() => {
                  if (view.filters && onApplySavedView) {
                    onApplySavedView(view.filters)
                  } else {
                    onFilterChange(view.filter)
                  }
                  toast(`View: ${view.name}`, { duration: 1500 })
                }}
                className="flex h-7 min-w-0 flex-1 items-center gap-2 rounded-lg px-2.5 pr-7 text-[12px] text-muted-foreground transition-all duration-150 hover:bg-secondary/50 hover:text-foreground"
              >
                <Bookmark className="h-3 w-3 shrink-0 text-muted-foreground/40 transition-colors duration-150 group-hover:text-accent/60" />
                <span className="truncate">{view.name}</span>
              </button>
              <button
                onClick={() => handleDeleteView(view.id)}
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground/30 opacity-0 transition-all duration-150 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500"
                aria-label={`Remove ${view.name}`}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
          {savedViews.length === 0 && (
            <p className="px-2.5 py-2 text-[11px] text-muted-foreground/40">
              No saved views yet
            </p>
          )}
        </nav>
      </div>
    </div>
  )
}
