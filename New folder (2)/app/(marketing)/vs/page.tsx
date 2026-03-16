import Link from "next/link";
import { getGeneratedSlugs } from "@/lib/pseo-data";
import { COMPETITOR_LIST } from "@/data/competitors";
import { Card, CardContent } from "@/components/ui/card";
import { PseoContainer, PseoSection } from "@/components/pseo/pseo-layout";
import {
  ShoppingBag,
  Headphones,
  MessageCircle,
  Bot,
  Users,
  type LucideIcon,
} from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://replyma.com";

export const metadata = {
  title: "Replyma vs Competitors — Compare AI Support Tools for E-commerce",
  description:
    "Compare Replyma with Gorgias, Zendesk, Freshdesk, Tidio, and 60+ customer support tools. See which AI support solution fits your e-commerce store.",
  keywords: [
    "Replyma vs Gorgias",
    "Replyma vs Zendesk",
    "AI support comparison",
    "e-commerce helpdesk comparison",
    "customer support software",
  ],
  openGraph: {
    title: "Replyma vs Competitors — Compare AI Support Tools | Replyma",
    description:
      "Compare Replyma with Gorgias, Zendesk, Freshdesk, Tidio, and 60+ customer support tools. See which AI support solution fits your e-commerce store.",
    type: "website" as const,
    url: `${BASE}/vs`,
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Replyma vs Competitors — Compare AI Support Tools",
    description:
      "Compare Replyma with Gorgias, Zendesk, Freshdesk, Tidio, and 60+ customer support tools for e-commerce.",
  },
  alternates: { canonical: `${BASE}/vs` },
};

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "ecommerce-specific": ShoppingBag,
  helpdesk: Headphones,
  "live-chat": MessageCircle,
  "ai-support": Bot,
  crm: Users,
};

const CATEGORY_LABELS: Record<string, string> = {
  "ecommerce-specific": "E-commerce specific",
  helpdesk: "Helpdesk",
  "live-chat": "Live chat",
  "ai-support": "AI support",
  crm: "CRM",
};

export default function VSHubPage() {
  const slugs = getGeneratedSlugs("vs");
  const byCategory = COMPETITOR_LIST.reduce<Record<string, string[]>>((acc, c) => {
    if (!slugs.includes(c.slug)) return acc;
    const cat = c.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(c.slug);
    return acc;
  }, {});

  const categories = ["ecommerce-specific", "helpdesk", "live-chat", "ai-support", "crm"];

  return (
    <>
      <PseoSection gradient firstSection>
        <PseoContainer>
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-foreground">
              Replyma vs competitors
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Compare Replyma with other customer support and helpdesk tools. Choose the best AI support solution for your e-commerce store.
            </p>
          </div>
        </PseoContainer>
      </PseoSection>
      <PseoSection>
        <PseoContainer>
          {slugs.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No comparison pages yet. Run{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm">npm run pseo:generate</code>{" "}
              to generate content.
            </p>
          ) : (
            <div className="space-y-10">
              {categories.map((cat) => {
                const list = byCategory[cat];
                if (!list?.length) return null;
                const Icon = CATEGORY_ICONS[cat] ?? Headphones;
                const label = CATEGORY_LABELS[cat] ?? cat.replace(/-/g, " ");
                return (
                  <section key={cat}>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-foreground">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      {label}
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {list.map((slug) => {
                        const name = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                        return (
                          <Link key={slug} href={`/vs/${slug}`} className="block">
                            <Card className="rounded-xl border-border/60 shadow-sm transition-all duration-200 hover:border-border hover:shadow-md h-full">
                              <CardContent className="pt-5 pb-5 flex items-center gap-4">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-lg font-semibold text-foreground">
                                  {name.charAt(0)}
                                </span>
                                <div className="min-w-0">
                                  <p className="font-semibold text-foreground">Replyma vs {name}</p>
                                  <p className="text-sm text-muted-foreground mt-0.5">
                                    Comparison & verdict
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </PseoContainer>
      </PseoSection>
    </>
  );
}
