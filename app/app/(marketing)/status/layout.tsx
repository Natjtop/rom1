import type { Metadata } from "next"

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://replyma.com"

export const metadata: Metadata = {
  title: "System Status - Uptime and Incident History",
  description:
    "Real-time status of all Replyma services. 99.98% average uptime across API, Dashboard, AI Agent, Email Delivery, and Webhooks. View incident history.",
  keywords: [
    "Replyma status",
    "support platform uptime",
    "service status",
    "incident history",
    "API status",
  ],
  openGraph: {
    title: "System Status | Replyma - Uptime and Incident History",
    description:
      "Real-time status for all Replyma services. 99.98% average uptime with full incident history.",
    type: "website",
    url: `${BASE}/status`,
  },
  twitter: {
    card: "summary_large_image",
    title: "System Status | Replyma",
    description:
      "Real-time health and incident history for all Replyma services. 99.98% average uptime.",
  },
  alternates: {
    canonical: `${BASE}/status`,
  },
}

export default function StatusLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
