import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    absolute: "Replyma vs Zendesk - E-commerce AI vs Enterprise IT",
  },
  description:
    "Compare Replyma and Zendesk for e-commerce support. Purpose-built AI vs generic IT helpdesk, 10-minute setup vs weeks, flat pricing vs per-agent fees.",
  keywords: ["Zendesk alternative", "better than Zendesk", "Zendesk vs Replyma", "Zendesk competitor", "Zendesk for e-commerce", "Zendesk replacement"],
  openGraph: {
    title: "Replyma vs Zendesk - E-commerce AI vs Enterprise IT",
    description:
      "Purpose-built for e-commerce vs enterprise IT. 10-minute setup, flat pricing, native Shopify.",
    type: "website",
    url: "https://replyma.com/vs-zendesk",
  },
  twitter: {
    card: "summary_large_image",
    title: "Replyma vs Zendesk",
    description:
      "Zendesk is built for IT. Replyma is built for e-commerce. Compare features, setup, and pricing.",
  },
  alternates: {
    canonical: "https://replyma.com/vs-zendesk",
  },
}

const comparisonJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Replyma vs Zendesk Comparison",
  description: "Side-by-side comparison of Replyma and Zendesk for e-commerce customer support.",
  url: "https://replyma.com/vs-zendesk",
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
      "Quick setup (< 15 min)",
      "Simple plan-based pricing",
      "Native Shopify integration",
      "Built for e-commerce",
      "Email and Live Chat",
      "Knowledge base with RAG",
    ],
  },
}

export default function VsZendeskLayout({
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
