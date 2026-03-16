"use client";

import type { NicheLandingPage } from "@/types/pseo";
import { PseoBreadcrumb, PseoCtaButton, PseoContainer, PseoSection } from "./pseo-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AlertCircle, Lightbulb, BarChart3, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizePseoContent } from "@/lib/pseo-format";

interface NicheLandingRendererProps {
  data: NicheLandingPage;
}

const frequencyBadge: Record<string, string> = {
  "very common": "bg-amber-500/10 text-amber-700",
  common: "bg-[var(--info)]/10 text-[var(--info)]",
  occasional: "bg-secondary text-muted-foreground",
};

export function NicheLandingRenderer({ data }: NicheLandingRendererProps) {
  const normalized = normalizePseoContent(data);
  const { seo, content } = normalized;

  return (
    <article>
      <PseoSection gradient firstSection>
        <PseoContainer>
          <PseoBreadcrumb category="for" title={seo.title} />
          <div className="mx-auto max-w-3xl text-center pt-4">
            <div className="mb-6 inline-flex items-center rounded-full border border-border/60 bg-background px-4 py-1.5 text-sm font-medium text-muted-foreground">
              <Sparkles className="mr-2 h-4 w-4" />
              Industry playbook
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-foreground">
              {content.hero_headline}
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              {content.hero_subheadline}
            </p>
            <div className="mt-10 grid gap-4 text-left sm:grid-cols-3">
              {content.stats.map((s, i) => (
                <Card key={i} className="rounded-2xl border-border/60 bg-background/80 shadow-sm">
                  <CardContent className="p-5">
                    <p className="text-2xl font-semibold text-foreground">{s.value}</p>
                    <p className="mt-2 text-sm font-medium text-foreground">{s.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{s.source}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </PseoContainer>
      </PseoSection>

      <PseoSection>
        <PseoContainer>
          <h2 className="text-2xl font-semibold mb-8 flex items-center gap-2 text-foreground">
            <AlertCircle className="h-6 w-6 text-destructive" />
            {content.problem_section.heading}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {content.problem_section.pain_points.map((p, i) => (
              <Card key={i} className="rounded-xl border-border/60 shadow-sm overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">{p.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>{p.description}</p>
                  <p className="font-medium text-destructive">{p.impact}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </PseoContainer>
      </PseoSection>

      <PseoSection>
        <PseoContainer>
          <h2 className="text-2xl font-semibold mb-8 flex items-center gap-2 text-foreground">
            <Lightbulb className="h-6 w-6 text-[var(--info)]" />
            {content.solution_section.heading}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {content.solution_section.features.map((f, i) => (
              <Card key={i} className="rounded-xl border-border/60 shadow-sm overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">{f.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p className="text-foreground">{f.description}</p>
                  <p className="text-muted-foreground italic">{f.niche_example}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </PseoContainer>
      </PseoSection>

      <PseoSection>
        <PseoContainer>
          <h2 className="text-2xl font-semibold mb-8 text-foreground">Ticket types we automate</h2>
          <div className="overflow-hidden rounded-xl border border-border/60">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-secondary/30">
                    <th className="text-left py-4 px-4 font-semibold">Ticket type</th>
                    <th className="text-left py-4 px-4 font-semibold">Frequency</th>
                    <th className="text-left py-4 px-4 font-semibold">Replyma response</th>
                  </tr>
                </thead>
                <tbody>
                  {content.automation_examples.map((row, i) => (
                    <tr key={i} className="border-b border-border/40 last:border-0">
                      <td className="py-3 px-4 font-medium">{row.ticket_type}</td>
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-xs font-medium",
                            frequencyBadge[row.frequency] ?? "bg-secondary"
                          )}
                        >
                          {row.frequency}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{row.replyma_response}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </PseoContainer>
      </PseoSection>

      <PseoSection>
        <PseoContainer className="text-center">
          <PseoCtaButton ctaText={content.cta_text} />
        </PseoContainer>
      </PseoSection>

      <PseoSection>
        <PseoContainer>
          <h2 className="text-2xl font-semibold mb-8 text-foreground">FAQ</h2>
          <Accordion type="single" collapsible className="w-full rounded-xl border border-border/60 divide-y divide-border/40">
            {content.faq.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-0 px-4">
                <AccordionTrigger className="py-5 hover:no-underline">{item.question}</AccordionTrigger>
                <AccordionContent className="pb-5 text-muted-foreground">{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="mt-12 flex justify-center">
            <PseoCtaButton ctaText={content.cta_text} />
          </div>
        </PseoContainer>
      </PseoSection>
    </article>
  );
}
