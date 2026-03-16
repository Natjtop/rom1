"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Plus, Trash2, Clock, Shield } from "lucide-react"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { sla } from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface SlaPolicyLocal {
  id: string
  name: string
  priority: string
  firstResponseMins: number
  resolutionMins: number
  isEnabled: boolean
  businessHoursOnly: boolean
}

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low", color: "border-slate-200 bg-slate-50 text-slate-700" },
  { value: "MEDIUM", label: "Medium", color: "border-foreground/10 bg-foreground/5 text-foreground/80" },
  { value: "HIGH", label: "High", color: "border-amber-200 bg-amber-50 text-amber-700" },
  { value: "URGENT", label: "Urgent", color: "border-red-200 bg-red-50 text-red-700" },
]

function formatMins(mins: number): string {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function getPriorityColor(priority: string): string {
  const option = PRIORITY_OPTIONS.find(o => o.value === priority)
  return option?.color || "border-border/60 bg-secondary text-muted-foreground"
}

export default function SlaSettingsPage() {
  const [policies, setPolicies] = useState<SlaPolicyLocal[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formName, setFormName] = useState("")
  const [formPriority, setFormPriority] = useState("HIGH")
  const [formFirstResponse, setFormFirstResponse] = useState(60)
  const [formResolution, setFormResolution] = useState(480)
  const [formBusinessHours, setFormBusinessHours] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true)
      const result = await sla.list()
      const mapped = (Array.isArray(result) ? result : []).map((p) => ({
        id: p.id,
        name: p.name,
        priority: p.priority as string,
        firstResponseMins: p.firstResponseMins,
        resolutionMins: p.resolutionMins,
        isEnabled: p.isEnabled,
        businessHoursOnly: p.businessHoursOnly ?? false,
      }))
      setPolicies(mapped)
    } catch (err) {
      toast.error("Failed to load SLA policies")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPolicies() }, [fetchPolicies])

  async function handleCreate() {
    if (!formName.trim()) return
    try {
      setSaving(true)
      const created = await sla.create({
        name: formName,
        priority: formPriority,
        firstResponseMins: formFirstResponse,
        resolutionMins: formResolution,
        businessHoursOnly: formBusinessHours,
      })
      setPolicies(prev => [...prev, {
        id: created.id,
        name: created.name,
        priority: created.priority,
        firstResponseMins: created.firstResponseMins,
        resolutionMins: created.resolutionMins,
        isEnabled: created.isEnabled ?? true,
        businessHoursOnly: created.businessHoursOnly ?? formBusinessHours,
      }])
      setDialogOpen(false)
      resetForm()
      toast.success("SLA policy created")
    } catch (err) {
      console.error("Failed to create SLA policy:", err)
      toast.error("Failed to create SLA policy")
    } finally {
      setSaving(false)
    }
  }

  function resetForm() {
    setFormName("")
    setFormPriority("HIGH")
    setFormFirstResponse(60)
    setFormResolution(480)
    setFormBusinessHours(true)
  }

  async function handleToggle(id: string, isEnabled: boolean) {
    const policy = policies.find(p => p.id === id)
    setPolicies(prev => prev.map(p => p.id === id ? { ...p, isEnabled: !isEnabled } : p))
    try {
      await sla.update(id, { isEnabled: !isEnabled })
      toast.success(`${policy?.name || "Policy"} ${!isEnabled ? "enabled" : "disabled"}`)
    } catch (err) {
      console.error("Failed to toggle SLA policy:", err)
      setPolicies(prev => prev.map(p => p.id === id ? { ...p, isEnabled } : p))
      toast.error("Failed to update SLA policy")
    }
  }

  async function handleDelete(id: string) {
    try {
      await sla.delete(id)
      setPolicies(policies.filter(p => p.id !== id))
      setDeleteConfirm(null)
      toast.success("SLA policy deleted")
    } catch (err) {
      console.error("Failed to delete SLA policy:", err)
      toast.error("Failed to delete SLA policy")
    }
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
          <span className="text-foreground font-medium">SLA Policies</span>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">SLA Policies</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Set response and resolution time targets by priority level.
            </p>
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 sm:py-2 text-[13px] font-medium text-background transition-colors duration-150 hover:bg-foreground/90 cursor-pointer min-h-[44px] sm:min-h-0 w-full sm:w-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            New policy
          </button>
        </div>
      </div>

      <div className="p-3 sm:p-6 space-y-8">
        {/* How SLAs work */}
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent/5">
              <Shield className="h-3.5 w-3.5 text-accent" />
            </div>
            <div>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                SLA policies define <span className="font-medium text-foreground">first response</span> and <span className="font-medium text-foreground">resolution</span> time targets. When a ticket is close to breaching its SLA, agents are automatically notified. Policies can optionally pause outside business hours.
              </p>
            </div>
          </div>
        </div>

        {/* Policies */}
        <div className="space-y-4">
          <div>
            <h2 className="text-[14px] font-semibold text-foreground">Active policies</h2>
            <p className="text-[13px] text-muted-foreground">Policies are matched to tickets based on priority level.</p>
          </div>

          {policies.length === 0 ? (
            <div className="rounded-xl border border-border/60 bg-card">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/60">
                  <Clock className="h-5 w-5 text-muted-foreground/40" />
                </div>
                <p className="mt-3 text-[14px] font-medium text-foreground">No SLA policies</p>
                <p className="mt-1 text-[13px] text-muted-foreground">Create your first policy to track response and resolution times.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Mobile: card layout */}
              <div className="sm:hidden space-y-3">
                {policies.map((policy) => (
                  <div key={policy.id} className="rounded-xl border border-border/60 bg-card p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[13px] font-medium text-foreground">{policy.name}</p>
                          <span className={cn(
                            "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium",
                            getPriorityColor(policy.priority)
                          )}>
                            {policy.priority}
                          </span>
                        </div>
                        {policy.businessHoursOnly && (
                          <p className="text-[11px] text-muted-foreground/60 mt-0.5">Business hours only</p>
                        )}
                      </div>
                      <Switch checked={policy.isEnabled} onCheckedChange={() => handleToggle(policy.id, policy.isEnabled)} />
                    </div>
                    <div className="mt-3 flex items-center gap-4">
                      <div>
                        <p className="text-[11px] text-muted-foreground/60 uppercase tracking-wider font-semibold">1st response</p>
                        <p className="text-[13px] font-medium text-foreground">{formatMins(policy.firstResponseMins)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground/60 uppercase tracking-wider font-semibold">Resolution</p>
                        <p className="text-[13px] font-medium text-foreground">{formatMins(policy.resolutionMins)}</p>
                      </div>
                      <div className="ml-auto">
                        <button
                          onClick={() => setDeleteConfirm(policy.id)}
                          className="rounded-md p-2 text-muted-foreground/50 hover:bg-red-50 hover:text-red-600 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: table layout */}
              <div className="hidden sm:block rounded-xl border border-border/60 bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  {/* Table header */}
                  <div className="grid grid-cols-[1fr_100px_100px_100px_80px_40px] items-center gap-4 border-b border-border/40 bg-secondary/20 px-5 py-2.5 min-w-[560px]">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">Policy</span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">Priority</span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 text-center">1st response</span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 text-center">Resolution</span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 text-center">Status</span>
                    <span />
                  </div>

                  <div className="divide-y divide-border/40">
                    {policies.map((policy) => (
                      <div key={policy.id} className="grid grid-cols-[1fr_100px_100px_100px_80px_40px] items-center gap-4 px-5 py-4 hover:bg-secondary/10 transition-colors min-w-[560px]">
                        <div>
                          <p className="text-[13px] font-medium text-foreground">{policy.name}</p>
                          {policy.businessHoursOnly && (
                            <p className="text-[11px] text-muted-foreground/60">Business hours only</p>
                          )}
                        </div>
                        <div>
                          <span className={cn(
                            "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium",
                            getPriorityColor(policy.priority)
                          )}>
                            {policy.priority}
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="text-[13px] font-medium text-foreground">{formatMins(policy.firstResponseMins)}</span>
                        </div>
                        <div className="text-center">
                          <span className="text-[13px] font-medium text-foreground">{formatMins(policy.resolutionMins)}</span>
                        </div>
                        <div className="flex justify-center">
                          <Switch checked={policy.isEnabled} onCheckedChange={() => handleToggle(policy.id, policy.isEnabled)} />
                        </div>
                        <div className="flex justify-end">
                          <button
                            onClick={() => setDeleteConfirm(policy.id)}
                            className="rounded-md p-2 text-muted-foreground/50 hover:bg-red-50 hover:text-red-600 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* SLA metrics overview */}
        <div className="space-y-4">
          <div>
            <h2 className="text-[14px] font-semibold text-foreground">Compliance overview</h2>
            <p className="text-[13px] text-muted-foreground">How your team is performing against SLA targets this month.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border/60 bg-card p-3 sm:p-5 text-center">
              <p className="text-[24px] font-semibold text-muted-foreground/40 tracking-tight">--</p>
              <p className="mt-1 text-[12px] text-muted-foreground">First response compliance</p>
              <p className="text-[11px] text-muted-foreground/50">No data yet</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-3 sm:p-5 text-center">
              <p className="text-[24px] font-semibold text-muted-foreground/40 tracking-tight">--</p>
              <p className="mt-1 text-[12px] text-muted-foreground">Resolution compliance</p>
              <p className="text-[11px] text-muted-foreground/50">No data yet</p>
            </div>
            <div className="col-span-2 sm:col-span-1 rounded-xl border border-border/60 bg-card p-3 sm:p-5 text-center">
              <p className="text-[24px] font-semibold text-muted-foreground/40 tracking-tight">--</p>
              <p className="mt-1 text-[12px] text-muted-foreground">Breaches this month</p>
              <p className="text-[11px] text-muted-foreground/50">No data yet</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create policy dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New SLA policy</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-foreground">Policy name</label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Urgent SLA"
                className="h-11 sm:h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-accent/30 text-foreground placeholder:text-muted-foreground/50 transition-colors"
              />
              <p className="text-[12px] text-muted-foreground/60">A descriptive name for this SLA policy.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-foreground">Priority level</label>
              <select
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value)}
                className="h-11 sm:h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-accent/30 text-foreground cursor-pointer transition-colors"
              >
                {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <p className="text-[12px] text-muted-foreground/60">This policy applies to tickets at this priority.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-foreground">First response</label>
                <div className="relative">
                  <input
                    type="number"
                    value={formFirstResponse}
                    onChange={(e) => setFormFirstResponse(Number(e.target.value))}
                    className="h-11 sm:h-9 w-full rounded-lg border border-border/60 bg-background px-3 pr-12 text-[13px] focus:outline-none focus:ring-1 focus:ring-accent/30 text-foreground transition-colors"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground/50">min</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-foreground">Resolution target</label>
                <div className="relative">
                  <input
                    type="number"
                    value={formResolution}
                    onChange={(e) => setFormResolution(Number(e.target.value))}
                    className="h-11 sm:h-9 w-full rounded-lg border border-border/60 bg-background px-3 pr-12 text-[13px] focus:outline-none focus:ring-1 focus:ring-accent/30 text-foreground transition-colors"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground/50">min</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-4 py-3">
              <div>
                <p className="text-[13px] font-medium text-foreground">Business hours only</p>
                <p className="text-[12px] text-muted-foreground">Pause SLA timer outside business hours</p>
              </div>
              <Switch checked={formBusinessHours} onCheckedChange={setFormBusinessHours} />
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              onClick={() => { setDialogOpen(false); resetForm() }}
              className="rounded-lg border border-border/60 px-4 py-2.5 sm:py-2 text-[13px] font-medium text-foreground hover:bg-secondary/60 transition-colors cursor-pointer min-h-[44px] sm:min-h-0 w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!formName.trim() || saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 sm:py-2 text-[13px] font-medium text-background transition-colors duration-150 hover:bg-foreground/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0 w-full sm:w-auto"
            >
              {saving ? "Creating..." : "Create policy"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null) }}>
        <DialogContent className="max-w-[95vw] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete SLA policy?</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-muted-foreground">
            This policy will be removed and will no longer apply to matching tickets. Existing SLA breaches will not be affected.
          </p>
          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="rounded-lg border border-border/60 px-4 py-2.5 sm:py-2 text-[13px] font-medium text-foreground hover:bg-secondary/60 cursor-pointer min-h-[44px] sm:min-h-0 w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 sm:py-2 text-[13px] font-medium text-red-600 transition-colors duration-150 hover:bg-red-50 cursor-pointer min-h-[44px] sm:min-h-0 w-full sm:w-auto"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete policy
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
