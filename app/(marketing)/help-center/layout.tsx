import type { Metadata } from "next"

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://replyma.com"

export const metadata: Metadata = {
  title: "Help Center - Guides and Documentation",
  description:
    "Find answers, tutorials, and guides for using Replyma. Learn to set up AI auto-replies, configure channels, integrate Shopify, and optimize your support workflow.",
  keywords: [
    "Replyma help",
    "support documentation",
    "AI setup guide",
    "Shopify integration help",
    "customer support tutorials",
  ],
  openGraph: {
    title: "Help Center | Replyma - Guides and Documentation",
    description:
      "Tutorials and guides for Replyma. Set up AI auto-replies, configure channels, and integrate Shopify.",
    type: "website",
    url: `${BASE}/help-center`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Help Center | Replyma",
    description:
      "91 articles covering AI setup, channel configuration, Shopify integration, automation, and more.",
  },
  alternates: {
    canonical: `${BASE}/help-center`,
  },
}

export default function HelpCenterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
