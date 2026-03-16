import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Replyma - Our Mission and Team",
  description:
    "Replyma was built to make world-class support accessible to every e-commerce store. Meet our team, learn our values, and see why 2,000+ stores trust us.",
  keywords: ["Replyma team", "about Replyma", "AI customer support company", "e-commerce support startup"],
  openGraph: {
    title: "About Replyma - Our Mission and Team",
    description:
      "Making world-class customer support accessible to every e-commerce store. Meet our team.",
    type: "website",
    url: "https://replyma.com/about",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Replyma",
    description:
      "Making world-class support accessible to every store. Meet the team behind Replyma.",
  },
  alternates: {
    canonical: "https://replyma.com/about",
  },
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
