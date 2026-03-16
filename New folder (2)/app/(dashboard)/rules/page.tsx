"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Trash2, ArrowRight, Zap, Copy, Search, ArrowDown } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { rules as rulesApi } from "@/lib/api"

interface Condition {
  field: string
  operator: string
  value: string
}

interface Action {
  type: string
  value: string
}

interface Rule {
  id: string
  name: string
  enabled: boolean
  conditions: Condition[]
  actions: Action[]
}

const fieldLabels: Record<string, string> = {
  channel: "Channel",
  customer_ltv: "Customer LTV",
  message_contains: "Message contains",
  priority: "Priority",
  status: "Status",
  subject_contains: "Subject contains",
  customer_email: "Customer email",
  ticket_age: "Ticket age (hours)",
}

const operatorLabels: Record<string, string> = {
  equals: "equals",
  not_equals: "not equals",
  contains: "contains",
  not_contains: "not contains",
  greater_than: "greater than",
  less_than: "less than",
  starts_with: "starts with",
  ends_with: "ends with",
}

const actionLabels: Record<string, string> = {
  assign_agent: "Assign agent",
  set_priority: "Set priority",
  add_tag: "Add tag",
  remove_tag: "Remove tag",
  apply_macro: "Apply macro",
  close_ticket: "Close ticket",
  send_notification: "Send notification",
  set_status: "Set status",
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/30 focus:ring-offset-1 ${
          checked ? "bg-accent" : "bg-border"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-150 ${
            checked ? "translate-x-[18px]" : "translate-x-[3px]"
          }`}
        />
      </button>
    </div>
  )
}

function ConditionSummary({ conditions }: { conditions: Condition[] }) {
  return (
    <span className="text-[12px] text-muted-foreground truncate">
      {conditions.map((c, i) => (
        <span key={i}>
          {i > 0 && <span className="mx-1 font-medium text-foreground/40">AND</span>}
          <span className="text-foreground/70">{fieldLabels[c.field] ?? c.field}</span>
          {" "}
          <span className="text-muted-foreground">{operatorLabels[c.operator] ?? c.operator}</span>
          {" "}
          <span className="font-medium text-foreground">{c.value}</span>
        </span>
      ))}
    </span>
  )
}

function ActionSummary({ actions }: { actions: Action[] }) {
  return (
    <span className="text-[12px] text-muted-foreground truncate">
      {actions.map((a, i) => (
        <span key={i}>
          {i > 0 && <span className="mx-1 text-foreground/40">,</span>}
          <span className="text-foreground/70">{actionLabels[a.type] ?? a.type}</span>
          {a.value && (
            <>
              {" "}
              <span className="font-medium text-foreground">{a.value}</span>
            </>
          )}
        </span>
      ))}
    </span>
  )
}

function mapApiRule(apiRule: Record<string, unknown>): Rule {
  const conditions = Array.isArray(apiRule.conditions) ? apiRule.conditions as Condition[] : []
  const actions = Array.isArray(apiRule.actions) ? apiRule.actions as Action[] : []
  return {
    id: String(apiRule.id ?? Date.now()),
    name: String(apiRule.name ?? "Untitled Rule"),
    enabled: apiRule.isEnabled === true || apiRule.enabled === true,
    conditions,
    actions,
  }
}

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true)
      const result = await rulesApi.list()
      const mapped = (Array.isArray(result) ? result : []).map((r) => mapApiRule(r as unknown as Record<string, unknown>))
      setRules(mapped)
    } catch {
      toast.error("Failed to load rules")
      setRules([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRules() }, [fetchRules])

  const activeCount = rules.filter((r) => r.enabled).length

  const filteredRules = rules.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  )

  const toggleRule = async (id: string) => {
    const rule = rules.find((r) => r.id === id)
    if (!rule) return
    const newEnabled = !rule.enabled
    setRules(rules.map((r) => (r.id === id ? { ...r, enabled: newEnabled } : r)))
    try {
      await rulesApi.update(id, { isEnabled: newEnabled })
      toast.success(rule.enabled ? "Rule disabled" : "Rule enabled", { description: rule.name })
    } catch {
      setRules(rules.map((r) => (r.id === id ? { ...r, enabled: rule.enabled } : r)))
      toast.error("Failed to toggle rule")
    }
  }

  const deleteRule = async (id: string) => {
    const rule = rules.find((r) => r.id === id)
    setRules(rules.filter((r) => r.id !== id))
    if (expandedId === id) setExpandedId(null)
    try {
      await rulesApi.delete(id)
      if (rule) toast.success("Rule deleted", { description: rule.name })
    } catch {
      if (rule) setRules((prev) => [...prev, rule])
      toast.error("Failed to delete rule")
    }
  }

  const duplicateRule = async (rule: Rule) => {
    const newId = Date.now().toString()
    const newRule: Rule = {
      ...rule,
      id: newId,
      name: `${rule.name} (copy)`,
      enabled: false,
    }
    setRules((prev) => [...prev, newRule])
    try {
      const created = await rulesApi.create({
        name: newRule.name,
        type: "AUTOMATION",
        conditions: rule.conditions,
        actions: rule.actions,
      })
      const mapped = mapApiRule(created as unknown as Record<string, unknown>)
      setRules((prev) => prev.map((r) => (r.id === newId ? { ...mapped, name: newRule.name } : r)))
      toast.success("Rule duplicated", { description: newRule.name })
    } catch {
      toast.error("Failed to duplicate rule on server")
    }
  }

  const updateRuleName = (id: string, name: string) => {
    setRules(rules.map((r) => (r.id === id ? { ...r, name } : r)))
  }

  const updateCondition = (ruleId: string, ci: number, key: keyof Condition, val: string) => {
    setRules(
      rules.map((r) =>
        r.id === ruleId
          ? {
              ...r,
              conditions: r.conditions.map((c, i) => (i === ci ? { ...c, [key]: val } : c)),
            }
          : r
      )
    )
  }

  const addCondition = (ruleId: string) => {
    setRules(
      rules.map((r) =>
        r.id === ruleId
          ? { ...r, conditions: [...r.conditions, { field: "channel", operator: "equals", value: "" }] }
          : r
      )
    )
  }

  const removeCondition = (ruleId: string, ci: number) => {
    setRules(
      rules.map((r) =>
        r.id === ruleId
          ? { ...r, conditions: r.conditions.filter((_, i) => i !== ci) }
          : r
      )
    )
  }

  const updateAction = (ruleId: string, ai: number, key: keyof Action, val: string) => {
    setRules(
      rules.map((r) =>
        r.id === ruleId
          ? {
              ...r,
              actions: r.actions.map((a, i) => (i === ai ? { ...a, [key]: val } : a)),
            }
          : r
      )
    )
  }

  const addAction = (ruleId: string) => {
    setRules(
      rules.map((r) =>
        r.id === ruleId
          ? { ...r, actions: [...r.actions, { type: "add_tag", value: "" }] }
          : r
      )
    )
  }

  const removeAction = (ruleId: string, ai: number) => {
    setRules(
      rules.map((r) =>
        r.id === ruleId
          ? { ...r, actions: r.actions.filter((_, i) => i !== ai) }
          : r
      )
    )
  }

  const saveRule = async (rule: Rule) => {
    try {
      await rulesApi.update(rule.id, {
        name: rule.name,
        conditions: rule.conditions,
        actions: rule.actions,
      })
      toast.success("Rule saved", { description: rule.name })
    } catch {
      toast.error("Failed to save rule")
    }
  }

  const addRule = async () => {
    const tempId = Date.now().toString()
    const localRule: Rule = {
      id: tempId,
      name: "New Rule",
      enabled: false,
      conditions: [{ field: "channel", operator: "equals", value: "email" }],
      actions: [{ type: "add_tag", value: "" }],
    }
    setRules([...rules, localRule])
    setExpandedId(tempId)
    try {
      const created = await rulesApi.create({
        name: localRule.name,
        type: "AUTOMATION",
        conditions: localRule.conditions,
        actions: localRule.actions,
      })
      const mapped = mapApiRule(created as unknown as Record<string, unknown>)
      setRules((prev) => prev.map((r) => (r.id === tempId ? { ...mapped } : r)))
      setExpandedId(mapped.id)
      toast.success("Rule created", { description: "Configure your new rule below." })
    } catch {
      toast.error("Failed to save to server — changes may be lost on refresh")
    }
  }

  if (loading) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded-lg bg-secondary" />
            <div className="h-4 w-64 rounded bg-secondary" />
            <div className="grid grid-cols-3 gap-3 mt-6">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-secondary" />)}
            </div>
            <div className="space-y-3 mt-6">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded-xl bg-secondary" />)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-[22px] font-semibold text-foreground tracking-tight">Automation Rules</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Create IF/THEN rules to automate your workflow.
            </p>
          </div>
          <button
            onClick={addRule}
            className="bg-accent text-white rounded-lg px-4 py-2 min-h-[44px] text-[13px] font-medium hover:bg-accent/90 transition-colors duration-150 cursor-pointer flex items-center justify-center gap-1.5 w-full sm:w-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            New Rule
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="mb-6 grid grid-cols-3 gap-2 sm:gap-3"
        >
          <div className="rounded-xl border border-border/60 bg-card p-3 sm:p-4">
            <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50">Total</p>
            <p className="mt-1 text-lg sm:text-xl font-semibold text-foreground">{rules.length}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-3 sm:p-4">
            <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50">Active</p>
            <p className="mt-1 text-lg sm:text-xl font-semibold text-emerald-600">{activeCount}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-3 sm:p-4">
            <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50">Disabled</p>
            <p className="mt-1 text-lg sm:text-xl font-semibold text-muted-foreground">{rules.length - activeCount}</p>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-5"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
            <input
              placeholder="Search rules..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border/60 bg-background pl-9 pr-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/40 transition-colors h-11 sm:h-9 text-foreground placeholder:text-muted-foreground/50"
            />
          </div>
        </motion.div>

        {/* Rules list */}
        <div className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
          {filteredRules.map((rule, idx) => {
            const isExpanded = expandedId === rule.id
            return (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
                layout
                className={`rounded-xl border border-border/60 bg-card transition-all duration-150 ${
                  !rule.enabled ? "opacity-55" : ""
                } ${isExpanded ? "border-accent/30" : ""}`}
              >
                {/* Rule row */}
                <div className="flex flex-col gap-3 px-4 sm:px-5 py-4">
                  {/* Top: icon + name + summary */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg mt-0.5 ${rule.enabled ? "bg-accent/10" : "bg-secondary"}`}>
                      <Zap className={`h-3.5 w-3.5 ${rule.enabled ? "text-accent" : "text-muted-foreground"}`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-foreground truncate">{rule.name}</p>
                      {!isExpanded && (
                        <div className="mt-0.5 flex items-center gap-1.5 overflow-hidden">
                          <span className="truncate">
                            <ConditionSummary conditions={rule.conditions} />
                          </span>
                          <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                          <span className="truncate">
                            <ActionSummary actions={rule.actions} />
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom: controls - always full row on mobile */}
                  <div className="flex items-center gap-2 sm:gap-3 sm:ml-10">
                    <span className={`text-[11px] font-medium shrink-0 ${rule.enabled ? "text-accent" : "text-muted-foreground"}`}>
                      {rule.enabled ? "Active" : "Off"}
                    </span>
                    <Toggle checked={rule.enabled} onChange={() => toggleRule(rule.id)} />
                    <button
                      onClick={() => duplicateRule(rule)}
                      className="flex h-[44px] w-[44px] sm:h-8 sm:w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors duration-150 cursor-pointer shrink-0"
                      aria-label={`Duplicate rule ${rule.name}`}
                      title="Duplicate"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (isExpanded) {
                          saveRule(rule)
                        }
                        setExpandedId(isExpanded ? null : rule.id)
                      }}
                      className="border border-border/60 rounded-lg px-4 py-2 min-h-[44px] sm:min-h-0 text-[13px] font-medium text-foreground hover:bg-secondary/60 transition-colors duration-150 cursor-pointer flex-1 sm:flex-none text-center"
                    >
                      {isExpanded ? "Done" : "Edit"}
                    </button>
                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="flex h-[44px] w-[44px] sm:h-8 sm:w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors duration-150 cursor-pointer shrink-0"
                      aria-label={`Delete rule ${rule.name}`}
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded editor */}
                {isExpanded && (
                  <div className="border-t border-border/60 px-4 sm:px-5 pb-5 pt-4">
                    {/* Rule name edit */}
                    <div className="mb-4">
                      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        Rule name
                      </label>
                      <input
                        value={rule.name}
                        onChange={(e) => updateRuleName(rule.id, e.target.value)}
                        className="rounded-lg border border-border/60 bg-background px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-accent/30 h-11 sm:h-9 w-full text-foreground"
                      />
                    </div>

                    {/* IF / THEN flow - stacks vertically on mobile */}
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-start gap-3">
                      {/* Conditions (IF) */}
                      <div className="flex-1 rounded-xl border border-border/60 bg-card p-3 sm:p-4">
                        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          IF
                        </p>
                        <div className="flex flex-col gap-2">
                          {rule.conditions.map((cond, ci) => (
                            <div key={ci} className="flex flex-col gap-2">
                              {ci > 0 && (
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground pl-0.5">
                                  AND
                                </p>
                              )}
                              {/* Each condition: stack field/operator/value on mobile */}
                              <div className="flex flex-col gap-2">
                                <Select
                                  value={cond.field}
                                  onValueChange={(v) => updateCondition(rule.id, ci, "field", v)}
                                >
                                  <SelectTrigger className="h-11 sm:h-8 w-full text-xs cursor-pointer">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="channel">Channel</SelectItem>
                                    <SelectItem value="customer_ltv">Customer LTV</SelectItem>
                                    <SelectItem value="message_contains">Message contains</SelectItem>
                                    <SelectItem value="priority">Priority</SelectItem>
                                    <SelectItem value="status">Status</SelectItem>
                                    <SelectItem value="subject_contains">Subject contains</SelectItem>
                                    <SelectItem value="customer_email">Customer email</SelectItem>
                                    <SelectItem value="ticket_age">Ticket age (hours)</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Select
                                  value={cond.operator}
                                  onValueChange={(v) => updateCondition(rule.id, ci, "operator", v)}
                                >
                                  <SelectTrigger className="h-11 sm:h-8 w-full text-xs cursor-pointer">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="equals">equals</SelectItem>
                                    <SelectItem value="not_equals">not equals</SelectItem>
                                    <SelectItem value="contains">contains</SelectItem>
                                    <SelectItem value="not_contains">not contains</SelectItem>
                                    <SelectItem value="greater_than">greater than</SelectItem>
                                    <SelectItem value="less_than">less than</SelectItem>
                                    <SelectItem value="starts_with">starts with</SelectItem>
                                    <SelectItem value="ends_with">ends with</SelectItem>
                                  </SelectContent>
                                </Select>
                                <div className="flex items-center gap-2">
                                  <input
                                    value={cond.value}
                                    onChange={(e) => updateCondition(rule.id, ci, "value", e.target.value)}
                                    placeholder="Value..."
                                    className="rounded-lg border border-border/60 bg-background px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-accent/30 h-11 sm:h-8 flex-1 min-w-0 text-foreground placeholder:text-muted-foreground/40"
                                  />
                                  {rule.conditions.length > 1 && (
                                    <button
                                      onClick={() => removeCondition(rule.id, ci)}
                                      className="flex h-[44px] w-[44px] sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                                      title="Remove condition"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          <button
                            onClick={() => addCondition(rule.id)}
                            className="mt-1 flex h-11 sm:h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/60 text-[11px] font-medium text-muted-foreground transition-colors hover:border-accent/40 hover:text-accent cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                            Add condition
                          </button>
                        </div>
                      </div>

                      {/* Arrow - rotated on mobile to point down */}
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center self-center">
                        <ArrowDown className="h-4 w-4 text-muted-foreground/50 lg:hidden" />
                        <ArrowRight className="h-4 w-4 text-muted-foreground/50 hidden lg:block" />
                      </div>

                      {/* Actions (THEN) */}
                      <div className="flex-1 rounded-xl border border-border/60 bg-card p-3 sm:p-4">
                        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          THEN
                        </p>
                        <div className="flex flex-col gap-2">
                          {rule.actions.map((action, ai) => (
                            <div key={ai} className="flex flex-col gap-2">
                              <Select
                                value={action.type}
                                onValueChange={(v) => updateAction(rule.id, ai, "type", v)}
                              >
                                <SelectTrigger className="h-11 sm:h-8 w-full text-xs cursor-pointer">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="assign_agent">Assign agent</SelectItem>
                                  <SelectItem value="set_priority">Set priority</SelectItem>
                                  <SelectItem value="add_tag">Add tag</SelectItem>
                                  <SelectItem value="remove_tag">Remove tag</SelectItem>
                                  <SelectItem value="apply_macro">Apply macro</SelectItem>
                                  <SelectItem value="close_ticket">Close ticket</SelectItem>
                                  <SelectItem value="send_notification">Send notification</SelectItem>
                                  <SelectItem value="set_status">Set status</SelectItem>
                                </SelectContent>
                              </Select>
                              {action.type !== "close_ticket" && (
                                <div className="flex items-center gap-2">
                                  <input
                                    value={action.value}
                                    onChange={(e) => updateAction(rule.id, ai, "value", e.target.value)}
                                    placeholder="Value..."
                                    className="rounded-lg border border-border/60 bg-background px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-accent/30 h-11 sm:h-8 flex-1 min-w-0 text-foreground placeholder:text-muted-foreground/40"
                                  />
                                  {rule.actions.length > 1 && (
                                    <button
                                      onClick={() => removeAction(rule.id, ai)}
                                      className="flex h-[44px] w-[44px] sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                                      title="Remove action"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              )}
                              {action.type === "close_ticket" && rule.actions.length > 1 && (
                                <button
                                  onClick={() => removeAction(rule.id, ai)}
                                  className="flex h-[44px] w-[44px] sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer self-start"
                                  title="Remove action"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            onClick={() => addAction(rule.id)}
                            className="mt-1 flex h-11 sm:h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/60 text-[11px] font-medium text-muted-foreground transition-colors hover:border-accent/40 hover:text-accent cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                            Add action
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
          </AnimatePresence>

          {filteredRules.length === 0 && rules.length > 0 && (
            <div className="rounded-xl border border-border/60 bg-card p-10 text-center flex flex-col items-center gap-2">
              <Search className="h-6 w-6 text-muted-foreground/30 mb-1" />
              <p className="text-[13px] font-medium text-foreground/60">No rules match your search</p>
              <p className="text-[12px] text-muted-foreground/40">Try adjusting your search term.</p>
            </div>
          )}

          {rules.length === 0 && (
            <div className="rounded-xl border border-border/60 bg-card p-10 flex flex-col items-center gap-3 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                <Zap className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-[13px] font-medium text-foreground">No rules yet</p>
              <p className="text-[12px] text-muted-foreground max-w-xs">
                Create your first automation rule to start handling tickets automatically.
              </p>
              <button
                onClick={addRule}
                className="mt-1 bg-accent text-white rounded-lg px-4 py-2 min-h-[44px] text-[13px] font-medium hover:bg-accent/90 transition-colors duration-150 cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                New Rule
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
