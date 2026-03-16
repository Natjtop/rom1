import type { Metadata } from "next"
import { MarketingHeader } from "@/components/marketing/header"
import { MarketingFooter } from "@/components/marketing/footer"
import { WidgetInLayout } from "@/components/marketing/widget-in-layout"

export const metadata: Metadata = {
  title: {
    template: "%s | Replyma",
    default: "Replyma - AI-Powered Customer Support for E-commerce",
  },
  description:
    "Resolve up to 80% of support tickets automatically with AI. Unified inbox for Email and Live Chat. Built for Shopify and e-commerce.",
  keywords: [
    "AI customer support",
    "e-commerce helpdesk",
    "Shopify support",
    "unified inbox",
    "AI auto-reply",
    "customer service automation",
    "live chat",
    "Replyma",
  ],
  authors: [{ name: "Replyma" }],
  creator: "Replyma",
  publisher: "Replyma",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Replyma",
    title: "Replyma - AI-Powered Customer Support for E-commerce",
    description:
      "Resolve up to 80% of support tickets automatically with AI. Unified inbox for Email and Live Chat. Built for Shopify and e-commerce.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Replyma - AI Customer Support" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Replyma - AI-Powered Customer Support for E-commerce",
    description:
      "Resolve up to 80% of support tickets automatically with AI. Unified inbox for Email and Live Chat.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background" data-marketing>
      <MarketingHeader />
      <main id="main-content" className="flex-1">{children}</main>
      <MarketingFooter />
      <WidgetInLayout />
    </div>
  )
}
