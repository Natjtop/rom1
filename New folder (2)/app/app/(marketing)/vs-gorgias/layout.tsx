import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    absolute: "Replyma vs Gorgias - Flat Rate vs Per-Ticket",
  },
  description:
    "Compare Replyma and Gorgias side by side. Flat-rate pricing vs per-ticket fees, real AI vs rule-based macros, Email + Live Chat included. See why brands switch.",
  keywords: ["Gorgias alternative", "better than Gorgias", "Gorgias vs Replyma", "Gorgias competitor", "Gorgias replacement", "cheaper than Gorgias"],
  openGraph: {
    title: "Replyma vs Gorgias - Flat Rate vs Per-Ticket",
    description:
      "Flat-rate pricing, real AI, Email + Live Chat included. Compare features, pricing, and ROI side by side.",
    type: "website",
    url: "https://replyma.com/vs-gorgias",
  },
  twitter: {
    card: "summary_large_image",
    title: "Replyma vs Gorgias",
    description:
      "Gorgias charges per ticket. Replyma does not. Compare features, pricing, and AI capabilities.",
  },
  alternates: {
    canonical: "https://replyma.com/vs-gorgias",
  },
}

const comparisonJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Replyma vs Gorgias Comparison",
  description: "Side-by-side comparison of Replyma and Gorgias for e-commerce customer support.",
  url: "https://replyma.com/vs-gorgias",
  mainEntity: {
    "@type": "SoftwareApplication",
    name: "Replyma",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "49",
      priceCurrency: "USD",
    },
    featureList: [
      "AI auto-resolution",
      "Simple plan-based pricing",
      "Email and Live Chat",
      "Knowledge base with RAG",
      "Gmail OAuth integration",
      "Visual automation builder",
      "Shopify Billing API",
      "GDPR compliance built-in",
    ],
  },
}

export default function VsGorgiasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(comparisonJsonLd) }}
      />
      {children}
    </>
  )
}
