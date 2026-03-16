"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Pencil, Trash2, Tag, Hash, Check } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { cn, btnAccent, inputClass } from "@/lib/utils"
import { EmptyState } from "@/components/dashboard/empty-state"
import { tags as tagsApi } from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface TagItem {
  id: string
  name: string
  color: string
  usageCount: number
}

const PRESET_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#f97316", "#14b8a6", "#64748b",
]

export default function TagsPage() {
  const [tagList, setTagList] = useState<TagItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTag, setEditTag] = useState<TagItem | null>(null)
  const [name, setName] = useState("")
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<TagItem | null>(null)

  // Fetch tags from API on mount
  const fetchTags = useCallback(async () => {
    try {
      setLoading(true)
      const result = await tagsApi.list()
      const data = result.data ?? []
      setTagList(data.map((t) => ({
        id: t.id ?? "",
        name: t.name ?? "",
        color: t.color ?? PRESET_COLORS[0],
        usageCount: (t as unknown as { usageCount?: number }).usageCount ?? 0,
      })))
    } catch (err) {
      console.error("Failed to fetch tags:", err)
      toast.error("Failed to load tags")
      setTagList([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  function openCreate() {
    setEditTag(null)
    setName("")
    setColor(PRESET_COLORS[0])
    setDialogOpen(true)
  }

  function openEdit(tag: TagItem) {
    setEditTag(tag)
    setName(tag.name)
    setColor(tag.color)
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    if (editTag) {
      try {
        await tagsApi.update(editTag.id, { name: name.trim(), color })
        setTagList((prev) => prev.map((t) => (t.id === editTag.id ? { ...t, name: name.trim(), color } : t)))
        toast.success("Tag updated")
      } catch (err) {
        console.error("Failed to update tag:", err)
        toast.error("Failed to update tag")
      }
    } else {
      try {
        const created = await tagsApi.create({ name: name.trim(), color })
        setTagList((prev) => [
          ...prev,
          { id: (created as unknown as { id?: string }).id ?? `t-${Date.now()}`, name: name.trim(), color, usageCount: 0 },
        ])
        toast.success("Tag created")
      } catch (err) {
        console.error("Failed to create tag:", err)
        toast.error("Failed to create tag")
      }
    }
    setDialogOpen(false)
    setSaving(false)
  }

  function confirmDelete(tag: TagItem) {
    setDeleteConfirm(tag)
  }

  async function handleDelete() {
    if (!deleteConfirm) return
    try {
      await tagsApi.delete(deleteConfirm.id)
      setTagList((prev) => prev.filter((t) => t.id !== deleteConfirm.id))
      toast.success(`Tag "${deleteConfirm.name}" deleted`)
    } catch (err) {
      console.error("Failed to delete tag:", err)
      toast.error("Failed to delete tag")
    }
    setDeleteConfirm(null)
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-[22px] font-semibold text-foreground tracking-tight">Tags</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">Manage tags to organize and categorize tickets.</p>
          </div>
          <button onClick={openCreate} className={cn(btnAccent, "w-full sm:w-auto justify-center min-h-[44px] sm:min-h-0")}>
            <Plus className="h-3.5 w-3.5" />
            Create tag
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="mb-6 grid grid-cols-2 gap-3 sm:gap-4"
        >
          <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-[12px] sm:text-[13px] text-muted-foreground">Total tags</p>
              <Tag className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <p className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-semibold text-foreground">{tagList.length}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-[12px] sm:text-[13px] text-muted-foreground">Total usage</p>
              <Hash className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <p className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-semibold text-foreground">
              {tagList.reduce((sum, t) => sum + t.usageCount, 0)}
            </p>
          </div>
        </motion.div>

        {/* Tags grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border/60 bg-card p-3.5 sm:px-5 sm:py-4 animate-pulse">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="h-4 w-4 rounded-full bg-secondary" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 w-20 rounded bg-secondary" />
                    <div className="h-2 w-14 rounded bg-secondary" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {tagList.map((tag, i) => (
            <motion.div
              key={tag.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
              className="group flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border/60 bg-card p-3.5 sm:px-5 sm:py-4 transition-colors hover:bg-secondary/30 gap-2.5 sm:gap-3"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div
                  className="h-4 w-4 shrink-0 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <div className="min-w-0">
                  <p className="text-[13px] sm:text-[14px] font-medium text-foreground truncate">{tag.name}</p>
                  <p className="text-[11px] text-muted-foreground">{tag.usageCount} tickets</p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-100 sm:opacity-0 transition-opacity sm:group-hover:opacity-100 self-end sm:self-auto shrink-0">
                <button
                  onClick={() => openEdit(tag)}
                  className="rounded-md p-2 sm:p-1.5 text-muted-foreground/60 hover:bg-secondary hover:text-foreground cursor-pointer transition-colors duration-150 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
                >
                  <Pencil className="h-4 w-4 sm:h-3 sm:w-3" />
                </button>
                <button
                  onClick={() => confirmDelete(tag)}
                  className="rounded-md p-2 sm:p-1.5 text-muted-foreground/60 hover:bg-red-50 hover:text-red-600 cursor-pointer transition-colors duration-150 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
                >
                  <Trash2 className="h-4 w-4 sm:h-3 sm:w-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
        )}

        {tagList.length === 0 && !loading && (
          <EmptyState
            icon={Tag}
            title="No tags yet"
            description="Create tags to organize and categorize your tickets."
            action={{ label: "Create tag", onClick: openCreate }}
          />
        )}
      </div>

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-md p-0 gap-0 overflow-hidden rounded-xl border border-border/60 max-h-[calc(100vh-2rem)] sm:max-h-[90vh] overflow-y-auto">
          <div className="px-5 sm:px-6 py-5 border-b border-border/60">
            <DialogHeader>
              <DialogTitle>{editTag ? "Edit tag" : "Create tag"}</DialogTitle>
              <DialogDescription className="text-[12px] text-muted-foreground mt-0.5">
                {editTag ? "Update the name or color for this tag." : "Tags help you organize and categorize tickets."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex flex-col gap-4 px-5 sm:px-6 py-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-foreground">Name</label>
              <input
                type="text"
                placeholder="e.g. VIP, Urgent, Return"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={cn(inputClass, "h-11 sm:h-9")}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-foreground">Color</label>
              <div className="flex flex-wrap gap-2.5 sm:gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      "flex h-11 w-11 sm:h-7 sm:w-7 items-center justify-center rounded-full transition-all cursor-pointer",
                      color === c ? "ring-2 ring-offset-2 ring-accent" : "hover:scale-110"
                    )}
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check className="h-3.5 w-3.5 sm:h-3 sm:w-3 text-white" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="px-5 sm:px-6 py-4 border-t border-border/60 flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2">
            <button
              onClick={() => setDialogOpen(false)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/60 px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-secondary/60 cursor-pointer min-h-[44px] sm:min-h-0"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || saving}
              className={cn(btnAccent, "disabled:opacity-50 min-h-[44px] sm:min-h-0 justify-center")}
            >
              {saving ? "Saving..." : editTag ? "Update" : "Create"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-sm p-0 gap-0 overflow-hidden rounded-xl border border-border/60">
          <div className="px-5 sm:px-6 py-5">
            <DialogHeader>
              <DialogTitle>Delete tag</DialogTitle>
              <DialogDescription className="text-[12px] text-muted-foreground mt-0.5">
                Are you sure you want to delete the tag &quot;{deleteConfirm?.name}&quot;? This will remove it from all tickets.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-5 sm:px-6 py-4 border-t border-border/60 flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/60 px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-secondary/60 cursor-pointer min-h-[44px] sm:min-h-0"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2 text-[13px] font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 cursor-pointer min-h-[44px] sm:min-h-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
