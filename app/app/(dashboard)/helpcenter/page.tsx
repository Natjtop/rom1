"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Edit2, Trash2, Search, Sparkles, BookOpen, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { helpcenter as helpcenterApi } from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn, btnAccent, btnSecondary, inputClass, cardClass } from "@/lib/utils"

interface Article {
  id: string
  title: string
  content: string
  synced: boolean
  updatedAt: string
}

export default function HelpCenterPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [formTitle, setFormTitle] = useState("")
  const [formContent, setFormContent] = useState("")
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null)

  // Fetch articles from API on mount
  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true)
      const result = await helpcenterApi.list()
      const data = Array.isArray(result) ? result : []
      setArticles(data.map((a) => ({
        id: a.id ?? "",
        title: a.title ?? "",
        content: a.content ?? "",
        synced: (a as unknown as { isPublished?: boolean }).isPublished ?? false,
        updatedAt: a.updatedAt ? new Date(a.updatedAt).toLocaleDateString() : "Unknown",
      })))
    } catch (err) {
      console.error("Failed to fetch articles:", err)
      toast.error("Failed to load articles")
      setArticles([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  const filtered = articles.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => {
    setEditingArticle(null)
    setFormTitle("")
    setFormContent("")
    setDialogOpen(true)
  }

  const openEdit = (article: Article) => {
    setEditingArticle(article)
    setFormTitle(article.title)
    setFormContent(article.content)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formTitle.trim() || !formContent.trim()) return

    if (editingArticle) {
      try {
        await helpcenterApi.update(editingArticle.id, { title: formTitle, content: formContent })
        const updatedArticle = {
          ...editingArticle,
          title: formTitle,
          content: formContent,
          updatedAt: "Just now",
        }
        setArticles(articles.map((a) => (a.id === editingArticle.id ? updatedArticle : a)))
        toast.success("Article updated")
      } catch (err) {
        console.error("Failed to update article:", err)
        toast.error("Failed to update article")
      }
    } else {
      try {
        const created = await helpcenterApi.create({ title: formTitle, content: formContent })
        const newArticle: Article = {
          id: (created as unknown as { id?: string }).id ?? `art-${Date.now()}`,
          title: formTitle,
          content: formContent,
          synced: false,
          updatedAt: "Just now",
        }
        setArticles([...articles, newArticle])
        toast.success("Article created")
      } catch (err) {
        console.error("Failed to create article:", err)
        toast.error("Failed to create article")
      }
    }

    setDialogOpen(false)
  }

  const handleSync = async (id: string) => {
    setSyncingId(id)
    try {
      await helpcenterApi.update(id, { isPublished: true })
      setArticles((prev) => prev.map((a) => (a.id === id ? { ...a, synced: true, updatedAt: "Just now" } : a)))
      toast.success("Article synced to AI")
    } catch (err) {
      console.error("Failed to sync article:", err)
      toast.error("Failed to sync article to AI")
    } finally {
      setSyncingId(null)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await helpcenterApi.delete(deleteTarget.id)
      setArticles(articles.filter((a) => a.id !== deleteTarget.id))
      toast.success(`"${deleteTarget.title}" deleted`)
    } catch (err) {
      console.error("Failed to delete article:", err)
      toast.error("Failed to delete article")
    }
    setDeleteTarget(null)
  }

  const syncedCount = articles.filter((a) => a.synced).length

  return (
    <div className="h-full overflow-y-auto overscroll-contain">
      <div className="mx-auto max-w-3xl px-3 sm:px-6 py-4 sm:py-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-5 sm:mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <h1 className="text-[20px] sm:text-[22px] font-semibold text-foreground tracking-tight leading-tight">Help Center</h1>
            <p className="mt-1 text-[13px] text-muted-foreground leading-snug">
              Write articles that the AI uses to answer customer questions via RAG.
            </p>
          </div>
          <button onClick={openCreate} className={cn(btnAccent, "w-full sm:w-auto justify-center min-h-[44px] sm:min-h-[36px] shrink-0")}>
            <Plus className="h-3.5 w-3.5" />
            New Article
          </button>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="mb-4 sm:mb-5 grid grid-cols-2 gap-2.5 sm:flex sm:items-center sm:gap-4"
        >
          <div className="rounded-xl border border-border/60 bg-card px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2.5">
            <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-[18px] font-semibold text-foreground leading-none">{articles.length}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">Total articles</p>
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-card px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2.5">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-[18px] font-semibold text-foreground leading-none">{syncedCount}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">Synced to AI</p>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08 }}
          className="mb-4 sm:mb-5"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
            <input
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(inputClass, "pl-9 h-11 sm:h-9")}
            />
          </div>
        </motion.div>

        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-2.5 sm:mb-3"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
            {filtered.length} {filtered.length === 1 ? "article" : "articles"}
          </span>
        </motion.div>

        {/* Articles list */}
        {loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border/60 bg-card p-3 sm:p-5 animate-pulse">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-48 rounded bg-secondary" />
                    <div className="h-4 w-20 rounded-full bg-secondary" />
                  </div>
                  <div className="h-2 w-full rounded bg-secondary" />
                  <div className="h-2 w-3/4 rounded bg-secondary" />
                  <div className="h-2 w-24 rounded bg-secondary" />
                </div>
              </div>
            ))}
          </div>
        ) : (
        <div className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {filtered.map((article, i) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="rounded-xl border border-border/60 bg-card p-3 sm:p-5 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start sm:items-center gap-1.5 sm:gap-2 mb-1.5">
                      <p className="text-[13px] font-semibold text-foreground leading-snug break-words min-w-0">{article.title}</p>
                      {article.synced ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 shrink-0 whitespace-nowrap">
                          <Sparkles className="h-2.5 w-2.5 shrink-0" />
                          Synced to AI
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 shrink-0 whitespace-nowrap">
                          Not synced
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] leading-relaxed text-muted-foreground line-clamp-2 break-words">
                      {article.content}
                    </p>
                    <p className="mt-1.5 sm:mt-2 text-[11px] text-muted-foreground/50">
                      Updated {article.updatedAt}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150 -ml-1 sm:ml-0">
                    {!article.synced && (
                      <button
                        onClick={() => handleSync(article.id)}
                        disabled={syncingId === article.id}
                        className={cn(btnSecondary, "px-3 py-1.5 min-h-[44px] sm:min-h-[32px] text-[12px] disabled:opacity-60")}
                      >
                        <RefreshCw className={`h-3 w-3 shrink-0 ${syncingId === article.id ? "animate-spin" : ""}`} />
                        Sync
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(article)}
                      className="cursor-pointer rounded-md p-2 sm:p-1.5 min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px] flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors duration-150"
                      aria-label={`Edit ${article.title}`}
                    >
                      <Edit2 className="h-4 w-4 sm:h-3.5 sm:w-3.5 shrink-0" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(article)}
                      className="cursor-pointer rounded-md p-2 sm:p-1.5 min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px] flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors duration-150"
                      aria-label={`Delete ${article.title}`}
                    >
                      <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5 shrink-0" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-xl border border-border/60 bg-card p-6 sm:p-10 text-center"
            >
              <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-[13px] text-muted-foreground">
                {search ? "No articles match your search." : "No articles yet. Create your first one."}
              </p>
              {!search && (
                <button onClick={openCreate} className={cn(btnAccent, "mt-4 min-h-[44px] sm:min-h-[36px] justify-center mx-auto")}>
                  <Plus className="h-3.5 w-3.5" />
                  New Article
                </button>
              )}
            </motion.div>
          )}
        </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[calc(100%-1rem)] sm:max-w-2xl w-full p-0 gap-0 overflow-hidden rounded-xl border border-border/60 max-h-[92vh] sm:max-h-[85vh] flex flex-col" showCloseButton={false}>
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-border/60 shrink-0">
            <DialogHeader className="text-left">
              <DialogTitle className="text-[15px] font-semibold text-foreground pr-8">
                {editingArticle ? "Edit Article" : "New Article"}
              </DialogTitle>
              <DialogDescription className="text-[12px] text-muted-foreground mt-0.5">
                Write help content. Save &amp; Sync to generate embeddings for AI answers.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-4 sm:px-6 py-4 sm:py-5 flex flex-col gap-4 overflow-y-auto flex-1 min-h-0 overscroll-contain">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                Title
              </label>
              <input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Article title..."
                className={cn(inputClass, "h-11 sm:h-9 w-full")}
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1 min-h-0">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                Content
              </label>
              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="Write your help article content..."
                rows={9}
                className="w-full rounded-lg border border-border/60 bg-background px-3 py-2.5 sm:py-2 text-[13px] leading-relaxed focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/40 transition-colors resize-none text-foreground placeholder:text-muted-foreground/50 flex-1 min-h-[200px]"
              />
            </div>
          </div>

          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border/60 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 shrink-0">
            <button
              onClick={() => setDialogOpen(false)}
              className={cn(btnSecondary, "w-full sm:w-auto justify-center min-h-[44px] sm:min-h-[36px]")}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!formTitle.trim() || !formContent.trim()}
              className={cn(btnAccent, "disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto justify-center min-h-[44px] sm:min-h-[36px]")}
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              Save &amp; Sync to AI
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete article</DialogTitle>
            <DialogDescription className="text-[13px] text-muted-foreground">
              Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? This action cannot be undone.
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
