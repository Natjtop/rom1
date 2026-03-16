"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Puzzle, Loader2, ExternalLink, Search, ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"
import { integrations as integrationsApi } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface IntegrationItem {
  id?: string
  type: string
  name: string
  description: string
  icon: string
  category: string
  installed: boolean
  enabled: boolean
  docsUrl?: string
  comingSoon?: boolean
}

const HELP_CENTER_BASE = "https://replyma.com/help-center"

const CATALOG: IntegrationItem[] = [
  { type: "SHOPIFY", name: "Shopify", description: "Sync orders, customers, and products. Power AI responses with real-time store data.", icon: "S", category: "E-commerce", installed: false, enabled: false, docsUrl: `${HELP_CENTER_BASE}/connecting-shopify-store` },
  { type: "WOOCOMMERCE", name: "WooCommerce", description: "Connect your WooCommerce store. Sync orders and customer data via REST API.", icon: "W", category: "E-commerce", installed: false, enabled: false, docsUrl: `${HELP_CENTER_BASE}/woocommerce-setup` },
  { type: "KLAVIYO", name: "Klaviyo", description: "Sync customer data and trigger email flows based on support events.", icon: "K", category: "Marketing", installed: false, enabled: false, docsUrl: `${HELP_CENTER_BASE}/klaviyo-integration` },
  { type: "RECHARGE", name: "Recharge", description: "View and manage subscriptions directly from the ticket sidebar.", icon: "R", category: "Subscriptions", installed: false, enabled: false, docsUrl: `${HELP_CENTER_BASE}/recharge-integration` },
  { type: "LOOP_RETURNS", name: "Loop Returns", description: "Process returns and exchanges seamlessly within support tickets.", icon: "L", category: "Returns", installed: false, enabled: false, docsUrl: `${HELP_CENTER_BASE}/loop-returns-integration` },
  { type: "YOTPO", name: "Yotpo", description: "Access product reviews and loyalty data alongside customer tickets.", icon: "Y", category: "Reviews", installed: false, enabled: false, docsUrl: `${HELP_CENTER_BASE}/yotpo-integration` },
  { type: "OKENDO", name: "Okendo", description: "View customer reviews and UGC data in the support sidebar.", icon: "O", category: "Reviews", installed: false, enabled: false, docsUrl: HELP_CENTER_BASE, comingSoon: true },
  { type: "ATTENTIVE", name: "Attentive", description: "Sync subscriber data and trigger campaigns from support events.", icon: "A", category: "Marketing", installed: false, enabled: false, docsUrl: HELP_CENTER_BASE, comingSoon: true },
  { type: "ZAPIER", name: "Zapier", description: "Connect Replyma with 5,000+ apps via automated Zaps.", icon: "Z", category: "Automation", installed: false, enabled: false, docsUrl: HELP_CENTER_BASE, comingSoon: true },
]

const ICON_COLORS: Record<string, string> = {
  S: "bg-[#96BF48]/10 text-[#96BF48]",
  W: "bg-[#7B5EA7]/10 text-[#7B5EA7]",
  K: "bg-foreground/8 text-foreground/80",
  R: "bg-foreground/8 text-foreground/80",
  L: "bg-foreground/8 text-foreground/80",
  Y: "bg-foreground/8 text-foreground/80",
  O: "bg-foreground/8 text-foreground/80",
  A: "bg-foreground/8 text-foreground/80",
  Z: "bg-foreground/8 text-foreground/80",
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"

export default function IntegrationsPage() {
  const { workspace } = useAuth()
  const [items, setItems] = useState<IntegrationItem[]>(CATALOG)
  const [installing, setInstalling] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState<"all" | "installed">("all")
  const [loading, setLoading] = useState(true)

  // Configuration dialog state
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [configTarget, setConfigTarget] = useState<IntegrationItem | null>(null)
  const [configApiKey, setConfigApiKey] = useState("")
  const [configSaving, setConfigSaving] = useState(false)
  // WooCommerce-specific fields
  const [wooStoreUrl, setWooStoreUrl] = useState("")
  const [wooConsumerKey, setWooConsumerKey] = useState("")
  const [wooConsumerSecret, setWooConsumerSecret] = useState("")

  const fetchIntegrations = useCallback(async () => {
    try {
      setLoading(true)
      const result = await integrationsApi.list()
      const installed = Array.isArray(result) ? result : []
      // Merge server data with catalog
      const merged = CATALOG.map(catalogItem => {
        const serverItem = installed.find((s) => s.type === catalogItem.type)
        if (serverItem) {
          return {
            ...catalogItem,
            id: serverItem.id,
            installed: true,
            enabled: serverItem.isEnabled ?? true,
          }
        }
        return catalogItem
      })
      setItems(merged)
    } catch (err) {
      toast.error("Failed to load integrations")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchIntegrations() }, [fetchIntegrations])

  function openConfigDialog(type: string) {
    const item = items.find(i => i.type === type)
    if (!item) return
    setConfigTarget(item)
    setConfigApiKey("")
    setConfigDialogOpen(true)
  }

  async function handleConfigSubmit() {
    if (!configTarget) return
    setConfigSaving(true)
    try {
      if (configTarget.type === "WOOCOMMERCE") {
        const result = await integrationsApi.configure("woocommerce", { storeUrl: wooStoreUrl, consumerKey: wooConsumerKey, consumerSecret: wooConsumerSecret })
        setItems(prev => prev.map(i => i.type === "WOOCOMMERCE" ? { ...i, id: result.id, installed: true, enabled: true } : i))
      } else {
        const result = await integrationsApi.configure(configTarget.type, { apiKey: configApiKey })
        setItems(prev => prev.map(i => i.type === configTarget.type ? { ...i, id: result.id, installed: true, enabled: true } : i))
      }
      toast.success(`${configTarget.name} connected successfully`)
      setConfigDialogOpen(false)
    } catch (err) {
      console.error("Failed to install integration:", err)
      toast.error(`Failed to connect ${configTarget.name}. Check your credentials.`)
    } finally {
      setConfigSaving(false)
    }
  }

  function handleInstall(type: string) {
    // For Shopify, redirect to OAuth flow; for everything else, open config dialog
    if (type === "SHOPIFY") {
      openConfigDialog(type)
      return
    }
    openConfigDialog(type)
  }

  async function handleUninstall(type: string) {
    const item = items.find(i => i.type === type)
    if (!item?.id) return
    try {
      await integrationsApi.delete(type)
      setItems(prev => prev.map(i => i.type === type ? { ...i, id: undefined, installed: false, enabled: false } : i))
      toast.success(`${item.name} uninstalled`)
    } catch (err) {
      console.error("Failed to uninstall integration:", err)
      toast.error(`Failed to uninstall ${item.name}`)
    }
  }

  async function handleToggle(type: string, currentEnabled: boolean) {
    const item = items.find(i => i.type === type)
    if (!item) return
    setItems(prev => prev.map(i => i.type === type ? { ...i, enabled: !currentEnabled } : i))
    try {
      if (currentEnabled) {
        await integrationsApi.delete(type)
      } else {
        await integrationsApi.configure(type, {})
      }
      toast.success(`${item.name} ${!currentEnabled ? "connected" : "disconnected"}`)
    } catch (err) {
      console.error("Failed to toggle integration:", err)
      setItems(prev => prev.map(i => i.type === type ? { ...i, enabled: currentEnabled } : i))
      toast.error(`Failed to update ${item.name}`)
    }
  }

  const categories = [...new Set(CATALOG.map(i => i.category))]

  const filteredItems = items.filter(item => {
    const matchesSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.description.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = activeFilter === "all" || item.installed
    return matchesSearch && matchesFilter
  })

  const filteredCategories = categories.filter(cat => filteredItems.some(i => i.category === cat))

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
          <span className="text-foreground font-medium">Integrations</span>
        </div>
        <h1 className="text-lg font-semibold text-foreground">Integrations</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Connect your favorite tools to supercharge your support workflow.
        </p>
      </div>

      <div className="p-3 sm:p-6 space-y-8">
        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search integrations..."
              className="h-11 sm:h-9 w-full rounded-lg border border-border/60 bg-background pl-9 pr-3 text-[13px] placeholder:text-muted-foreground/50 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
            />
          </div>
          <div className="flex items-center rounded-lg border border-border/60 p-0.5 self-start">
            <button
              onClick={() => setActiveFilter("all")}
              className={cn(
                "rounded-md px-3 py-2 sm:py-1.5 text-[12px] font-medium transition-colors min-h-[44px] sm:min-h-0",
                activeFilter === "all" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter("installed")}
              className={cn(
                "rounded-md px-3 py-2 sm:py-1.5 text-[12px] font-medium transition-colors min-h-[44px] sm:min-h-0",
                activeFilter === "installed" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Installed
            </button>
          </div>
        </div>

        {/* Integration cards by category */}
        {filteredCategories.map((category) => (
          <div key={category} className="space-y-4">
            <div>
              <h2 className="text-[14px] font-semibold text-foreground">{category}</h2>
              <p className="text-[13px] text-muted-foreground">
                {category === "E-commerce" && "E-commerce platforms and store integrations."}
                {category === "Marketing" && "Marketing automation and customer engagement tools."}
                {category === "Subscriptions" && "Subscription and recurring billing platforms."}
                {category === "Returns" && "Returns management and exchange processing."}
                {category === "Reviews" && "Customer review and user-generated content platforms."}
                {category === "Automation" && "Workflow automation and integration platforms."}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.filter(i => i.category === category).map((item) => (
                <div
                  key={item.type}
                  className="rounded-xl border border-border/60 bg-card p-3 sm:p-5 transition-colors hover:border-border/80"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[14px] font-bold",
                      ICON_COLORS[item.icon] || "bg-secondary text-foreground"
                    )}>
                      {item.type === "SHOPIFY" ? (
                        <ShoppingBag className="h-5 w-5" />
                      ) : (
                        item.icon
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-semibold text-foreground">{item.name}</p>
                        {item.installed && (
                          <span className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-medium border",
                            item.enabled
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-border/60 bg-secondary text-muted-foreground"
                          )}>
                            {item.enabled ? "Connected" : "Disconnected"}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed">{item.description}</p>
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                        {item.installed ? (
                          <button
                            onClick={() => handleToggle(item.type, item.enabled)}
                            className={cn(
                              "rounded-lg px-3 py-2 sm:py-1.5 text-[12px] font-medium transition-colors cursor-pointer min-h-[44px] sm:min-h-0 w-full sm:w-auto text-center",
                              item.enabled
                                ? "border border-red-200 text-red-600 hover:bg-red-50"
                                : "bg-foreground text-background hover:bg-foreground/90"
                            )}
                          >
                            {item.enabled ? "Disconnect" : "Connect"}
                          </button>
                        ) : item.comingSoon ? (
                          <span className="rounded-full bg-secondary px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
                            Coming soon
                          </span>
                        ) : (
                          <button
                            onClick={() => handleInstall(item.type)}
                            disabled={installing === item.type}
                            className="flex items-center justify-center gap-1.5 rounded-lg bg-foreground px-3 py-2 sm:py-1.5 text-[12px] font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50 cursor-pointer min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                          >
                            {installing === item.type ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Puzzle className="h-3 w-3" />
                            )}
                            Install
                          </button>
                        )}
                        <a
                          href={item.docsUrl ?? HELP_CENTER_BASE}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors min-h-[44px] sm:min-h-0"
                        >
                          Docs <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/60">
              <Puzzle className="h-5 w-5 text-muted-foreground/40" />
            </div>
            <p className="mt-3 text-[14px] font-medium text-foreground">No integrations found</p>
            <p className="mt-1 text-[13px] text-muted-foreground">Try adjusting your search or filter.</p>
          </div>
        )}
      </div>

      {/* Configuration dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {configTarget?.type === "SHOPIFY" ? "Connect Shopify" : `Install ${configTarget?.name ?? ""}`}
            </DialogTitle>
            <DialogDescription className="text-[13px] text-muted-foreground">
              {configTarget?.description}
            </DialogDescription>
          </DialogHeader>

          {configTarget?.type === "SHOPIFY" ? (
            <div className="flex flex-col gap-4 py-2">
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Enter your Shopify store URL and click Install to connect via OAuth.
              </p>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="shopify-store-url" className="text-[12px] font-medium text-foreground">
                  Shopify store URL
                </label>
                <input
                  id="shopify-store-url"
                  type="text"
                  placeholder="your-store.myshopify.com"
                  className="h-11 w-full rounded-lg border border-border/60 bg-background px-3 text-[16px] sm:text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                />
                <p className="text-[11px] text-muted-foreground/60">Enter your store name or full .myshopify.com URL</p>
              </div>
              <button
                onClick={() => {
                  const shopInput = document.getElementById("shopify-store-url") as HTMLInputElement | null
                  const shop = shopInput?.value?.trim()
                  if (!shop) {
                    toast.error("Please enter your Shopify store URL")
                    return
                  }
                  // Strip https://, trailing slashes, /admin paths
                  let cleaned = shop.replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim()
                  // Add .myshopify.com if not present
                  if (!cleaned.includes(".myshopify.com")) cleaned = `${cleaned}.myshopify.com`
                  window.open(`${API_BASE}/shopify/auth?shop=${encodeURIComponent(cleaned)}&workspaceId=${encodeURIComponent(workspace?.id ?? "")}`, "_blank")
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-[13px] font-medium text-background transition-colors hover:bg-foreground/90 cursor-pointer min-h-[44px] w-full"
              >
                Install from Shopify
              </button>
            </div>
          ) : configTarget?.type === "WOOCOMMERCE" ? (
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-foreground">Store URL</label>
                <input type="url" value={wooStoreUrl} onChange={(e) => setWooStoreUrl(e.target.value)} placeholder="https://your-store.com" className="h-11 w-full rounded-lg border border-border/60 bg-background px-3 text-[14px] sm:text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-foreground">Consumer Key</label>
                <input type="text" value={wooConsumerKey} onChange={(e) => setWooConsumerKey(e.target.value)} placeholder="ck_..." className="h-11 w-full rounded-lg border border-border/60 bg-background px-3 text-[14px] sm:text-[13px] text-foreground font-mono placeholder:text-muted-foreground/50 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-foreground">Consumer Secret</label>
                <input type="password" value={wooConsumerSecret} onChange={(e) => setWooConsumerSecret(e.target.value)} placeholder="cs_..." className="h-11 w-full rounded-lg border border-border/60 bg-background px-3 text-[14px] sm:text-[13px] text-foreground font-mono placeholder:text-muted-foreground/50 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20" />
              </div>
              <p className="text-[11px] text-muted-foreground">Find these in WooCommerce Admin → Settings → Advanced → REST API. Create a key with Read/Write permissions.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-foreground">API Key</label>
                <input type="password" value={configApiKey} onChange={(e) => setConfigApiKey(e.target.value)} placeholder={`Enter your ${configTarget?.name ?? ""} API key`} className="h-11 w-full rounded-lg border border-border/60 bg-background px-3 text-[14px] sm:text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20" />
                <p className="text-[11px] text-muted-foreground">This value is encrypted and stored securely.</p>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              onClick={() => setConfigDialogOpen(false)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/60 px-4 py-2 text-[13px] font-medium text-foreground transition-colors duration-150 hover:bg-secondary/60 cursor-pointer w-full sm:w-auto min-h-[44px]"
            >
              Cancel
            </button>
            {configTarget?.type !== "SHOPIFY" && (
              <button
                onClick={handleConfigSubmit}
                disabled={configSaving || (configTarget?.type === "WOOCOMMERCE" ? (!wooStoreUrl || !wooConsumerKey || !wooConsumerSecret) : !configApiKey.trim())}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2 text-[13px] font-medium text-background transition-colors hover:bg-foreground/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto min-h-[44px]"
              >
                {configSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect"
                )}
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
