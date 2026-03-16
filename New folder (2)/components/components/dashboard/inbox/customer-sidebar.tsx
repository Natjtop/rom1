"use client"

import {
  DollarSign, ShoppingBag, Package, RotateCcw, ChevronDown, ExternalLink,
  XCircle, Truck, CreditCard, MapPin, Ban, AlertTriangle, Clock, Mail, Globe, MessageSquare,
} from "lucide-react"
import type { UITicket as Ticket } from "@/lib/types"
import { useState } from "react"
import { cn, getInitials, isRealCustomerEmail } from "@/lib/utils"
import { toast } from "sonner"
import { tickets as ticketsApi } from "@/lib/api"

interface CustomerSidebarProps {
  ticket: Ticket
}

// Confirmation modal component
function ConfirmDialog({
  title,
  description,
  confirmLabel,
  confirmClassName,
  onConfirm,
  onCancel,
}: {
  title: string
  description: string
  confirmLabel: string
  confirmClassName?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm" onClick={onCancel} />
      <div className="fixed inset-x-3 bottom-3 top-auto z-50 mx-auto rounded-xl border border-border/60 bg-background p-5 shadow-[0_24px_80px_-16px_rgb(0_0_0/0.2)] sm:bottom-auto sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-6">
        <h3 className="text-[15px] font-semibold text-foreground sm:text-[14px]">{title}</h3>
        <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed">{description}</p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          <button
            onClick={onCancel}
            className="flex min-h-[44px] items-center justify-center rounded-lg border border-border/60 px-4 text-[13px] font-medium text-foreground transition-colors hover:bg-secondary/60 active:bg-secondary/60 sm:min-h-0 sm:py-2"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "flex min-h-[44px] items-center justify-center rounded-lg px-4 text-[13px] font-medium text-white transition-colors sm:min-h-0 sm:py-2",
              confirmClassName ?? "bg-accent hover:bg-accent/90"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  )
}

export function CustomerSidebar({ ticket }: CustomerSidebarProps) {
  const [orderOpen, setOrderOpen] = useState(true)
  const [confirmAction, setConfirmAction] = useState<null | "refund" | "return" | "cancel">(null)

  const initials = getInitials(ticket.customerName)

  const memberSince = ticket.createdAt
    ? ticket.createdAt.replace(/\s*ago$/, "") !== ticket.createdAt
      ? ticket.createdAt
      : ticket.createdAt
    : "\u2014"
  const location = "\u2014"

  return (
    <div className={cn(
      "flex h-full w-full shrink-0 flex-col overflow-y-auto bg-background",
      /* Desktop: fixed width with left border; mobile: full width, no left border */
      "xl:w-[260px] xl:border-l xl:border-border/60"
    )}>
      {/* Customer info -- centered on mobile, row layout on larger screens */}
      <div className="border-b border-border/60 p-4 sm:p-4">
        <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:items-center sm:gap-3 sm:text-left lg:flex-row lg:gap-3 lg:text-left">
          <div
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold sm:h-10 sm:w-10 sm:text-[13px] lg:h-10 lg:w-10 lg:text-[13px]",
              ticket.channel === "livechat"
                ? "bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/20"
                : "bg-accent/10 text-accent"
            )}
            aria-label={ticket.channel === "livechat" ? "Live Chat customer avatar" : "Customer avatar"}
          >
            {ticket.channel === "livechat" ? (
              <MessageSquare className="h-5 w-5 sm:h-4 sm:w-4" />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-foreground sm:text-[14px] lg:text-[14px]">
              {ticket.customerName}
            </p>
            <p className="truncate text-[13px] text-muted-foreground sm:text-[12px] lg:text-[12px]">
              {isRealCustomerEmail(ticket.customerEmail) ? ticket.customerEmail : "—"}
            </p>
          </div>
        </div>
        {/* Extra customer details */}
        <div className="mt-3 flex flex-col gap-2 sm:gap-1.5">
          <div className="flex items-center gap-2.5 text-[12px] text-muted-foreground sm:text-[11px] sm:gap-2">
            <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 sm:h-3 sm:w-3" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-2.5 text-[12px] text-muted-foreground sm:text-[11px] sm:gap-2">
            <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 sm:h-3 sm:w-3" />
            <span>Customer since {memberSince}</span>
          </div>
          <div className="flex items-center gap-2.5 text-[12px] text-muted-foreground sm:text-[11px] sm:gap-2">
            <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 sm:h-3 sm:w-3" />
            <span className="capitalize">{ticket.channel} channel</span>
          </div>
        </div>
      </div>

      {/* Stats -- responsive padding */}
      <div className="grid grid-cols-2 gap-px border-b border-border/60 bg-border/30">
        <div className="bg-background p-4 sm:p-3">
          <div className="flex items-center gap-1.5 text-muted-foreground/60">
            <DollarSign className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em]">LTV</span>
          </div>
          <p className="mt-1.5 text-[20px] font-semibold tracking-tight text-foreground tabular-nums sm:mt-1 sm:text-[18px]">
            ${ticket.ltv.toLocaleString()}
          </p>
        </div>
        <div className="bg-background p-4 sm:p-3">
          <div className="flex items-center gap-1.5 text-muted-foreground/60">
            <ShoppingBag className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em]">Orders</span>
          </div>
          <p className="mt-1.5 text-[20px] font-semibold tracking-tight text-foreground tabular-nums sm:mt-1 sm:text-[18px]">
            {ticket.totalOrders}
          </p>
        </div>
      </div>

      {/* Tags section */}
      {ticket.tags && ticket.tags.length > 0 && (
        <div className="border-b border-border/60 p-4">
          <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50">
            Tags
          </p>
          <div className="flex flex-wrap gap-2 sm:gap-1.5">
            {ticket.tags.map((tag) => {
              // Color-code common tags
              const tagColors: Record<string, string> = {
                urgent: "bg-red-500/10 text-red-600 border-red-500/20",
                billing: "bg-amber-500/10 text-amber-600 border-amber-500/20",
                shipping: "bg-foreground/5 text-foreground/80 border-foreground/10",
                wismo: "bg-foreground/5 text-foreground/80 border-foreground/10",
                return: "bg-foreground/5 text-foreground/80 border-foreground/10",
                subscription: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                retention: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                recommendation: "bg-pink-500/10 text-pink-600 border-pink-500/20",
                international: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
              }
              const colorClass = tagColors[tag.toLowerCase()] || "bg-secondary text-muted-foreground border-border/40"
              return (
                <span
                  key={tag}
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors duration-150 sm:px-2 sm:py-0.5 sm:text-[10px]",
                    colorClass
                  )}
                >
                  {tag}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Order details */}
      {ticket.orderDetails && (
        <div className="border-b border-border/60">
          <button
            onClick={() => setOrderOpen(!orderOpen)}
            className="flex min-h-[44px] w-full items-center justify-between px-4 py-3 text-[13px] font-medium text-foreground transition-colors duration-150 hover:bg-secondary/40"
          >
            <div className="flex items-center gap-2">
              <Package className="h-3.5 w-3.5 text-muted-foreground/60" />
              <span>Order {ticket.orderDetails.id}</span>
            </div>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-muted-foreground/50 transition-transform duration-200",
                orderOpen ? "rotate-180" : ""
              )}
            />
          </button>

          {orderOpen && (
            <div className="px-4 pb-4">
              <div className="flex flex-col gap-3 overflow-hidden">
                {/* Info rows with label/value layout */}
                <div className="flex min-h-[36px] items-center justify-between sm:min-h-0">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50">Status</span>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 sm:px-2 sm:py-0.5 sm:text-[10px]">
                    {ticket.orderDetails.status}
                  </span>
                </div>
                <div className="h-px bg-border/40" />
                <div className="flex min-h-[36px] items-center justify-between sm:min-h-0">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50">Total</span>
                  <span className="text-[14px] font-semibold text-foreground tabular-nums sm:text-[13px]">
                    {ticket.orderDetails.total}
                  </span>
                </div>
                {ticket.orderDetails.trackingNumber && (
                  <>
                    <div className="h-px bg-border/40" />
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50 shrink-0">Tracking</span>
                      <button className="flex min-h-[44px] items-center gap-1.5 font-mono text-[12px] text-accent transition-colors duration-150 hover:text-accent/80 active:text-accent/80 sm:min-h-0 sm:text-[11px]">
                        <span className="truncate max-w-[200px] sm:max-w-[120px]">
                          {ticket.orderDetails.trackingNumber}
                        </span>
                        <ExternalLink className="h-3 w-3 shrink-0 sm:h-2.5 sm:w-2.5" />
                      </button>
                    </div>
                  </>
                )}
                <div className="h-px bg-border/40" />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50 mb-2">Items</p>
                  <ul className="flex flex-col gap-2 sm:gap-1.5">
                    {ticket.orderDetails.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-[13px] text-foreground sm:text-[12px]"
                      >
                        <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/30 sm:mt-1.5 sm:h-1 sm:w-1" />
                        <span className="break-words min-w-0">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Order Management Actions */}
                <div className="mt-1 flex flex-col gap-2 sm:gap-1.5">
                  <div className="h-px bg-border/40 mt-1 mb-2" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50 mb-1">
                    Order Actions
                  </p>
                  <button
                    onClick={() => setConfirmAction("refund")}
                    className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-border/60 text-[13px] font-medium text-foreground transition-all duration-150 hover:bg-secondary/60 hover:border-border active:bg-secondary/60 sm:min-h-[36px] sm:gap-1.5 sm:text-[12px]"
                  >
                    <CreditCard className="h-4 w-4 shrink-0 sm:h-3.5 sm:w-3.5" />
                    Issue Refund
                  </button>
                  <button
                    onClick={() => setConfirmAction("return")}
                    className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-border/60 text-[13px] font-medium text-foreground transition-all duration-150 hover:bg-secondary/60 hover:border-border active:bg-secondary/60 sm:min-h-[36px] sm:gap-1.5 sm:text-[12px]"
                  >
                    <RotateCcw className="h-4 w-4 shrink-0 sm:h-3.5 sm:w-3.5" />
                    Generate Return Label
                  </button>
                  <button
                    onClick={() => setConfirmAction("cancel")}
                    className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-red-500/20 text-[13px] font-medium text-red-600 transition-all duration-150 hover:bg-red-500/[0.06] active:bg-red-500/[0.06] sm:min-h-[36px] sm:gap-1.5 sm:text-[12px]"
                  >
                    <Ban className="h-4 w-4 shrink-0 sm:h-3.5 sm:w-3.5" />
                    Cancel Order
                  </button>
                  <button
                    onClick={() => toast.info("Edit shipping address -- coming soon")}
                    className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-border/60 text-[13px] font-medium text-foreground transition-all duration-150 hover:bg-secondary/60 hover:border-border active:bg-secondary/60 sm:min-h-[36px] sm:gap-1.5 sm:text-[12px]"
                  >
                    <MapPin className="h-4 w-4 shrink-0 sm:h-3.5 sm:w-3.5" />
                    Edit Shipping Address
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Customer history */}
      <div className="p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50">
          Customer History
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:mt-2.5 sm:gap-2">
          {(ticket.ltv > 0 || ticket.totalOrders > 0) ? (
            <>
              {ticket.ltv > 0 && (
                <div className="flex items-center justify-between text-[13px] sm:text-[12px]">
                  <span className="text-muted-foreground">Lifetime value</span>
                  <span className="font-medium text-foreground tabular-nums">${ticket.ltv.toLocaleString()}</span>
                </div>
              )}
              {ticket.totalOrders > 0 && (
                <div className="flex items-center justify-between text-[13px] sm:text-[12px]">
                  <span className="text-muted-foreground">Orders</span>
                  <span className="font-medium text-foreground tabular-nums">{ticket.totalOrders}</span>
                </div>
              )}
            </>
          ) : (
            <p className="text-[13px] text-muted-foreground/60 sm:text-[12px]">
              New customer -- first interaction
            </p>
          )}
        </div>
      </div>

      {/* Confirmation dialogs */}
      {confirmAction === "refund" && ticket.orderDetails && (
        <ConfirmDialog
          title="Issue Refund"
          description={`This will issue a full refund of ${ticket.orderDetails.total} for order ${ticket.orderDetails.id}. This feature requires a connected Shopify store.`}
          confirmLabel="Issue Refund"
          confirmClassName="bg-accent hover:bg-accent/90"
          onConfirm={async () => {
            setConfirmAction(null)
            try {
              await ticketsApi.shopifyRefund(ticket.id, { orderId: ticket.orderDetails!.id })
              toast.success(`Refund issued for order ${ticket.orderDetails!.id}`)
            } catch {
              toast.error("Failed to issue refund. Make sure Shopify is connected.")
            }
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction === "return" && ticket.orderDetails && (
        <ConfirmDialog
          title="Generate Return Label"
          description={`A return request for order ${ticket.orderDetails.id} will be created${isRealCustomerEmail(ticket.customerEmail) ? ` and the customer will be notified at ${ticket.customerEmail}` : ""}.`}
          confirmLabel="Create Return"
          confirmClassName="bg-accent hover:bg-accent/90"
          onConfirm={async () => {
            setConfirmAction(null)
            try {
              await ticketsApi.shopifyRefund(ticket.id, { orderId: ticket.orderDetails!.id, reason: "Return request" })
              toast.success("Return request created")
            } catch {
              toast.error("Failed to create return. Make sure Shopify is connected.")
            }
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction === "cancel" && ticket.orderDetails && (
        <ConfirmDialog
          title="Cancel Order"
          description={`Are you sure you want to cancel order ${ticket.orderDetails.id} (${ticket.orderDetails.total})? The customer will be refunded and notified.`}
          confirmLabel="Cancel Order"
          confirmClassName="bg-red-600 hover:bg-red-600/90"
          onConfirm={async () => {
            setConfirmAction(null)
            try {
              await ticketsApi.shopifyCancel(ticket.id, { orderId: ticket.orderDetails!.id })
              toast.success(`Order ${ticket.orderDetails!.id} cancelled`)
            } catch {
              toast.error("Failed to cancel order. Make sure Shopify is connected.")
            }
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  )
}
