import type { Metadata } from "next"

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://replyma.com"

export const metadata: Metadata = {
  title: "Partners - Agency and App Partner Programs",
  description:
    "Join the Replyma partner program. 20% recurring commission for agency referrals. API access and co-marketing for app partners. Grow with the AI support platform.",
  keywords: [
    "Replyma partners",
    "agency partner program",
    "support software reseller",
    "API partner",
    "e-commerce integrations",
  ],
  openGraph: {
    title: "Partners | Replyma - Agency and App Partner Programs",
    description:
      "20% recurring commission for agency referrals. API access and co-marketing for app partners.",
    type: "website",
    url: `${BASE}/partners`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Partners | Replyma",
    description:
      "Earn 20% recurring commission as an agency partner or build integrations as an app partner.",
  },
  alternates: {
    canonical: `${BASE}/partners`,
  },
}

export default function PartnersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
