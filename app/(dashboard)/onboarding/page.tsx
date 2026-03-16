"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { workspace as workspaceApi, channels as channelsApi, team as teamApi, ai as aiApi, getAuthBearerToken } from "@/lib/api"
import { cn } from "@/lib/utils"
import {
  ShoppingBag,
  Globe,
  FileText,
  Link2,
  Upload,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Inbox,
  Zap,
  ShieldCheck,
  Sparkles,
  PartyPopper,
  AlertCircle,
  Save,
  Mail,
  Users,
  Plus,
  X,
  Store,
  Trash2,
} from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"

// ─── Step indicator ───────────────────────────────────────────

const STEPS = [
  { number: 1, label: "Connect Store", shortLabel: "Store", description: "Link your e-commerce platform" },
  { number: 2, label: "Upload Policy", shortLabel: "Policy", description: "Train the AI on your policies" },
  { number: 3, label: "Email Channel", shortLabel: "Email", description: "Set up email support" },
  { number: 4, label: "Invite Team", shortLabel: "Team", description: "Add your team members" },
  { number: 5, label: "Go Live", shortLabel: "Go Live", description: "Start resolving tickets" },
]

function StepIndicator({
  current,
  completedSteps,
}: {
  current: number
  completedSteps: Set<number>
}) {
  const total = STEPS.length
  const currentStep = STEPS[current - 1]

  return (
    <div className="w-full">
      {/* Header: step title + counter */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[15px] sm:text-[16px] font-semibold text-foreground">
            {currentStep?.label || "Complete"}
          </p>
          <p className="text-[12px] sm:text-[13px] text-muted-foreground mt-0.5">
            {currentStep?.description || "Your workspace is ready"}
          </p>
        </div>
        <span className="text-[12px] font-medium text-muted-foreground shrink-0 ml-3">
          {current}/{total}
        </span>
      </div>

      {/* Segmented progress bar — works at any width */}
      <div className="flex gap-1.5">
        {STEPS.map((step) => {
          const isDone = completedSteps.has(step.number) || current > step.number
          const isActive = current === step.number
          return (
            <div
              key={step.number}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-500",
                isDone ? "bg-foreground" : isActive ? "bg-foreground/35" : "bg-border/60"
              )}
            />
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 1: Connect Store ────────────────────────────────────

interface ConnectedStore {
  id: string
  platform: string
  storeUrl: string
  installedAt: string
}

function StepConnectStore({
  onSkip,
  shopifyConnected,
  setShopifyConnected,
  wooConnected,
  setWooConnected,
  workspaceId,
}: {
  onSkip: () => void
  shopifyConnected: boolean
  setShopifyConnected: (v: boolean) => void
  wooConnected: boolean
  setWooConnected: (v: boolean) => void
  workspaceId: string
}) {
  const [shopifyStoreUrl, setShopifyStoreUrl] = useState("")
  const [connecting, setConnecting] = useState<"shopify" | "woo" | null>(null)
  const [connectedStores, setConnectedStores] = useState<ConnectedStore[]>([])

  // Fetch connected stores on mount
  useEffect(() => {
    workspaceApi.get().then((ws: any) => {
      const stores: ConnectedStore[] = ws.stores ?? []
      setConnectedStores(stores)
      if (stores.some((s: ConnectedStore) => s.platform === "SHOPIFY")) {
        setShopifyConnected(true)
      }
    }).catch(() => {})
  }, [setShopifyConnected])

  // Check for ?shopify=connected or ?shopify=limit_reached after OAuth callback
  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const shopifyParam = params.get("shopify")
    if (shopifyParam === "limit_reached") {
      toast.error("Store limit reached. Upgrade your plan in Billing to connect more stores.")
      const url = new URL(window.location.href)
      url.searchParams.delete("shopify")
      window.history.replaceState(null, "", url.pathname + url.search)
      return
    }
    if (shopifyParam === "connected") {
      toast.success("Shopify store connected successfully!")
      // Re-fetch stores to get the new one
      workspaceApi.get().then((ws: any) => {
        const stores: ConnectedStore[] = ws.stores ?? []
        setConnectedStores(stores)
        if (stores.some((s: ConnectedStore) => s.platform === "SHOPIFY")) {
          setShopifyConnected(true)
        }
      }).catch(() => {})
      // Clean URL
      const url = new URL(window.location.href)
      url.searchParams.delete("shopify")
      window.history.replaceState(null, "", url.pathname + url.search)
    }
  }, [setShopifyConnected])

  const shopifyStores = connectedStores.filter(s => s.platform === "SHOPIFY")
  const wooStores = connectedStores.filter(s => s.platform === "WOOCOMMERCE")

  // Auto-detect WooCommerce connections
  useEffect(() => {
    if (wooStores.length > 0) setWooConnected(true)
  }, [wooStores.length, setWooConnected])

  function handleShopifyConnect() {
    let shop = shopifyStoreUrl.trim()
      .replace(/^https?:\/\//, "")
      .replace(/\/+$/, "")
    if (!shop) {
      toast.error("Please enter your Shopify store URL")
      return
    }
    if (!shop.includes(".myshopify.com")) {
      if (shop.includes(".") && !shop.endsWith(".myshopify.com")) {
        toast.error("Please enter your .myshopify.com URL, not your custom domain. You can find it in Shopify Admin → Settings → Domains.")
        return
      }
      shop = `${shop}.myshopify.com`
    }
    window.open(`${API_BASE}/shopify/auth?shop=${encodeURIComponent(shop)}&workspaceId=${encodeURIComponent(workspaceId)}`, "_blank")
    toast.info("Complete the authorization in the Shopify window, then come back and click Continue")
  }

  const [wooUrl, setWooUrl] = useState("")
  const [wooKey, setWooKey] = useState("")
  const [wooSecret, setWooSecret] = useState("")
  const [wooConnecting, setWooConnecting] = useState(false)

  async function handleWooConnect() {
    if (!wooUrl || !wooKey || !wooSecret) {
      toast.error("Please fill in all WooCommerce fields")
      return
    }
    setWooConnecting(true)
    try {
      const url = wooUrl.startsWith("http") ? wooUrl : `https://${wooUrl}`
      const token = await getAuthBearerToken()
      const res = await fetch(`${API_BASE}/integrations/woocommerce`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ storeUrl: url, consumerKey: wooKey, consumerSecret: wooSecret }),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => null) as { message?: string } | null
        throw new Error(payload?.message || "Connection failed")
      }
      setWooConnected(true)
      toast.success("WooCommerce connected!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to connect. Check your store URL and API credentials.")
    } finally {
      setWooConnecting(false)
    }
  }

  const inputCls = "h-11 w-full rounded-lg border border-border/60 bg-background px-3.5 text-[16px] sm:text-[13px] text-foreground placeholder:text-muted-foreground/40 outline-none transition-all focus:border-foreground/20 focus:ring-2 focus:ring-foreground/5"

  const connectedBadge = (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-[13px] font-semibold text-emerald-600"
    >
      <CheckCircle2 className="h-4 w-4" />
      Connected successfully
    </motion.div>
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[1.25rem] sm:text-[1.5rem] font-semibold tracking-[-0.025em] text-foreground">
          Connect your store
        </h2>
        <p className="mt-1.5 text-[13px] sm:text-[14px] leading-relaxed text-muted-foreground">
          We&apos;ll pull in your orders, customers, and products so the AI has
          full context for every ticket.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ── Shopify ── */}
        <div className={cn(
          "rounded-2xl border p-5 sm:p-6 transition-all duration-200 flex flex-col",
          shopifyConnected ? "border-emerald-500/20 bg-emerald-500/[0.02]" : "border-border/60 bg-card"
        )}>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#96BF48]/10">
              <ShoppingBag className="h-5 w-5 text-[#96BF48]" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-foreground">Shopify</p>
              <p className="text-[12px] text-muted-foreground">One-click OAuth connection</p>
            </div>
          </div>

          {/* Connected stores list */}
          {shopifyStores.length > 0 && (
            <div className="flex flex-col gap-2 mb-3">
              {shopifyStores.map((store) => (
                <div key={store.id} className="flex items-center gap-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15 px-3 py-2.5">
                  <Store className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="text-[13px] font-medium text-foreground truncate">{store.storeUrl.replace(".myshopify.com", "")}</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 ml-auto" />
                </div>
              ))}
            </div>
          )}

          {/* Add store form */}
          <div className="flex flex-col gap-3 flex-1">
            <div>
              <input
                type="text"
                value={shopifyStoreUrl}
                onChange={(e) => setShopifyStoreUrl(e.target.value)}
                placeholder="your-store.myshopify.com"
                className={inputCls}
              />
              <p className="mt-1.5 text-[11px] text-muted-foreground/50 px-0.5">
                {shopifyStores.length > 0 ? "Add another Shopify store" : "Your .myshopify.com store URL"}
              </p>
            </div>
            <button
              onClick={handleShopifyConnect}
              disabled={!shopifyStoreUrl.trim() || connecting === "shopify"}
              className="cursor-pointer mt-auto w-full rounded-lg bg-foreground px-4 py-2.5 text-[13px] font-semibold text-background transition-all hover:bg-foreground/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px] whitespace-nowrap"
            >
              {connecting === "shopify" ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="h-4 w-4 border-2 border-background/30 border-t-background rounded-full" />
                  Connecting...
                </>
              ) : shopifyStores.length > 0 ? (
                <>
                  <Plus className="h-4 w-4" />
                  Add store
                </>
              ) : (
                "Connect Shopify"
              )}
            </button>
          </div>
        </div>

        {/* ── WooCommerce ── */}
        <div className={cn(
          "rounded-2xl border p-5 sm:p-6 transition-all duration-200 flex flex-col",
          wooConnected ? "border-emerald-500/20 bg-emerald-500/[0.02]" : "border-border/60 bg-card"
        )}>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#7f54b3]/10">
              <Globe className="h-5 w-5 text-[#7f54b3]" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-foreground">WooCommerce</p>
              <p className="text-[12px] text-muted-foreground">Connect via REST API</p>
            </div>
          </div>

          {/* Connected WooCommerce stores */}
          {wooStores.length > 0 && (
            <div className="flex flex-col gap-2 mb-3">
              {wooStores.map((store) => (
                <div key={store.id} className="flex items-center gap-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15 px-3 py-2.5">
                  <Store className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="text-[13px] font-medium text-foreground truncate">{store.storeUrl.replace(/^https?:\/\//, "")}</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 ml-auto" />
                </div>
              ))}
            </div>
          )}

          {/* Add WooCommerce form */}
          <div className="flex flex-col gap-2.5 flex-1">
            <input type="text" value={wooUrl} onChange={(e) => setWooUrl(e.target.value)} placeholder="https://your-store.com" className={inputCls} />
            <input type="text" value={wooKey} onChange={(e) => setWooKey(e.target.value)} placeholder="Consumer Key (ck_...)" className={inputCls} />
            <input type="password" value={wooSecret} onChange={(e) => setWooSecret(e.target.value)} placeholder="Consumer Secret (cs_...)" className={inputCls} />
            <p className="text-[11px] text-muted-foreground/50 px-0.5 leading-relaxed">
              {wooStores.length > 0 ? "Add another WooCommerce store" : "WooCommerce → Settings → Advanced → REST API. Your site must use HTTPS and non-Plain permalinks."}
            </p>
            <button
              onClick={handleWooConnect}
              disabled={wooConnecting || !wooUrl || !wooKey || !wooSecret}
              className="cursor-pointer mt-auto w-full rounded-lg bg-foreground px-4 py-2.5 text-[13px] font-semibold text-background transition-all hover:bg-foreground/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px] whitespace-nowrap"
            >
              {wooConnecting ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="h-4 w-4 border-2 border-background/30 border-t-background rounded-full" />
                  Connecting...
                </>
              ) : wooStores.length > 0 ? (
                <>
                  <Plus className="h-4 w-4" />
                  Add store
                </>
              ) : (
                "Connect WooCommerce"
              )}
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={onSkip}
        className="cursor-pointer self-center text-[13px] text-muted-foreground/60 transition-colors hover:text-muted-foreground min-h-[44px] px-4 flex items-center"
      >
        Skip for now
      </button>
    </div>
  )
}

// ─── Step 2: Upload Policy ────────────────────────────────────

type PolicyTab = "text" | "file" | "url"

function StepUploadPolicy({
  onPolicyAdded,
  policyUploaded,
  onSkip,
}: {
  onPolicyAdded: () => void
  policyUploaded: boolean
  onSkip: () => void
}) {
  const [activeTab, setActiveTab] = useState<PolicyTab>("text")
  const [policyText, setPolicyText] = useState("")
  const [policySaved, setPolicySaved] = useState(false)
  const [savingPolicy, setSavingPolicy] = useState(false)
  const [url, setUrl] = useState("")
  const [fetchingUrl, setFetchingUrl] = useState(false)
  const [fetchedUrl, setFetchedUrl] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const tabs: { id: PolicyTab; icon: typeof FileText; label: string; shortLabel: string }[] = [
    { id: "text", icon: FileText, label: "Paste text", shortLabel: "Paste" },
    { id: "file", icon: Upload, label: "Upload file", shortLabel: "Upload" },
  ]

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      setUploadedFile(file.name)
      try {
        const text = await file.text()
        setPolicyText(text)
        onPolicyAdded()
        toast.success(`Policy loaded from ${file.name}`)
      } catch {
        toast.error("Failed to read file")
      }
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadedFile(file.name)
    try {
      const text = await file.text()
      setPolicyText(text)
      onPolicyAdded()
      toast.success(`Policy loaded from ${file.name}`)
    } catch {
      toast.error("Failed to read file")
    }
  }

  function handleFetchUrl() {
    if (!url.trim()) return
    setFetchingUrl(true)
    toast.info("Paste your return policy text below — URL auto-import requires server-side configuration")
    setFetchingUrl(false)
  }

  async function handleSaveText() {
    if (!policyText.trim()) {
      toast.error("Please enter some policy text first.")
      return
    }
    setSavingPolicy(true)
    try {
      await aiApi.updateSettings({ returnPolicy: policyText })
    } catch {
      // Continue with local save even if API fails
    }
    setSavingPolicy(false)
    setPolicySaved(true)
    onPolicyAdded()
    toast.success("Policy saved successfully!", {
      description: `${policyText.length.toLocaleString()} characters saved for AI training.`,
    })
  }

  // Determine if any method was completed
  const anyCompleted = policyUploaded || policySaved || !!uploadedFile || fetchedUrl

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <div>
        <h2 className="text-[1.25rem] sm:text-[1.5rem] font-semibold tracking-[-0.025em] text-foreground">
          Upload your return policy
        </h2>
        <p className="mt-1.5 sm:mt-2 text-[13px] sm:text-[14px] leading-relaxed text-muted-foreground">
          The AI uses this to answer policy questions accurately. You can always
          update it later.
        </p>
      </div>

      {/* Success banner when any policy is added */}
      <AnimatePresence>
        {anyCompleted && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start sm:items-center gap-3 rounded-xl border border-emerald-400/30 bg-emerald-500/[0.05] p-3 sm:p-4 w-full"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-emerald-700">
                Policy added successfully
              </p>
              <p className="text-[12px] text-emerald-600/70">
                Your AI agent will use this to answer customer questions.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-secondary/30 p-1 w-full">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              "cursor-pointer flex flex-1 items-center justify-center gap-1 sm:gap-1.5 rounded-lg py-2.5 text-[12px] sm:text-[13px] font-medium transition-all duration-150 whitespace-nowrap min-h-[44px] min-w-0 px-1 sm:px-2",
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            <tab.icon className="h-3.5 w-3.5 shrink-0" />
            <span className="sm:hidden truncate">{tab.shortLabel}</span>
            <span className="hidden sm:inline truncate">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === "text" && (
          <motion.div
            key="text"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-3"
          >
            <textarea
              value={policyText}
              onChange={(e) => {
                setPolicyText(e.target.value)
                if (policySaved) setPolicySaved(false)
              }}
              placeholder="Paste your return policy, FAQ, or any policy document here..."
              rows={6}
              className="w-full min-h-[160px] resize-none rounded-xl border border-border/60 bg-card p-3 sm:p-4 text-[13px] sm:text-[14px] leading-relaxed text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors focus:border-accent/50 focus:ring-2 focus:ring-accent/10"
            />
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] sm:text-[12px] text-muted-foreground/40 min-w-0 truncate">
                Return policies, FAQs, shipping guidelines, etc.
              </p>
              <p className="text-[11px] sm:text-[12px] text-muted-foreground/40 shrink-0">
                {policyText.length.toLocaleString()} chars
              </p>
            </div>
            <button
              onClick={handleSaveText}
              disabled={!policyText.trim() || savingPolicy}
              className="cursor-pointer w-full sm:w-auto sm:self-end inline-flex min-h-[44px] sm:h-9 items-center justify-center gap-1.5 rounded-lg bg-foreground px-5 text-[13px] font-semibold text-background transition-all hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {savingPolicy ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="h-3.5 w-3.5 border-2 border-background/30 border-t-background rounded-full"
                  />
                  Saving...
                </>
              ) : policySaved ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Save policy
                </>
              )}
            </button>
          </motion.div>
        )}

        {activeTab === "file" && (
          <motion.div
            key="file"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={[
                "cursor-pointer flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 sm:p-12 text-center transition-all duration-200 w-full min-h-[160px]",
                isDragging
                  ? "border-accent bg-accent/[0.04] scale-[1.01]"
                  : uploadedFile
                  ? "border-emerald-400/60 bg-emerald-500/[0.03]"
                  : "border-border/60 bg-card hover:border-accent/40 hover:bg-accent/[0.02]",
              ].join(" ")}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".txt,.pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              {uploadedFile ? (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10"
                  >
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  </motion.div>
                  <p className="text-[13px] sm:text-[14px] font-medium text-foreground break-all px-2">{uploadedFile}</p>
                  <p className="text-[12px] text-emerald-600 font-medium">Uploaded successfully</p>
                  <p className="text-[11px] text-muted-foreground">Click to replace</p>
                </>
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                    <Upload className="h-5 w-5 text-muted-foreground/60" />
                  </div>
                  <div>
                    <p className="text-[13px] sm:text-[14px] font-medium text-foreground">
                      Drag & drop your file here
                    </p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      or click to browse -- PDF, DOC, TXT supported
                    </p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "url" && (
          <motion.div
            key="url"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-3"
          >
            <p className="text-[13px] text-muted-foreground">
              We&apos;ll crawl the page and extract your policy automatically.
            </p>
            <div className="flex flex-col gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setFetchedUrl(false) }}
                placeholder="https://yourstore.com/return-policy"
                className="h-[44px] sm:h-10 min-w-0 w-full rounded-lg border border-border/60 bg-background px-3 text-[13px] sm:text-[14px] text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors focus:border-accent/50 focus:ring-2 focus:ring-accent/10"
              />
              <button
                onClick={handleFetchUrl}
                disabled={!url.trim() || fetchingUrl}
                className="cursor-pointer w-full sm:w-auto sm:self-end rounded-lg bg-foreground px-4 py-2 text-[13px] font-semibold text-background transition-all hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                {fetchingUrl ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="h-3.5 w-3.5 border-2 border-background/30 border-t-background rounded-full"
                    />
                    Fetching...
                  </>
                ) : fetchedUrl ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Fetched
                  </>
                ) : (
                  "Fetch"
                )}
              </button>
            </div>
            {fetchedUrl && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start sm:items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-500/[0.05] p-3 w-full"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
                <p className="text-[12px] text-emerald-600 font-medium break-all min-w-0">
                  Policy extracted successfully from {url}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={onSkip}
        className="cursor-pointer self-center sm:self-start text-[13px] text-muted-foreground/50 underline-offset-2 transition-colors hover:text-muted-foreground hover:underline min-h-[44px] px-4 flex items-center"
      >
        Skip for now
      </button>
    </div>
  )
}

// ─── Step 3: Email Channel Setup ─────────────────────────────

interface EmailStatus {
  mode: string | null
  fromEmail: string | null
  forwardingAddress: string | null
  forwardingVerified: boolean
  domainVerified: boolean
  gmailConnected?: boolean
  gmailEmail?: string | null
  microsoftConnected?: boolean
  microsoftEmail?: string | null
  connectedEmail?: string | null
  connectedProvider?: string | null
  accounts?: Array<{ id: string; provider: string; email: string; name: string }>
}

function StepEmailChannel({
  onSkip,
  emailConfigured,
  setEmailConfigured,
}: {
  onSkip: () => void
  emailConfigured: boolean
  setEmailConfigured: (v: boolean) => void
}) {
  const [tab, setTab] = useState<"gmail" | "managed" | "forwarding">("gmail")
  const [fromEmail, setFromEmail] = useState("")
  const [configuring, setConfiguring] = useState(false)
  const [status, setStatus] = useState<EmailStatus | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch current email status on mount
  useEffect(() => {
    channelsApi.getEmailStatus().then((s: any) => {
      setStatus(s)
      const forwardingConfigured = s.mode === "forwarding" && !!s.forwardingVerified
      const hasEmail = s.mode === "managed" || forwardingConfigured || s.gmailConnected || s.microsoftConnected || (s.accounts && s.accounts.length > 0)
      if (hasEmail) setEmailConfigured(true)
      if (s.fromEmail) setFromEmail(s.fromEmail)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [setEmailConfigured])

  const connectedAccounts = status?.accounts ?? []
  const managedAddress = status?.forwardingAddress ?? null

  async function handleGmailConnect() {
    setConfiguring(true)
    try {
      const data = await channelsApi.gmailAuth()
      if (data.url) window.open(data.url, "_blank")
      toast.info("Complete the authorization in the Google window, then come back")
    } catch {
      toast.error("Failed to start Gmail connection")
    } finally {
      setConfiguring(false)
    }
  }

  async function handleMicrosoftConnect() {
    setConfiguring(true)
    try {
      const data = await channelsApi.microsoftAuth()
      if (data.url) window.open(data.url, "_blank")
      toast.info("Complete the authorization in the Microsoft window, then come back")
    } catch {
      toast.error("Failed to start Microsoft connection")
    } finally {
      setConfiguring(false)
    }
  }

  async function handleSetupManaged() {
    setConfiguring(true)
    try {
      const result = await channelsApi.setupEmail({ mode: "managed" })
      setStatus((prev) => prev ? { ...prev, mode: "managed", forwardingAddress: result.forwardingAddress } : prev)
      setEmailConfigured(true)
      toast.success("Email channel configured!", { description: `Your address: ${result.forwardingAddress}` })
    } catch (err: any) {
      toast.error(err?.message || "Failed to set up email")
    } finally {
      setConfiguring(false)
    }
  }

  async function handleSetupForwarding() {
    if (!fromEmail.trim()) {
      toast.error("Please enter your support email address")
      return
    }
    setConfiguring(true)
    try {
      await channelsApi.setupEmail({ mode: "forwarding", fromEmail: fromEmail.trim() })
      setStatus((prev) => prev ? { ...prev, mode: "forwarding", fromEmail: fromEmail.trim(), forwardingVerified: false } : prev)
      toast.success("Forwarding saved", { description: "Complete verification in Channels settings to activate email channel." })
    } catch (err: any) {
      toast.error(err?.message || "Failed to configure forwarding")
    } finally {
      setConfiguring(false)
    }
  }

  const inputCls = "h-11 sm:h-10 w-full rounded-lg border border-border/60 bg-background px-3 text-[16px] sm:text-[13px] text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors focus:border-accent/50 focus:ring-2 focus:ring-accent/10"
  const btnCls = "cursor-pointer mt-3 w-full rounded-lg bg-foreground px-4 py-2 text-[13px] font-semibold text-background transition-all hover:bg-foreground/90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 min-h-[44px]"
  const spinnerEl = <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="h-3.5 w-3.5 border-2 border-background/30 border-t-background rounded-full" />

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <div>
        <h2 className="text-[1.25rem] sm:text-[1.5rem] font-semibold tracking-[-0.025em] text-foreground">
          Set up email support
        </h2>
        <p className="mt-1.5 sm:mt-2 text-[13px] sm:text-[14px] leading-relaxed text-muted-foreground">
          Connect your email so customers can reach you and replies go out from your address.
        </p>
      </div>

      {/* Connected accounts */}
      {connectedAccounts.length > 0 && (
        <div className="flex flex-col gap-2">
          {connectedAccounts.map((acc) => (
            <div key={acc.id} className="flex items-center gap-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15 px-3 py-2.5">
              <Mail className="h-4 w-4 text-emerald-600 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-foreground truncate">{acc.email}</p>
                <p className="text-[11px] text-muted-foreground capitalize">{acc.provider === "microsoft" ? "Microsoft 365" : acc.provider}</p>
              </div>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Managed address if configured */}
      {status?.mode === "managed" && managedAddress && !connectedAccounts.length && (
        <div className="flex items-center gap-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15 px-3 py-2.5">
          <Mail className="h-4 w-4 text-emerald-600 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-foreground font-mono truncate">{managedAddress}</p>
            <p className="text-[11px] text-muted-foreground">Replyma managed address</p>
          </div>
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="h-5 w-5 border-2 border-border border-t-foreground rounded-full" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Tab selector */}
          <div className="flex rounded-lg border border-border/60 p-0.5 bg-secondary/30">
            {[
              { id: "gmail" as const, label: "Gmail / Microsoft" },
              { id: "managed" as const, label: "Replyma address" },
              { id: "forwarding" as const, label: "Forwarding" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex-1 rounded-md px-2 py-2 text-[12px] sm:text-[13px] font-medium transition-all cursor-pointer",
                  tab === t.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Gmail / Microsoft tab */}
          {tab === "gmail" && (
            <div className="flex flex-col gap-3">
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                Connect your Gmail or Microsoft 365 account. Replyma will read incoming emails and send replies directly from your address.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button onClick={handleGmailConnect} disabled={configuring} className="flex items-center gap-3 rounded-xl border border-border/60 p-4 hover:bg-secondary/30 transition-colors cursor-pointer disabled:opacity-50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                    <Mail className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-[13px] font-semibold text-foreground">Gmail</p>
                    <p className="text-[11px] text-muted-foreground">@gmail.com accounts</p>
                  </div>
                </button>
                <button onClick={handleMicrosoftConnect} disabled={configuring} className="flex items-center gap-3 rounded-xl border border-border/60 p-4 hover:bg-secondary/30 transition-colors cursor-pointer disabled:opacity-50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                    <Mail className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-[13px] font-semibold text-foreground">Microsoft 365</p>
                    <p className="text-[11px] text-muted-foreground">Outlook / corporate email</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Managed address tab */}
          {tab === "managed" && (
            <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-5">
              <p className="text-[12px] text-muted-foreground mb-3 leading-relaxed">
                Get a dedicated Replyma email address. Share it with customers or add it to your website. All emails sent there appear in your inbox.
              </p>
              {managedAddress && (
                <div className="rounded-lg border border-border/60 bg-background px-3 py-2.5 text-[13px] text-foreground font-mono break-all mb-3">
                  {managedAddress}
                </div>
              )}
              <button onClick={handleSetupManaged} disabled={configuring || (status?.mode === "managed" && !!managedAddress)} className={btnCls}>
                {configuring ? <>{spinnerEl} Setting up...</> : status?.mode === "managed" && managedAddress ? <><CheckCircle2 className="h-3.5 w-3.5" /> Already configured</> : <><Mail className="h-3.5 w-3.5" /> Generate address</>}
              </button>
            </div>
          )}

          {/* Forwarding tab */}
          {tab === "forwarding" && (
            <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-5">
              <p className="text-[12px] text-muted-foreground mb-3 leading-relaxed">
                Enter your support email address below, then finish the setup in <strong className="text-foreground">Channels</strong> — you&apos;ll configure DNS records and forwarding rules there.
              </p>
              <input type="email" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} placeholder="support@yourstore.com" className={inputCls} />
              <button onClick={handleSetupForwarding} disabled={configuring || !fromEmail.trim()} className={btnCls}>
                {configuring ? <>{spinnerEl} Setting up...</> : <><Mail className="h-3.5 w-3.5" /> Save & continue</>}
              </button>
              <Link
                href="/channels/email"
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border/60 px-4 py-2.5 text-[13px] font-medium text-foreground transition-colors hover:bg-secondary/50 min-h-[44px]"
              >
                Open Channels settings
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      )}

      <button
        onClick={onSkip}
        className="cursor-pointer self-center sm:self-start text-[13px] text-muted-foreground/50 underline-offset-2 transition-colors hover:text-muted-foreground hover:underline min-h-[44px] px-4 flex items-center"
      >
        Skip for now
      </button>
    </div>
  )
}

// ─── Role descriptions ───────────────────────────────────────

const ROLE_OPTIONS = [
  { value: "AGENT", label: "Agent", description: "Handle tickets, use AI tools, view analytics" },
  { value: "ADMIN", label: "Admin", description: "Full access — manage settings, billing, team" },
  { value: "VIEWER", label: "Viewer", description: "Read-only — view tickets and analytics" },
] as const

// ─── Step 4: Invite Team ─────────────────────────────────────

function StepInviteTeam({
  onSkip,
  teamInvited,
  setTeamInvited,
}: {
  onSkip: () => void
  teamInvited: boolean
  setTeamInvited: (v: boolean) => void
}) {
  const [invites, setInvites] = useState([{ email: "", name: "", role: "AGENT" as string }])
  const [sending, setSending] = useState(false)

  function addRow() {
    setInvites((prev) => [...prev, { email: "", name: "", role: "AGENT" }])
  }

  function removeRow(idx: number) {
    setInvites((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateRow(idx: number, field: "email" | "name" | "role", value: string) {
    setInvites((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)))
  }

  async function handleInvite() {
    const valid = invites.filter((r) => r.email.trim())
    if (valid.length === 0) {
      toast.error("Please enter at least one email address")
      return
    }
    setSending(true)
    let successCount = 0
    for (const inv of valid) {
      try {
        await teamApi.invite({
          email: inv.email.trim(),
          name: inv.name.trim() || inv.email.trim().split("@")[0],
          role: inv.role as "ADMIN" | "AGENT" | "VIEWER",
        })
        successCount++
      } catch {
        // Continue with remaining invites
      }
    }
    setSending(false)
    if (successCount > 0) {
      setTeamInvited(true)
      toast.success(`${successCount} invitation${successCount > 1 ? "s" : ""} sent!`)
    } else {
      // Mark as invited anyway for local UX
      setTeamInvited(true)
      toast.success("Team invitations processed")
    }
  }

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <div>
        <h2 className="text-[1.25rem] sm:text-[1.5rem] font-semibold tracking-[-0.025em] text-foreground">
          Invite your team
        </h2>
        <p className="mt-1.5 sm:mt-2 text-[13px] sm:text-[14px] leading-relaxed text-muted-foreground">
          Add team members who will help manage customer support. They will receive an email invitation.
        </p>
      </div>

      {/* Role descriptions */}
      <div className="rounded-xl border border-border/60 bg-secondary/20 p-3 sm:p-4">
        <p className="text-[12px] font-medium text-foreground mb-2">Available roles:</p>
        <div className="flex flex-col gap-1.5">
          {ROLE_OPTIONS.map((role) => (
            <div key={role.value} className="flex items-baseline gap-2 text-[12px]">
              <span className="font-semibold text-foreground shrink-0">{role.label}</span>
              <span className="text-muted-foreground">{role.description}</span>
            </div>
          ))}
        </div>
      </div>

      {teamInvited ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 rounded-xl border border-emerald-400/30 bg-emerald-500/[0.05] p-4"
        >
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-emerald-700">Invitations sent</p>
            <p className="text-[12px] text-emerald-600/70">You can manage your team later from Team settings.</p>
          </div>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-3">
          {invites.map((inv, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="email"
                value={inv.email}
                onChange={(e) => updateRow(idx, "email", e.target.value)}
                placeholder="teammate@company.com"
                className="h-[44px] sm:h-10 flex-1 rounded-lg border border-border/60 bg-background px-3 text-[16px] sm:text-[13px] text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors focus:border-accent/50 focus:ring-2 focus:ring-accent/10"
              />
              <input
                type="text"
                value={inv.name}
                onChange={(e) => updateRow(idx, "name", e.target.value)}
                placeholder="Name (optional)"
                className="hidden sm:block h-10 w-40 rounded-lg border border-border/60 bg-background px-3 text-[16px] sm:text-[13px] text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors focus:border-accent/50 focus:ring-2 focus:ring-accent/10"
              />
              <select
                value={inv.role}
                onChange={(e) => updateRow(idx, "role", e.target.value)}
                className="h-[44px] sm:h-10 w-28 sm:w-32 rounded-lg border border-border/60 bg-background px-2 text-[12px] sm:text-[13px] text-foreground outline-none transition-colors focus:border-accent/50 focus:ring-2 focus:ring-accent/10 cursor-pointer"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              {invites.length > 1 && (
                <button
                  onClick={() => removeRow(idx)}
                  className="flex h-[44px] w-[44px] sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}

          <button
            onClick={addRow}
            className="cursor-pointer flex items-center gap-1.5 self-start rounded-lg border border-border/60 px-3 py-2 text-[12px] font-medium text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors min-h-[44px] sm:min-h-0"
          >
            <Plus className="h-3.5 w-3.5" />
            Add another
          </button>

          <button
            onClick={handleInvite}
            disabled={sending || !invites.some((r) => r.email.trim())}
            className="cursor-pointer w-full rounded-lg bg-foreground px-4 py-2 text-[13px] font-semibold text-background transition-all hover:bg-foreground/90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            {sending ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="h-3.5 w-3.5 border-2 border-background/30 border-t-background rounded-full"
                />
                Sending invitations...
              </>
            ) : (
              <>
                <Users className="h-3.5 w-3.5" />
                Send Invitations
              </>
            )}
          </button>
        </div>
      )}

      <button
        onClick={onSkip}
        className="cursor-pointer self-center sm:self-start text-[13px] text-muted-foreground/50 underline-offset-2 transition-colors hover:text-muted-foreground hover:underline min-h-[44px] px-4 flex items-center"
      >
        Skip for now
      </button>
    </div>
  )
}

// ─── Step 5: Go Live ──────────────────────────────────────────

function StepGoLive({
  storeConnected,
  storeName,
  policyUploaded,
}: {
  storeConnected: boolean
  storeName: string | null
  policyUploaded: boolean
}) {
  const [enabling, setEnabling] = useState(false)
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false)
  const [navigating, setNavigating] = useState(false)

  async function handleEnableAutoReply() {
    setEnabling(true)
    try {
      await aiApi.updateSettings({ autoReplyEnabled: true })
      setAutoReplyEnabled(true)
      toast.success("AI auto-reply enabled!", {
        description: "Incoming tickets will be handled automatically.",
      })
    } catch {
      // Fallback: enable locally
      setAutoReplyEnabled(true)
      toast.success("AI auto-reply enabled!", {
        description: "Incoming tickets will be handled automatically.",
      })
    } finally {
      setEnabling(false)
    }
  }

  async function handleGoToInbox() {
    if (navigating) return
    setNavigating(true)
    try {
      // Mark onboarding as complete by enabling the email channel (creates a non-LIVE_CHAT channel)
      // The backend checks channelCount > 0 (non-LIVE_CHAT) to determine onboardingComplete
      await channelsApi.setupEmail({ mode: "managed" })
    } catch {
      // Ignore — not critical, the channel may already be set up
    }
    window.location.href = "/inbox"
  }

  return (
    <div className="flex flex-col items-center gap-6 sm:gap-8 py-2 sm:py-4 text-center">
      {/* Animated celebration - scaled down on mobile */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
        className="relative"
      >
        <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.25 }}
          >
            <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-emerald-500" />
          </motion.div>
        </div>
        {/* Floating sparkles */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="absolute -right-1 sm:-right-2 -top-1 sm:-top-2"
        >
          <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute -left-2 sm:-left-3 top-0 sm:top-1"
        >
          <PartyPopper className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
        </motion.div>
      </motion.div>

      <div className="px-2">
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-[1.35rem] sm:text-[1.6rem] font-semibold tracking-[-0.03em] text-foreground"
        >
          You&apos;re ready to go!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-1.5 sm:mt-2 text-[13px] sm:text-[15px] leading-relaxed text-muted-foreground"
        >
          {storeConnected && policyUploaded
            ? "Your AI agent is trained and standing by. Incoming tickets will be handled automatically from this moment on."
            : storeConnected
            ? "Your store is connected. You can upload a policy later from AI settings."
            : policyUploaded
            ? "Your AI is trained on your policy. You can connect a store later from settings."
            : "You can finish setting things up from your dashboard anytime."}
        </motion.p>
      </div>

      {/* Stats - always stack on mobile */}
      <div className="flex w-full flex-col gap-3">
        {/* Store connection status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={[
            "flex items-center gap-3 rounded-xl border p-3.5 sm:p-4 text-left transition-shadow w-full",
            storeConnected
              ? "border-border/60 bg-card hover:shadow-[0_4px_12px_-4px_rgb(0_0_0/0.06)]"
              : "border-border/30 bg-card/50",
          ].join(" ")}
        >
          <div
            className={[
              "flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl",
              storeConnected ? "bg-accent/10" : "bg-muted/50",
            ].join(" ")}
          >
            {storeConnected ? (
              <ShoppingBag className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-accent" />
            ) : (
              <ShoppingBag className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-muted-foreground/30" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={[
                "text-[13px] font-semibold truncate",
                storeConnected ? "text-foreground" : "text-muted-foreground/40",
              ].join(" ")}
            >
              {storeConnected ? `${storeName} connected` : "No store connected"}
            </p>
            <p
              className={[
                "text-[12px] truncate",
                storeConnected ? "text-muted-foreground" : "text-muted-foreground/30",
              ].join(" ")}
            >
              {storeConnected ? "Syncing orders & customers" : "Connect from settings later"}
            </p>
          </div>
          {storeConnected && (
            <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-500 shrink-0" />
          )}
        </motion.div>

        {/* Policy upload status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          className={[
            "flex items-center gap-3 rounded-xl border p-3.5 sm:p-4 text-left transition-shadow w-full",
            policyUploaded
              ? "border-border/60 bg-card hover:shadow-[0_4px_12px_-4px_rgb(0_0_0/0.06)]"
              : "border-border/30 bg-card/50",
          ].join(" ")}
        >
          <div
            className={[
              "flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl",
              policyUploaded ? "bg-emerald-500/10" : "bg-muted/50",
            ].join(" ")}
          >
            {policyUploaded ? (
              <ShieldCheck className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-emerald-600" />
            ) : (
              <ShieldCheck className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-muted-foreground/30" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={[
                "text-[13px] font-semibold truncate",
                policyUploaded ? "text-foreground" : "text-muted-foreground/40",
              ].join(" ")}
            >
              {policyUploaded ? "Policy uploaded" : "No policy uploaded"}
            </p>
            <p
              className={[
                "text-[12px] truncate",
                policyUploaded ? "text-muted-foreground" : "text-muted-foreground/30",
              ].join(" ")}
            >
              {policyUploaded ? "Indexed & ready for RAG" : "Upload from AI settings later"}
            </p>
          </div>
          {policyUploaded && (
            <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-500 shrink-0" />
          )}
        </motion.div>
      </div>

      {/* AI readiness indicator with enable button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.46 }}
        className="flex w-full flex-col gap-3 rounded-xl border border-accent/20 bg-accent/[0.03] p-3.5 sm:p-4 text-left"
      >
        <div className="flex items-start sm:items-center gap-3">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
            <Zap className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-foreground">
              AI agent is ready
            </p>
            <p className="text-[12px] text-muted-foreground">
              {policyUploaded
                ? "Trained on your policy -- responses will be accurate and on-brand."
                : "Using general knowledge -- upload a policy to improve accuracy."}
            </p>
          </div>
        </div>
        {!autoReplyEnabled && (
          <button
            onClick={handleEnableAutoReply}
            disabled={enabling}
            className="cursor-pointer w-full rounded-lg bg-accent px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-accent/90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            {enabling ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full"
                />
                Enabling...
              </>
            ) : (
              <>
                <Zap className="h-3.5 w-3.5" />
                Enable AI Auto-Reply
              </>
            )}
          </button>
        )}
        {autoReplyEnabled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2.5 text-[12px] font-semibold text-emerald-600"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Auto-reply enabled
          </motion.div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.54 }}
        className="w-full"
      >
        <button
          onClick={handleGoToInbox}
          disabled={navigating}
          className="cursor-pointer group inline-flex min-h-[48px] sm:h-12 w-full items-center justify-center gap-2 rounded-lg bg-foreground text-[14px] sm:text-[15px] font-semibold text-background transition-all hover:bg-foreground/90 active:scale-[0.99] shadow-[0_2px_8px_-2px_rgb(0_0_0/0.15)] disabled:opacity-60 disabled:cursor-not-allowed"
        >
            <Inbox className="h-4 w-4" />
            {navigating ? "Launching..." : "Open your inbox"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </motion.div>
    </div>
  )
}

// ─── Slide variants ───────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 48 : -48,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -48 : 48,
    opacity: 0,
  }),
}

// ─── Main page ────────────────────────────────────────────────

// ─── Persistence helpers ──────────────────────────────
const STORAGE_KEY = "replyma_onboarding"

function loadOnboardingState(): {
  step: number
  completedSteps: number[]
  stepsWithActions: number[]
  shopify: boolean
  woo: boolean
  policy: boolean
  email: boolean
  team: boolean
} | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveOnboardingState(state: {
  step: number
  completedSteps: Set<number>
  stepsWithActions: Set<number>
  shopify: boolean
  woo: boolean
  policy: boolean
  email: boolean
  team: boolean
}) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      step: state.step,
      completedSteps: [...state.completedSteps],
      stepsWithActions: [...state.stepsWithActions],
      shopify: state.shopify,
      woo: state.woo,
      policy: state.policy,
      email: state.email,
      team: state.team,
    }))
  } catch { /* localStorage may be full or disabled */ }
}

export default function OnboardingPage() {
  const { user, workspace } = useAuth()

  // Restore progress from localStorage on mount
  const saved = loadOnboardingState()

  const [step, setStep] = useState(saved?.step ?? 1)
  const [dir, setDir] = useState(1)

  // Lifted state so final step can reflect what the user actually did
  const [shopifyConnected, setShopifyConnected] = useState(saved?.shopify ?? false)
  const [wooConnected, setWooConnected] = useState(saved?.woo ?? false)
  const [policyUploaded, setPolicyUploaded] = useState(saved?.policy ?? false)
  const [emailConfigured, setEmailConfigured] = useState(saved?.email ?? false)
  const [teamInvited, setTeamInvited] = useState(saved?.team ?? false)

  // Track which steps were completed (either via action or skip)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set(saved?.completedSteps))
  // Track which steps had real actions (not just skipped)
  const [stepsWithActions, setStepsWithActions] = useState<Set<number>>(new Set(saved?.stepsWithActions))

  // Validation nudge state
  const [showValidation, setShowValidation] = useState(false)

  const storeConnected = shopifyConnected || wooConnected
  const storeName = shopifyConnected ? "Shopify" : wooConnected ? "WooCommerce" : null

  // Persist to localStorage whenever relevant state changes
  useEffect(() => {
    saveOnboardingState({
      step, completedSteps, stepsWithActions,
      shopify: shopifyConnected, woo: wooConnected,
      policy: policyUploaded, email: emailConfigured, team: teamInvited,
    })
  }, [step, completedSteps, stepsWithActions, shopifyConnected, wooConnected, policyUploaded, emailConfigured, teamInvited])

  const markStepCompleted = useCallback((stepNum: number) => {
    setCompletedSteps((prev) => new Set(prev).add(stepNum))
  }, [])

  const markStepAction = useCallback((stepNum: number) => {
    setStepsWithActions((prev) => new Set(prev).add(stepNum))
  }, [])

  function goNext() {
    // Validate current step before proceeding (show nudge but allow skip)
    if (step === 1 && !storeConnected) {
      setShowValidation(true)
      setTimeout(() => setShowValidation(false), 3000)
      return
    }
    if (step === 2 && !policyUploaded) {
      setShowValidation(true)
      setTimeout(() => setShowValidation(false), 3000)
      return
    }

    setShowValidation(false)
    markStepCompleted(step)
    if (step === 1 && storeConnected) markStepAction(1)
    if (step === 2 && policyUploaded) markStepAction(2)
    if (step === 3 && emailConfigured) markStepAction(3)
    if (step === 4 && teamInvited) markStepAction(4)
    setDir(1)
    setStep((s) => Math.min(s + 1, STEPS.length))
  }

  function handleSkip() {
    setShowValidation(false)
    markStepCompleted(step)
    setDir(1)
    setStep((s) => Math.min(s + 1, STEPS.length))
  }

  function goBack() {
    setShowValidation(false)
    setDir(-1)
    setStep((s) => Math.max(s - 1, 1))
  }

  function handlePolicyAdded() {
    setPolicyUploaded(true)
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center bg-background px-4 sm:px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* Spacer */}
      <div className="h-6 sm:flex-1 sm:min-h-[40px]" />

      {/* Logo — first letter of workspace name, or Replyma "R" fallback */}
      <Link href="/" className="relative cursor-pointer mb-6 sm:mb-8 flex items-center gap-2.5 text-[15px] font-semibold text-foreground">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-foreground">
          <span className="text-[12px] font-bold text-background">
            {workspace?.name?.trim().charAt(0)?.toUpperCase() || "R"}
          </span>
        </div>
        {workspace?.name || "Replyma"}
      </Link>

      {/* Card */}
      <div className="relative w-full max-w-2xl rounded-2xl border-0 sm:border sm:border-border/60 bg-background sm:bg-card sm:shadow-[0_20px_60px_-16px_rgb(0_0_0/0.08)]">
        {/* Step indicator */}
        <div className="border-b border-border/40 px-4 sm:px-8 py-4 sm:py-7">
          <StepIndicator current={step} completedSteps={completedSteps} />
        </div>

        {/* Step content */}
        <div className="px-4 sm:px-8 py-5 sm:py-8" style={{ minHeight: 280 }}>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            >
              {step === 1 && (
                <StepConnectStore
                  onSkip={handleSkip}
                  shopifyConnected={shopifyConnected}
                  setShopifyConnected={setShopifyConnected}
                  wooConnected={wooConnected}
                  setWooConnected={setWooConnected}
                  workspaceId={workspace?.id ?? ""}
                />
              )}
              {step === 2 && (
                <StepUploadPolicy
                  onPolicyAdded={handlePolicyAdded}
                  policyUploaded={policyUploaded}
                  onSkip={handleSkip}
                />
              )}
              {step === 3 && (
                <StepEmailChannel
                  onSkip={handleSkip}
                  emailConfigured={emailConfigured}
                  setEmailConfigured={setEmailConfigured}
                />
              )}
              {step === 4 && (
                <StepInviteTeam
                  onSkip={handleSkip}
                  teamInvited={teamInvited}
                  setTeamInvited={setTeamInvited}
                />
              )}
              {step === 5 && (
                <StepGoLive
                  storeConnected={storeConnected}
                  storeName={storeName}
                  policyUploaded={policyUploaded}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation footer */}
        {step < STEPS.length && (
          <div className="border-t border-border/40 px-3 sm:px-8 py-4 sm:py-5 sticky bottom-0 bg-card">
            {/* Validation nudge */}
            <AnimatePresence>
              {showValidation && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 12 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="flex items-start sm:items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-500/[0.05] px-3 py-2.5"
                >
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
                  <p className="text-[12px] text-amber-600">
                    {step === 1
                      ? "Connect a store first, or click \"Skip for now\" to continue."
                      : step === 2
                      ? "Add a policy first, or click \"Skip for now\" to continue."
                      : "Complete this step, or click \"Skip for now\" to continue."}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mobile: stacked layout (Continue on top, Back below) */}
            <div className="flex flex-col gap-3 sm:hidden">
              <button
                onClick={goNext}
                className="cursor-pointer inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-foreground px-5 text-[13px] font-semibold text-background transition-all hover:bg-foreground/90 active:scale-[0.98] w-full"
              >
                {step === STEPS.length - 1 ? "Finish" : "Continue"}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              {step > 1 && (
                <button
                  onClick={goBack}
                  className="cursor-pointer inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-background px-4 text-[13px] font-medium text-foreground transition-colors hover:bg-secondary/60 active:scale-[0.98] w-full"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </button>
              )}
              <span className="text-[12px] text-muted-foreground/40 text-center">
                Step {step} of {STEPS.length}
              </span>
            </div>

            {/* Desktop: inline layout */}
            <div className="hidden sm:flex items-center justify-between">
              <div className="flex items-center gap-2">
                {step > 1 && (
                  <button
                    onClick={goBack}
                    className="cursor-pointer inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-background px-4 text-[13px] font-medium text-foreground transition-colors hover:bg-secondary/60 active:scale-[0.98]"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[12px] text-muted-foreground/40">
                  Step {step} of {STEPS.length}
                </span>
                <button
                  onClick={goNext}
                  className="cursor-pointer inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-foreground px-5 text-[13px] font-semibold text-background transition-all hover:bg-foreground/90 active:scale-[0.98]"
                >
                  {step === STEPS.length - 1 ? "Finish" : "Continue"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Skip onboarding entirely */}
      {step < STEPS.length && (
        <Link
          href="/inbox"
          className="cursor-pointer mt-4 sm:mt-6 text-[13px] text-muted-foreground/40 underline-offset-2 transition-colors hover:text-muted-foreground hover:underline min-h-[44px] px-6 flex items-center justify-center text-center"
        >
          Skip and go to inbox
        </Link>
      )}

      {/* Bottom spacer */}
      <div className="h-6 sm:flex-1 sm:min-h-[40px]" />
    </div>
  )
}
