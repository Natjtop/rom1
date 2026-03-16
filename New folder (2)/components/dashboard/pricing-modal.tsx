"use client"

import { useState } from "react"
import { X, Check, Sparkles, Zap, Rocket, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { billing } from "@/lib/api"

const TRIAL_DAYS = 3

const PLANS = [
  {
    key: "starter",
    name: "Starter",
    price: 49,
    trial: true,
    popular: false,
    icon: Zap,
    color: "text-blue-600",
    bg: "bg-blue-500/10",
    features: [
      "2 Agent seats",
      "500 AI resolutions/mo",
      "Shopify integration",
      "Email + Live Chat",
      "Basic analytics",
    ],
  },
  {
    key: "growth",
    name: "Growth",
    price: 99,
    trial: true,
    popular: true,
    icon: Sparkles,
    color: "text-accent",
    bg: "bg-accent/10",
    features: [
      "5 Agent seats",
      "2,000 AI resolutions/mo",
      "All integrations",
      "Advanced analytics",
      "Macros, rules & flows",
      "Knowledge base + RAG",
    ],
  },
  {
    key: "scale",
    name: "Scale",
    price: 199,
    trial: true,
    popular: false,
    icon: Rocket,
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
    features: [
      "Unlimited seats",
      "10,000 AI resolutions/mo",
      "Custom AI training",
      "Dedicated onboarding",
      "SLA guarantee",
      "Priority support",
    ],
  },
]

interface PricingModalProps {
  open: boolean
  onClose: () => void
}

export function PricingModal({ open, onClose }: PricingModalProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [hasSubscription, setHasSubscription] = useState(false)

  useState(() => {
    billing.getPlan().then((r) => {
      setHasSubscription(r.plan !== "free")
    }).catch(() => {})
  })

  if (!open) return null

  const isTrial = !hasSubscription

  async function handleStartTrial(planKey: string) {
    setLoading(planKey)
    try {
      const res = await billing.createCheckout(planKey, false)
      if (res.url) {
        window.location.href = res.url
      }
    } catch {
      toast.error("Failed to start trial. Please try again.")
      setLoading(null)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />

      {/* Mobile: bottom sheet / Desktop: centered modal */}
      <div className={cn(
        "fixed z-50 bg-background overflow-y-auto overscroll-contain",
        // Mobile: bottom sheet
        "inset-x-0 bottom-0 max-h-[92vh] rounded-t-2xl",
        // Desktop: centered modal
        "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-h-[90vh] sm:w-full sm:max-w-[780px] sm:rounded-2xl sm:border sm:border-border/60 sm:shadow-2xl",
        // Animation
        "animate-in sm:fade-in sm:zoom-in-95 slide-in-from-bottom duration-300 sm:slide-in-from-bottom-0"
      )}>
        {/* Drag handle (mobile) */}
        <div className="flex justify-center py-2 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-2 pt-1 sm:px-6 sm:pt-5">
          <div>
            <h2 className="text-[18px] font-semibold text-foreground sm:text-[20px]">{isTrial ? "Start your free trial" : "Choose a plan"}</h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">{isTrial ? `${TRIAL_DAYS}-day free trial with 25% usage limit. No credit card required.` : "Upgrade your plan to unlock more features."}</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Plans */}
        <div className="overflow-y-auto overscroll-contain px-5 pb-6 pt-3 sm:px-6 sm:pb-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {PLANS.map((plan) => {
              const Icon = plan.icon
              const isLoading = loading === plan.key
              return (
                <div
                  key={plan.key}
                  className={cn(
                    "relative flex flex-col rounded-xl border p-4 transition-all",
                    plan.popular
                      ? "border-accent/30 bg-accent/[0.02] shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_4px_16px_-4px_rgba(0,0,0,0.06)]"
                      : "border-border/60 bg-card"
                  )}
                >
                  {plan.popular && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-semibold text-white">
                      Most popular
                    </span>
                  )}

                  <div className="flex items-center gap-2.5">
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", plan.bg)}>
                      <Icon className={cn("h-4.5 w-4.5", plan.color)} />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-foreground">{plan.name}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[22px] font-bold text-foreground">${plan.price}</span>
                        <span className="text-[12px] text-muted-foreground">/mo</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex-1 space-y-2">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        <span className="text-[12px] text-muted-foreground leading-tight">{f}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleStartTrial(plan.key)}
                    disabled={!!loading}
                    className={cn(
                      "mt-4 flex h-10 w-full items-center justify-center rounded-lg text-[13px] font-semibold transition-all disabled:opacity-50",
                      plan.popular
                        ? "bg-foreground text-background hover:bg-foreground/90"
                        : "border border-border/60 bg-card text-foreground hover:bg-secondary"
                    )}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      isTrial ? `Start ${TRIAL_DAYS}-day free trial` : "Choose plan"
                    )}
                  </button>
                </div>
              )
            })}
          </div>

          {isTrial && (
            <p className="mt-4 text-center text-[11px] text-muted-foreground/50">
              Trial includes 25% of plan limits. Upgrade anytime to unlock full access. Cancel before trial ends — no charge.
            </p>
          )}
        </div>
      </div>
    </>
  )
}
