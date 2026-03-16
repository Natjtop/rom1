"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Save, Check, Star, Loader2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { workspace } from "@/lib/api"

const TIMING_OPTIONS = [
  { id: "immediate", label: "Immediately after close", description: "Survey sent as soon as the ticket is resolved" },
  { id: "1h", label: "1 hour after close", description: "Gives customers time to verify the resolution" },
  { id: "24h", label: "24 hours after close", description: "Best for complex issues that may need follow-up" },
]

const SCALE_OPTIONS = [
  { id: "3-point", label: "3-point scale", description: "Great, Okay, Poor" },
  { id: "5-point", label: "5-point scale", description: "1 to 5 star rating" },
]

export default function CsatPage() {
  const [enabled, setEnabled] = useState(true)
  const [timing, setTiming] = useState("1h")
  const [scale, setScale] = useState("3-point")
  const [followUpEnabled, setFollowUpEnabled] = useState(false)
  const [message, setMessage] = useState(
    "How satisfied were you with our support today?"
  )
  const [followUpMessage, setFollowUpMessage] = useState(
    "We noticed your experience wasn't great. Could you tell us what we could improve?"
  )
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      const ws = await workspace.get()
      const wsData = ws as unknown as Record<string, unknown>
      if (wsData.csatEnabled !== undefined) setEnabled(wsData.csatEnabled as boolean)
      if (wsData.csatTiming) setTiming(wsData.csatTiming as string)
      if (wsData.csatScale) setScale(wsData.csatScale as string)
      if (wsData.csatMessage) setMessage(wsData.csatMessage as string)
      if (wsData.csatFollowUpEnabled !== undefined) setFollowUpEnabled(wsData.csatFollowUpEnabled as boolean)
      if (wsData.csatFollowUpMessage) setFollowUpMessage(wsData.csatFollowUpMessage as string)
    } catch (err) {
      toast.error("Failed to load CSAT settings")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const handleSave = async () => {
    try {
      setSaving(true)
      await workspace.update({
        csatEnabled: enabled,
        csatTiming: timing,
        csatScale: scale,
        csatMessage: message,
        csatFollowUpEnabled: followUpEnabled,
        csatFollowUpMessage: followUpMessage,
      })
      setSaved(true)
      toast.success("CSAT settings saved")
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error("Failed to save CSAT settings:", err)
      toast.error("Failed to save CSAT settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded-lg bg-secondary" />
            <div className="h-4 w-64 rounded bg-secondary" />
            <div className="space-y-3 mt-6">
              {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-secondary" />)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Page header */}
      <div className="border-b border-border/60 px-3 sm:px-6 py-6">
        <div className="mb-4 flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <Link href="/settings" className="hover:text-foreground transition-colors">Settings</Link>
          <span>/</span>
          <span className="text-foreground font-medium">CSAT Surveys</span>
        </div>
        <h1 className="text-lg font-semibold text-foreground">Customer Satisfaction (CSAT)</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Collect feedback from customers after their tickets are resolved.
        </p>
      </div>

      <div className="p-3 sm:p-6 space-y-8">
        {/* Enable CSAT */}
        <div className="space-y-4">
          <div>
            <h2 className="text-[14px] font-semibold text-foreground">Survey status</h2>
            <p className="text-[13px] text-muted-foreground">Enable or disable CSAT surveys for resolved tickets.</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card">
            <div className="flex items-center justify-between gap-3 px-3 sm:px-5 py-4">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-foreground">
                  Send satisfaction survey after ticket is resolved
                </p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  Customers will receive a short survey when their ticket is closed.
                </p>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={setEnabled}
                className="shrink-0"
              />
            </div>
          </div>
        </div>

        {/* Survey timing */}
        <div className="space-y-4">
          <div>
            <h2 className="text-[14px] font-semibold text-foreground">Delivery timing</h2>
            <p className="text-[13px] text-muted-foreground">When should the survey be sent after a ticket is resolved?</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
            <div className="divide-y divide-border/40">
              {TIMING_OPTIONS.map((option) => (
                <label
                  key={option.id}
                  className="flex items-center gap-3 px-3 sm:px-5 py-4 cursor-pointer hover:bg-secondary/10 transition-colors"
                  onClick={() => setTiming(option.id)}
                >
                  <div
                    className={cn(
                      "h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors duration-150 shrink-0",
                      timing === option.id
                        ? "border-foreground bg-foreground"
                        : "border-border/60 bg-background"
                    )}
                  >
                    {timing === option.id && (
                      <div className="h-1.5 w-1.5 rounded-full bg-background" />
                    )}
                  </div>
                  <div>
                    <span className={cn(
                      "text-[13px] transition-colors duration-150",
                      timing === option.id ? "text-foreground font-medium" : "text-muted-foreground"
                    )}>
                      {option.label}
                    </span>
                    <p className="text-[12px] text-muted-foreground/60">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Rating scale */}
        <div className="space-y-4">
          <div>
            <h2 className="text-[14px] font-semibold text-foreground">Rating scale</h2>
            <p className="text-[13px] text-muted-foreground">Choose the rating format customers will see.</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
            <div className="divide-y divide-border/40">
              {SCALE_OPTIONS.map((option) => (
                <label
                  key={option.id}
                  className="flex items-center gap-3 px-3 sm:px-5 py-4 cursor-pointer hover:bg-secondary/10 transition-colors"
                  onClick={() => setScale(option.id)}
                >
                  <div
                    className={cn(
                      "h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors duration-150 shrink-0",
                      scale === option.id
                        ? "border-foreground bg-foreground"
                        : "border-border/60 bg-background"
                    )}
                  >
                    {scale === option.id && (
                      <div className="h-1.5 w-1.5 rounded-full bg-background" />
                    )}
                  </div>
                  <div>
                    <span className={cn(
                      "text-[13px] transition-colors duration-150",
                      scale === option.id ? "text-foreground font-medium" : "text-muted-foreground"
                    )}>
                      {option.label}
                    </span>
                    <p className="text-[12px] text-muted-foreground/60">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Survey message */}
        <div className="space-y-4">
          <div>
            <h2 className="text-[14px] font-semibold text-foreground">Survey message</h2>
            <p className="text-[13px] text-muted-foreground">Customize the message customers see in the survey.</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card">
            <div className="p-3 sm:p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-foreground">
                  Primary question
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-[13px] focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 resize-none text-foreground transition-colors duration-150"
                />
                <p className="text-[12px] text-muted-foreground/60">This is the main question customers will be asked to rate.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Follow-up for negative */}
        <div className="space-y-4">
          <div>
            <h2 className="text-[14px] font-semibold text-foreground">Negative feedback follow-up</h2>
            <p className="text-[13px] text-muted-foreground">Optionally ask for more details when a customer rates poorly.</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card">
            <div className="p-3 sm:p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-foreground">Enable follow-up question</p>
                  <p className="text-[12px] text-muted-foreground">Show an additional text field for negative ratings</p>
                </div>
                <Switch checked={followUpEnabled} onCheckedChange={setFollowUpEnabled} />
              </div>
              {followUpEnabled && (
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-foreground">Follow-up message</label>
                  <textarea
                    value={followUpMessage}
                    onChange={(e) => setFollowUpMessage(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-[13px] focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 resize-none text-foreground transition-colors duration-150"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <div>
            <h2 className="text-[14px] font-semibold text-foreground">Preview</h2>
            <p className="text-[13px] text-muted-foreground">How the survey will appear to customers.</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card">
            <div className="p-3 sm:p-5">
              <div className="mx-auto max-w-full sm:max-w-sm rounded-xl border border-border/60 bg-background p-4 sm:p-6 text-center shadow-sm">
                <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-full bg-accent/10">
                  <Star className="h-5 w-5 text-accent" />
                </div>
                <p className="mt-4 text-[14px] font-medium text-foreground">{message}</p>
                {scale === "3-point" ? (
                  <div className="mt-4 flex flex-wrap justify-center gap-2 sm:gap-3">
                    <button className="rounded-lg border border-border/60 px-4 py-2 text-[13px] font-medium text-foreground hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-colors min-h-[44px]">
                      Great
                    </button>
                    <button className="rounded-lg border border-border/60 px-4 py-2 text-[13px] font-medium text-foreground hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 transition-colors min-h-[44px]">
                      Okay
                    </button>
                    <button className="rounded-lg border border-border/60 px-4 py-2 text-[13px] font-medium text-foreground hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors min-h-[44px]">
                      Poor
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 flex justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} className="rounded-lg p-2 sm:p-1.5 text-muted-foreground/40 hover:text-amber-500 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                        <Star className="h-6 w-6" />
                      </button>
                    ))}
                  </div>
                )}
                <p className="mt-3 text-[11px] text-muted-foreground">Powered by Replyma</p>
              </div>
            </div>
          </div>
        </div>

        {/* This month stats */}
        <div className="space-y-4">
          <div>
            <h2 className="text-[14px] font-semibold text-foreground">This month</h2>
            <p className="text-[13px] text-muted-foreground">Survey performance for the current billing period.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border/60 bg-card p-3 sm:p-5 text-center">
              <p className="text-[24px] font-semibold text-muted-foreground/40 tracking-tight">--</p>
              <p className="mt-1 text-[12px] text-muted-foreground">Average rating</p>
              <p className="text-[11px] text-muted-foreground/50">No data yet</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-3 sm:p-5 text-center">
              <p className="text-[24px] font-semibold text-muted-foreground/40 tracking-tight">--</p>
              <p className="mt-1 text-[12px] text-muted-foreground">Total responses</p>
              <p className="text-[11px] text-muted-foreground/50">No data yet</p>
            </div>
            <div className="col-span-2 sm:col-span-1 rounded-xl border border-border/60 bg-card p-3 sm:p-5 text-center">
              <p className="text-[24px] font-semibold text-muted-foreground/40 tracking-tight">--</p>
              <p className="mt-1 text-[12px] text-muted-foreground">Positive rate</p>
              <p className="text-[11px] text-muted-foreground/50">No data yet</p>
            </div>
          </div>
        </div>

        {/* Sticky save bar */}
        <div className="sticky bottom-0 -mx-3 sm:-mx-6 border-t border-border/60 bg-background/95 backdrop-blur-sm px-3 sm:px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] text-muted-foreground">Changes apply to all future surveys.</p>
            <button
              onClick={handleSave}
              disabled={saving}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 sm:py-2 text-[13px] font-medium transition-all duration-150 active:scale-[0.98] min-h-[44px] sm:min-h-0 w-full sm:w-auto",
                saved
                  ? "bg-emerald-500 text-white"
                  : "bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
              )}
            >
              {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</> : saved ? <><Check className="h-3.5 w-3.5" /> Saved</> : <><Save className="h-3.5 w-3.5" /> Save settings</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
