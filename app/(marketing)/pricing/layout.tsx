import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pricing - Flat Rate AI Support from $49/mo",
  description:
    "Transparent, flat-rate pricing for Replyma AI customer support. Plans from $49/mo with AI auto-replies, 5-channel inbox, and Shopify integration. 3-day free trial, no credit card.",
  keywords: ["customer support platform pricing", "help desk pricing", "AI support pricing", "e-commerce help desk cost", "flat rate support software", "Replyma pricing"],
  openGraph: {
    title: "Pricing | Replyma - Flat Rate AI Support from $49/mo",
    description:
      "Transparent, flat-rate pricing for Replyma AI customer support. Plans from $49/mo with AI auto-replies, 5-channel inbox, and Shopify integration.",
    type: "website",
    url: "https://replyma.com/pricing",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing | Replyma - Flat Rate AI Support from $49/mo",
    description:
      "No per-ticket pricing. AI support plans from $49/mo with Email + Live Chat and Shopify integration. 3-day free trial.",
  },
  alternates: {
    canonical: "https://replyma.com/pricing",
  },
}

const pricingJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Replyma",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: [
    {
      "@type": "Offer",
      name: "Starter",
      price: "49",
      priceCurrency: "USD",
      description: "For small stores. 1 store, 2 agents, 500 AI resolutions/mo, Email + Live Chat.",
      url: "https://replyma.com/pricing",
    },
    {
      "@type": "Offer",
      name: "Growth",
      price: "99",
      priceCurrency: "USD",
      description: "For growing brands. 3 stores, 5 agents, 2,000 AI resolutions/mo, all Email + Live Chat.",
      url: "https://replyma.com/pricing",
    },
    {
      "@type": "Offer",
      name: "Scale",
      price: "199",
      priceCurrency: "USD",
      description: "For high-volume stores. Unlimited stores and agents, 10,000 AI resolutions/mo, dedicated onboarding.",
      url: "https://replyma.com/pricing",
    },
  ],
}

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Do I need a developer to set this up?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Not at all. Replyma connects to Shopify in one click via our official app. You can also connect your Gmail or set up email forwarding. The entire setup takes under 15 minutes with zero code required.",
      },
    },
    {
      "@type": "Question",
      name: "How does the AI know my policies?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You upload your return policy, FAQ document, or help center articles. Our AI uses RAG (Retrieval-Augmented Generation) to search through your content and craft accurate, contextual responses based on your specific rules.",
      },
    },
    {
      "@type": "Question",
      name: "Can humans take over from the AI?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely. The AI handles routine tickets automatically, but any ticket can be escalated to a human agent at any time. Your team can also set rules for when escalation should happen automatically.",
      },
    },
    {
      "@type": "Question",
      name: "What counts as an AI resolution?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "An AI resolution is when the AI agent fully handles a ticket without human intervention. If the AI escalates to a human agent, it does not count as a resolution.",
      },
    },
    {
      "@type": "Question",
      name: "Is there a free trial?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, all plans include a 3-day free trial with full access to all features. No credit card required to start.",
      },
    },
    {
      "@type": "Question",
      name: "What happens when I hit my AI resolution limit?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Tickets will still come in, but the AI will stop auto-replying. Your human agents can continue handling tickets normally. You can upgrade anytime to restore AI capabilities.",
      },
    },
  ],
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {children}
    </>
  )
}
