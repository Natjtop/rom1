import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Shopify Integration - Order Actions in Tickets",
  description:
    "Deep Shopify integration with one-click refunds, order cancellation, address edits, and real-time data inside every ticket. OAuth install, no developer needed.",
  keywords: ["Shopify customer support app", "Shopify help desk", "Shopify order management", "Shopify support integration", "Shopify refund automation", "Shopify customer service"],
  openGraph: {
    title: "Shopify Integration | Replyma - Order Actions in Tickets",
    description:
      "One-click refunds, order edits, and real-time Shopify data inside every ticket. OAuth install in seconds.",
    type: "website",
    url: "https://replyma.com/features/shopify",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shopify Integration | Replyma",
    description:
      "Your Shopify admin, inside the ticket. Refunds, order edits, and live data with one-click install.",
  },
  alternates: {
    canonical: "https://replyma.com/features/shopify",
  },
}

export default function ShopifyFeatureLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
