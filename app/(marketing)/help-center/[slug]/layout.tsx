import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getArticleBySlug } from "../articles"

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://replyma.com"

function excerptFromContent(content: string, maxLen = 155): string {
  const plain = content
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\n+/g, " ")
    .trim()
  if (plain.length <= maxLen) return plain
  return plain.slice(0, maxLen - 3).trim() + "..."
}

type Props = { params: Promise<{ slug: string }>; children: React.ReactNode }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article) return { title: "Help Center" }
  const description = excerptFromContent(article.content)
  const url = `${BASE}/help-center/${slug}`
  return {
    title: article.title,
    description,
    openGraph: {
      title: article.title,
      description,
      type: "website",
      url,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
    },
    alternates: { canonical: url },
  }
}

export default async function HelpCenterArticleLayout({ params, children }: Props) {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article) notFound()

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: excerptFromContent(article.content, 200),
    author: { "@type": "Organization", name: "Replyma" },
    publisher: { "@type": "Organization", name: "Replyma", logo: { "@type": "ImageObject", url: `${BASE}/icon.svg` } },
    url: `${BASE}/help-center/${slug}`,
    dateModified: new Date().toISOString().slice(0, 10),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      {children}
    </>
  )
}
