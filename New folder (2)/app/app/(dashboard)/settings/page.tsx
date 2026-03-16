"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Save, ExternalLink, Check, Key, Webhook, SmilePlus, Mail, Clock, Bell, Puzzle, ChevronRight, Loader2, UserCircle, ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { workspace } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
const WEEKEND = ["Saturday", "Sunday"]

const settingsLinks = [
  { href: "/settings/account",   icon: UserCircle,label: "Account",         desc: "Profile, password, and security" },
  { href: "/settings/api",       icon: Key,       label: "API Keys",        desc: "Manage API keys for integrations" },
  { href: "/settings/webhooks",  icon: Webhook,   label: "Webhooks",        desc: "Configure event delivery endpoints" },
  { href: "/settings/csat",      icon: SmilePlus, label: "CSAT Surveys",    desc: "Customer satisfaction settings" },
  { href: "/settings/templates", icon: Mail,      label: "Email Templates", desc: "Automated email templates" },
  { href: "/settings/sla",       icon: Clock,     label: "SLA Policies",    desc: "Response & resolution time targets" },
  { href: "/settings/notifications", icon: Bell,  label: "Notifications",   desc: "Email, in-app & push preferences" },
  { href: "/settings/shopping-assistant", icon: ShoppingBag, label: "Shopping Assistant", desc: "Product recommendations & AI shopping in live chat" },
  { href: "/settings/integrations",  icon: Puzzle,label: "Integrations",    desc: "Connect third-party tools" },
]

const defaultHours: Record<string, { open: string; close: string }> = {
  Monday:    { open: "09:00", close: "17:00" },
  Tuesday:   { open: "09:00", close: "17:00" },
  Wednesday: { open: "09:00", close: "17:00" },
  Thursday:  { open: "09:00", close: "17:00" },
  Friday:    { open: "09:00", close: "17:00" },
}

interface StoreConnection {
  id: string
  platform: string
  storeUrl: string
  shopId: string | null
  installedAt: string
}

function getStoreAdminUrl(store: StoreConnection): string {
  const base = store.storeUrl.startsWith("http://") || store.storeUrl.startsWith("https://")
    ? store.storeUrl
    : `https://${store.storeUrl}`
  const origin = base.replace(/\/+$/, "")
  if (store.platform === "WOOCOMMERCE") return `${origin}/wp-admin`
  return `${origin}/admin`
}

export default function SettingsPage() {
  const { updateWorkspace } = useAuth()
  const [workspaceName, setWorkspaceName] = useState("")
  const [workspaceSlug, setWorkspaceSlug] = useState("")
  const [hours, setHours] = useState(defaultHours)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [stores, setStores] = useState<StoreConnection[]>([])
  const [timezone, setTimezone] = useState("UTC")
  const [weekendHours, setWeekendHours] = useState<Record<string, { enabled: boolean; open: string; close: string }>>({
    Saturday: { enabled: false, open: "10:00", close: "16:00" },
    Sunday: { enabled: false, open: "10:00", close: "16:00" },
  })

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      const ws = await workspace.get() as unknown as Record<string, unknown>
      setWorkspaceName((ws.name as string) || "")
      setWorkspaceSlug((ws.slug as string) || "")
      if (Array.isArray(ws.stores)) {
        setStores(ws.stores as StoreConnection[])
      }
      if (ws.businessHoursJson) {
        try {
          const parsed = typeof ws.businessHoursJson === "string" ? JSON.parse(ws.businessHoursJson) : ws.businessHoursJson
          if (parsed && typeof parsed === "object") {
            const p = parsed as Record<string, unknown>
            // Restore timezone
            if (typeof p.timezone === "string") {
              setTimezone(p.timezone)
            }
            // Restore weekend hours
            if (p.weekendHours && typeof p.weekendHours === "object") {
              setWeekendHours(p.weekendHours as Record<string, { enabled: boolean; open: string; close: string }>)
            }
            // Restore weekday hours
            const weekdayData: Record<string, { open: string; close: string }> = {}
            for (const day of WEEKDAYS) {
              if (p[day] && typeof p[day] === "object") {
                weekdayData[day] = p[day] as { open: string; close: string }
              }
            }
            if (Object.keys(weekdayData).length > 0) {
              setHours({ ...defaultHours, ...weekdayData })
            }
          }
        } catch {
          // Keep default hours
        }
      }
    } catch (err) {
      toast.error("Failed to load workspace settings")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const handleSave = async () => {
    try {
      setSaving(true)
      await workspace.update({
        name: workspaceName,
        businessHoursJson: { ...hours, timezone, weekendHours },
      })
      updateWorkspace({ name: workspaceName })
      setSaved(true)
      toast.success("Settings saved successfully")
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error("Failed to save settings:", err)
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const updateHour = (day: string, field: "open" | "close", value: string) => {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }))
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
        <h1 className="text-lg font-semibold text-foreground">Settings</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Manage your workspace configuration, business hours, and account preferences.
        </p>
      </div>

      <div className="p-3 sm:p-6 space-y-8">
        {/* Settings navigation */}
        <div className="space-y-4">
          <div>
            <h2 className="text-[14px] font-semibold text-foreground">Quick access</h2>
            <p className="text-[13px] text-muted-foreground">Jump to a specific settings section.</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {settingsLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3.5 transition-all duration-150 hover:border-border hover:bg-secondary/30"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-secondary/50 transition-colors duration-150 group-hover:bg-background">
                  <link.icon className="h-4 w-4 text-muted-foreground/70" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-foreground">{link.label}</p>
                  <p className="text-[11px] text-muted-foreground/60 leading-tight">{link.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/30 transition-colors group-hover:text-muted-foreground/60" />
              </Link>
            ))}
          </div>
        </div>

        {/* Workspace details */}
        <div className="space-y-4">
          <div>
            <h2 className="text-[14px] font-semibold text-foreground">Workspace</h2>
            <p className="text-[13px] text-muted-foreground">General information about your workspace.</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card">
            <div className="p-3 sm:p-5 space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="ws-name" className="text-[13px] font-medium text-foreground">Workspace name</label>
                <input
                  id="ws-name"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="h-11 sm:h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-[13px] text-foreground focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                />
                <p className="text-[12px] text-muted-foreground/60">This is the name displayed across the platform and in customer-facing communications.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-foreground">Workspace URL</label>
                <div className="flex h-11 sm:h-9 items-center rounded-lg border border-border/60 bg-secondary/30 px-3 text-[13px] text-muted-foreground">
                  {workspaceSlug}.replyma.com
                </div>
                <p className="text-[12px] text-muted-foreground/60">Your unique workspace identifier.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Store connection */}
        <div className="space-y-4">
          <div>
            <h2 className="text-[14px] font-semibold text-foreground">Store connection</h2>
            <p className="text-[13px] text-muted-foreground">Your connected e-commerce platform.</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card">
            {stores.length > 0 ? (
              stores.map((store) => (
                <div key={store.id} className="flex flex-col gap-3 p-3 sm:p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-secondary/40">
                      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-[#96BF48]" aria-label="Shopify" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15.337 2.24c-.012-.1-.1-.15-.172-.16-.073-.012-1.502-.028-1.502-.028s-1.19-1.16-1.315-1.285c-.124-.123-.37-.085-.465-.057L11.12 1.04C10.9.38 10.54 0 10.057 0c0 0-.008 0-.012.001C9.9-.007 9.74.15 9.6.432 9.2 1.27 9.038 2.593 9.038 2.593l-1.61.497c0-.001-.16.052-.165.054C7.11 3.25 7.1 3.41 7.1 3.41L5.5 18.22l9.44 1.77 5.1-1.1L15.337 2.24z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-foreground capitalize">{store.platform.toLowerCase()}</p>
                      <p className="text-[12px] text-muted-foreground break-all">{store.storeUrl}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Connected
                    </span>
                    <a href={getStoreAdminUrl(store)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-lg border border-border/60 px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors min-h-[44px]">
                      Open admin <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col gap-3 p-3 sm:p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-secondary/40">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-muted-foreground/30" aria-label="Shopify" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15.337 2.24c-.012-.1-.1-.15-.172-.16-.073-.012-1.502-.028-1.502-.028s-1.19-1.16-1.315-1.285c-.124-.123-.37-.085-.465-.057L11.12 1.04C10.9.38 10.54 0 10.057 0c0 0-.008 0-.012.001C9.9-.007 9.74.15 9.6.432 9.2 1.27 9.038 2.593 9.038 2.593l-1.61.497c0-.001-.16.052-.165.054C7.11 3.25 7.1 3.41 7.1 3.41L5.5 18.22l9.44 1.77 5.1-1.1L15.337 2.24z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-foreground">No store connected</p>
                    <p className="text-[12px] text-muted-foreground">Connect your Shopify store to unlock order data and revenue tracking.</p>
                  </div>
                </div>
                <Link
                  href="/settings/integrations"
                  className="flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-[12px] font-medium text-background transition-colors hover:bg-foreground/90 min-h-[44px] shrink-0"
                >
                  Connect <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Business hours */}
        <div className="space-y-4">
          <div>
            <h2 className="text-[14px] font-semibold text-foreground">Business hours</h2>
            <p className="text-[13px] text-muted-foreground">Define when your team is available for live support. SLA timers pause outside these hours if configured.</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card">
            <div className="p-3 sm:p-5">
              {/* Timezone selector */}
              <div className="mb-4 pb-4 border-b border-border/40">
                <label htmlFor="tz-select" className="text-[13px] font-medium text-foreground">Timezone</label>
                <select
                  id="tz-select"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="mt-1.5 h-11 sm:h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-[13px] text-foreground focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                >
                  <option value="America/New_York">America/New_York (EST/EDT)</option>
                  <option value="America/Chicago">America/Chicago (CST/CDT)</option>
                  <option value="America/Denver">America/Denver (MST/MDT)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="Europe/Paris">Europe/Paris (CET/CEST)</option>
                  <option value="Europe/Berlin">Europe/Berlin (CET/CEST)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                  <option value="Asia/Shanghai">Asia/Shanghai (CST)</option>
                  <option value="Australia/Sydney">Australia/Sydney (AEST/AEDT)</option>
                  <option value="UTC">UTC</option>
                </select>
                <p className="mt-1 text-[12px] text-muted-foreground/60">Business hours and SLA timers will use this timezone.</p>
              </div>

              <div className="flex flex-col divide-y divide-border/40">
                {WEEKDAYS.map((day) => (
                  <div key={day} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-[13px] font-medium text-foreground">{day}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={hours[day].open}
                        onChange={(e) => updateHour(day, "open", e.target.value)}
                        className="h-11 sm:h-9 w-full sm:w-28 rounded-lg border border-border/60 bg-background px-3 text-[13px] text-foreground focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                      />
                      <span className="text-[12px] text-muted-foreground shrink-0">to</span>
                      <input
                        type="time"
                        value={hours[day].close}
                        onChange={(e) => updateHour(day, "close", e.target.value)}
                        className="h-11 sm:h-9 w-full sm:w-28 rounded-lg border border-border/60 bg-background px-3 text-[13px] text-foreground focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                      />
                    </div>
                  </div>
                ))}
                {WEEKEND.map((day) => (
                  <div key={day} className="flex flex-col gap-2 py-3 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <span className={cn("text-[13px]", weekendHours[day].enabled ? "font-medium text-foreground" : "text-muted-foreground")}>{day}</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={weekendHours[day].enabled}
                        onClick={() => setWeekendHours((prev) => ({
                          ...prev,
                          [day]: { ...prev[day], enabled: !prev[day].enabled },
                        }))}
                        className={cn(
                          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200",
                          weekendHours[day].enabled ? "bg-accent" : "bg-border"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200",
                            weekendHours[day].enabled ? "translate-x-[18px]" : "translate-x-[3px]"
                          )}
                        />
                      </button>
                    </div>
                    {weekendHours[day].enabled ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={weekendHours[day].open}
                          onChange={(e) => setWeekendHours((prev) => ({
                            ...prev,
                            [day]: { ...prev[day], open: e.target.value },
                          }))}
                          className="h-11 sm:h-9 w-full sm:w-28 rounded-lg border border-border/60 bg-background px-3 text-[13px] text-foreground focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                        />
                        <span className="text-[12px] text-muted-foreground shrink-0">to</span>
                        <input
                          type="time"
                          value={weekendHours[day].close}
                          onChange={(e) => setWeekendHours((prev) => ({
                            ...prev,
                            [day]: { ...prev[day], close: e.target.value },
                          }))}
                          className="h-11 sm:h-9 w-full sm:w-28 rounded-lg border border-border/60 bg-background px-3 text-[13px] text-foreground focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                        />
                      </div>
                    ) : (
                      <span className="rounded-full border border-border/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">Closed</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky save bar */}
        <div className="sticky bottom-0 -mx-3 sm:-mx-6 border-t border-border/60 bg-background/95 backdrop-blur-sm px-3 sm:px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] text-muted-foreground">Save changes to update your workspace settings.</p>
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
              {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</> : saved ? <><Check className="h-3.5 w-3.5" /> Saved</> : <><Save className="h-3.5 w-3.5" /> Save changes</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
