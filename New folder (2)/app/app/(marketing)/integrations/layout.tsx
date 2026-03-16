import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Integrations - Shopify, WooCommerce, and More",
  description:
    "Connect Replyma with Shopify, WooCommerce, Klaviyo, Recharge, and more. Manage all your e-commerce customer support channels in one unified inbox.",
  keywords: ["Shopify support integration", "WooCommerce help desk", "Klaviyo integration", "e-commerce integrations", "support tool integrations"],
  openGraph: {
    title: "Integrations | Replyma - Connect Your Store and Channels",
    description:
      "Shopify, WooCommerce, Klaviyo and more. Unified inbox with Email and Live Chat.",
    type: "website",
    url: "https://replyma.com/integrations",
  },
  twitter: {
    card: "summary_large_image",
    title: "Integrations | Replyma",
    description:
      "Connect Shopify, WooCommerce, and more. Unified inbox for all your support.",
  },
  alternates: {
    canonical: "https://replyma.com/integrations",
  },
}

export default function IntegrationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
