"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Bell, Mail, Smartphone, Save, Check, Loader2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { notifications as notificationsApi } from "@/lib/api"

interface Prefs {
  email: boolean
  push: boolean
  ticketAssigned: boolean
  ticketEscalated: boolean
  newTicket: boolean
  csatResponse: boolean
  weeklyDigest: boolean
}

const defaults: Prefs = {
  email: true,
  push: true,
  ticketAssigned: true,
  ticketEscalated: true,
  newTicket: true,
  csatResponse: true,
  weeklyDigest: false,
}

const toggles: { key: keyof Prefs; label: string; description: string }[] = [
  { key: "email", label: "Email notifications", description: "Receive notifications via email" },
  { key: "push", label: "Push notifications", description: "Browser push notifications" },
  { key: "newTicket", label: "New tickets", description: "When a new ticket is created" },
  { key: "ticketAssigned", label: "Ticket assigned", description: "When a ticket is assigned to you" },
  { key: "ticketEscalated", label: "Escalations", description: "When a ticket is escalated to a human" },
  { key: "csatResponse", label: "CSAT responses", description: "When a customer submits a satisfaction survey" },
  { key: "weeklyDigest", label: "Weekly digest", description: "Summary of your support metrics every Monday" },
]

export default function NotificationsSettingsPage() {
  const [prefs, setPrefs] = useState<Prefs>(defaults)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const fetchPrefs = useCallback(async () => {
    try {
      setLoading(true)
      const result = await notificationsApi.get()
      setPrefs({ ...defaults, ...result })
    } catch {
      // Keep defaults
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPrefs() }, [fetchPrefs])

  function toggle(key: keyof Prefs) {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleSave() {
    try {
      setSaving(true)
      await notificationsApi.update(prefs)
      setSaved(true)
      toast.success("Notification preferences saved")
      setTimeout(() => setSaved(false), 2000)
    } catch {
      toast.error("Failed to save preferences")
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
            <div className="h-4 w-72 rounded bg-secondary" />
            <div className="space-y-3 mt-6">
              {[1,2,3,4,5].map(i => <div key={i} className="h-16 rounded-xl bg-secondary" />)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-lg sm:text-[22px] font-semibold text-foreground tracking-tight">Notifications</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">Choose what you want to be notified about.</p>
        </div>

        {/* Toggles */}
        <div className="rounded-xl border border-border/60 bg-card divide-y divide-border/40">
          {toggles.map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-4 px-4 sm:px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-[14px] sm:text-[13px] font-medium text-foreground">{item.label}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">{item.description}</p>
              </div>
              <div className="flex items-center justify-center min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0">
                <Switch
                  checked={prefs[item.key]}
                  onCheckedChange={() => toggle(item.key)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Save bar */}
        <div className="sticky bottom-0 -mx-4 sm:-mx-6 mt-6 border-t border-border/60 bg-background/95 backdrop-blur-sm px-4 sm:px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] text-muted-foreground">Changes are saved to your account.</p>
            <button
              onClick={handleSave}
              disabled={saving}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 sm:py-2 text-[13px] font-medium transition-all min-h-[44px] sm:min-h-0 w-full sm:w-auto",
                saved
                  ? "bg-emerald-500 text-white"
                  : "bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
              )}
            >
              {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</> : saved ? <><Check className="h-3.5 w-3.5" /> Saved</> : <><Save className="h-3.5 w-3.5" /> Save changes</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
