"use client";

import type { VSPage } from "@/types/pseo";
import { PseoCtaButton, PseoContainer, PseoHero, PseoSection } from "./pseo-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Check, X, Trophy, BadgeCheck, Scale, WalletCards } from "lucide-react";
import { normalizePseoContent } from "@/lib/pseo-format";

interface VSPageRendererProps {
  data: VSPage;
}

export function VSPageRenderer({ data }: VSPageRendererProps) {
  const normalized = normalizePseoContent(data);
  const { meta, seo, content } = normalized;
  const competitorName = meta.competitor_slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <>
      <PseoHero
        category="vs"
        title={seo.title}
        description={content.intro}
        eyebrow="Side-by-side comparison"
      >
        <div className="grid gap-4 text-left sm:grid-cols-3">
          <Card className="rounded-2xl border-border/60 bg-background/80 shadow-sm">
            <CardContent className="flex items-start gap-3 p-5">
              <BadgeCheck className="mt-0.5 h-5 w-5 text-[var(--info)]" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Replyma best for</p>
                <p className="mt-1 text-sm text-foreground">{content.tldr.replyma_best_for}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/60 bg-background/80 shadow-sm">
            <CardContent className="flex items-start gap-3 p-5">
              <Scale className="mt-0.5 h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">{competitorName} best for</p>
                <p className="mt-1 text-sm text-foreground">{content.tldr.competitor_best_for}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/60 bg-background/80 shadow-sm">
            <CardContent className="flex items-start gap-3 p-5">
              <WalletCards className="mt-0.5 h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pricing snapshot</p>
                <p className="mt-1 text-sm text-foreground">Replyma: {content.tldr.replyma_price}</p>
                <p className="text-sm text-muted-foreground">{competitorName}: {content.tldr.competitor_price}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </PseoHero>
      <PseoSection>
        <PseoContainer>
          <article className="space-y-14">
        <section>
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Comparison</h2>
            <span className="hidden rounded-full border border-border/60 bg-secondary/50 px-3 py-1 text-sm text-muted-foreground sm:inline-flex">
              10 decision criteria
            </span>
          </div>
          <div className="space-y-5">
          {content.dimensions.map((d, i) => (
            <Card key={i} className="rounded-2xl border-border/60 shadow-sm">
              <CardContent className="space-y-4 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <span className="text-base font-semibold text-foreground">{d.dimension}</span>
                {d.winner !== "tie" && (
                  <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    <Trophy className="h-3 w-3" />
                    {d.winner === "replyma" ? "Replyma" : competitorName}
                  </span>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex-1">
                  <p className="mb-1 text-xs text-muted-foreground">Replyma</p>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${d.replyma_score * 10}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{d.replyma_detail}</p>
                </div>
                <div className="flex-1">
                  <p className="mb-1 text-xs text-muted-foreground">{competitorName}</p>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gray-400"
                      style={{ width: `${d.competitor_score * 10}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{d.competitor_detail}</p>
                </div>
              </div>
              </CardContent>
            </Card>
          ))}
          </div>
        </section>

        <section>
          <Card className="rounded-2xl border-border/60 bg-[var(--surface-sunken)] shadow-sm">
            <CardContent className="p-6 sm:p-8">
              <p className="text-sm font-medium uppercase tracking-[0.12em] text-muted-foreground">Verdict</p>
              <p className="mt-3 text-lg leading-8 text-foreground">{content.verdict}</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Replyma pros & cons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {content.replyma_pros.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <Check className="h-4 w-4 shrink-0 text-green-600" />
                  <span>{p}</span>
                </div>
              ))}
              {content.replyma_cons.map((c, i) => (
                <div key={i} className="flex gap-2">
                  <X className="h-4 w-4 shrink-0 text-red-500" />
                  <span>{c}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">{competitorName} pros & cons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {content.competitor_pros.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <Check className="h-4 w-4 shrink-0 text-green-600" />
                  <span>{p}</span>
                </div>
              ))}
              {content.competitor_cons.map((c, i) => (
                <div key={i} className="flex gap-2">
                  <X className="h-4 w-4 shrink-0 text-red-500" />
                  <span>{c}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl border-blue-200 bg-blue-50/30 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base text-blue-600">Choose Replyma if…</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {content.choose_replyma_if.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Choose {competitorName} if…</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {content.choose_competitor_if.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        <div className="flex justify-center">
          <PseoCtaButton ctaText={content.cta_text} />
        </div>

        <section>
        <h2 className="mb-6 text-2xl font-semibold text-foreground sm:text-3xl">FAQ</h2>
        <Accordion type="single" collapsible className="w-full rounded-2xl border border-border/60 bg-background shadow-sm">
          {content.faq.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border-border/40 px-5">
              <AccordionTrigger className="text-left text-base font-medium hover:no-underline">{item.question}</AccordionTrigger>
              <AccordionContent className="text-base leading-7 text-muted-foreground">{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        </section>

        <div className="mt-10 flex justify-center">
          <PseoCtaButton ctaText={content.cta_text} />
        </div>
      </article>
        </PseoContainer>
      </PseoSection>
    </>
  );
}
