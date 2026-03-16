import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Shopping Assistant - AI Product Recommendations",
  description:
    "Turn browsers into buyers with Replyma AI shopping assistant. Product recommendations, in-chat cart building, upsells, and guided shopping inside the chat widget.",
  keywords: ["AI shopping assistant", "e-commerce product recommendations", "conversational commerce", "AI upsell", "shopping chatbot", "guided shopping AI"],
  openGraph: {
    title: "Shopping Assistant | Replyma - AI Product Recommendations",
    description:
      "AI shopping assistant that recommends products, builds carts, triggers upsells, and guides to checkout.",
    type: "website",
    url: "https://replyma.com/features/shopping-assistant",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shopping Assistant | Replyma",
    description:
      "AI that recommends products, builds carts, and triggers upsells. Turn browsers into buyers.",
  },
  alternates: {
    canonical: "https://replyma.com/features/shopping-assistant",
  },
}

export default function ShoppingAssistantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
