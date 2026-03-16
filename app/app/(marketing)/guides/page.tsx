import Link from "next/link";
import { getGeneratedSlugs, getGeneratedPage } from "@/lib/pseo-data";
import type { ProblemGuide } from "@/types/pseo";
import { Card, CardContent } from "@/components/ui/card";
import { PseoContainer, PseoSection } from "@/components/pseo/pseo-layout";
import { BookOpen } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://replyma.com";

export const metadata = {
  title: "E-commerce Support Guides — How to Solve Common Problems",
  description:
    "Guides to reduce WISMO tickets, automate refunds, handle Black Friday support, and scale customer support with AI.",
  keywords: [
    "e-commerce support guides",
    "WISMO tickets",
    "Black Friday support",
    "support automation",
    "AI customer support",
  ],
  openGraph: {
    title: "E-commerce Support Guides — How to Solve Common Problems | Replyma",
    description:
      "Guides to reduce WISMO tickets, automate refunds, handle Black Friday support, and scale customer support with AI.",
    type: "website" as const,
    url: `${BASE}/guides`,
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "E-commerce Support Guides — How to Solve Common Problems",
    description:
      "Guides to reduce WISMO, automate refunds, Black Friday support, and scale support with AI.",
  },
  alternates: { canonical: `${BASE}/guides` },
};

export default function GuidesHubPage() {
  const slugs = getGeneratedSlugs("problem-guide");

  return (
    <>
      <PseoSection gradient firstSection>
        <PseoContainer>
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-foreground">
              E-commerce support guides
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              How to solve the biggest customer support challenges for online stores — with AI and Replyma.
            </p>
          </div>
        </PseoContainer>
      </PseoSection>
      <PseoSection>
        <PseoContainer>
          {slugs.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No guides yet. Run{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm">npm run pseo:generate</code>{" "}
              to generate content.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {slugs.map((slug) => {
                const data = getGeneratedPage<ProblemGuide>("problem-guide", slug);
                const title = data?.seo?.title ?? slug.replace(/-/g, " ");
                return (
                  <Link key={slug} href={`/guides/${slug}`} className="block">
                    <Card className="rounded-xl border-border/60 shadow-sm transition-all duration-200 hover:border-border hover:shadow-md h-full">
                      <CardContent className="pt-5 pb-5 flex items-center gap-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                          <BookOpen className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">{title}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            Step-by-step with Replyma
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
