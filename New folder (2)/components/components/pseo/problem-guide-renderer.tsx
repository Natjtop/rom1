"use client";

import type { ProblemGuide } from "@/types/pseo";
import { PseoCtaButton, PseoContainer, PseoHero, PseoSection } from "./pseo-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AlertTriangle, Lightbulb, TrendingUp } from "lucide-react";
import { normalizePseoContent } from "@/lib/pseo-format";

interface ProblemGuideRendererProps {
  data: ProblemGuide;
}

export function ProblemGuideRenderer({ data }: ProblemGuideRendererProps) {
  const normalized = normalizePseoContent(data);
  const { seo, content } = normalized;

  return (
    <>
      <PseoHero
        category="guides"
        title={seo.title}
        description={content.intro}
        eyebrow="Operational playbook"
      />
      <PseoSection>
        <PseoContainer>
      <article className="space-y-14">
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-2xl border-amber-200 bg-amber-50/50 shadow-sm">
            <CardContent className="p-6 sm:p-8">
          <p className="flex items-center gap-2 font-medium text-foreground">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Problem overview
          </p>
          <p className="mt-3 leading-8 text-muted-foreground">{content.problem_overview}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardContent className="p-6 sm:p-8">
              <p className="mb-4 flex items-center gap-2 font-medium text-foreground">
                <TrendingUp className="h-4 w-4 text-[var(--info)]" />
                Why it matters
              </p>
              <div className="space-y-3">
                {content.why_it_matters.map((w, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--info)]" />
                    <p className="text-sm leading-7 text-muted-foreground">{w}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Traditional approach</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="text-muted-foreground">{content.traditional_approach.description}</p>
              <p className="font-medium mt-2">Downsides:</p>
              <ul className="list-disc list-inside mt-1 text-muted-foreground">
                {content.traditional_approach.downsides.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-blue-200 bg-blue-50/30 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base text-blue-600">AI approach with Replyma</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="text-muted-foreground">{content.ai_approach.description}</p>
              <div className="mt-4 space-y-3">
                {content.ai_approach.steps.map((s) => (
                  <div key={s.step_number} className="flex gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                      {s.step_number}
                    </span>
                    <div>
                      <p className="font-medium">{s.title}</p>
                      <p className="text-muted-foreground text-xs">{s.description}</p>
                      <p className="text-xs text-blue-600 mt-0.5">Replyma: {s.replyma_feature}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
        <h2 className="mb-6 text-2xl font-semibold text-foreground sm:text-3xl">Expected results</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {content.results.map((r, i) => (
            <Card key={i} className="rounded-2xl border-border/60 shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm font-medium text-foreground">{r.metric}</p>
                <p className="mt-3 text-2xl font-semibold text-blue-600">{r.improvement}</p>
                <p className="mt-2 text-sm text-muted-foreground">{r.timeframe}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        </section>

        <section>
        <Card className="rounded-2xl border-border/60 bg-[var(--surface-sunken)] shadow-sm">
          <CardContent className="p-6 sm:p-8">
          <p className="flex items-center gap-2 font-medium text-foreground">
            <Lightbulb className="h-4 w-4" />
            Pro tips
          </p>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            {content.pro_tips.map((t, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-foreground/50" />
                <span>{t}</span>
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
