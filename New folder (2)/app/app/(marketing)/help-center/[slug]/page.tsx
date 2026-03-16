"use client"

import { use } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, BookOpen, ChevronRight, Clock } from "lucide-react"
import { getArticleBySlug, categories } from "../articles"

const ease = [0.23, 1, 0.32, 1] as const

function renderMarkdown(md: string) {
  const lines = md.split("\n")
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith("## ")) {
      elements.push(<h2 key={i} className="text-[1.5rem] font-semibold tracking-tight text-foreground mt-8 mb-4 first:mt-0">{line.slice(3)}</h2>)
    } else if (line.startsWith("### ")) {
      elements.push(<h3 key={i} className="text-[1.1rem] font-semibold text-foreground mt-6 mb-3">{line.slice(4)}</h3>)
    } else if (line.startsWith("- ")) {
      const items: string[] = []
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2))
        i++
      }
      elements.push(
        <ul key={`ul-${i}`} className="my-3 ml-1 flex flex-col gap-2">
          {items.map((item, j) => (
            <li key={j} className="flex gap-2.5 text-[15px] leading-relaxed text-foreground/80">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/40" />
              <span dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
            </li>
          ))}
        </ul>
      )
      continue
    } else if (line.startsWith("| ")) {
      const rows: string[][] = []
      while (i < lines.length && lines[i].startsWith("| ") || lines[i]?.startsWith("|--")) {
        if (!lines[i].startsWith("|--")) {
          rows.push(lines[i].split("|").filter(Boolean).map(c => c.trim()))
        }
        i++
      }
      if (rows.length > 0) {
        const [header, ...body] = rows
        elements.push(
          <div key={`table-${i}`} className="my-4 overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border/60 bg-secondary/30">
                  {header.map((h, j) => <th key={j} className="px-4 py-2.5 text-left font-semibold text-foreground">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {body.map((row, j) => (
                  <tr key={j} className="border-b border-border/30 last:border-0">
                    {row.map((cell, k) => <td key={k} className="px-4 py-2.5 text-foreground/80"><code className="rounded bg-secondary/60 px-1.5 py-0.5 text-[12px] font-mono">{cell.replace(/`/g, "")}</code></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
        continue
      }
    } else if (line.startsWith("1. ")) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""))
        i++
      }
      elements.push(
        <ol key={`ol-${i}`} className="my-3 ml-1 flex flex-col gap-2">
          {items.map((item, j) => (
            <li key={j} className="flex gap-2.5 text-[15px] leading-relaxed text-foreground/80">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[11px] font-bold text-accent">{j + 1}</span>
              <span dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
            </li>
          ))}
        </ol>
      )
      continue
    } else if (line.startsWith("`") && line.endsWith("`") && !line.startsWith("``")) {
      elements.push(<pre key={i} className="my-3 rounded-lg bg-secondary/50 px-4 py-3 text-[13px] font-mono text-foreground/80 overflow-x-auto">{line.slice(1, -1)}</pre>)
    } else if (line.trim() === "") {
      // skip blank lines
    } else {
      elements.push(<p key={i} className="text-[15px] leading-[1.8] text-foreground/80 my-2" dangerouslySetInnerHTML={{ __html: inlineFormat(line) }} />)
    }
    i++
  }

  return elements
}

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
    .replace(/`(.+?)`/g, '<code class="rounded bg-secondary/60 px-1.5 py-0.5 text-[13px] font-mono text-accent">$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, (_match, label, url) => {
      // Block javascript: and data: URLs
      const safeUrl = /^(https?:\/\/|\/|#|mailto:)/.test(url) ? url : "#"
      return `<a href="${safeUrl}" class="text-accent underline underline-offset-2 hover:text-accent/80">${label}</a>`
    })
}

export default function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const article = getArticleBySlug(slug)

  if (!article) return notFound()

  const category = categories.find(c => c.articles.some(a => a.slug === slug))
  const categoryArticles = category?.articles.filter(a => a.slug !== slug).slice(0, 4) ?? []

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-[98px] pb-24 sm:pt-[114px]">
        {/* Breadcrumb — wrapped for mobile */}
        <motion.nav
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease }}
          className="mb-4 sm:mb-8 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] sm:text-[13px] text-muted-foreground min-w-0"
          aria-label="Breadcrumb"
        >
          <Link href="/help-center" className="hover:text-foreground transition-colors shrink-0">Help Center</Link>
          <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/60" aria-hidden />
          <span className="text-foreground/60 shrink-0">{article.category}</span>
          <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/60" aria-hidden />
          <span className="text-foreground truncate min-w-0 max-w-[180px] sm:max-w-[280px]">{article.title}</span>
        </motion.nav>

        {/* Back link — touch-friendly on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease }}
        >
          <Link
            href="/help-center"
            className="mb-6 sm:mb-8 inline-flex items-center gap-1.5 text-[12px] sm:text-[13px] font-medium text-accent transition-colors hover:text-accent/80 py-2 -ml-1 min-h-[44px] sm:min-h-0 sm:py-0"
          >
            <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
            Back to Help Center
          </Link>
        </motion.div>

        {/* Article */}
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, duration: 0.4, ease }}
          className="rounded-xl border border-border/60 bg-card p-8 shadow-sm sm:p-10 md:p-12"
        >
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-[12px] font-medium text-accent">
              <BookOpen className="h-3 w-3" />
              {article.category}
            </span>
          </div>

          <div className="prose-custom">
            {renderMarkdown(article.content)}
          </div>
        </motion.article>

        {/* Related articles */}
        {categoryArticles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4, ease }}
            className="mt-10"
          >
            <h3 className="mb-4 text-[15px] font-semibold text-foreground">More in {article.category}</h3>
            <div className="flex flex-col gap-2">
              {categoryArticles.map(a => (
                <Link
                  key={a.slug}
                  href={`/help-center/${a.slug}`}
                  className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card px-5 py-4 transition-all duration-200 hover:border-border hover:shadow-[0_4px_12px_-4px_rgb(0_0_0/0.06)]"
                >
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-all group-hover:text-accent group-hover:translate-x-0.5" />
                  <span className="text-[14px] font-medium text-foreground group-hover:text-accent transition-colors">{a.title}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
