"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Plus, Edit2, Trash2, Search, Copy, Loader2, FileText } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { macros as macrosApi } from "@/lib/api"
import { EmptyState } from "@/components/dashboard/empty-state"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

interface Macro {
  id: string
  name: string
  body: string
}

const VARIABLES = [
  "customer_name",
  "order_id",
  "order_status",
  "tracking_number",
  "product_name",
  "refund_amount",
  "store_name",
  "restock_date",
]

export default function MacrosPage() {
  const [macros, setMacros] = useState<Macro[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [editingMacro, setEditingMacro] = useState<Macro | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formName, setFormName] = useState("")
  const [formBody, setFormBody] = useState("")
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const [deleteTarget, setDeleteTarget] = useState<Macro | null>(null)

  // Fetch macros from API on mount
  const fetchMacros = useCallback(async () => {
    try {
      setLoading(true)
      const result = await macrosApi.list()
      const data = Array.isArray(result) ? result : []
      setMacros(data.map((m) => ({
        id: m.id ?? "",
        name: m.name ?? "",
        body: m.body ?? "",
      })))
    } catch (err) {
      console.error("Failed to fetch macros:", err)
      toast.error("Failed to load macros")
      setMacros([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMacros()
  }, [fetchMacros])

  const filtered = macros.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.body.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => {
    setEditingMacro(null)
    setFormName("")
    setFormBody("")
    setDialogOpen(true)
  }

  const openEdit = (macro: Macro) => {
    setEditingMacro(macro)
    setFormName(macro.name)
    setFormBody(macro.body)
    setDialogOpen(true)
  }

  const handleDuplicate = async (macro: Macro) => {
    const duplicateName = `${macro.name} (copy)`
    try {
      const created = await macrosApi.create({ name: duplicateName, body: macro.body })
      const newMacro: Macro = {
        id: (created as unknown as { id?: string }).id ?? Date.now().toString(),
        name: duplicateName,
        body: macro.body,
      }
      setMacros((prev) => [...prev, newMacro])
      toast.success("Macro duplicated", { description: newMacro.name })
    } catch (err) {
      console.error("Failed to duplicate macro:", err)
      toast.error("Failed to duplicate macro")
    }
  }

  const handleSave = async () => {
    if (!formName.trim() || !formBody.trim()) return

    if (editingMacro) {
      try {
        await macrosApi.update(editingMacro.id, { name: formName, body: formBody })
        setMacros(
          macros.map((m) =>
            m.id === editingMacro.id ? { ...m, name: formName, body: formBody } : m
          )
        )
        toast.success("Macro updated", { description: formName })
      } catch (err) {
        console.error("Failed to update macro:", err)
        toast.error("Failed to update macro")
      }
    } else {
      try {
        const created = await macrosApi.create({ name: formName, body: formBody })
        const newMacro: Macro = {
          id: (created as unknown as { id?: string }).id ?? Date.now().toString(),
          name: formName,
          body: formBody,
        }
        setMacros((prev) => [...prev, newMacro])
        toast.success("Macro created", { description: formName })
      } catch (err) {
        console.error("Failed to create macro:", err)
        toast.error("Failed to create macro")
      }
    }

    setDialogOpen(false)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await macrosApi.delete(deleteTarget.id)
      setMacros(macros.filter((m) => m.id !== deleteTarget.id))
      toast.success("Macro deleted", { description: deleteTarget.name })
    } catch (err) {
      console.error("Failed to delete macro:", err)
      toast.error("Failed to delete macro")
    }
    setDeleteTarget(null)
  }

  const insertVariable = (variable: string) => {
    const tag = `{{${variable}}}`
    const textarea = bodyRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newBody = formBody.slice(0, start) + tag + formBody.slice(end)
      setFormBody(newBody)
      requestAnimationFrame(() => {
        textarea.focus()
        textarea.setSelectionRange(start + tag.length, start + tag.length)
      })
    } else {
      setFormBody((prev) => prev + tag)
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
        >
          <div>
            <h1 className="text-[22px] font-semibold text-foreground tracking-tight">Macros</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Canned responses to speed up your replies.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="bg-accent text-white rounded-lg px-4 py-2 min-h-[44px] text-[13px] font-medium hover:bg-accent/90 transition-colors duration-150 cursor-pointer flex items-center justify-center gap-1.5 w-full sm:w-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            New Macro
          </button>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-4"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
            <input
              placeholder="Search macros by name or content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border/60 bg-background pl-9 pr-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/40 transition-colors h-11 sm:h-9 text-foreground placeholder:text-muted-foreground/50"
            />
          </div>
        </motion.div>

        {/* Category filter - horizontal scroll on mobile, wrap on desktop */}
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-3"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
            {filtered.length} {filtered.length === 1 ? "macro" : "macros"}
          </span>
        </motion.div>

        {/* Macros grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border/60 bg-card p-4 sm:p-5 animate-pulse">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="h-3 w-32 rounded bg-secondary" />
                  <div className="h-4 w-16 rounded-full bg-secondary" />
                </div>
                <div className="space-y-1.5 mt-3">
                  <div className="h-2 w-full rounded bg-secondary" />
                  <div className="h-2 w-3/4 rounded bg-secondary" />
                  <div className="h-2 w-1/2 rounded bg-secondary" />
                </div>
              </div>
            ))}
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence initial={false}>
            {filtered.map((macro, i) => (
              <motion.div
                key={macro.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                layout
                className="rounded-xl border border-border/60 bg-card p-4 sm:p-5 group hover:border-accent/20 transition-colors duration-150 flex flex-col"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-foreground truncate">{macro.name}</p>
                  </div>
                </div>
                <p className="text-[12px] leading-relaxed text-muted-foreground line-clamp-3 flex-1 mt-2">
                  {macro.body}
                </p>
                <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-end">
                  <div className="flex shrink-0 items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150">
                    <button
                      onClick={() => handleDuplicate(macro)}
                      className="cursor-pointer rounded-md p-1.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors duration-150"
                      aria-label={`Duplicate ${macro.name}`}
                      title="Duplicate"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => openEdit(macro)}
                      className="cursor-pointer rounded-md p-1.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors duration-150"
                      aria-label={`Edit ${macro.name}`}
                      title="Edit"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(macro)}
                      className="cursor-pointer rounded-md p-1.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors duration-150"
                      aria-label={`Delete ${macro.name}`}
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filtered.length === 0 && macros.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-xl border border-border/60 bg-card p-10 text-center col-span-full flex flex-col items-center gap-2"
            >
              <Search className="h-6 w-6 text-muted-foreground/30 mb-1" />
              <p className="text-[13px] font-medium text-foreground/60">No macros match your search</p>
            </motion.div>
          )}
          {macros.length === 0 && !loading && (
            <div className="col-span-full">
              <EmptyState
                icon={FileText}
                title="No macros yet"
                description="Create canned responses to speed up your replies."
                action={{ label: "Create macro", onClick: () => setDialogOpen(true) }}
              />
            </div>
          )}
        </div>
        )}
      </div>

      {/* Dialog - nearly full-screen on mobile */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-lg p-0 gap-0 overflow-hidden rounded-xl border border-border/60 max-h-[calc(100dvh-2rem)] sm:max-h-[85vh] flex flex-col">
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-border/60 shrink-0">
            <DialogHeader>
              <DialogTitle className="text-[15px] font-semibold text-foreground">
                {editingMacro ? "Edit Macro" : "New Macro"}
              </DialogTitle>
              <DialogDescription className="text-[12px] text-muted-foreground mt-0.5">
                Use {"{{variable}}"} syntax for dynamic values like customer_name, order_id, etc.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-4 sm:px-6 py-4 sm:py-5 flex flex-col gap-4 overflow-y-auto flex-1 min-h-0">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                Name
              </label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Macro name..."
                className="rounded-lg border border-border/60 bg-background px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/40 transition-colors h-11 sm:h-9 w-full text-foreground placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                Body
              </label>
              <textarea
                ref={bodyRef}
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                placeholder="Macro content..."
                rows={7}
                className="rounded-lg border border-border/60 bg-background px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/40 transition-colors resize-none text-foreground placeholder:text-muted-foreground/50 min-h-[120px] w-full"
              />
              {/* Variable insertion buttons */}
              <div className="flex flex-wrap gap-1.5 mt-1">
                {VARIABLES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => insertVariable(v)}
                    className="rounded-md border border-border/60 bg-secondary/40 px-2 py-1 min-h-[36px] sm:min-h-0 text-[11px] font-mono text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors duration-150 cursor-pointer"
                  >
                    {`{{${v}}}`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="px-4 sm:px-6 py-4 border-t border-border/60 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 shrink-0">
            <button
              onClick={() => setDialogOpen(false)}
              className="cursor-pointer border border-border/60 rounded-lg px-4 py-2 min-h-[44px] sm:min-h-0 text-[13px] font-medium text-foreground hover:bg-secondary/60 transition-colors duration-150 w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!formName.trim() || !formBody.trim()}
              className="cursor-pointer bg-accent text-white rounded-lg px-4 py-2 min-h-[44px] sm:min-h-0 text-[13px] font-medium hover:bg-accent/90 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              Save Macro
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete macro</DialogTitle>
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
