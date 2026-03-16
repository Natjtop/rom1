import Link from "next/link";
import { getGeneratedSlugs } from "@/lib/pseo-data";
import { COMPETITOR_LIST } from "@/data/competitors";
import { Card, CardContent } from "@/components/ui/card";
import { PseoContainer, PseoSection } from "@/components/pseo/pseo-layout";
import { ArrowLeftRight } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://replyma.com";

export const metadata = {
  title: "Best Alternatives to Customer Support Tools — 2026",
  description:
    "Find the best alternatives to Gorgias, Zendesk, Tidio, and 60+ helpdesk and live chat tools. Ranked for e-commerce stores.",
  keywords: [
    "Gorgias alternatives",
    "Zendesk alternatives",
    "helpdesk alternatives",
    "live chat alternatives",
    "e-commerce support software",
  ],
  openGraph: {
    title: "Best Alternatives to Customer Support Tools — 2026 | Replyma",
    description:
      "Find the best alternatives to Gorgias, Zendesk, Tidio, and 60+ helpdesk and live chat tools. Ranked for e-commerce stores.",
    type: "website" as const,
    url: `${BASE}/alternatives`,
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Best Alternatives to Customer Support Tools — 2026",
    description:
      "Find the best alternatives to Gorgias, Zendesk, Tidio, and 60+ helpdesk tools for e-commerce.",
  },
  alternates: { canonical: `${BASE}/alternatives` },
};

export default function AlternativesHubPage() {
  const slugs = getGeneratedSlugs("alternatives");
  const alternativesSlugs = slugs.filter((s) => s.endsWith("-alternatives"));
  const originalNames = COMPETITOR_LIST.filter((c) =>
    alternativesSlugs.includes(`${c.slug}-alternatives`)
  );

  return (
    <>
      <PseoSection gradient firstSection>
        <PseoContainer>
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-foreground">
              Alternatives to customer support tools
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Looking for an alternative? We&apos;ve ranked the best options for e-commerce, with Replyma as the top choice for AI-powered support.
            </p>
          </div>
        </PseoContainer>
      </PseoSection>
      <PseoSection>
        <PseoContainer>
          {alternativesSlugs.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No alternatives pages yet. Run{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-sm">npm run pseo:generate</code>{" "}
              to generate content.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {originalNames.map((c) => (
                <Link key={c.slug} href={`/alternatives/${c.slug}-alternatives`} className="block">
                  <Card className="rounded-xl border-border/60 shadow-sm transition-all duration-200 hover:border-border hover:shadow-md h-full">
                    <CardContent className="pt-5 pb-5 flex items-center gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                        <ArrowLeftRight className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">Best {c.name} alternatives</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          Ranked & reviewed for e-commerce
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </PseoContainer>
      </PseoSection>
    </>
  );
}
