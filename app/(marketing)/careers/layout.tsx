import type { Metadata } from "next"

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://replyma.com"

export const metadata: Metadata = {
  title: "Careers - Join the Replyma Team",
  description:
    "Join a small, remote-first team building the AI support platform e-commerce brands deserve. Open roles in engineering, design, sales, and customer success.",
  keywords: [
    "Replyma careers",
    "customer support jobs",
    "remote support jobs",
    "AI company jobs",
    "e-commerce tech careers",
  ],
  openGraph: {
    title: "Careers | Replyma - Join Our Team",
    description:
      "Remote-first team building AI customer support. Open roles in engineering, design, sales, and more.",
    type: "website",
    url: `${BASE}/careers`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Careers | Replyma",
    description:
      "Join our remote-first team building AI support for e-commerce. View open positions.",
  },
  alternates: {
    canonical: `${BASE}/careers`,
  },
}

export default function CareersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
