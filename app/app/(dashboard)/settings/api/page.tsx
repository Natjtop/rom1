"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Key, Copy, Check, Plus, Trash2, AlertTriangle, Eye, EyeOff } from "lucide-react"
import { settingsApi } from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface ApiKeyLocal {
  id: string
  name: string
  prefix: string
  created: string
  lastUsed: string
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyLocal[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [revokeId, setRevokeId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchKeys = useCallback(async () => {
    try {
      setLoading(true)
      const result = await settingsApi.getApiKeys()
      const data = result.data || []
      setKeys(data.map((k: Record<string, unknown>) => ({
        id: k.id as string,
        name: k.name as string,
        prefix: (k.prefix as string) || "sk_****",
        created: k.createdAt ? new Date(k.createdAt as string).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
        lastUsed: k.lastUsedAt ? new Date(k.lastUsedAt as string).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Never",
      })))
    } catch (err) {
      toast.error("Failed to load API keys")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchKeys() }, [fetchKeys])

  const handleCreate = async () => {
    if (!newKeyName.trim()) return
    try {
      setSaving(true)
      const result = await settingsApi.createApiKey({ name: newKeyName.trim() })
      setCreatedKey(result.key)
      setKeys(prev => [...prev, {
        id: result.id,
        name: result.name,
        prefix: result.prefix || result.key.slice(0, 12) + "...",
        created: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        lastUsed: "Never",
      }])
      toast.success("API key created successfully")
    } catch (err) {
      console.error("Failed to create API key:", err)
      toast.error("Failed to create API key")
    } finally {
      setSaving(false)
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

  const handleCloseCreate = () => {
    setCreateOpen(false)
    setNewKeyName("")
    setCreatedKey(null)
    setCopied(null)
  }

  const handleRevoke = async (id: string) => {
    const key = keys.find((k) => k.id === id)
    try {
      await settingsApi.revokeApiKey(id)
      setKeys((prev) => prev.filter((k) => k.id !== id))
      setRevokeId(null)
      toast.success(`API key "${key?.name || "Unknown"}" revoked`)
    } catch (err) {
      console.error("Failed to revoke API key:", err)
      toast.error("Failed to revoke API key")
    }
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://api.replyma.com/api/v1"
  const webhookUrl = `${apiBase}/webhooks/incoming`

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
          <span className="text-foreground font-medium">API Keys</span>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">API Keys</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Manage API keys for programmatic access to the Replyma API.
            </p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 sm:py-2 text-[13px] font-medium text-background transition-colors duration-150 hover:bg-foreground/90 cursor-pointer min-h-[44px] sm:min-h-0 w-full sm:w-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            Create key
          </button>
        </div>
      </div>

      <div className="p-3 sm:p-6 space-y-8">
        {/* Security notice */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="text-[13px] font-medium text-amber-800">Keep your API keys secret</p>
              <p className="mt-0.5 text-[12px] text-amber-700/80">
                Never expose keys in client-side code or version control. Use environment variables in production.
              </p>
            </div>
          </div>
        </div>

        {/* Active keys */}
        <div className="space-y-4">
          <div>
            <h2 className="text-[14px] font-semibold text-foreground">Active keys</h2>
            <p className="text-[13px] text-muted-foreground">Keys currently authorized to access the API.</p>
          </div>

          <div className="rounded-xl border border-border/60 bg-card">
            {keys.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/60">
                  <Key className="h-5 w-5 text-muted-foreground/40" />
                </div>
                <p className="mt-3 text-[14px] font-medium text-foreground">No API keys</p>
                <p className="mt-1 text-[13px] text-muted-foreground">Create your first key to start using the API.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {keys.map((key) => (
                  <div key={key.id} className="flex flex-col gap-3 px-3 sm:px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/60">
                        <Key className="h-4 w-4 text-muted-foreground/60" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13px] font-medium text-foreground">{key.name}</span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1">
                          <code className="font-mono text-[12px] text-muted-foreground truncate max-w-[140px] sm:max-w-none break-all">
                            {key.prefix}
                          </code>
                        </div>
                        {/* Mobile-only date info */}
                        <div className="mt-1 sm:hidden">
                          <p className="text-[11px] text-muted-foreground">Created: {key.created}</p>
                          <p className={`text-[11px] ${key.lastUsed === "Never" ? "text-muted-foreground/40" : "text-muted-foreground"}`}>
                            Last used: {key.lastUsed}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-[12px] text-muted-foreground">{key.created}</p>
                        <p className={`text-[11px] ${key.lastUsed === "Never" ? "text-muted-foreground/40" : "text-muted-foreground"}`}>
                          Last used: {key.lastUsed}
                        </p>
                      </div>
                      <button
                        onClick={() => setRevokeId(key.id)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-[12px] font-medium text-red-600 transition-colors duration-150 hover:bg-red-50 cursor-pointer min-h-[44px] sm:min-h-0 sm:py-1.5 w-full sm:w-auto"
                      >
                        <Trash2 className="h-3 w-3" />
                        Revoke
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Webhook URL */}
        <div className="space-y-4">
          <div>
            <h2 className="text-[14px] font-semibold text-foreground">Webhook URL</h2>
            <p className="text-[13px] text-muted-foreground">Use this URL to send inbound events to Replyma.</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card">
            <div className="flex flex-col gap-3 px-3 sm:px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <code className="font-mono text-[13px] text-foreground/80 break-all">{webhookUrl}</code>
              <button
                onClick={() => handleCopy(webhookUrl, "webhook")}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border/60 px-3 py-2 sm:py-1.5 text-[12px] font-medium text-foreground hover:bg-secondary/60 cursor-pointer transition-colors duration-150 shrink-0 min-h-[44px] sm:min-h-0 w-full sm:w-auto"
              >
                {copied === "webhook" ? (
                  <><Check className="h-3 w-3 text-emerald-600" /> Copied</>
                ) : (
                  <><Copy className="h-3 w-3" /> Copy</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* API documentation link */}
        <div className="space-y-4">
          <div>
            <h2 className="text-[14px] font-semibold text-foreground">Documentation</h2>
            <p className="text-[13px] text-muted-foreground">Learn how to authenticate and use the Replyma API.</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card">
            <div className="flex flex-col gap-3 px-3 sm:px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/60">
                  <Key className="h-4 w-4 text-muted-foreground/60" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-foreground">API Reference</p>
                  <p className="text-[12px] text-muted-foreground">Authentication, endpoints, and rate limits</p>
                </div>
              </div>
              <a
                href="https://replyma.com/api-docs"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center text-[13px] font-medium text-accent hover:text-accent/80 transition-colors min-h-[44px] sm:min-h-0"
              >
                View docs
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Create key modal */}
      <Dialog open={createOpen} onOpenChange={(open) => { if (!open) handleCloseCreate() }}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{createdKey ? "Copy your API key" : "Create new API key"}</DialogTitle>
          </DialogHeader>

          {createdKey ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p className="text-[13px] text-amber-800">
                  Copy your key now -- it <span className="font-semibold">won&apos;t be shown again</span> after you close this dialog.
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-secondary/40 p-3">
                <code className="block break-all font-mono text-[12px] text-foreground leading-relaxed select-all">{createdKey}</code>
              </div>
              <button
                onClick={() => handleCopy(createdKey, "new-key")}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-border/60 px-4 py-2.5 text-[13px] font-medium text-foreground hover:bg-secondary transition-colors duration-150 cursor-pointer min-h-[44px]"
              >
                {copied === "new-key" ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span className="text-emerald-600">Copied to clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy to clipboard
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-foreground">Key name</label>
                <input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. Production, CI/CD, Mobile app"
                  className="h-11 sm:h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-[13px] placeholder:text-muted-foreground/50 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
                />
                <p className="text-[12px] text-muted-foreground/60">A descriptive label to help you identify this key.</p>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            {createdKey ? (
              <button
                onClick={handleCloseCreate}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 sm:py-2 text-[13px] font-medium text-background transition-colors duration-150 hover:bg-foreground/90 cursor-pointer min-h-[44px] sm:min-h-0 w-full sm:w-auto"
              >
                Done
              </button>
            ) : (
              <>
                <button
                  onClick={handleCloseCreate}
                  className="rounded-lg border border-border/60 px-4 py-2.5 sm:py-2 text-[13px] font-medium text-foreground hover:bg-secondary/60 cursor-pointer min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newKeyName.trim() || saving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 sm:py-2 text-[13px] font-medium text-background transition-colors duration-150 hover:bg-foreground/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0 w-full sm:w-auto"
                >
                  <Key className="h-3.5 w-3.5" />
                  {saving ? "Creating..." : "Create key"}
                </button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke confirmation modal */}
      <Dialog open={!!revokeId} onOpenChange={(open) => { if (!open) setRevokeId(null) }}>
        <DialogContent className="max-w-[95vw] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Revoke API key?</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-muted-foreground">
            This action cannot be undone. Any integrations using this key will stop working immediately.
          </p>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => setRevokeId(null)}
              className="rounded-lg border border-border/60 px-4 py-2.5 sm:py-2 text-[13px] font-medium text-foreground hover:bg-secondary/60 cursor-pointer min-h-[44px] sm:min-h-0 w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              onClick={() => revokeId && handleRevoke(revokeId)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 sm:py-2 text-[13px] font-medium text-red-600 transition-colors duration-150 hover:bg-red-50 cursor-pointer min-h-[44px] sm:min-h-0 w-full sm:w-auto"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Revoke key
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
