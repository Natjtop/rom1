"use client";

import type { AlternativesPage } from "@/types/pseo";
import { PseoCtaButton, PseoContainer, PseoHero, PseoSection } from "./pseo-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Check, X, Award, ArrowRight } from "lucide-react";
import { normalizePseoContent } from "@/lib/pseo-format";

interface AlternativesPageRendererProps {
  data: AlternativesPage;
}

export function AlternativesPageRenderer({ data }: AlternativesPageRendererProps) {
  const normalized = normalizePseoContent(data);
  const { seo, content } = normalized;

  return (
    <>
      <PseoHero
        category="alternatives"
        title={seo.title}
        description={content.intro}
        eyebrow="Ranked alternatives"
      />
      <PseoSection>
        <PseoContainer>
      <article className="space-y-14">
        {content.why_look_for_alternatives.length > 0 && (
          <section>
            <h2 className="mb-6 text-2xl font-semibold text-foreground sm:text-3xl">Why look for alternatives?</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {content.why_look_for_alternatives.map((r, i) => (
                <Card key={i} className="rounded-2xl border-border/60 shadow-sm">
                  <CardContent className="flex gap-3 p-5">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-800">
                      {i + 1}
                    </span>
                    <p className="text-sm leading-7 text-muted-foreground">{r}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        <section>
        <h2 className="mb-6 text-2xl font-semibold text-foreground sm:text-3xl">Alternatives ranked</h2>
        <div className="space-y-5">
          {content.alternatives.map((alt) => (
            <Card
              key={alt.rank}
              className={alt.is_replyma ? "rounded-2xl border-blue-300 bg-blue-50/30 shadow-sm" : "rounded-2xl border-border/60 shadow-sm"}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-2xl font-bold text-muted-foreground">#{alt.rank}</span>
                  {alt.is_replyma && (
                    <span className="inline-flex items-center gap-1 rounded bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                      <Award className="h-3 w-3" /> Editor&apos;s Choice
                    </span>
                  )}
                  {alt.ecommerce_native && (
                    <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                      E-commerce Native
                    </span>
                  )}
                      <CardTitle className="mb-0 text-lg">{alt.name}</CardTitle>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{alt.tagline}</p>
                  </div>
                  <div className="shrink-0 rounded-full border border-border/60 bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                    {alt.pricing}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 text-sm">
                <p className="leading-7 text-muted-foreground">{alt.description}</p>
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Best for</p>
                  <p className="mt-2 leading-7 text-foreground">{alt.best_for}</p>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Pros</p>
                    <div className="space-y-2">
                  {alt.pros.map((p, i) => (
                        <div key={i} className="flex gap-2 text-green-700">
                          <Check className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{p}</span>
                        </div>
                  ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Trade-offs</p>
                    <div className="space-y-2">
                      {alt.cons.map((c, i) => (
                        <div key={i} className="flex gap-2 text-red-600">
                          <X className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{c}</span>
                        </div>
                  ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <a
                    href={alt.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-foreground/70"
                  >
                    Visit {alt.name}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
