"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Plus, Workflow, Trash2, Pencil, Play, Pause,
  Zap, MessageSquare, Tag, UserCircle, ArrowRight,
  AlertTriangle, Webhook, X, Copy, Search,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { cn, btnAccent, inputClass } from "@/lib/utils"
import type { Flow } from "@/lib/types"
import { flows as flowsApi } from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

// ─── Types ──────────────────────────────────────────

interface FlowNode {
  id: string
  type: "trigger" | "condition" | "action"
  label: string
  config: Record<string, unknown>
}

interface FlowEdge {
  from: string
  to: string
}

const TRIGGER_TYPES = [
  { value: "ticket_created", label: "New ticket created", icon: Zap },
  { value: "tag_added", label: "Tag added", icon: Tag },
  { value: "status_changed", label: "Status changed", icon: Workflow },
  { value: "message_received", label: "Message received", icon: MessageSquare },
]

const ACTION_TYPES = [
  { value: "send_message", label: "Send message", icon: MessageSquare },
  { value: "assign_agent", label: "Assign agent", icon: UserCircle },
  { value: "add_tag", label: "Add tag", icon: Tag },
  { value: "escalate", label: "Escalate", icon: AlertTriangle },
  { value: "webhook", label: "Send webhook", icon: Webhook },
]

const CONDITION_TYPES = [
  { value: "check_ltv", label: "Check customer LTV" },
  { value: "check_sentiment", label: "Check sentiment" },
  { value: "check_channel", label: "Check channel" },
  { value: "check_priority", label: "Check priority" },
  { value: "check_tag", label: "Has tag" },
]

// ─── Flow Builder Component ─────────────────────────

function FlowBuilderDialog({
  open,
  onOpenChange,
  editFlow,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editFlow: Flow | null
  onSave: (flow: { name: string; trigger: string; nodes: FlowNode[]; edges: FlowEdge[] }) => void
}) {
  const [name, setName] = useState("")
  const [trigger, setTrigger] = useState("ticket_created")
  const [nodes, setNodes] = useState<FlowNode[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editFlow) {
      setName(editFlow.name)
      setTrigger(editFlow.trigger)
      setNodes((editFlow.nodes as FlowNode[]) || [])
    } else {
      setName("")
      setTrigger("ticket_created")
      setNodes([
        { id: "n1", type: "trigger", label: "New ticket", config: { trigger: "ticket_created" } },
      ])
    }
  }, [editFlow, open])

  function addCondition() {
    const id = `n${Date.now()}`
    setNodes((prev) => [
      ...prev,
      { id, type: "condition", label: "Check customer LTV", config: { condition: "check_ltv" } },
    ])
  }

  function addAction() {
    const id = `n${Date.now()}`
    setNodes((prev) => [
      ...prev,
      { id, type: "action", label: "Send message", config: { action: "send_message" } },
    ])
  }

  function removeNode(id: string) {
    setNodes((prev) => prev.filter((n) => n.id !== id))
  }

  function updateNodeAction(id: string, actionType: string) {
    const actionDef = ACTION_TYPES.find((a) => a.value === actionType)
    setNodes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, label: actionDef?.label ?? actionType, config: { action: actionType } } : n
      )
    )
  }

  function updateNodeCondition(id: string, conditionType: string) {
    const condDef = CONDITION_TYPES.find((c) => c.value === conditionType)
    setNodes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, label: condDef?.label ?? conditionType, config: { condition: conditionType } } : n
      )
    )
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    const edges: FlowEdge[] = nodes.slice(0, -1).map((n, i) => ({
      from: n.id,
      to: nodes[i + 1]!.id,
    }))
    onSave({ name: name.trim(), trigger, nodes, edges })
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-[16px] sm:text-[18px]">{editFlow ? "Edit flow" : "Create flow"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 sm:gap-4 py-2 overflow-y-auto flex-1 min-h-0 -mx-1 px-1">
          {/* Flow name input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-foreground">Flow name</label>
            <input
              type="text"
              placeholder="e.g. Auto-tag VIP customers"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={cn(inputClass, "min-h-[44px] sm:min-h-0")}
              autoFocus
            />
          </div>

          {/* Trigger select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-foreground">Trigger</label>
            <select
              value={trigger}
              onChange={(e) => {
                setTrigger(e.target.value)
                const trigDef = TRIGGER_TYPES.find((t) => t.value === e.target.value)
                setNodes((prev) => {
                  const updated = [...prev]
                  if (updated[0]) {
                    updated[0] = { ...updated[0], label: trigDef?.label ?? e.target.value, config: { trigger: e.target.value } }
                  }
                  return updated
                })
              }}
              className={cn(inputClass, "cursor-pointer min-h-[44px] sm:min-h-0")}
            >
              {TRIGGER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Visual flow steps */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-foreground">Steps</label>
            <div className="rounded-lg border border-border/60 bg-secondary/20 p-2.5 sm:p-4 max-h-[40vh] overflow-y-auto">
              {nodes.map((node, i) => (
                <div key={node.id}>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      node.type === "trigger" ? "bg-accent/10 text-accent" :
                      node.type === "condition" ? "bg-amber-500/10 text-amber-600" :
                      "bg-emerald-500/10 text-emerald-600"
                    )}>
                      {node.type === "trigger" ? <Zap className="h-3.5 w-3.5" /> :
                       node.type === "condition" ? <Workflow className="h-3.5 w-3.5" /> :
                       <ArrowRight className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      {node.type === "action" ? (
                        <select
                          value={(node.config.action as string) ?? "send_message"}
                          onChange={(e) => updateNodeAction(node.id, e.target.value)}
                          className="w-full rounded-lg border border-border/60 bg-background px-2 text-[12px] text-foreground cursor-pointer min-h-[44px] sm:min-h-[32px] sm:h-8"
                        >
                          {ACTION_TYPES.map((a) => (
                            <option key={a.value} value={a.value}>{a.label}</option>
                          ))}
                        </select>
                      ) : node.type === "condition" ? (
                        <select
                          value={(node.config.condition as string) ?? "check_ltv"}
                          onChange={(e) => updateNodeCondition(node.id, e.target.value)}
                          className="w-full rounded-lg border border-border/60 bg-background px-2 text-[12px] text-foreground cursor-pointer min-h-[44px] sm:min-h-[32px] sm:h-8"
                        >
                          {CONDITION_TYPES.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-[13px] font-medium text-foreground truncate block">{node.label}</span>
                      )}
                    </div>
                    {node.type !== "trigger" && (
                      <button
                        onClick={() => removeNode(node.id)}
                        className="shrink-0 rounded-md min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px] flex items-center justify-center text-muted-foreground/40 hover:bg-secondary hover:text-red-500 transition-colors"
                      >
                        <X className="h-4 w-4 sm:h-3 sm:w-3" />
                      </button>
                    )}
                  </div>
                  {i < nodes.length - 1 && (
                    <div className="ml-4 flex h-5 sm:h-6 items-center">
                      <div className="h-full w-px bg-border/60" />
                    </div>
                  )}
                </div>
              ))}

              {/* Add step buttons */}
              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={addCondition}
                  className="flex min-h-[44px] sm:min-h-[36px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-dashed border-amber-500/30 text-[12px] font-medium text-muted-foreground transition-colors hover:border-amber-500/60 hover:text-amber-600 cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  Add condition
                </button>
                <button
                  onClick={addAction}
                  className="flex min-h-[44px] sm:min-h-[36px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-dashed border-emerald-500/30 text-[12px] font-medium text-muted-foreground transition-colors hover:border-emerald-500/60 hover:text-emerald-600 cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  Add action
                </button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 flex-col sm:flex-row gap-2 sm:gap-2 pt-2">
          <button
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/60 px-4 py-2 min-h-[44px] sm:min-h-[36px] text-[13px] font-medium text-foreground transition-colors hover:bg-secondary/60 cursor-pointer w-full sm:w-auto order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className={cn(btnAccent, "disabled:opacity-50 w-full sm:w-auto justify-center min-h-[44px] sm:min-h-[36px] order-1 sm:order-2")}
          >
            {saving ? "Saving..." : editFlow ? "Update" : "Create"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Page ──────────────────────────────────────────

export default function FlowsPage() {
  const [flowList, setFlowList] = useState<Flow[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editFlow, setEditFlow] = useState<Flow | null>(null)
  const [search, setSearch] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<Flow | null>(null)

  const fetchFlows = useCallback(async () => {
    try {
      setLoading(true)
      const result = await flowsApi.list()
      const data = Array.isArray(result) ? result : []
      setFlowList(data)
    } catch {
      toast.error("Failed to load flows")
      setFlowList([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchFlows() }, [fetchFlows])

  const filteredFlows = flowList.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  function openCreate() {
    setEditFlow(null)
    setDialogOpen(true)
  }

  function openEdit(flow: Flow) {
    setEditFlow(flow)
    setDialogOpen(true)
  }

  async function handleToggle(flow: Flow) {
    const newEnabled = !flow.isEnabled
    setFlowList((prev) =>
      prev.map((f) => (f.id === flow.id ? { ...f, isEnabled: newEnabled } : f))
    )
    try {
      await flowsApi.update(flow.id, { isEnabled: newEnabled })
      toast.success(newEnabled ? "Flow enabled" : "Flow paused", { description: flow.name })
    } catch {
      setFlowList((prev) =>
        prev.map((f) => (f.id === flow.id ? { ...f, isEnabled: flow.isEnabled } : f))
      )
      toast.error("Failed to toggle flow")
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setFlowList((prev) => prev.filter((f) => f.id !== deleteTarget.id))
    try {
      await flowsApi.delete(deleteTarget.id)
      toast.success("Flow deleted", { description: deleteTarget.name })
    } catch {
      setFlowList((prev) => [...prev, deleteTarget])
      toast.error("Failed to delete flow")
    }
    setDeleteTarget(null)
  }

  async function handleDuplicate(flow: Flow) {
    const tempId = `f-${Date.now()}`
    const newFlow: Flow = {
      ...flow,
      id: tempId,
      name: `${flow.name} (copy)`,
      isEnabled: false,
      stats: { runs: 0, lastRun: null },
      createdAt: new Date().toISOString(),
    }
    setFlowList((prev) => [...prev, newFlow])
    try {
      const created = await flowsApi.create({
        name: newFlow.name,
        trigger: newFlow.trigger,
        nodes: newFlow.nodes,
        edges: newFlow.edges,
      })
      setFlowList((prev) => prev.map((f) => (f.id === tempId ? { ...newFlow, id: created.id } : f)))
      toast.success("Flow duplicated", { description: newFlow.name })
    } catch {
      toast.error("Failed to duplicate flow on server")
    }
  }

  async function handleSave(data: { name: string; trigger: string; nodes: FlowNode[]; edges: FlowEdge[] }) {
    if (editFlow) {
      try {
        await flowsApi.update(editFlow.id, {
          name: data.name,
          trigger: data.trigger,
          nodes: data.nodes as unknown,
          edges: data.edges as unknown,
        })
        setFlowList((prev) =>
          prev.map((f) =>
            f.id === editFlow.id
              ? { ...f, name: data.name, trigger: data.trigger, nodes: data.nodes as unknown, edges: data.edges as unknown }
              : f
          )
        )
        toast.success("Flow updated", { description: data.name })
      } catch {
        toast.error("Failed to update flow")
      }
    } else {
      const tempId = `f-${Date.now()}`
      const newFlow = {
        id: tempId,
        workspaceId: tempId,
        name: data.name,
        trigger: data.trigger,
        nodes: data.nodes as unknown,
        edges: data.edges as unknown,
        isEnabled: false,
        stats: { runs: 0, lastRun: null },
        createdAt: new Date().toISOString(),
      }
      setFlowList((prev) => [...prev, newFlow])
      try {
        const created = await flowsApi.create({
          name: data.name,
          trigger: data.trigger,
          nodes: data.nodes,
          edges: data.edges,
        })
        setFlowList((prev) => prev.map((f) => (f.id === tempId ? { ...newFlow, id: created.id } : f)))
        toast.success("Flow created", { description: data.name })
      } catch {
        toast.error("Failed to save to server — changes may be lost on refresh")
      }
    }
    setDialogOpen(false)
  }

  const triggerDef = (trigger: string) => TRIGGER_TYPES.find((t) => t.value === trigger)

  if (loading) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="mx-auto max-w-4xl px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded-lg bg-secondary" />
            <div className="h-4 w-64 rounded bg-secondary" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-secondary" />)}
            </div>
            <div className="space-y-3 mt-6">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 rounded-xl bg-secondary" />)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Header: stacks vertically on mobile, row on sm+ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-5 sm:mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
        >
          <div className="min-w-0">
            <h1 className="text-[20px] sm:text-[22px] font-semibold text-foreground tracking-tight">Flows</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Visual automation builder — define triggers and actions.
            </p>
          </div>
          <button onClick={openCreate} className={cn(btnAccent, "w-full sm:w-auto justify-center min-h-[44px] sm:min-h-0 shrink-0")}>
            <Plus className="h-3.5 w-3.5" />
            Create flow
          </button>
        </motion.div>

        {/* Stats: 2-col on mobile, 3-col on sm+ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="mb-5 sm:mb-6 grid grid-cols-2 gap-2.5 sm:gap-4 sm:grid-cols-3"
        >
          {[
            { label: "Total flows", value: flowList.length, icon: Workflow },
            { label: "Active", value: flowList.filter((f) => f.isEnabled).length, icon: Play },
            {
              label: "Total runs",
              value: flowList.reduce((sum, f) => sum + ((f.stats as Record<string, number> | null)?.runs ?? 0), 0),
              icon: Zap,
            },
          ].map((stat, idx) => (
            <div
              key={stat.label}
              className={cn(
                "rounded-xl border border-border/60 bg-card p-3 sm:p-5",
                /* Last stat spans full width on 2-col mobile when odd count */
                idx === 2 && "col-span-2 sm:col-span-1"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[12px] sm:text-[13px] text-muted-foreground truncate">{stat.label}</p>
                <stat.icon className="h-4 w-4 shrink-0 text-muted-foreground/50" />
              </div>
              <p className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-semibold text-foreground">{stat.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Search: full-width, taller on mobile for touch */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-4 sm:mb-5"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
            <input
              placeholder="Search flows..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border/60 bg-background pl-9 pr-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/40 transition-colors h-11 sm:h-9 text-foreground placeholder:text-muted-foreground/50"
            />
          </div>
        </motion.div>

        {/* Flow list */}
        <div className="flex flex-col gap-2.5 sm:gap-3">
          <AnimatePresence initial={false}>
          {filteredFlows.map((flow, i) => {
            const td = triggerDef(flow.trigger)
            const TriggerIcon = td?.icon ?? Zap
            const stats = flow.stats as Record<string, unknown> | null
            const nodeCount = Array.isArray(flow.nodes) ? (flow.nodes as unknown[]).length : 0

            return (
              <motion.div
                key={flow.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                layout
                className="group rounded-xl border border-border/60 bg-card p-3 sm:p-4 lg:p-5 transition-colors hover:bg-secondary/20"
              >
                {/* Top row: icon + info + actions */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-3">
                  {/* Left: trigger icon + flow info */}
                  <div className="flex items-start gap-2.5 sm:gap-3 lg:gap-4 min-w-0 flex-1">
                    <div className={cn(
                      "flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl",
                      flow.isEnabled ? "bg-accent/10 text-accent" : "bg-secondary text-muted-foreground/60"
                    )}>
                      <TriggerIcon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="text-[14px] sm:text-[15px] font-semibold text-foreground truncate min-w-0">{flow.name}</h3>
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0 whitespace-nowrap",
                          flow.isEnabled ? "bg-emerald-500/10 text-emerald-600" : "bg-secondary text-muted-foreground"
                        )}>
                          {flow.isEnabled ? "Active" : "Paused"}
                        </span>
                      </div>
                      <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-[12px] text-muted-foreground truncate">
                        Trigger: {td?.label ?? flow.trigger} · {nodeCount} steps
                      </p>
                      {stats && (
                        <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground/60">
                          {String(stats.runs ?? 0)} runs · Last: {String(stats.lastRun ?? "never")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action buttons: always visible on mobile, hover on desktop */}
                  <div className="flex items-center gap-0.5 sm:gap-1 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 ml-[46px] sm:ml-0 shrink-0">
                    <button
                      onClick={() => handleToggle(flow)}
                      className={cn(
                        "rounded-md min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px] flex items-center justify-center transition-colors cursor-pointer",
                        flow.isEnabled
                          ? "text-amber-600 hover:bg-amber-500/10"
                          : "text-emerald-600 hover:bg-emerald-500/10"
                      )}
                      title={flow.isEnabled ? "Pause" : "Enable"}
                    >
                      {flow.isEnabled ? <Pause className="h-4 w-4 sm:h-3.5 sm:w-3.5" /> : <Play className="h-4 w-4 sm:h-3.5 sm:w-3.5" />}
                    </button>
                    <button
                      onClick={() => handleDuplicate(flow)}
                      className="rounded-md min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px] flex items-center justify-center text-muted-foreground/60 hover:bg-secondary hover:text-foreground cursor-pointer transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                    </button>
                    <button
                      onClick={() => openEdit(flow)}
                      className="rounded-md min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px] flex items-center justify-center text-muted-foreground/60 hover:bg-secondary hover:text-foreground cursor-pointer transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(flow)}
                      className="rounded-md min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px] flex items-center justify-center text-muted-foreground/60 hover:bg-red-500/10 hover:text-red-600 cursor-pointer transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Mini flow visualization */}
                <div className="mt-2.5 sm:mt-3 flex flex-wrap items-center gap-1 sm:gap-1.5 ml-[46px] sm:ml-[52px] lg:ml-[56px] overflow-hidden">
                  {(flow.nodes as FlowNode[]).map((node, ni) => (
                    <div key={node.id} className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                      <span className={cn(
                        "rounded-md px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-medium whitespace-nowrap",
                        node.type === "trigger" ? "bg-accent/10 text-accent" :
                        node.type === "condition" ? "bg-amber-500/10 text-amber-600" :
                        "bg-emerald-500/10 text-emerald-600"
                      )}>
                        {node.label}
                      </span>
                      {ni < (flow.nodes as FlowNode[]).length - 1 && (
                        <ArrowRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0 text-muted-foreground/30" />
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          })}
          </AnimatePresence>
        </div>

        {/* Empty state: search yielded no results */}
        {filteredFlows.length === 0 && flowList.length > 0 && (
          <div className="mt-4 sm:mt-6 rounded-xl border border-border/60 bg-card p-6 sm:p-10 text-center">
            <Search className="mx-auto h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground/30 mb-2" />
            <p className="text-[13px] text-muted-foreground">No flows match your search.</p>
          </div>
        )}

        {/* Empty state: no flows at all */}
        {flowList.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 sm:mt-6 rounded-xl border border-border/60 bg-card p-10 flex flex-col items-center gap-3 text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
              <Workflow className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <p className="text-[14px] font-medium text-foreground/60">No flows yet</p>
            <p className="text-[12px] text-muted-foreground/40 max-w-xs">
              Create your first automation flow to define triggers and actions for your workflow.
            </p>
            <button onClick={openCreate} className={cn(btnAccent, "mt-1 min-h-[44px] sm:min-h-0 justify-center")}>
              <Plus className="h-3.5 w-3.5" />
              Create flow
            </button>
          </motion.div>
        )}
      </div>

      <FlowBuilderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editFlow={editFlow}
        onSave={handleSave}
      />

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete flow</DialogTitle>
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
    </div>
  )
}
