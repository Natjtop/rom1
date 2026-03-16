import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "API Documentation - Developer Reference",
  description:
    "Replyma REST API documentation for developers. Authenticate, manage tickets, customers, channels, and integrate Replyma into your custom workflows programmatically.",
  keywords: ["Replyma API", "help desk API", "customer support API", "REST API documentation", "developer reference"],
  openGraph: {
    title: "API Documentation | Replyma - Developer Reference",
    description:
      "Replyma REST API documentation for developers. Authenticate, manage tickets, customers, channels, and integrate Replyma into your workflows.",
    type: "website",
    url: "https://replyma.com/api-docs",
  },
  twitter: {
    card: "summary_large_image",
    title: "API Documentation | Replyma",
    description:
      "REST API docs for developers. Manage tickets, customers, and channels programmatically.",
  },
  alternates: {
    canonical: "https://replyma.com/api-docs",
  },
}

export default function ApiDocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
