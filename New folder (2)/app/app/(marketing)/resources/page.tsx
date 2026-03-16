import Link from "next/link";
import { getGeneratedSlugs, getGeneratedPage } from "@/lib/pseo-data";
import type { SupportChecklist } from "@/types/pseo";
import { Card, CardContent } from "@/components/ui/card";
import { PseoContainer, PseoSection } from "@/components/pseo/pseo-layout";
import { ClipboardList } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://replyma.com";

export const metadata = {
  title: "E-commerce Support Checklists — 2026",
  description:
    "Checklists for holiday prep, new store launch, AI implementation, Black Friday, and customer support best practices.",
  keywords: [
    "support checklists",
    "e-commerce checklists",
    "holiday support prep",
    "AI implementation",
    "customer support best practices",
  ],
  openGraph: {
    title: "E-commerce Support Checklists — 2026 | Replyma",
    description:
      "Checklists for holiday prep, new store launch, AI implementation, Black Friday, and customer support best practices.",
    type: "website" as const,
    url: `${BASE}/resources`,
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "E-commerce Support Checklists — 2026",
    description:
      "Checklists for holiday prep, new store launch, AI implementation, and support best practices.",
  },
  alternates: { canonical: `${BASE}/resources` },
};

export default function ResourcesHubPage() {
  const slugs = getGeneratedSlugs("checklist");

  return (
    <>
      <PseoSection gradient firstSection>
        <PseoContainer>
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-foreground">
              Support checklists
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Step-by-step checklists for e-commerce customer support — from holiday prep to AI implementation. Use Replyma to automate where possible.
            </p>
          </div>
        </PseoContainer>
      </PseoSection>
      <PseoSection>
        <PseoContainer>
          {slugs.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No checklists yet. Run{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm">npm run pseo:generate</code>{" "}
              to generate content.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {slugs.map((slug) => {
                const data = getGeneratedPage<SupportChecklist>("checklist", slug);
                const title = data?.seo?.title ?? slug.replace(/-/g, " ");
                return (
                  <Link key={slug} href={`/resources/checklists/${slug}`} className="block">
                    <Card className="rounded-xl border-border/60 shadow-sm transition-all duration-200 hover:border-border hover:shadow-md h-full">
                      <CardContent className="pt-5 pb-5 flex items-center gap-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                          <ClipboardList className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">{title}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            Interactive checklist
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </PseoContainer>
      </PseoSection>
    </>
  );
}
