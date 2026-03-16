import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { LegalMarkdown } from "@/components/marketing/legal-markdown";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://replyma.com";

export const metadata = {
  title: "Terms of Service",
  description:
    "Replyma Terms of Service by DECODS LLC. Terms governing the use of the Replyma AI customer support platform, billing, and data handling.",
  keywords: [
    "Replyma terms of service",
    "terms of use",
    "platform terms",
    "SaaS terms",
    "customer support software terms",
  ],
  openGraph: {
    title: "Terms of Service | Replyma",
    description:
      "DECODS LLC Terms of Service. Terms governing the use of the Replyma platform.",
    type: "website",
    url: `${BASE}/terms`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service | Replyma",
    description:
      "DECODS LLC Terms of Service covering platform use, billing, and data handling.",
  },
  alternates: {
    canonical: `${BASE}/terms`,
  },
};

function getTermsContent(): string {
  try {
    const filePath = path.join(process.cwd(), "docs/legal/TERMS_OF_SERVICE.md");
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

export default function TermsPage() {
  const content = getTermsContent();
  if (!content) {
    return (
      <div className="mx-auto max-w-3xl px-6 pt-[146px] pb-24 sm:pt-[178px] sm:pb-32">
        <nav className="mb-8 text-sm text-muted-foreground">
          <Link href="/" className="text-accent hover:underline">
            ← Replyma
          </Link>
        </nav>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-4 text-muted-foreground">
          Content is loading. If this persists, the terms document may be
          unavailable. Contact{" "}
          <a href="mailto:legal@replyma.com" className="text-accent underline">
            legal@replyma.com
          </a>
          .
        </p>
        <p className="mt-4">
          <Link href="/privacy" className="text-accent underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-3xl px-6 pt-[98px] pb-12 sm:pt-[114px] sm:pb-16">
      <nav className="mb-10 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <Link href="/" className="text-accent hover:underline">
          ← Replyma
        </Link>
        <span aria-hidden className="text-border">
          ·
        </span>
        <Link href="/privacy" className="text-accent hover:underline">
          Privacy Policy
        </Link>
      </nav>
      <LegalMarkdown content={content} />
      <footer className="mt-14 border-t border-border pt-8 text-sm text-muted-foreground">
        <Link href="/" className="text-accent hover:underline">
          Back to Replyma
        </Link>
        {" · "}
        <Link href="/privacy" className="text-accent hover:underline">
          Privacy Policy
        </Link>
      </footer>
    </div>
  );
}
