import type { MetadataRoute } from "next"
import { getGeneratedSlugs } from "@/lib/pseo-data"
import { allArticles } from "@/app/(marketing)/help-center/articles"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://replyma.com"
  const now = new Date().toISOString()

  const staticPages: { path: string; priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }[] = [
    // Homepage
    { path: "", priority: 1.0, changeFrequency: "weekly" },
    // Core pages
    { path: "/pricing", priority: 0.9, changeFrequency: "monthly" },
    // Feature pages
    { path: "/features/ai-agent", priority: 0.8, changeFrequency: "monthly" },
    { path: "/features/inbox", priority: 0.8, changeFrequency: "monthly" },
    { path: "/features/shopify", priority: 0.8, changeFrequency: "monthly" },
    { path: "/features/live-chat", priority: 0.8, changeFrequency: "monthly" },
    { path: "/features/macros", priority: 0.8, changeFrequency: "monthly" },
    { path: "/features/analytics", priority: 0.8, changeFrequency: "monthly" },
    { path: "/features/shopping-assistant", priority: 0.8, changeFrequency: "monthly" },
    // Comparison pages
    { path: "/vs-gorgias", priority: 0.8, changeFrequency: "monthly" },
    { path: "/vs-zendesk", priority: 0.8, changeFrequency: "monthly" },
    // Integrations
    { path: "/integrations", priority: 0.7, changeFrequency: "monthly" },
    // Content pages
    { path: "/about", priority: 0.6, changeFrequency: "monthly" },
    { path: "/blog", priority: 0.7, changeFrequency: "weekly" },
    { path: "/case-studies", priority: 0.7, changeFrequency: "monthly" },
    { path: "/changelog", priority: 0.6, changeFrequency: "weekly" },
    { path: "/help-center", priority: 0.7, changeFrequency: "weekly" },
    { path: "/careers", priority: 0.5, changeFrequency: "monthly" },
    { path: "/partners", priority: 0.5, changeFrequency: "monthly" },
    // Trust (no /security page — removed from sitemap to avoid 404)
    { path: "/status", priority: 0.5, changeFrequency: "weekly" },
    // Developer
    { path: "/api-docs", priority: 0.5, changeFrequency: "monthly" },
    // Legal
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  ]

  const helpArticleSlugs = allArticles.map((a) => a.slug)

  // Hub pages: always in sitemap (do not depend on data/generated)
  const hubEntries: MetadataRoute.Sitemap = [
    { url: `${base}/vs`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${base}/alternatives`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${base}/for`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${base}/guides`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${base}/resources`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 },
  ]

  // pSEO subpages: from data/generated (on server set PSEO_DATA_ROOT if app runs from .next/standalone)
  const pseoEntries: MetadataRoute.Sitemap = []
  try {
    const vsSlugs = getGeneratedSlugs("vs")
    const altSlugs = getGeneratedSlugs("alternatives")
    const nicheSlugs = getGeneratedSlugs("niche-landing")
    const guideSlugs = getGeneratedSlugs("problem-guide")
    const integrationSlugs = getGeneratedSlugs("integration")
    const checklistSlugs = getGeneratedSlugs("checklist")

    vsSlugs.forEach((slug) =>
      pseoEntries.push({
        url: `${base}/vs/${slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.8,
      })
    )
    altSlugs.forEach((slug) =>
      pseoEntries.push({
        url: `${base}/alternatives/${slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
      })
    )
    nicheSlugs.forEach((slug) =>
      pseoEntries.push({
        url: `${base}/for/${slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.8,
      })
    )
    guideSlugs.forEach((slug) =>
      pseoEntries.push({
        url: `${base}/guides/${slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
      })
    )
    integrationSlugs.forEach((slug) =>
      pseoEntries.push({
        url: `${base}/integrations/${slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6,
      })
    )
    checklistSlugs.forEach((slug) =>
      pseoEntries.push({
        url: `${base}/resources/checklists/${slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6,
      })
    )
  } catch {
    // No generated data or fs unavailable — hub entries still included below
  }

  return [
    ...staticPages.map((page) => ({
      url: page.path ? `${base}${page.path}` : base,
      lastModified: now,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    ...helpArticleSlugs.map((slug) => ({
      url: `${base}/help-center/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...hubEntries,
    ...pseoEntries,
  ]
}
