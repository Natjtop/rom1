import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Live Chat - AI Chat Widget for E-commerce",
  description:
    "Embeddable AI live chat widget for your store. Configure when it appears and the greeting; the AI answers with your brand voice across Email and Live Chat.",
  keywords: ["live chat for e-commerce", "website live chat widget", "AI live chat", "e-commerce live chat", "customer support chat"],
  openGraph: {
    title: "Live Chat | Replyma - AI Chat for E-commerce",
    description:
      "AI chat widget for your store. Configure appearance and greeting; the AI handles conversations in your brand voice.",
    type: "website",
    url: "https://replyma.com/features/live-chat",
  },
  twitter: {
    card: "summary_large_image",
    title: "Live Chat | Replyma",
    description:
      "AI chat widget for e-commerce. One inbox for Email and Live Chat; AI answers with your brand voice.",
  },
  alternates: {
    canonical: "https://replyma.com/features/live-chat",
  },
}

export default function LiveChatFeatureLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
