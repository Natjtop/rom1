"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { CreditCard, Download, Zap, Users, Store, Check, Sparkles, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { cn, btnSecondary } from "@/lib/utils"
import { toast } from "sonner"
import { billing } from "@/lib/api"
import { PLANS } from "@/lib/plans"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const ease = [0.23, 1, 0.32, 1]

// ─── Types ──────────────────────────────────────────────────────────────────

interface UsageMetric {
  label: string
  used: number
  total: number
  icon: React.ElementType
}

interface Invoice {
  id: string
  date: string
  description: string
  amount: string
  status: string
  pdfUrl?: string
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function UsageBar({ metric, index }: { metric: UsageMetric; index: number }) {
  const pct = metric.total > 0 ? Math.round((metric.used / metric.total) * 100) : 0
  const isHigh = pct >= 80

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.06, ease }}
      className="flex flex-col gap-2"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
            isHigh ? "bg-amber-500/10" : "bg-secondary"
          )}>
            <metric.icon className={cn("h-3.5 w-3.5", isHigh ? "text-amber-600" : "text-muted-foreground/60")} />
          </div>
          <span className="text-[13px] font-medium text-foreground truncate">{metric.label}</span>
        </div>
        <span className="text-[13px] font-medium text-foreground whitespace-nowrap shrink-0">
          {typeof metric.used === "number" && metric.total > 10
            ? `${metric.used.toLocaleString()} / ${metric.total.toLocaleString()}`
            : `${metric.used} / ${metric.total}`}
        </span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: 0.2 + index * 0.06, ease }}
          className={cn(
            "h-2 rounded-full transition-colors",
            isHigh ? "bg-amber-500" : "bg-accent"
          )}
        />
      </div>
      <p className="text-[11px] text-muted-foreground/50">{pct}% used</p>
    </motion.div>
  )
}

function PaidBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Paid
    </span>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [currentPlan, setCurrentPlan] = useState("Free")
  const [hasSubscription, setHasSubscription] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [updatePaymentOpen, setUpdatePaymentOpen] = useState(false)
  const [isCanceled, setIsCanceled] = useState(false)
  const [isAnnual, setIsAnnual] = useState(false)

  // Real data from API
  const [usage, setUsage] = useState<UsageMetric[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [invoicesLoading, setInvoicesLoading] = useState(true)

  // Handle post-checkout redirect from Stripe
  useEffect(() => {
    const success = searchParams.get("success")
    const canceled = searchParams.get("canceled")
    const plan = searchParams.get("plan")
    const error = searchParams.get("error")

    if (success === "true") {
      const planName = PLANS.find((p) => p.key === plan)?.name ?? plan ?? "paid"
      toast.success(`Subscription activated! You are now on the ${planName} plan.`)
      // Clean URL params without triggering navigation
      window.history.replaceState({}, "", "/billing")
    } else if (canceled === "true") {
      toast.info("Checkout canceled. No charges were made.")
      window.history.replaceState({}, "", "/billing")
    } else if (error) {
      const errorMessages: Record<string, string> = {
        missing_params: "Billing confirmation failed: missing parameters.",
        missing_charge_id: "Billing confirmation failed: no charge ID provided.",
        charge_not_active: "The charge was not activated. Please try again.",
        charge_verification_failed: "Could not verify the charge. Please contact support.",
      }
      toast.error(errorMessages[error] ?? `Billing error: ${error}`)
      window.history.replaceState({}, "", "/billing")
    }
  }, [searchParams])

  // Load billing plan and usage from API on mount
  useEffect(() => {
    let cancelled = false
    const loadPlan = async () => {
      try {
        const result = await billing.getPlan()
        if (cancelled) return
        setHasSubscription(!!result.hasStripeSubscription)
        setIsCanceled(!!result.cancelAtPeriodEnd)
        if (result.plan) {
          const matchedPlan = PLANS.find((p) => p.name.toLowerCase() === result.plan.toLowerCase())
          if (matchedPlan) {
            setCurrentPlan(matchedPlan.name)

            // Build usage metrics from API response
            if (result.usage) {
              const usageMetrics: UsageMetric[] = [
                {
                  label: "AI Resolutions",
                  used: result.usage.aiResolutions ?? 0,
                  total: matchedPlan.aiResolutions,
                  icon: Zap,
                },
                {
                  label: "Agent seats",
                  used: result.usage.agentSeats ?? 0,
                  total: matchedPlan.agentSeats,
                  icon: Users,
                },
                {
                  label: "Stores",
                  used: result.usage.stores ?? 0,
                  total: matchedPlan.stores,
                  icon: Store,
                },
              ]
              setUsage(usageMetrics)
            }
          }
        }
      } catch (err) {
        toast.error("Failed to load billing plan")
        // Build default usage from default plan
        const defaultPlan = PLANS.find((p) => p.name === "Growth") ?? PLANS[1]
        setUsage([
          { label: "AI Resolutions", used: 0, total: defaultPlan.aiResolutions, icon: Zap },
          { label: "Agent seats", used: 0, total: defaultPlan.agentSeats, icon: Users },
          { label: "Stores", used: 0, total: defaultPlan.stores, icon: Store },
        ])
      } finally {
        if (!cancelled) setPageLoading(false)
      }
    }
    loadPlan()
    return () => { cancelled = true }
  }, [])

  // Load invoices from API
  useEffect(() => {
    let cancelled = false
    const loadInvoices = async () => {
      try {
        setInvoicesLoading(true)
        const result = await billing.getInvoices()
        if (cancelled) return
        setInvoices(Array.isArray(result?.data) ? result.data : [])
      } catch (err) {
        toast.error("Failed to load invoices")
        setInvoices([])
      } finally {
        if (!cancelled) setInvoicesLoading(false)
      }
    }
    loadInvoices()
    return () => { cancelled = true }
  }, [])

  // Recalculate usage when plan changes (if no API usage data was loaded)
  useEffect(() => {
    if (usage.length === 0 && !pageLoading) {
      const plan = PLANS.find((p) => p.name === currentPlan) ?? PLANS[1]
      setUsage([
        { label: "AI Resolutions", used: 0, total: plan.aiResolutions, icon: Zap },
        { label: "Agent seats", used: 0, total: plan.agentSeats, icon: Users },
        { label: "Stores", used: 0, total: plan.stores, icon: Store },
      ])
    }
  }, [currentPlan, usage.length, pageLoading])

  const currentPlanDef = PLANS.find((p) => p.name === currentPlan) ?? PLANS[1]

  const handleUpgradePlan = () => {
    const idx = PLANS.findIndex((p) => p.name === currentPlan)
    const nextPlan = PLANS[idx + 1]
    if (nextPlan) {
      handleChangePlan(nextPlan.name)
    } else {
      toast.info("You are already on the highest plan")
    }
  }

  const handleChangePlan = async (planName: string) => {
    setLoading(true)
    try {
      const planKey = planName.toLowerCase()
      if (!hasSubscription) {
        // No subscription — go directly to Stripe Checkout
        const result = await billing.createCheckout(planKey, isAnnual)
        if (result.url) {
          window.location.href = result.url
          return
        }
      } else {
        // Has subscription — update it directly
        const result = await billing.changePlan(planKey)
        setCurrentPlan(planName)
        setIsCanceled(false)
        toast.success(`Plan changed to ${planName}`)
        if (result.redirectUrl) {
          window.open(result.redirectUrl, "_blank")
        }
      }
    } catch (err) {
      console.error("Failed to change plan:", err)
      toast.error(err instanceof Error && err.message ? err.message : "Failed to change plan")
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    setLoading(true)
    try {
      await billing.cancelSubscription()
      setIsCanceled(true)
      toast.success("Subscription canceled. Access continues until end of billing period.")
    } catch (err) {
      console.error("Failed to cancel subscription:", err)
      toast.error("Failed to cancel subscription")
    } finally {
      setCancelDialogOpen(false)
      setLoading(false)
    }
  }

  const handleDownloadInvoice = (invoice: Invoice) => {
    if (invoice.pdfUrl) {
      window.open(invoice.pdfUrl, "_blank")
    } else {
      toast.error("Invoice PDF not available")
    }
  }

  const handleDownloadAll = () => {
    const pdfInvoices = invoices.filter((inv) => inv.pdfUrl)
    if (pdfInvoices.length === 0) {
      toast.error("No invoice PDFs available")
      return
    }
    pdfInvoices.forEach((inv) => {
      window.open(inv.pdfUrl!, "_blank")
    })
    toast.success(`Opened ${pdfInvoices.length} invoice PDF(s)`)
  }

  const handleManageSubscription = async () => {
    try {
      const result = await billing.createPortal()
      if (result.url) window.open(result.url, "_blank")
    } catch {
      toast.error("Failed to open billing portal")
    }
  }

  const handleUpdatePayment = () => {
    setUpdatePaymentOpen(true)
  }

  if (pageLoading) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-32 rounded-lg bg-secondary" />
            <div className="h-4 w-64 rounded bg-secondary" />
            <div className="space-y-4 mt-6">
              <div className="h-48 rounded-2xl bg-secondary" />
              <div className="h-32 rounded-2xl bg-secondary" />
              <div className="h-24 rounded-2xl bg-secondary" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="text-xl sm:text-[22px] font-semibold text-foreground tracking-tight">Billing</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Manage your plan, payment method, and invoices.
          </p>
        </motion.div>

        <div className="flex flex-col gap-4 sm:gap-5">

          {/* Current plan card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05, ease }}
            className="rounded-2xl border border-border/60 bg-card overflow-hidden"
          >
            {/* Plan header */}
            <div className="p-4 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                      Current plan
                    </span>
                    {isCanceled ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600 shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Canceling
                      </span>
                    ) : hasSubscription ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground shrink-0">
                        Free
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-[22px] sm:text-[24px] font-semibold text-foreground tracking-tight">{currentPlan}</p>
                  {hasSubscription ? (
                    <>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-[26px] sm:text-[28px] font-semibold text-foreground">${currentPlanDef.price}</span>
                        <span className="text-[13px] sm:text-[14px] text-muted-foreground">/month</span>
                      </div>
                      <p className="mt-1 text-[13px] text-muted-foreground break-words">
                        {isCanceled ? "Access ends at end of billing period" : "Renews at end of billing period"}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-[13px] text-muted-foreground">
                      Upgrade to unlock more features and AI resolutions.
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2 sm:items-end w-full sm:w-auto">
                  <button
                    onClick={handleUpgradePlan}
                    disabled={loading || currentPlan === "Scale"}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-[13px] font-medium text-background transition-all duration-150 hover:bg-foreground/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm min-h-[44px] w-full sm:w-auto"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {currentPlan === "Scale" ? "On highest plan" : "Upgrade plan"}
                  </button>
                  {hasSubscription && !isCanceled ? (
                    <button
                      onClick={() => setCancelDialogOpen(true)}
                      disabled={loading}
                      className="text-[13px] font-medium text-destructive/70 hover:text-destructive hover:bg-destructive/5 cursor-pointer rounded-lg px-3 py-2 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] w-full sm:w-auto text-center"
                    >
                      Cancel subscription
                    </button>
                  ) : isCanceled ? (
                    <button
                      onClick={async () => {
                        try {
                          await billing.changePlan(currentPlan.toLowerCase())
                          setIsCanceled(false)
                          toast.success("Subscription reactivated")
                        } catch {
                          toast.error("Failed to reactivate subscription")
                        }
                      }}
                      disabled={loading}
                      className="text-[13px] font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/5 cursor-pointer rounded-lg px-3 py-2 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] w-full sm:w-auto text-center"
                    >
                      Reactivate subscription
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Usage bars */}
            <div className="border-t border-border/40 p-4 sm:p-6">
              <h3 className="mb-4 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground/50">Usage this billing period</h3>
              <div className="flex flex-col gap-4">
                {usage.map((metric, i) => (
                  <UsageBar key={metric.label} metric={metric} index={i} />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Plan comparison */}
          <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-6">
            <div className="mb-4 sm:mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                Compare plans
              </h3>

              {/* Annual / Monthly toggle */}
              <div className="flex items-center gap-2">
                <span className={cn("text-[13px] font-medium transition-colors", !isAnnual ? "text-foreground" : "text-muted-foreground/50")}>Monthly</span>
                <button
                  onClick={() => setIsAnnual(!isAnnual)}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
                    isAnnual ? "bg-accent" : "bg-secondary"
                  )}
                  role="switch"
                  aria-checked={isAnnual}
                  aria-label="Toggle annual billing"
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200",
                      isAnnual ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
                <span className={cn("text-[13px] font-medium transition-colors", isAnnual ? "text-foreground" : "text-muted-foreground/50")}>
                  Annual
                </span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                  Save 20%
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {PLANS.filter((p) => p.price > 0).map((plan, i) => {
                const isCurrent = plan.name === currentPlan
                const isPopular = plan.name === "Growth"
                const displayPrice = isAnnual ? Math.round(plan.annualPrice / 12) : plan.price
                const totalAnnual = plan.annualPrice
                const monthlySavings = isAnnual ? plan.price - Math.round(plan.annualPrice / 12) : 0
                return (
                  <div
                    key={plan.name}
                    className={cn(
                      "relative flex flex-col rounded-xl border p-4 sm:p-5 transition-all duration-200",
                      isCurrent
                        ? "border-accent/30 bg-accent/[0.03] ring-1 ring-accent/10"
                        : isPopular
                          ? "border-accent/20 shadow-[0_4px_12px_-4px_rgb(0_0_0/0.08)]"
                          : "border-border/60 hover:border-border hover:shadow-[0_4px_12px_-4px_rgb(0_0_0/0.06)]"
                    )}
                  >
                    {isPopular && !isCurrent && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-semibold text-white whitespace-nowrap">
                        Most popular
                      </span>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground/60">{plan.name}</p>
                      {isCurrent && (
                        <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent shrink-0">Current</span>
                      )}
                    </div>
                    <div className="mt-2">
                      <p className="text-[22px] sm:text-[24px] font-semibold text-foreground tracking-tight">
                        ${displayPrice}<span className="text-[13px] font-normal text-muted-foreground">/mo</span>
                      </p>
                      {isAnnual && (
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          ${totalAnnual}/yr <span className="text-emerald-600 font-medium">(save ${monthlySavings}/mo)</span>
                        </p>
                      )}
                    </div>
                    <ul className="mt-3 flex flex-1 flex-col gap-1.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-[13px] text-muted-foreground">
                          <Check className="h-3 w-3 shrink-0 text-emerald-600" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    {!isCurrent ? (
                      <button
                        onClick={() => handleChangePlan(plan.name)}
                        disabled={loading}
                        className="mt-4 w-full rounded-lg bg-foreground py-2.5 text-[13px] font-medium text-background transition-colors hover:bg-foreground/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                      >
                        {!hasSubscription ? "Start 3-day free trial" : plan.price > currentPlanDef.price ? "Upgrade" : "Downgrade"}
                      </button>
                    ) : (
                      <div className="mt-4 w-full rounded-lg py-2.5 text-center text-[13px] font-medium text-muted-foreground min-h-[44px] flex items-center justify-center">
                        Current plan
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Payment method card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15, ease }}
            className="rounded-2xl border border-border/60 bg-card p-4 sm:p-6"
          >
            <h3 className="mb-4 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground/50">
              Payment method
            </h3>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-gradient-to-br from-secondary/80 to-secondary/40">
                  <CreditCard className="h-4.5 w-4.5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-foreground truncate">Payment via Stripe</p>
                  <p className="text-[12px] text-muted-foreground">Manage your payment method in the Stripe portal</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row w-full sm:w-auto">
                <button
                  onClick={handleUpdatePayment}
                  className={cn(btnSecondary, "w-full sm:w-auto min-h-[44px] justify-center")}
                >
                  Update
                </button>
                <button
                  onClick={handleManageSubscription}
                  className={cn(btnSecondary, "w-full sm:w-auto min-h-[44px] justify-center")}
                >
                  Manage Subscription
                </button>
              </div>
            </div>
          </motion.div>

          {/* Invoices card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2, ease }}
            className="rounded-2xl border border-border/60 bg-card p-4 sm:p-6"
          >
            <div className="mb-4 sm:mb-5 flex items-center justify-between gap-3">
              <h3 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                Invoices
              </h3>
              {invoices.length > 0 && (
                <button
                  onClick={handleDownloadAll}
                  className="text-[13px] font-medium text-accent transition-colors hover:text-accent/80 cursor-pointer min-h-[44px] inline-flex items-center shrink-0"
                >
                  Download all
                </button>
              )}
            </div>

            {invoicesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/60">
                  <CreditCard className="h-4 w-4 text-muted-foreground/40" />
                </div>
                <p className="mt-3 text-[13px] font-medium text-foreground">No invoices yet</p>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  Your invoices will appear here after your first billing cycle.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop table view */}
                <div className="hidden sm:block overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
                  <table className="w-full text-[13px] min-w-[500px]">
                    <thead>
                      <tr className="border-b border-border/60">
                        <th className="pb-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                          Date
                        </th>
                        <th className="pb-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                          Description
                        </th>
                        <th className="pb-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                          Amount
                        </th>
                        <th className="pb-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                          Status
                        </th>
                        <th className="pb-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                          PDF
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {invoices.map((invoice, i) => (
                        <motion.tr
                          key={invoice.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.25 + i * 0.04, ease }}
                          className="transition-colors hover:bg-secondary/20"
                        >
                          <td className="py-3.5 pr-4 text-muted-foreground whitespace-nowrap">{invoice.date}</td>
                          <td className="py-3.5 pr-4 font-medium text-foreground">{invoice.description}</td>
                          <td className="py-3.5 pr-4 font-semibold text-foreground whitespace-nowrap">{invoice.amount}</td>
                          <td className="py-3.5 pr-4">
                            {invoice.status === "Paid" || invoice.status === "paid" ? (
                              <PaidBadge />
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                                {invoice.status}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 text-right">
                            <button
                              onClick={() => handleDownloadInvoice(invoice)}
                              className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors duration-150 hover:bg-secondary/60 hover:text-foreground cursor-pointer min-h-[44px] min-w-[44px]"
                              aria-label={`Download invoice ${invoice.id}`}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile card view for invoices */}
                <div className="flex flex-col gap-3 sm:hidden">
                  {invoices.map((invoice, i) => (
                    <motion.div
                      key={invoice.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.25 + i * 0.04, ease }}
                      className="rounded-lg border border-border/40 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-foreground truncate">{invoice.description}</p>
                          <p className="mt-0.5 text-[12px] text-muted-foreground">{invoice.date}</p>
                        </div>
                        <button
                          onClick={() => handleDownloadInvoice(invoice)}
                          className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors duration-150 hover:bg-secondary/60 hover:text-foreground cursor-pointer min-h-[44px] min-w-[44px] shrink-0 -mr-2 -mt-1"
                          aria-label={`Download invoice ${invoice.id}`}
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[14px] font-semibold text-foreground">{invoice.amount}</span>
                        {invoice.status === "Paid" || invoice.status === "paid" ? (
                          <PaidBadge />
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                            {invoice.status}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </motion.div>

        </div>
      </div>

      {/* Cancel subscription confirmation dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel subscription</DialogTitle>
            <DialogDescription className="text-[13px] text-muted-foreground">
              Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your current billing period.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              onClick={() => setCancelDialogOpen(false)}
              className={cn(btnSecondary, "w-full sm:w-auto min-h-[44px] justify-center")}
            >
              Keep subscription
            </button>
            <button
              onClick={handleCancelSubscription}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2 text-[13px] font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto min-h-[44px]"
            >
              {loading ? "Canceling..." : "Yes, cancel"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update payment method dialog */}
      <Dialog open={updatePaymentOpen} onOpenChange={setUpdatePaymentOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update payment method</DialogTitle>
            <DialogDescription className="text-[13px] text-muted-foreground">
              You'll be redirected to our secure payment portal to update your card details.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg border border-border/60 bg-secondary/30 p-4 text-center">
              <CreditCard className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-[13px] text-muted-foreground">
                Your payment information is securely managed by Stripe. Click below to update your card.
              </p>
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              onClick={() => setUpdatePaymentOpen(false)}
              className={cn(btnSecondary, "w-full sm:w-auto min-h-[44px] justify-center")}
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                try {
                  const result = await billing.createPortal()
                  if (result.url) window.open(result.url, "_blank")
                  setUpdatePaymentOpen(false)
                } catch {
                  toast.error("Failed to open payment portal")
                }
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2 text-[13px] font-medium text-background transition-colors hover:bg-foreground/90 cursor-pointer w-full sm:w-auto min-h-[44px]"
            >
              <CreditCard className="h-3.5 w-3.5" />
              Open Stripe Portal
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change plan dialog removed — goes directly to Stripe Checkout */}
    </div>
  )
}
