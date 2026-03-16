"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Save, Check, Loader2, ShoppingBag, Plus, Pencil, Trash2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { workspace } from "@/lib/api"

interface ProactiveCampaign {
  id: string
  name?: string
  priority?: number
  enabled?: boolean
  triggers?: {
    cartValueMin?: number
    dwellTimeMinSeconds?: number
    urlPattern?: string
    exitIntent?: boolean
  }
  messageTemplate?: string
}

const DISCOUNT_STRATEGIES = [
  { value: "none", label: "No discounts", description: "AI will not suggest discounts" },
  { value: "conservative", label: "Conservative", description: "Suggest discounts only when clearly needed" },
  { value: "strategic", label: "Strategic", description: "Balance conversion and margin" },
  { value: "generous", label: "Generous", description: "Use discounts more freely to convert" },
]

function commaListToArray(s: string): string[] {
  return s
    .split(/[,\n]/)
    .map((x) => x.trim())
    .filter(Boolean)
}

function arrayToCommaList(arr: string[] | undefined): string {
  if (!arr?.length) return ""
  return arr.join(", ")
}

export default function ShoppingAssistantPage() {
  const [enabled, setEnabled] = useState(false)
  const [promptOverride, setPromptOverride] = useState("")
  const [discountStrategy, setDiscountStrategy] = useState<string>("none")
  const [promoteProductIds, setPromoteProductIds] = useState("")
  const [excludeProductIds, setExcludeProductIds] = useState("")
  const [excludeTags, setExcludeTags] = useState("")
  const [excludeVendors, setExcludeVendors] = useState("")
  const [campaigns, setCampaigns] = useState<ProactiveCampaign[]>([])
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<ProactiveCampaign | null>(null)
  const [campaignName, setCampaignName] = useState("")
  const [campaignPriority, setCampaignPriority] = useState(0)
  const [campaignEnabled, setCampaignEnabled] = useState(true)
  const [campaignCartValueMin, setCampaignCartValueMin] = useState("")
  const [campaignDwellSec, setCampaignDwellSec] = useState("")
  const [campaignUrlPattern, setCampaignUrlPattern] = useState("")
  const [campaignExitIntent, setCampaignExitIntent] = useState(false)
  const [campaignMessage, setCampaignMessage] = useState("")
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      const ws = (await workspace.get()) as unknown as Record<string, unknown>
      if (ws.shoppingAssistantEnabled !== undefined) setEnabled(ws.shoppingAssistantEnabled as boolean)
      if (ws.shoppingAssistantPromptOverride != null) setPromptOverride(String(ws.shoppingAssistantPromptOverride))
      if (ws.shoppingDiscountStrategy != null) setDiscountStrategy(String(ws.shoppingDiscountStrategy))
      const config = ws.shoppingProductRecommendationConfig as Record<string, string[] | undefined> | null | undefined
      if (config) {
        setPromoteProductIds(arrayToCommaList(config.promoteProductIds))
        setExcludeProductIds(arrayToCommaList(config.excludeProductIds))
        setExcludeTags(arrayToCommaList(config.excludeTags))
        setExcludeVendors(arrayToCommaList(config.excludeVendors))
      }
      const rawCampaigns = ws.shoppingProactiveCampaigns as ProactiveCampaign[] | null | undefined
      setCampaigns(Array.isArray(rawCampaigns) ? rawCampaigns : [])
    } catch {
      toast.error("Failed to load Shopping Assistant settings")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  function openAddCampaign() {
    setEditingCampaign(null)
    setCampaignName("")
    setCampaignPriority(0)
    setCampaignEnabled(true)
    setCampaignCartValueMin("")
    setCampaignDwellSec("")
    setCampaignUrlPattern("")
    setCampaignExitIntent(false)
    setCampaignMessage("")
    setCampaignDialogOpen(true)
  }

  function openEditCampaign(c: ProactiveCampaign) {
    setEditingCampaign(c)
    setCampaignName(c.name ?? "")
    setCampaignPriority(c.priority ?? 0)
    setCampaignEnabled(c.enabled !== false)
    setCampaignCartValueMin(c.triggers?.cartValueMin != null ? String(c.triggers.cartValueMin) : "")
    setCampaignDwellSec(c.triggers?.dwellTimeMinSeconds != null ? String(c.triggers.dwellTimeMinSeconds) : "")
    setCampaignUrlPattern(c.triggers?.urlPattern ?? "")
    setCampaignExitIntent(c.triggers?.exitIntent ?? false)
    setCampaignMessage(c.messageTemplate ?? "")
    setCampaignDialogOpen(true)
  }

  function saveCampaign() {
    const triggers: ProactiveCampaign["triggers"] = {}
    if (campaignCartValueMin.trim()) triggers.cartValueMin = Number(campaignCartValueMin) || 0
    if (campaignDwellSec.trim()) triggers.dwellTimeMinSeconds = Number(campaignDwellSec) || 0
    if (campaignUrlPattern.trim()) triggers.urlPattern = campaignUrlPattern.trim()
    if (campaignExitIntent) triggers.exitIntent = true
    const payload: ProactiveCampaign = {
      id: editingCampaign?.id ?? `c-${Date.now()}`,
      name: campaignName.trim() || undefined,
      priority: campaignPriority,
      enabled: campaignEnabled,
      triggers: Object.keys(triggers).length ? triggers : undefined,
      messageTemplate: campaignMessage.trim() || undefined,
    }
    if (editingCampaign) {
      setCampaigns((prev) => prev.map((x) => (x.id === editingCampaign.id ? payload : x)))
    } else {
      setCampaigns((prev) => [...prev, payload])
    }
    setCampaignDialogOpen(false)
  }

  function removeCampaign(id: string) {
    setCampaigns((prev) => prev.filter((c) => c.id !== id))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const config = {
        promoteProductIds: commaListToArray(promoteProductIds),
        excludeProductIds: commaListToArray(excludeProductIds),
        excludeTags: commaListToArray(excludeTags),
        excludeVendors: commaListToArray(excludeVendors),
      }
      await workspace.update({
        shoppingAssistantEnabled: enabled,
        shoppingAssistantPromptOverride: promptOverride.trim() || null,
        shoppingDiscountStrategy: discountStrategy === "none" ? null : discountStrategy,
        shoppingProductRecommendationConfig: config,
        shoppingProactiveCampaigns: campaigns,
      })
      setSaved(true)
      toast.success("Shopping Assistant settings saved")
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error("Failed to save Shopping Assistant settings:", err)
      toast.error("Failed to save settings")
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
            <div className="mt-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-secondary" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="border-b border-border/60 px-3 sm:px-6 py-6">
        <div className="mb-4 flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <Link href="/settings" className="hover:text-foreground transition-colors">
            Settings
          </Link>
          <span>/</span>
          <span className="font-medium text-foreground">Shopping Assistant</span>
        </div>
        <h1 className="text-lg font-semibold text-foreground">Shopping Assistant</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Let AI recommend products from your Shopify catalog in live chat. Enable product cards and control which
          products to promote or exclude.
        </p>
      </div>

      <div className="space-y-8 p-3 sm:p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-[14px] font-semibold text-foreground">Status</h2>
            <p className="text-[13px] text-muted-foreground">
              When enabled, live chat AI can recommend products from your store and show product cards in the widget.
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card">
            <div className="flex items-center justify-between gap-3 px-3 sm:px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-foreground">Enable Shopping Assistant</p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    Requires a connected Shopify store. Product catalog is cached for 5 minutes.
                  </p>
                </div>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} className="shrink-0" />
            </div>
          </div>
        </div>

        {enabled && (
          <>
            <div className="space-y-4">
              <div>
                <h2 className="text-[14px] font-semibold text-foreground">Custom instructions</h2>
                <p className="text-[13px] text-muted-foreground">
                  Optional. Add instructions for the AI when recommending products (e.g. tone, priorities).
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-3 sm:p-5">
                <Label className="text-[13px] font-medium text-foreground">Prompt override</Label>
                <Textarea
                  value={promptOverride}
                  onChange={(e) => setPromptOverride(e.target.value)}
                  placeholder="e.g. Prefer eco-friendly products. Keep recommendations to 2 items unless the customer asks for more."
                  rows={3}
                  className="mt-2 w-full resize-none rounded-lg border border-border/60 bg-background px-3 py-2 text-[13px] text-foreground focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-[14px] font-semibold text-foreground">Discount strategy</h2>
                <p className="text-[13px] text-muted-foreground">
                  How the AI should approach suggesting discounts (used in AI instructions).
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-3 sm:p-5">
                <Select value={discountStrategy} onValueChange={setDiscountStrategy}>
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DISCOUNT_STRATEGIES.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className="font-medium">{opt.label}</span>
                        <span className="ml-2 text-muted-foreground">— {opt.description}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-[14px] font-semibold text-foreground">Product recommendations</h2>
                <p className="text-[13px] text-muted-foreground">
                  Promote specific products (AI prioritizes them) or exclude products, tags, or vendors from
                  recommendations. One ID or tag per line, or comma-separated.
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-3 sm:p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-medium text-foreground">Promote product IDs</Label>
                  <Textarea
                    value={promoteProductIds}
                    onChange={(e) => setPromoteProductIds(e.target.value)}
                    placeholder="gid://shopify/Product/123456789, or one per line"
                    rows={2}
                    className="w-full resize-none rounded-lg border border-border/60 bg-background px-3 py-2 text-[13px] text-foreground focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-medium text-foreground">Exclude product IDs</Label>
                  <Textarea
                    value={excludeProductIds}
                    onChange={(e) => setExcludeProductIds(e.target.value)}
                    placeholder="Product IDs to never recommend"
                    rows={2}
                    className="w-full resize-none rounded-lg border border-border/60 bg-background px-3 py-2 text-[13px] text-foreground focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-medium text-foreground">Exclude tags</Label>
                    <Textarea
                      value={excludeTags}
                      onChange={(e) => setExcludeTags(e.target.value)}
                      placeholder="sale, clearance"
                      rows={2}
                      className="w-full resize-none rounded-lg border border-border/60 bg-background px-3 py-2 text-[13px] text-foreground focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-medium text-foreground">Exclude vendors</Label>
                    <Textarea
                      value={excludeVendors}
                      onChange={(e) => setExcludeVendors(e.target.value)}
                      placeholder="Vendor names to exclude"
                      rows={2}
                      className="w-full resize-none rounded-lg border border-border/60 bg-background px-3 py-2 text-[13px] text-foreground focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-[14px] font-semibold text-foreground">Proactive campaigns</h2>
                <p className="text-[13px] text-muted-foreground">
                  Show a message in the widget when triggers match (e.g. cart value, time on page, URL, exit intent). Widget sends session context and requests the message via API.
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-3 sm:p-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className="text-[13px] text-muted-foreground">{campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}</span>
                  <Button type="button" variant="outline" size="sm" onClick={openAddCampaign} className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    Add campaign
                  </Button>
                </div>
                {campaigns.length === 0 ? (
                  <p className="text-[13px] text-muted-foreground py-2">No proactive campaigns yet. Add one to show a message when conditions match.</p>
                ) : (
                  <ul className="space-y-2">
                    {campaigns.map((c) => (
                      <li key={c.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/50 px-3 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-foreground truncate">{c.name || "Unnamed campaign"}</p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {c.triggers?.cartValueMin != null && `Cart ≥ $${c.triggers.cartValueMin} `}
                            {c.triggers?.dwellTimeMinSeconds != null && `Dwell ≥ ${c.triggers.dwellTimeMinSeconds}s `}
                            {c.triggers?.urlPattern && `URL: ${c.triggers.urlPattern} `}
                            {c.triggers?.exitIntent && "Exit intent "}
                            {!c.triggers?.cartValueMin && !c.triggers?.dwellTimeMinSeconds && !c.triggers?.urlPattern && !c.triggers?.exitIntent && "No triggers"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditCampaign(c)} aria-label="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => removeCampaign(c.id)} aria-label="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}

        <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingCampaign ? "Edit campaign" : "Add campaign"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="e.g. High cart value" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Priority (higher first)</Label>
                  <Input type="number" value={campaignPriority} onChange={(e) => setCampaignPriority(Number(e.target.value) || 0)} />
                </div>
                <div className="flex items-center gap-2 pt-8">
                  <Switch checked={campaignEnabled} onCheckedChange={setCampaignEnabled} />
                  <Label>Enabled</Label>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Triggers (optional)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" placeholder="Cart value min ($)" value={campaignCartValueMin} onChange={(e) => setCampaignCartValueMin(e.target.value)} />
                  <Input type="number" placeholder="Dwell time (seconds)" value={campaignDwellSec} onChange={(e) => setCampaignDwellSec(e.target.value)} />
                </div>
                <Input placeholder="URL pattern (regex or substring)" value={campaignUrlPattern} onChange={(e) => setCampaignUrlPattern(e.target.value)} />
                <div className="flex items-center gap-2">
                  <Switch checked={campaignExitIntent} onCheckedChange={setCampaignExitIntent} />
                  <Label className="text-[13px]">Exit intent</Label>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Message template</Label>
                <Textarea value={campaignMessage} onChange={(e) => setCampaignMessage(e.target.value)} placeholder="Hi! Need help finding something?" rows={3} className="resize-none" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCampaignDialogOpen(false)}>Cancel</Button>
              <Button type="button" onClick={saveCampaign}>{editingCampaign ? "Save" : "Add"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving…" : saved ? "Saved" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  )
}
