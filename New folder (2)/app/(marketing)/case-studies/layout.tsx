import type { Metadata } from "next"

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://replyma.com"

export const metadata: Metadata = {
  title: "Case Studies - Real Results from Real Stores",
  description:
    "See how e-commerce brands use Replyma to cut response times by 96%, automate 80% of tickets, and save tens of thousands per year with AI-powered support.",
  keywords: [
    "Replyma case studies",
    "e-commerce support success",
    "AI support results",
    "customer support ROI",
    "support automation case study",
  ],
  openGraph: {
    title: "Case Studies | Replyma - Real Results from Real Stores",
    description:
      "E-commerce brands cutting response times by 96% and automating 80% of tickets with Replyma AI.",
    type: "website",
    url: `${BASE}/case-studies`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Case Studies | Replyma",
    description:
      "Real results: 80% AI resolution, 96% faster responses, major annual savings.",
  },
  alternates: {
    canonical: `${BASE}/case-studies`,
  },
}

export default function CaseStudiesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
