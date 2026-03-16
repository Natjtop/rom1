import type { Metadata } from "next"

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://replyma.com"

export const metadata: Metadata = {
  title: "Changelog - Product Updates and New Features",
  description:
    "Every Replyma product update, new feature, improvement, and fix in reverse chronological order. See what we ship every week to make your support faster.",
  keywords: [
    "Replyma changelog",
    "product updates",
    "support software updates",
    "new features",
    "release notes",
  ],
  openGraph: {
    title: "Changelog | Replyma - Product Updates and New Features",
    description:
      "Every Replyma update in reverse chronological order. New features, improvements, and fixes weekly.",
    type: "website",
    url: `${BASE}/changelog`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Changelog | Replyma",
    description:
      "Product updates, new features, and improvements shipped weekly. Stay up to date with Replyma.",
  },
  alternates: {
    canonical: `${BASE}/changelog`,
  },
}

export default function ChangelogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
