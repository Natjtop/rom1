import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "AI Agent - Resolve 80% of Tickets Automatically",
  description:
    "Replyma's AI Agent resolves 80% of support tickets autonomously. Reads live Shopify data, references your policies via RAG, and replies in under 5 seconds across all channels.",
  keywords: ["AI auto-reply customer support", "AI ticket resolution", "autonomous AI agent", "e-commerce AI support", "Shopify AI agent", "automated customer service", "RAG customer support"],
  openGraph: {
    title: "AI Agent | Replyma - Resolve 80% of Tickets Automatically",
    description:
      "AI that reads live Shopify data, references your policies via RAG, and sends complete replies in under 5 seconds. Not a chatbot -- a real autonomous agent.",
    type: "website",
    url: "https://replyma.com/features/ai-agent",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Agent | Replyma",
    description:
      "Resolve 80% of support tickets automatically. AI reads orders, cites your policies, and replies in under 5 seconds.",
  },
  alternates: {
    canonical: "https://replyma.com/features/ai-agent",
  },
}

export default function AIAgentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
