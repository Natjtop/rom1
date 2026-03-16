"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Plus, Pencil, Trash2, Webhook, Info, Send, Copy, Check } from "lucide-react"
import { toast } from "sonner"
import { settingsApi, getAuthBearerToken } from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

const ALL_EVENTS = [
  "ticket.created",
  "ticket.resolved",
  "ticket.escalated",
  "ticket.assigned",
  "ai.replied",
] as const

type WebhookEvent = (typeof ALL_EVENTS)[number]

interface Endpoint {
  id: string
  url: string
  events: WebhookEvent[]
  status: "active" | "inactive"
  secret: string
}

// Static delivery logs removed -- delivery log viewer coming soon

export default function WebhooksPage() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEndpoint, setEditingEndpoint] = useState<Endpoint | null>(null)
  const [urlInput, setUrlInput] = useState("")
  const [selectedEvents, setSelectedEvents] = useState<Set<WebhookEvent>>(new Set())
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchWebhooks = useCallback(async () => {
    try {
      setLoading(true)
      const result = await settingsApi.getWebhooks()
      const data = result.data || []
      setEndpoints(data.map((w: Record<string, unknown>) => ({
        id: w.id as string,
        url: w.url as string,
        events: (w.events as WebhookEvent[]) || [],
        status: (w.isEnabled as boolean) !== false ? "active" as const : "inactive" as const,
        secret: (w.secret as string) || "",
      })))
    } catch (err) {
      toast.error("Failed to load webhooks")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchWebhooks() }, [fetchWebhooks])

  const openAdd = () => {
    setEditingEndpoint(null)
    setUrlInput("")
    setSelectedEvents(new Set())
    setModalOpen(true)
  }

  const openEdit = (ep: Endpoint) => {
    setEditingEndpoint(ep)
    setUrlInput(ep.url)
    setSelectedEvents(new Set(ep.events))
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!urlInput.trim() || selectedEvents.size === 0) return
    try {
      setSaving(true)
      if (editingEndpoint) {
        await settingsApi.updateWebhook(editingEndpoint.id, {
          url: urlInput.trim(),
          events: Array.from(selectedEvents),
        })
        setEndpoints((prev) =>
          prev.map((ep) =>
            ep.id === editingEndpoint.id
              ? { ...ep, url: urlInput.trim(), events: Array.from(selectedEvents) }
              : ep
          )
        )
        toast.success("Endpoint updated successfully")
      } else {
        const result = await settingsApi.createWebhook({
          url: urlInput.trim(),
          events: Array.from(selectedEvents),
        })
        setEndpoints((prev) => [
          ...prev,
          {
            id: result.id,
            url: urlInput.trim(),
            events: Array.from(selectedEvents),
            status: "active",
            secret: result.secret || "",
          },
        ])
        toast.success("Endpoint added successfully")
      }
      setModalOpen(false)
    } catch (err) {
      console.error("Failed to save webhook:", err)
      toast.error(editingEndpoint ? "Failed to update endpoint" : "Failed to add endpoint")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await settingsApi.deleteWebhook(id)
      setEndpoints((prev) => prev.filter((ep) => ep.id !== id))
      setDeleteId(null)
      toast.success("Endpoint deleted")
    } catch (err) {
      console.error("Failed to delete webhook:", err)
      toast.error("Failed to delete endpoint")
    }
  }

  const handleTest = async (id: string) => {
    setTestingId(id)
    try {
      const ep = endpoints.find((e) => e.id === id)
      if (!ep) return
      // Send a real test event to the webhook URL
      const token = await getAuthBearerToken()
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"
      const res = await fetch(`${API_BASE}/settings/webhooks/${id}/test`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        toast.success("Test webhook sent", { description: ep.url })
      } else {
        toast.error("Webhook test failed", { description: "Check the endpoint URL" })
      }
    } catch {
      toast.error("Could not send test webhook")
    } finally {
      setTestingId(null)
    }
  }

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      toast.error("Failed to copy to clipboard")
    }
  }

  const toggleEvent = (event: WebhookEvent) => {
    setSelectedEvents((prev) => {
      const next = new Set(prev)
      next.has(event) ? next.delete(event) : next.add(event)
      return next
    })
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
          <span className="text-foreground font-medium">Webhooks</span>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Webhooks</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Receive real-time event notifications at your HTTP endpoints.
            </p>
          </div>
          <button
            onClick={openAdd}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 sm:py-2 text-[13px] font-medium text-background transition-colors duration-150 hover:bg-foreground/90 cursor-pointer min-h-[44px] sm:min-h-0 w-full sm:w-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            Add endpoint
          </button>
        </div>
      </div>

      <div className="p-3 sm:p-6 space-y-8">
        {/* How it works */}
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent/5">
              <Info className="h-3.5 w-3.5 text-accent" />
            </div>
            <div>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Replyma sends <span className="font-medium text-foreground">POST requests</span> with a JSON payload to your endpoints. Respond with a{" "}
                <code className="rounded bg-secondary/60 px-1 py-0.5 font-mono text-[12px]">2xx</code> status to acknowledge delivery. Failed deliveries are retried up to 3 times with exponential backoff.
              </p>
            </div>
          </div>
        </div>

        {/* Endpoints */}
        <div className="space-y-4">
          <div>
            <h2 className="text-[14px] font-semibold text-foreground">Endpoints</h2>
            <p className="text-[13px] text-muted-foreground">URLs that receive webhook event notifications.</p>
          </div>

          <div className="rounded-xl border border-border/60 bg-card">
            {endpoints.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/60">
                  <Webhook className="h-5 w-5 text-muted-foreground/40" />
                </div>
                <p className="mt-3 text-[14px] font-medium text-foreground">No endpoints</p>
                <p className="mt-1 text-[13px] text-muted-foreground">Add an endpoint to start receiving events.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {endpoints.map((ep) => (
                  <div key={ep.id} className="p-3 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <code className="font-mono text-[13px] font-medium text-foreground break-all">
                            {ep.url}
                          </code>
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 shrink-0">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {ep.events.map((event) => (
                            <span
                              key={event}
                              className="rounded-md border border-border/40 bg-secondary/60 px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
                            >
                              {event}
                            </span>
                          ))}
                        </div>
                        {/* Signing secret */}
                        {ep.secret && (
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[11px] text-muted-foreground/60">Signing secret:</span>
                            <code className="font-mono text-[11px] text-muted-foreground/80">
                              {ep.secret.slice(0, 10)}{"..."}
                            </code>
                            <button
                              onClick={() => handleCopy(ep.secret, `secret-${ep.id}`)}
                              className="rounded p-1.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center"
                            >
                              {copied === `secret-${ep.id}` ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleTest(ep.id)}
                          disabled={testingId === ep.id}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border/60 px-3 py-2 sm:py-1.5 text-[12px] font-medium text-foreground hover:bg-secondary/60 cursor-pointer transition-colors duration-150 disabled:opacity-50 min-h-[44px] sm:min-h-0 flex-1 sm:flex-initial"
                        >
                          <Send className={`h-3 w-3 ${testingId === ep.id ? "animate-pulse" : ""}`} />
                          {testingId === ep.id ? "Sending..." : "Test"}
                        </button>
                        <button
                          onClick={() => openEdit(ep)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border/60 px-3 py-2 sm:py-1.5 text-[12px] font-medium text-foreground hover:bg-secondary/60 cursor-pointer transition-colors duration-150 min-h-[44px] sm:min-h-0 flex-1 sm:flex-initial"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteId(ep.id)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 sm:py-1.5 text-[12px] font-medium text-red-600 transition-colors duration-150 hover:bg-red-50 cursor-pointer min-h-[44px] sm:min-h-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent deliveries */}
        <div className="space-y-4">
          <div>
            <h2 className="text-[14px] font-semibold text-foreground">Recent deliveries</h2>
            <p className="text-[13px] text-muted-foreground">The last 50 webhook delivery attempts.</p>
          </div>

          <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/60">
                <Webhook className="h-5 w-5 text-muted-foreground/40" />
              </div>
              <p className="mt-3 text-[14px] font-medium text-foreground">No delivery logs yet</p>
              <p className="mt-1 text-[13px] text-muted-foreground">Delivery logs will appear here once webhooks start firing. Coming soon.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit endpoint modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) setModalOpen(false) }}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEndpoint ? "Edit endpoint" : "Add endpoint"}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-foreground">Endpoint URL</label>
              <input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://your-site.com/webhooks"
                className="h-11 sm:h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-[13px] placeholder:text-muted-foreground/50 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
              />
              <p className="text-[12px] text-muted-foreground/60">Must be a publicly accessible HTTPS URL.</p>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-medium text-foreground">Events to subscribe</label>
              <div className="flex flex-col gap-2 rounded-lg border border-border/60 bg-background p-3">
                {ALL_EVENTS.map((event) => (
                  <label key={event} className="flex cursor-pointer items-center gap-2.5 group">
                    <input
                      type="checkbox"
                      checked={selectedEvents.has(event)}
                      onChange={() => toggleEvent(event)}
                      className="h-3.5 w-3.5 rounded border-border/60 cursor-pointer accent-foreground"
                    />
                    <span className="font-mono text-[12px] text-foreground group-hover:text-foreground/80 transition-colors">{event}</span>
                  </label>
                ))}
              </div>
              {selectedEvents.size === 0 && (
                <p className="text-[11px] text-red-500">Select at least one event.</p>
              )}
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-border/60 px-4 py-2.5 sm:py-2 text-[13px] font-medium text-foreground hover:bg-secondary/60 cursor-pointer min-h-[44px] sm:min-h-0 w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!urlInput.trim() || selectedEvents.size === 0 || saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 sm:py-2 text-[13px] font-medium text-background transition-colors duration-150 hover:bg-foreground/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0 w-full sm:w-auto"
            >
              {saving ? "Saving..." : editingEndpoint ? "Update endpoint" : "Add endpoint"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation modal */}
      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null) }}>
        <DialogContent className="max-w-[95vw] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete endpoint?</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-muted-foreground">
            This endpoint will stop receiving events immediately. This action cannot be undone.
          </p>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => setDeleteId(null)}
              className="rounded-lg border border-border/60 px-4 py-2.5 sm:py-2 text-[13px] font-medium text-foreground hover:bg-secondary/60 cursor-pointer min-h-[44px] sm:min-h-0 w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteId && handleDelete(deleteId)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 sm:py-2 text-[13px] font-medium text-red-600 transition-colors duration-150 hover:bg-red-50 cursor-pointer min-h-[44px] sm:min-h-0 w-full sm:w-auto"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
