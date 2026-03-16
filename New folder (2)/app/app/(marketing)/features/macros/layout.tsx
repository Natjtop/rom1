import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Macros and Rules - Visual Automation Builder",
  description:
    "Build visual IF/THEN automation rules in minutes. Automate refunds, routing, tagging, and Shopify actions with Replyma macros and rules engine. No code required.",
  keywords: ["customer support macros", "canned responses help desk", "support automation rules", "help desk macros", "automated ticket routing", "e-commerce support automation"],
  openGraph: {
    title: "Macros and Rules | Replyma - Visual Automation Builder",
    description:
      "Build IF/THEN rules visually. Automate refunds, routing, tagging, and Shopify actions without code.",
    type: "website",
    url: "https://replyma.com/features/macros",
  },
  twitter: {
    card: "summary_large_image",
    title: "Macros and Rules | Replyma",
    description:
      "Visual automation builder for e-commerce support. Build rules in minutes, automate refunds and routing.",
  },
  alternates: {
    canonical: "https://replyma.com/features/macros",
  },
}

export default function MacrosFeatureLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
