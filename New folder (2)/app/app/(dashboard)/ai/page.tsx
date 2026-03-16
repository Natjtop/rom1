"use client"

import { useState, useEffect, useCallback } from "react"
import { Sparkles, Save, X, Plus, Loader2, Check, BookOpen, RefreshCw, Zap } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { ai, helpcenter } from "@/lib/api"
import type { HelpArticle } from "@/lib/types"

const fadeUp = {
  initial: { opacity: 0, y: 8 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
  viewport: { once: true },
}

type AiTab = "settings" | "knowledge-base"

export default function AISettingsPage() {
  const [activeTab, setActiveTab] = useState<AiTab>("settings")
  const [pageLoading, setPageLoading] = useState(true)
  const [autoReply, setAutoReply] = useState(true)
  const [tone, setTone] = useState("")
  const [returnPolicy, setReturnPolicy] = useState("")
  const [keywords, setKeywords] = useState<string[]>([])
  const [newKeyword, setNewKeyword] = useState("")
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle")

  const [testMessage, setTestMessage] = useState("")
  const [testReply, setTestReply] = useState("")
  const [testIntent, setTestIntent] = useState<string | null>(null)
  const [testSentiment, setTestSentiment] = useState<string | null>(null)
  const [testLoading, setTestLoading] = useState(false)

  // Knowledge Base state
  const [kbArticles, setKbArticles] = useState<(HelpArticle & { embedStatus?: string })[]>([])
  const [kbLoading, setKbLoading] = useState(false)
  const [embeddingId, setEmbeddingId] = useState<string | null>(null)
  const [reindexing, setReindexing] = useState(false)

  const loadKbArticles = useCallback(async () => {
    setKbLoading(true)
    try {
      const articles = await helpcenter.list()
      const mapped = (Array.isArray(articles) ? articles : []).map((a: HelpArticle) => ({
        ...a,
        embedStatus: a.isPublished ? "embedded" : "not_embedded",
      }))
      setKbArticles(mapped)
    } catch {
      // Keep empty
    } finally {
      setKbLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === "knowledge-base" && kbArticles.length === 0) {
      loadKbArticles()
    }
  }, [activeTab, kbArticles.length, loadKbArticles])

  const handleEmbedArticle = async (articleId: string) => {
    setEmbeddingId(articleId)
    try {
      await helpcenter.update(articleId, { isPublished: true })
      setKbArticles((prev) =>
        prev.map((a) => (a.id === articleId ? { ...a, embedStatus: "embedded", isPublished: true } : a))
      )
      toast.success("Article embedded for AI training")
    } catch {
      toast.error("Failed to embed article")
    } finally {
      setEmbeddingId(null)
    }
  }

  const handleReindexAll = async () => {
    setReindexing(true)
    try {
      const results = await Promise.allSettled(
        kbArticles.map((a) => helpcenter.update(a.id, { isPublished: true }))
      )
      const succeeded = results.filter((r) => r.status === "fulfilled").length
      const failed = results.filter((r) => r.status === "rejected").length
      setKbArticles((prev) => prev.map((a) => ({ ...a, embedStatus: "embedded", isPublished: true })))
      if (failed > 0) {
        toast.warning(`Re-indexed ${succeeded} articles, ${failed} failed`)
      } else {
        toast.success("All articles re-indexed for AI training")
      }
    } catch {
      toast.error("Failed to re-index articles")
    } finally {
      setReindexing(false)
    }
  }

  const handleTestReply = async () => {
    if (!testMessage.trim()) return
    setTestLoading(true)
    setTestReply("")
    try {
      const result = await ai.testReply(testMessage)
      setTestReply(result.reply)
      setTestIntent((result as any).intent ?? null)
      setTestSentiment((result as any).sentiment ?? null)
    } catch {
      toast.error("Failed to test AI reply")
    } finally {
      setTestLoading(false)
    }
  }

  // Load AI settings from API on mount
  useEffect(() => {
    let cancelled = false
    const loadSettings = async () => {
      try {
        const settings = await ai.getSettings()
        if (cancelled) return
        if (settings.aiTone) setTone(settings.aiTone)
        if (typeof settings.autoReplyEnabled === "boolean") setAutoReply(settings.autoReplyEnabled)
        if (settings.escalateKeywords?.length) setKeywords(settings.escalateKeywords)
        if (settings.returnPolicy) setReturnPolicy(settings.returnPolicy)
      } catch (err) {
        toast.error("Failed to load AI settings")
      } finally {
        setPageLoading(false)
      }
    }
    loadSettings()
    return () => { cancelled = true }
  }, [])

  const handleSaveSettings = async () => {
    setSaveState("saving")
    try {
      await ai.updateSettings({
        aiTone: tone,
        autoReplyEnabled: autoReply,
        escalateKeywords: keywords,
        returnPolicy: returnPolicy,
      })
      setSaveState("saved")
      toast.success("AI settings saved")
      setTimeout(() => setSaveState("idle"), 2000)
    } catch (err) {
      console.error("Failed to save AI settings:", err)
      toast.error("Failed to save settings")
      setSaveState("idle")
    }
  }

  const addKeyword = () => {
    const trimmed = newKeyword.trim().toLowerCase()
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed])
      setNewKeyword("")
    }
  }

  const removeKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw))
  }

  if (pageLoading) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-8">
          <div className="animate-pulse space-y-5">
            <div>
              <div className="h-7 w-48 rounded-lg bg-secondary" />
              <div className="mt-2 h-4 w-72 rounded bg-secondary" />
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-secondary" />
                  <div>
                    <div className="h-4 w-24 rounded bg-secondary" />
                    <div className="mt-1 h-3 w-48 rounded bg-secondary" />
                  </div>
                </div>
                <div className="h-6 w-10 rounded-full bg-secondary" />
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-5">
              <div className="h-4 w-36 rounded bg-secondary mb-3" />
              <div className="h-28 w-full rounded-lg bg-secondary" />
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-5">
              <div className="h-4 w-36 rounded bg-secondary mb-3" />
              <div className="h-28 w-full rounded-lg bg-secondary" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-8 pb-28 sm:pb-8">

        {/* Page header */}
        <motion.div className="mb-6 sm:mb-8" {...fadeUp}>
          <h1 className="text-xl sm:text-[22px] font-semibold text-foreground leading-tight">
            AI Agent Settings
          </h1>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            Configure how the AI agent responds to customer tickets.
          </p>
        </motion.div>

        {/* Tab switcher */}
        <div className="mb-6 flex items-center gap-1 rounded-xl border border-border/60 bg-secondary/30 p-1">
          {([
            { id: "settings" as AiTab, label: "Settings", icon: Sparkles },
            { id: "knowledge-base" as AiTab, label: "Knowledge Base", icon: BookOpen },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-[13px] font-medium transition-all duration-150 min-h-[44px] sm:min-h-0",
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Knowledge Base Tab */}
        {activeTab === "knowledge-base" && (
          <div className="flex flex-col gap-4 sm:gap-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-[14px] font-semibold text-foreground">Articles for AI Training</h2>
                <p className="text-[13px] text-muted-foreground">Help articles that the AI uses to answer customer questions via RAG.</p>
              </div>
              <button
                onClick={handleReindexAll}
                disabled={reindexing || kbArticles.length === 0}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[13px] font-medium text-white transition-all hover:bg-accent/90 disabled:opacity-50 min-h-[44px] sm:min-h-[36px]"
              >
                {reindexing ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Re-indexing...</>
                ) : (
                  <><RefreshCw className="h-3.5 w-3.5" /> Re-embed All</>
                )}
              </button>
            </div>

            {kbLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
              </div>
            ) : kbArticles.length === 0 ? (
              <div className="rounded-xl border border-border/60 bg-card">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/60">
                    <BookOpen className="h-5 w-5 text-muted-foreground/40" />
                  </div>
                  <p className="mt-3 text-[14px] font-medium text-foreground">No articles found</p>
                  <p className="mt-1 text-[13px] text-muted-foreground">Create help articles in the Help Center first, then embed them here for AI training.</p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
                {/* Mobile: cards */}
                <div className="sm:hidden divide-y divide-border/40">
                  {kbArticles.map((article) => (
                    <div key={article.id} className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-foreground truncate">{article.title}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              article.embedStatus === "embedded"
                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-200"
                                : "bg-secondary text-muted-foreground border border-border/60"
                            )}>
                              {article.embedStatus === "embedded" ? "Embedded" : "Not Embedded"}
                            </span>
                            {article.isPublished && (
                              <span className="text-[10px] text-muted-foreground/50">Published</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleEmbedArticle(article.id)}
                          disabled={embeddingId === article.id}
                          className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-border/60 px-3 py-1.5 text-[12px] font-medium text-foreground hover:bg-secondary/60 transition-colors min-h-[44px] disabled:opacity-50"
                        >
                          {embeddingId === article.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Zap className="h-3 w-3" />
                          )}
                          {article.embedStatus === "embedded" ? "Re-embed" : "Embed"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop: table */}
                <div className="hidden sm:block">
                  <div className="grid grid-cols-[1fr_120px_120px] items-center gap-4 border-b border-border/40 bg-secondary/20 px-5 py-2.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">Article</span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 text-center">Status</span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 text-center">Action</span>
                  </div>
                  <div className="divide-y divide-border/40">
                    {kbArticles.map((article) => (
                      <div key={article.id} className="grid grid-cols-[1fr_120px_120px] items-center gap-4 px-5 py-3 hover:bg-secondary/10 transition-colors">
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-foreground truncate">{article.title}</p>
                          <p className="text-[11px] text-muted-foreground/60 truncate">{article.isPublished ? "Published" : "Draft"}</p>
                        </div>
                        <div className="flex justify-center">
                          <span className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            article.embedStatus === "embedded"
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-200"
                              : "bg-secondary text-muted-foreground border border-border/60"
                          )}>
                            {article.embedStatus === "embedded" ? "Embedded" : "Not Embedded"}
                          </span>
                        </div>
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleEmbedArticle(article.id)}
                            disabled={embeddingId === article.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-border/60 px-3 py-1.5 text-[12px] font-medium text-foreground hover:bg-secondary/60 transition-colors disabled:opacity-50"
                          >
                            {embeddingId === article.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Zap className="h-3 w-3" />
                            )}
                            {article.embedStatus === "embedded" ? "Re-embed" : "Embed"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && <div className="flex flex-col gap-4 sm:gap-5">

          {/* ── Auto-Reply toggle ── */}
          <motion.div
            className="rounded-xl border border-border/60 bg-card p-4 sm:p-5"
            {...fadeUp}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              {/* Left: icon + text */}
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors duration-150 ${
                    autoReply ? "bg-accent/10" : "bg-secondary"
                  }`}
                >
                  <Sparkles
                    className={`h-5 w-5 transition-colors duration-150 ${
                      autoReply ? "text-accent" : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-foreground">Auto-Reply</p>
                  <p className="text-[13px] leading-relaxed text-muted-foreground">
                    Enable AI to automatically respond to incoming tickets
                  </p>
                </div>
              </div>

              {/* Right: switch with 44px touch target on mobile */}
              <div className="flex shrink-0 items-center justify-center min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0">
                <Switch
                  checked={autoReply}
                  onCheckedChange={setAutoReply}
                  className="cursor-pointer"
                />
              </div>
            </div>

            {autoReply && (
              <div className="mt-4 flex items-start sm:items-center gap-2 rounded-lg border border-border/60 bg-secondary/40 px-3 py-2.5">
                <div className="mt-1 sm:mt-0 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  AI is active and will respond to new tickets automatically.
                </p>
              </div>
            )}
          </motion.div>

          {/* ── AI Tone & Personality ── */}
          <motion.div
            className="rounded-xl border border-border/60 bg-card p-4 sm:p-5"
            {...fadeUp}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="mb-3">
              <label
                htmlFor="ai-tone"
                className="block text-[14px] font-semibold text-foreground"
              >
                AI Tone &amp; Personality
              </label>
              <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
                Define how the AI should communicate with your customers.
              </p>
            </div>
            <Textarea
              id="ai-tone"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="min-h-[120px] sm:min-h-[110px] w-full resize-none text-[13px] leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:ring-1"
              placeholder="e.g. Friendly and concise. Use first names when the customer shared theirs. Avoid jargon. Match the customer's language."
            />
            <p className="mt-2 text-[12px] text-muted-foreground">
              {tone.length} characters
            </p>
          </motion.div>

          {/* ── Return Policy ── */}
          <motion.div
            className="rounded-xl border border-border/60 bg-card p-4 sm:p-5"
            {...fadeUp}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <div className="mb-3">
              <label
                htmlFor="return-policy"
                className="block text-[14px] font-semibold text-foreground"
              >
                Return Policy
              </label>
              <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
                The AI uses this to answer return and refund questions accurately.
              </p>
            </div>
            <Textarea
              id="return-policy"
              value={returnPolicy}
              onChange={(e) => setReturnPolicy(e.target.value)}
              className="min-h-[130px] sm:min-h-[110px] w-full resize-none text-[13px] leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:ring-1"
              placeholder="Enter your return policy..."
            />
            <p className="mt-2 text-[12px] text-muted-foreground">
              {returnPolicy.length} characters
            </p>
          </motion.div>

          {/* ── Escalation Keywords ── */}
          <motion.div
            className="rounded-xl border border-border/60 bg-card p-4 sm:p-5"
            {...fadeUp}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="mb-3">
              <p className="text-[14px] font-semibold text-foreground">Escalation Keywords</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
                When a message contains these keywords the AI will escalate to a human agent.
              </p>
            </div>

            {/* Keyword chips */}
            <div className="mb-4 flex min-h-[36px] flex-wrap gap-2">
              {keywords.length === 0 && (
                <p className="text-[13px] text-muted-foreground py-2">No keywords added yet.</p>
              )}
              {keywords.map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => removeKeyword(kw)}
                  title={`Remove "${kw}"`}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border/60 bg-secondary px-3 py-1.5 min-h-[44px] sm:min-h-[32px] text-[13px] sm:text-[12px] font-medium text-foreground transition-colors duration-150 hover:border-red-300 hover:bg-red-50 hover:text-red-600 active:bg-red-100"
                >
                  {kw}
                  <span className="flex items-center justify-center h-5 w-5 sm:h-3.5 sm:w-3.5">
                    <X className="h-3.5 w-3.5 sm:h-3 sm:w-3 opacity-60" />
                  </span>
                </button>
              ))}
            </div>

            {/* Add keyword input */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addKeyword()}
                placeholder="Type a keyword and press Enter..."
                className="flex-1 rounded-lg border border-border/60 bg-background px-3 py-2 min-h-[44px] text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors duration-150"
              />
              <button
                type="button"
                onClick={addKeyword}
                className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-lg border border-border/60 px-4 py-2 min-h-[44px] text-[13px] font-medium text-foreground transition-colors duration-150 hover:bg-secondary/60 active:bg-secondary w-full sm:w-auto"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>
          </motion.div>

          {/* ── Test AI Reply ── */}
          <motion.div
            className="rounded-xl border border-border/60 bg-card p-4 sm:p-5"
            {...fadeUp}
            transition={{ duration: 0.3, delay: 0.25 }}
          >
            <div className="mb-3">
              <p className="text-[14px] font-semibold text-foreground">Test AI Reply</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
                Send a test message to see how the AI would respond with your current settings.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="min-h-[80px] w-full resize-none text-[13px] leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:ring-1"
                placeholder="Type a customer message to test... e.g. 'Where is my order #1234?'"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestReply}
                  disabled={!testMessage.trim() || testLoading}
                  className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2 min-h-[44px] sm:min-h-[36px] text-[13px] font-medium text-white transition-all duration-150 hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {testLoading ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Testing...</>
                  ) : (
                    <><Sparkles className="h-3.5 w-3.5" /> Test Reply</>
                  )}
                </button>
              </div>
              {testReply && (
                <div className="rounded-lg border border-border/60 bg-secondary/30 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    {testSentiment && (
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        testSentiment === "POSITIVE" ? "bg-emerald-500/10 text-emerald-600" :
                        testSentiment === "NEGATIVE" || testSentiment === "ANGRY" ? "bg-red-500/10 text-red-600" :
                        "bg-secondary text-muted-foreground"
                      )}>
                        {testSentiment}
                      </span>
                    )}
                    {testIntent && (
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                        {testIntent}
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] leading-relaxed text-foreground whitespace-pre-wrap">{testReply}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* ── Save row ── */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-30 flex flex-col items-stretch gap-3 border-t border-border/60 bg-background/95 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:relative sm:left-auto sm:right-auto sm:z-auto sm:flex-row sm:items-center sm:justify-between sm:border-t-0 sm:bg-transparent sm:px-0 sm:py-0 sm:pb-0 sm:backdrop-blur-none"
            {...fadeUp}
            transition={{ duration: 0.3, delay: 0.25 }}
          >
            {/* Status text */}
            <p className="text-[13px] text-muted-foreground text-center sm:text-left order-2 sm:order-1">
              {saveState === "saving"
                ? "Saving your changes..."
                : saveState === "saved"
                  ? "All changes saved."
                  : "Changes are saved to your workspace."}
            </p>

            {/* Save button */}
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={saveState === "saving"}
              className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 min-h-[48px] sm:min-h-[36px] text-[14px] sm:text-[13px] font-medium text-white transition-all duration-150 hover:bg-accent/90 disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto order-1 sm:order-2"
            >
              {saveState === "saving" ? (
                <>
                  <Loader2 className="h-4 w-4 sm:h-3.5 sm:w-3.5 animate-spin" />
                  Saving...
                </>
              ) : saveState === "saved" ? (
                <>
                  <Check className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                  Save Settings
                </>
              )}
            </button>
          </motion.div>

        </div>}
      </div>
    </div>
  )
}
