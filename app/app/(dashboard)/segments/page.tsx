"use client"

import { useState, useEffect, useCallback } from "react"
import { Users, Filter, Plus, Eye, Pencil, Trash2, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { cn, cardClass, btnAccent, btnSecondary, inputClass } from "@/lib/utils"
import { segments as segmentsApi } from "@/lib/api"

// ─── Types ──────────────────────────────────────────────────────────────────

interface CriteriaRule {
  property: string
  operator: string
  value: string
}

interface Segment {
  id: string
  name: string
  criteria: string
  customerCount: number
  createdAt: string
  rules: CriteriaRule[]
}

const propertyLabels: Record<string, string> = {
  ltv: "Lifetime value",
  order_count: "Order count",
  open_tickets: "Open tickets",
  account_age_days: "Account age (days)",
  total_spent: "Total spent",
  last_order_days: "Days since last order",
  tags: "Customer tag",
}

const operatorLabels: Record<string, string> = {
  equals: "equals",
  not_equals: "does not equal",
  greater_than: "greater than",
  less_than: "less than",
  contains: "contains",
}

// ─── Page ────────────────────────────────────────────────────────────────────

function mapApiSegment(apiSeg: Record<string, unknown>): Segment {
  const filters = (apiSeg.filters as CriteriaRule[] | undefined) ?? []
  const rules = Array.isArray(filters) ? filters : []
  const criteriaDescription = rules
    .map((r) => `${propertyLabels[r.property] ?? r.property} ${operatorLabels[r.operator] ?? r.operator} ${r.value}`)
    .join(" AND ")
  return {
    id: String(apiSeg.id ?? Date.now()),
    name: String(apiSeg.name ?? "Untitled"),
    criteria: (apiSeg.description as string) || criteriaDescription || "Custom criteria",
    customerCount: (apiSeg.customerCount as number) ?? 0,
    createdAt: apiSeg.createdAt
      ? new Date(apiSeg.createdAt as string).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "Unknown",
    rules,
  }
}

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null)
  const [viewingSegment, setViewingSegment] = useState<Segment | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [formName, setFormName] = useState("")
  const [formRules, setFormRules] = useState<CriteriaRule[]>([
    { property: "ltv", operator: "greater_than", value: "" },
  ])
  const [deleteTarget, setDeleteTarget] = useState<Segment | null>(null)

  const fetchSegments = useCallback(async () => {
    try {
      setLoading(true)
      const result = await segmentsApi.list()
      const data = Array.isArray(result.data) ? result.data : []
      setSegments(data.map((s) => mapApiSegment(s as unknown as Record<string, unknown>)))
    } catch {
      toast.error("Failed to load segments")
      setSegments([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSegments() }, [fetchSegments])

  const openCreate = () => {
    setEditingSegment(null)
    setFormName("")
    setFormRules([{ property: "ltv", operator: "greater_than", value: "" }])
    setDialogOpen(true)
  }

  const openEdit = (segment: Segment) => {
    setEditingSegment(segment)
    setFormName(segment.name)
    setFormRules(segment.rules.length > 0 ? [...segment.rules] : [{ property: "ltv", operator: "greater_than", value: "" }])
    setDialogOpen(true)
  }

  const openView = (segment: Segment) => {
    setViewingSegment(segment)
    setViewDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setSegments(segments.filter((s) => s.id !== deleteTarget.id))
    try {
      await segmentsApi.delete(deleteTarget.id)
      toast.success(`Segment "${deleteTarget.name}" deleted`)
    } catch {
      setSegments((prev) => [...prev, deleteTarget])
      toast.error("Failed to delete segment")
    }
    setDeleteTarget(null)
  }

  const updateRule = (index: number, key: keyof CriteriaRule, val: string) => {
    setFormRules(
      formRules.map((r, i) => (i === index ? { ...r, [key]: val } : r))
    )
  }

  const addRule = () => {
    setFormRules([
      ...formRules,
      { property: "order_count", operator: "equals", value: "" },
    ])
  }

  const removeRule = (index: number) => {
    if (formRules.length <= 1) return
    setFormRules(formRules.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!formName.trim() || formRules.some((r) => !r.value.trim())) return
    const criteriaDescription = formRules
      .map(
        (r) =>
          `${propertyLabels[r.property] ?? r.property} ${operatorLabels[r.operator] ?? r.operator} ${r.value}`
      )
      .join(" AND ")

    if (editingSegment) {
      const updatedSegment: Segment = {
        ...editingSegment,
        name: formName,
        criteria: criteriaDescription,
        rules: formRules,
      }
      setSegments(segments.map((s) => (s.id === editingSegment.id ? updatedSegment : s)))
      try {
        await segmentsApi.update(editingSegment.id, {
          name: formName,
          description: criteriaDescription,
          filters: { rules: formRules } as Record<string, unknown>,
        })
        toast.success(`Segment "${formName}" updated`)
      } catch {
        toast.error("Failed to update segment on server")
      }
    } else {
      try {
        const created = await segmentsApi.create({
          name: formName,
          description: criteriaDescription,
          filters: { rules: formRules } as Record<string, unknown>,
        })
        const mapped = mapApiSegment(created as unknown as Record<string, unknown>)
        setSegments((prev) => [...prev, mapped])
        toast.success(`Segment "${formName}" created`)
      } catch {
        toast.error("Failed to save to server — changes may be lost on refresh")
      }
    }
    setDialogOpen(false)
  }

  const formatCount = (n: number) =>
    n.toLocaleString("en-US")

  if (loading) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded-lg bg-secondary" />
            <div className="h-4 w-64 rounded bg-secondary" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-secondary" />)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-40 rounded-xl bg-secondary" />)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8 flex flex-col sm:flex-row items-start justify-between gap-4"
        >
          <div>
            <h1 className="text-[22px] font-semibold text-foreground tracking-tight">
              Segments
            </h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Group customers by behavior and attributes for targeted support.
            </p>
          </div>
          <button onClick={openCreate} className={cn(btnAccent, "w-full sm:w-auto justify-center min-h-[44px] sm:min-h-0")}>
            <Plus className="h-3.5 w-3.5" />
            Create segment
          </button>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3"
        >
          {[
            {
              label: "Total segments",
              value: segments.length,
              icon: Filter,
            },
            {
              label: "Customers segmented",
              value: formatCount(
                segments.reduce((sum, s) => sum + s.customerCount, 0)
              ),
              icon: Users,
            },
            {
              label: "Largest segment",
              value: formatCount(
                Math.max(...segments.map((s) => s.customerCount), 0)
              ),
              icon: Users,
            },
          ].map((stat, idx) => (
            <div key={stat.label} className={cn(cardClass, "p-4 sm:p-5", idx === 2 && "col-span-2 sm:col-span-1")}>
              <div className="flex items-center justify-between">
                <p className="text-[12px] sm:text-[13px] text-muted-foreground">{stat.label}</p>
                <stat.icon className="h-4 w-4 text-muted-foreground/50" />
              </div>
              <p className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-semibold text-foreground">
                {stat.value}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-3"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
            {segments.length} {segments.length === 1 ? "segment" : "segments"}
          </span>
        </motion.div>

        {/* Segment cards grid */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
          <AnimatePresence initial={false}>
            {segments.map((segment, i) => (
              <motion.div
                key={segment.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className={cn(cardClass, "p-4 sm:p-5 group")}
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                      <Users className="h-4 w-4 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-foreground truncate">
                        {segment.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Created {segment.createdAt}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Criteria tag */}
                <div className="mt-3 min-w-0">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground max-w-full">
                    <Filter className="h-3 w-3 shrink-0" />
                    <span className="truncate">{segment.criteria}</span>
                  </span>
                </div>

                {/* Customer count */}
                <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                      Customers
                    </p>
                    <p className="mt-1 text-xl font-semibold text-foreground">
                      {formatCount(segment.customerCount)}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 w-full sm:w-auto opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150">
                    <button
                      onClick={() => openView(segment)}
                      className={cn(
                        btnSecondary,
                        "flex-1 sm:flex-initial justify-center px-3 py-1.5 text-[12px] min-h-[44px] sm:min-h-0"
                      )}
                    >
                      <Eye className="h-3 w-3" />
                      View
                    </button>
                    <button
                      onClick={() => openEdit(segment)}
                      className={cn(
                        btnSecondary,
                        "flex-1 sm:flex-initial justify-center px-3 py-1.5 text-[12px] min-h-[44px] sm:min-h-0"
                      )}
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(segment)}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-[12px] font-medium text-destructive transition-colors duration-150 hover:bg-destructive/10 cursor-pointer min-h-[44px] sm:min-h-0"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty state */}
        {segments.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              cardClass,
              "p-10 flex flex-col items-center gap-3 text-center"
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-[13px] font-medium text-foreground">
              No segments yet
            </p>
            <p className="text-[12px] text-muted-foreground max-w-xs">
              Create your first customer segment to start grouping and targeting
              customers.
            </p>
            <button onClick={openCreate} className={cn(btnAccent, "mt-1 min-h-[44px] sm:min-h-0")}>
              <Plus className="h-3.5 w-3.5" />
              Create segment
            </button>
          </motion.div>
        )}
      </div>

      {/* Create Segment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg w-[calc(100vw-1rem)] sm:w-full p-0 gap-0 overflow-hidden rounded-xl border border-border/60 max-h-[calc(100vh-2rem)] sm:max-h-[90vh] overflow-y-auto">
          <div className="px-6 py-5 border-b border-border/60">
            <DialogHeader>
              <DialogTitle className="text-[15px] font-semibold text-foreground">
                {editingSegment ? "Edit segment" : "Create segment"}
              </DialogTitle>
              <DialogDescription className="text-[12px] text-muted-foreground mt-0.5">
                {editingSegment ? "Update the criteria for this customer segment." : "Define criteria to automatically group matching customers."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 py-5 flex flex-col gap-5">
            {/* Segment name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                Segment name
              </label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. High-value customers"
                className={cn(inputClass, "h-11 sm:h-9")}
              />
            </div>

            {/* Criteria builder */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                Criteria
              </label>
              <div className={cn(cardClass, "p-3 sm:p-4")}>
                <div className="flex flex-col gap-3">
                  {formRules.map((rule, index) => (
                    <div key={index}>
                      {index > 0 && (
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                          AND
                        </p>
                      )}
                      <div className="flex flex-col gap-2">
                        {/* Property */}
                        <select
                          value={rule.property}
                          onChange={(e) =>
                            updateRule(index, "property", e.target.value)
                          }
                          className={cn(
                            inputClass,
                            "w-full sm:min-w-[140px] cursor-pointer h-11 sm:h-9"
                          )}
                        >
                          <option value="ltv">Lifetime value</option>
                          <option value="order_count">Order count</option>
                          <option value="open_tickets">Open tickets</option>
                          <option value="account_age_days">
                            Account age (days)
                          </option>
                          <option value="total_spent">Total spent</option>
                          <option value="last_order_days">
                            Days since last order
                          </option>
                          <option value="tags">Customer tag</option>
                        </select>

                        {/* Operator */}
                        <select
                          value={rule.operator}
                          onChange={(e) =>
                            updateRule(index, "operator", e.target.value)
                          }
                          className={cn(
                            inputClass,
                            "w-full sm:min-w-[120px] cursor-pointer h-11 sm:h-9"
                          )}
                        >
                          <option value="equals">equals</option>
                          <option value="not_equals">does not equal</option>
                          <option value="greater_than">greater than</option>
                          <option value="less_than">less than</option>
                          <option value="contains">contains</option>
                        </select>

                        <div className="flex items-center gap-2">
                          {/* Value */}
                          <input
                            value={rule.value}
                            onChange={(e) =>
                              updateRule(index, "value", e.target.value)
                            }
                            placeholder="Value"
                            className={cn(inputClass, "w-full sm:w-24 h-11 sm:h-9")}
                          />

                          {/* Remove rule */}
                          {formRules.length > 1 && (
                            <button
                              onClick={() => removeRule(index)}
                              className="flex h-11 w-11 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors duration-150 cursor-pointer"
                              aria-label="Remove rule"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add rule button */}
                <button
                  onClick={addRule}
                  className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-accent hover:text-accent/80 transition-colors duration-150 cursor-pointer min-h-[44px] sm:min-h-0"
                >
                  <Plus className="h-3 w-3" />
                  Add rule
                </button>
              </div>
            </div>
          </div>

          {/* Dialog footer */}
          <div className="px-6 py-4 border-t border-border/60 flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2">
            <button
              onClick={() => setDialogOpen(false)}
              className={cn(btnSecondary, "min-h-[44px] sm:min-h-0 justify-center")}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={
                !formName.trim() || formRules.some((r) => !r.value.trim())
              }
              className={cn(
                btnAccent,
                "disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0 justify-center"
              )}
            >
              {editingSegment ? "Update segment" : "Create segment"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete segment</DialogTitle>
            <DialogDescription className="text-[13px] text-muted-foreground">
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button onClick={() => setDeleteTarget(null)} className="inline-flex items-center justify-center rounded-lg border border-border/60 px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-secondary cursor-pointer min-h-[44px] sm:min-h-0 w-full sm:w-auto">
              Cancel
            </button>
            <button onClick={handleConfirmDelete} className="inline-flex items-center justify-center rounded-lg bg-destructive px-4 py-2 text-[13px] font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 cursor-pointer min-h-[44px] sm:min-h-0 w-full sm:w-auto">
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Segment Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-md w-[calc(100vw-1rem)] sm:w-full p-0 gap-0 overflow-hidden rounded-xl border border-border/60 max-h-[calc(100vh-2rem)] sm:max-h-[90vh] overflow-y-auto">
          <div className="px-6 py-5 border-b border-border/60">
            <DialogHeader>
              <DialogTitle className="text-[15px] font-semibold text-foreground">
                {viewingSegment?.name}
              </DialogTitle>
              <DialogDescription className="text-[12px] text-muted-foreground mt-0.5">
                Segment details and matching criteria.
              </DialogDescription>
            </DialogHeader>
          </div>

          {viewingSegment && (
            <div className="px-6 py-5 flex flex-col gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-1.5">
                  Criteria
                </p>
                <p className="text-[13px] text-foreground">{viewingSegment.criteria}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-1">
                    Customers
                  </p>
                  <p className="text-xl font-semibold text-foreground">
                    {formatCount(viewingSegment.customerCount)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-1">
                    Created
                  </p>
                  <p className="text-[13px] text-foreground">{viewingSegment.createdAt}</p>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2">
                  Rules
                </p>
                <div className="flex flex-col gap-1.5">
                  {viewingSegment.rules.map((rule, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                      <Filter className="h-3 w-3" />
                      {propertyLabels[rule.property] ?? rule.property} {operatorLabels[rule.operator] ?? rule.operator} {rule.value}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="px-6 py-4 border-t border-border/60 flex items-center justify-end">
            <button
              onClick={() => setViewDialogOpen(false)}
              className={cn(btnSecondary, "w-full sm:w-auto justify-center min-h-[44px] sm:min-h-0")}
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
