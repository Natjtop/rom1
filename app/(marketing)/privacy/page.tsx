import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { LegalMarkdown } from "@/components/marketing/legal-markdown";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://replyma.com";

export const metadata = {
  title: "Privacy Policy",
  description:
    "Replyma Privacy Policy by DECODS LLC. How we collect, use, and protect your data. GDPR, UK GDPR, CCPA compliant.",
  keywords: [
    "Replyma privacy policy",
    "GDPR",
    "CCPA",
    "data protection",
    "customer data privacy",
  ],
  openGraph: {
    title: "Privacy Policy | Replyma",
    description:
      "DECODS LLC Privacy Policy. How Replyma collects, uses, and protects your data. GDPR compliant.",
    type: "website",
    url: `${BASE}/privacy`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | Replyma",
    description: "DECODS LLC Privacy Policy. GDPR compliant with full transparency.",
  },
  alternates: {
    canonical: `${BASE}/privacy`,
  },
};

function getPrivacyContent(): string {
  try {
    const filePath = path.join(process.cwd(), "docs/legal/PRIVACY_POLICY.md");
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

export default function PrivacyPage() {
  const content = getPrivacyContent();
  if (!content) {
    return (
      <div className="mx-auto max-w-3xl px-6 pt-[146px] pb-24 sm:pt-[178px] sm:pb-32">
        <nav className="mb-8 text-sm text-muted-foreground">
          <Link href="/" className="text-accent hover:underline">
            ← Replyma
          </Link>
        </nav>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-muted-foreground">
          Content is loading. If this persists, the policy document may be
          unavailable. Contact{" "}
          <a href="mailto:privacy@replyma.com" className="text-accent underline">
            privacy@replyma.com
          </a>
          .
        </p>
        <p className="mt-4">
          <Link href="/terms" className="text-accent underline">
            Terms of Service
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
        <Link href="/terms" className="text-accent hover:underline">
          Terms of Service
        </Link>
      </nav>
      <LegalMarkdown content={content} />
      <footer className="mt-14 border-t border-border pt-8 text-sm text-muted-foreground">
        <Link href="/" className="text-accent hover:underline">
          Back to Replyma
        </Link>
        {" · "}
        <Link href="/terms" className="text-accent hover:underline">
          Terms of Service
        </Link>
      </footer>
    </div>
  );
}
