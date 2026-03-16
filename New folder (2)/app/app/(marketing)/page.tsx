import type { Metadata } from "next"
import { HeroSection } from "@/components/marketing/hero-section"
import { LogoMarquee } from "@/components/marketing/logo-marquee"
import { BentoGrid } from "@/components/marketing/bento-grid"
import { HowItWorks } from "@/components/marketing/how-it-works"
import { Testimonials } from "@/components/marketing/testimonials"
import { CTASection } from "@/components/marketing/cta-section"

export const metadata: Metadata = {
  title: {
    absolute: "Replyma - AI-Powered Customer Support for E-commerce",
  },
  description:
    "Resolve up to 80% of support tickets automatically with AI. Unified inbox for Email and Live Chat. Built for Shopify and e-commerce businesses.",
  keywords: [
    "AI customer support platform",
    "AI help desk",
    "e-commerce customer service",
    "Shopify support",
    "AI auto-reply",
    "unified inbox",
    "customer support automation",
    "e-commerce helpdesk",
  ],
  openGraph: {
    title: "Replyma - AI-Powered Customer Support for E-commerce",
    description:
      "Resolve up to 80% of support tickets automatically with AI. Unified inbox for Email and Live Chat. Built for Shopify and e-commerce businesses.",
    type: "website",
    url: "https://replyma.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Replyma - AI-Powered Customer Support for E-commerce",
    description:
      "Resolve up to 80% of support tickets automatically with AI. Unified inbox across Email and Live Chat. Built for Shopify.",
  },
  alternates: {
    canonical: "https://replyma.com",
  },
}

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Replyma",
  url: "https://replyma.com",
  logo: "https://replyma.com/icon.svg",
  description:
    "AI-powered customer support platform for e-commerce businesses. Unified inbox with AI auto-replies across Email and Live Chat.",
  sameAs: ["https://x.com/replyma", "https://linkedin.com/company/replyma"],
  contactPoint: {
    "@type": "ContactPoint",
    email: "hello@replyma.com",
    contactType: "sales",
  },
}

const webSiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Replyma",
  url: "https://replyma.com",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://replyma.com/help-center?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
}

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Replyma",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "AI-powered customer support platform that resolves up to 80% of e-commerce tickets automatically across Email and Live Chat.",
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "0",
    highPrice: "199",
    priceCurrency: "USD",
    offerCount: "4",
  },
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <HeroSection />
      <LogoMarquee />
      <BentoGrid />
      <HowItWorks />
      <Testimonials />
      <CTASection />
    </>
  )
}
