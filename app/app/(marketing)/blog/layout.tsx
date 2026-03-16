import type { Metadata } from "next"

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://replyma.com"

export const metadata: Metadata = {
  title: "Blog - E-commerce Support Tips and Updates",
  description:
    "Guides, case studies, and product updates from the Replyma team. AI automation strategies, e-commerce support best practices, and actionable tips for support leads.",
  keywords: [
    "e-commerce support blog",
    "customer support tips",
    "AI automation",
    "support best practices",
    "Replyma updates",
  ],
  openGraph: {
    title: "Blog | Replyma - E-commerce Support Tips and Updates",
    description:
      "Guides, case studies, and product updates. AI automation strategies and support best practices.",
    type: "website",
    url: `${BASE}/blog`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog | Replyma",
    description:
      "AI automation strategies, support best practices, and product updates from the Replyma team.",
  },
  alternates: {
    canonical: `${BASE}/blog`,
  },
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
