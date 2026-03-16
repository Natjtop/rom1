import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Analytics - Real-Time Support Insights",
  description:
    "Track AI resolution rates, response times, CSAT scores, and per-channel performance in real time. Replyma analytics ships with every plan, no setup needed.",
  keywords: ["customer support analytics", "help desk reporting", "AI resolution rate", "CSAT tracking", "support metrics dashboard", "e-commerce support analytics"],
  openGraph: {
    title: "Analytics | Replyma - Real-Time Support Insights",
    description:
      "Real-time dashboards for AI resolution rates, response times, CSAT scores, and agent performance.",
    type: "website",
    url: "https://replyma.com/features/analytics",
  },
  twitter: {
    card: "summary_large_image",
    title: "Analytics | Replyma",
    description:
      "Real-time support dashboards: AI resolution rates, response times, CSAT, and channel breakdowns.",
  },
  alternates: {
    canonical: "https://replyma.com/features/analytics",
  },
}

export default function AnalyticsFeatureLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
