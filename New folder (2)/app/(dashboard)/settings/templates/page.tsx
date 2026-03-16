"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Plus, Edit2, Trash2, Info, Search, FileText, Code } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { settingsApi } from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

interface Template {
  id: string
  name: string
  subject: string
  body: string
  type: "system" | "custom"
}

const VARIABLES = [
  "{{customer_name}}",
  "{{ticket_id}}",
  "{{order_id}}",
  "{{agent_name}}",
]

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formName, setFormName] = useState("")
  const [formSubject, setFormSubject] = useState("")
  const [formBody, setFormBody] = useState("")
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "system" | "custom">("all")
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null)

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      const result = await settingsApi.getTemplates()
      const data = result.data || []
      setTemplates(data.map((t: Record<string, unknown>) => ({
        id: t.id as string,
        name: t.name as string,
        subject: t.subject as string,
        body: t.body as string,
        type: ((t.type as string) || "custom") as "system" | "custom",
      })))
    } catch (err) {
      toast.error("Failed to load email templates")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTemplates() }, [fetchTemplates])

  const openEdit = (template: Template) => {
    setEditingTemplate(template)
    setFormName(template.name)
    setFormSubject(template.subject)
    setFormBody(template.body)
    setDialogOpen(true)
  }

  const openCreate = () => {
    setEditingTemplate(null)
    setFormName("")
    setFormSubject("")
    setFormBody("")
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formSubject.trim() || !formBody.trim()) return
    try {
      setSaving(true)
      if (editingTemplate) {
        await settingsApi.updateTemplate(editingTemplate.id, {
          name: formName || editingTemplate.name,
          subject: formSubject,
          body: formBody,
        })
        setTemplates(
          templates.map((t) =>
            t.id === editingTemplate.id
              ? { ...t, name: formName || t.name, subject: formSubject, body: formBody }
              : t
          )
        )
        toast.success("Template updated successfully")
      } else {
        const result = await settingsApi.createTemplate({
          name: formName || "New Template",
          subject: formSubject,
          body: formBody,
          type: "custom",
        })
        setTemplates([
          ...templates,
          {
            id: result.id,
            name: result.name || formName || "New Template",
            subject: formSubject,
            body: formBody,
            type: "custom",
          },
        ])
        toast.success("Template created successfully")
      }
      setDialogOpen(false)
    } catch (err) {
      console.error("Failed to save template:", err)
      toast.error(editingTemplate ? "Failed to update template" : "Failed to create template")
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await settingsApi.deleteTemplate(deleteTarget.id)
      setTemplates(templates.filter((t) => t.id !== deleteTarget.id))
      toast.success(`Template "${deleteTarget.name}" deleted`)
    } catch (err) {
      console.error("Failed to delete template:", err)
      toast.error("Failed to delete template")
    }
    setDeleteTarget(null)
  }

  const insertVariable = (variable: string) => {
    setFormBody((prev) => prev + variable)
  }

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.subject.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === "all" || t.type === filter
    return matchesSearch && matchesFilter
  })

  const systemCount = templates.filter(t => t.type === "system").length
  const customCount = templates.filter(t => t.type === "custom").length

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
          <span className="text-foreground font-medium">Email Templates</span>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Email Templates</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Manage system and custom email templates sent to customers.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 sm:py-2 text-[13px] font-medium text-background transition-colors duration-150 hover:bg-foreground/90 cursor-pointer min-h-[44px] sm:min-h-0 w-full sm:w-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            New template
          </button>
        </div>
      </div>

      <div className="p-3 sm:p-6 space-y-8">
        {/* Info */}
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent/5">
              <Info className="h-3.5 w-3.5 text-accent" />
            </div>
            <div>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Templates are used for automated emails sent to customers (receipts, confirmations, survey requests). They are different from <span className="font-medium text-foreground">macros</span>, which are agent-triggered replies.
              </p>
            </div>
          </div>
        </div>

        {/* Search and filter */}
        <div className="space-y-4">
          <div>
            <h2 className="text-[14px] font-semibold text-foreground">Templates</h2>
            <p className="text-[13px] text-muted-foreground">{templates.length} templates ({systemCount} system, {customCount} custom)</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates..."
                className="h-11 sm:h-9 w-full rounded-lg border border-border/60 bg-background pl-9 pr-3 text-[13px] placeholder:text-muted-foreground/50 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors"
              />
            </div>
            <div className="flex items-center rounded-lg border border-border/60 p-0.5 self-start">
              {(["all", "system", "custom"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "rounded-md px-3 py-2 sm:py-1.5 text-[12px] font-medium transition-colors capitalize min-h-[44px] sm:min-h-0",
                    filter === f ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Templates list */}
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
          {filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/60">
                <FileText className="h-5 w-5 text-muted-foreground/40" />
              </div>
              <p className="mt-3 text-[14px] font-medium text-foreground">No templates found</p>
              <p className="mt-1 text-[13px] text-muted-foreground">Try adjusting your search or filter.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex flex-col gap-3 px-3 sm:px-5 py-4 hover:bg-secondary/10 transition-colors group sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      template.type === "system" ? "bg-secondary/60" : "bg-accent/10"
                    )}>
                      {template.type === "system" ? (
                        <FileText className="h-4 w-4 text-muted-foreground/60" />
                      ) : (
                        <Code className="h-4 w-4 text-accent" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-medium text-foreground">
                          {template.name}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                            template.type === "system"
                              ? "border-border/60 bg-secondary text-muted-foreground"
                              : "border-accent/20 bg-accent/5 text-accent"
                          )}
                        >
                          {template.type === "system" ? "System" : "Custom"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[12px] text-muted-foreground truncate">
                        {template.subject}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150">
                    <button
                      onClick={() => openEdit(template)}
                      className="cursor-pointer rounded-lg border border-border/60 px-3 py-2 sm:py-1.5 text-[12px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors duration-150 min-h-[44px] sm:min-h-0 flex-1 sm:flex-initial"
                    >
                      Edit
                    </button>
                    {template.type === "custom" && (
                      <button
                        onClick={() => setDeleteTarget(template)}
                        className="cursor-pointer rounded-lg border border-red-200 px-3 py-2 sm:py-1.5 text-[12px] font-medium text-red-600 hover:bg-red-50 transition-colors duration-150 min-h-[44px] sm:min-h-0 flex-1 sm:flex-initial"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete template</DialogTitle>
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

      {/* Edit / Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl p-0 gap-0 overflow-hidden rounded-xl border border-border/60">
          <div className="px-4 sm:px-6 py-5 border-b border-border/60">
            <DialogHeader>
              <DialogTitle className="text-[15px] font-semibold text-foreground">
                {editingTemplate ? `Edit: ${editingTemplate.name}` : "New template"}
              </DialogTitle>
              <DialogDescription className="text-[12px] text-muted-foreground mt-0.5">
                {editingTemplate?.type === "system"
                  ? "Editing a system template. Changes apply to all outgoing emails of this type."
                  : "Use HTML for formatting. Insert variables below to personalise the email."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-4 sm:px-6 py-5 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
            {/* Name input */}
            {!editingTemplate && (
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-foreground">Template name</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Order Confirmation"
                  className="h-11 sm:h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-[13px] focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 text-foreground placeholder:text-muted-foreground/50 transition-colors"
                />
              </div>
            )}

            {/* Subject input */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-foreground">Subject line</label>
              <input
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                placeholder="Email subject..."
                className="h-11 sm:h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-[13px] focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 text-foreground placeholder:text-muted-foreground/50 transition-colors"
              />
              <p className="text-[12px] text-muted-foreground/60">Supports template variables like {"{{ticket_id}}"}.</p>
            </div>

            {/* Body textarea */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-foreground">Body (HTML)</label>
              <textarea
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                placeholder="Email body HTML..."
                rows={9}
                className="rounded-lg border border-border/60 bg-background px-3 py-2 text-[13px] focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 resize-none text-foreground placeholder:text-muted-foreground/50 font-mono transition-colors w-full"
              />
            </div>

            {/* Variables */}
            <div className="space-y-2">
              <label className="text-[13px] font-medium text-foreground">Available variables</label>
              <div className="flex flex-wrap gap-1.5">
                {VARIABLES.map((variable) => (
                  <button
                    key={variable}
                    type="button"
                    onClick={() => insertVariable(variable)}
                    className="cursor-pointer inline-flex items-center rounded-md border border-border/60 bg-secondary/40 px-2.5 py-1 text-[11px] font-mono text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors duration-150"
                  >
                    {variable}
                  </button>
                ))}
              </div>
              <p className="text-[12px] text-muted-foreground/60">Click a variable to insert it at the end of the body.</p>
            </div>

            {/* Preview */}
            {formBody.trim() && (
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-foreground">Preview</label>
                <div className="rounded-lg border border-border/60 bg-background px-4 py-4 text-[13px] text-foreground leading-relaxed min-h-[80px]">
                  {formSubject && (
                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 border-b border-border/40 pb-2">
                      Subject: {formSubject}
                    </p>
                  )}
                  <pre className="whitespace-pre-wrap text-sm text-foreground font-sans">{formBody}</pre>
                </div>
              </div>
            )}
          </div>

          <div className="px-4 sm:px-6 py-4 border-t border-border/60 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <button
              onClick={() => setDialogOpen(false)}
              className="cursor-pointer rounded-lg border border-border/60 px-4 py-2.5 sm:py-2 text-[13px] font-medium text-foreground hover:bg-secondary/60 transition-colors duration-150 min-h-[44px] sm:min-h-0 w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!formSubject.trim() || !formBody.trim() || saving}
              className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 sm:py-2 text-[13px] font-medium text-background transition-colors duration-150 hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0 w-full sm:w-auto"
            >
              {saving ? "Saving..." : "Save template"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
