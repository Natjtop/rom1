import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Unified Inbox - Email + Live Chat, Zero Tab-Switching",
  description:
    "Manage Email and Live Chat in one unified inbox. Full customer history with AI triage, smart routing, and saved replies. Built for e-commerce support teams.",
  keywords: ["unified inbox customer support", "omnichannel inbox", "shared inbox for support", "email and live chat inbox", "customer support inbox", "e-commerce support inbox"],
  openGraph: {
    title: "Unified Inbox | Replyma - Email + Live Chat, One View",
    description:
      "Email and Live Chat in one inbox with AI triage and smart routing.",
    type: "website",
    url: "https://replyma.com/features/inbox",
  },
  twitter: {
    card: "summary_large_image",
    title: "Unified Inbox | Replyma",
    description:
      "Two channels, zero context-switching. Email and Live Chat.",
  },
  alternates: {
    canonical: "https://replyma.com/features/inbox",
  },
}

export default function InboxFeatureLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
