"use client";

import type { IntegrationPage } from "@/types/pseo";
import { PseoBreadcrumb, PseoCtaButton, PseoContainer, PseoSection } from "./pseo-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plug, Zap, ArrowRight } from "lucide-react";

interface IntegrationPageRendererProps {
  data: IntegrationPage;
}

export function IntegrationPageRenderer({ data }: IntegrationPageRendererProps) {
  const { meta, seo, content } = data;
  const platformName = meta.platform_slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <>
      <PseoSection gradient firstSection>
        <PseoContainer>
          <PseoBreadcrumb category="integrations" title={seo.title} />
        </PseoContainer>
      </PseoSection>
      <PseoSection>
        <PseoContainer>
      <article className="prose prose-neutral max-w-none">
        <div className="flex items-center justify-center gap-4 my-8">
          <span className="rounded-lg border bg-muted/50 px-4 py-2 font-medium">{platformName}</span>
          <span className="text-2xl text-muted-foreground">+</span>
          <span className="rounded-lg border bg-blue-100 px-4 py-2 font-medium text-blue-700">
            Replyma
          </span>
        </div>

        <p className="lead text-lg text-muted-foreground">{content.intro}</p>

        <section className="my-10">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Plug className="h-5 w-5" />
            What you can do
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {content.what_you_can_do.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-blue-600 mt-0.5">✓</span>
                {c}
              </li>
            ))}
          </ul>
        </section>

        <section className="my-10">
          <h2 className="text-xl font-semibold mb-4">Setup steps</h2>
          <div className="space-y-4">
            {content.setup_steps.map((s) => (
              <Card key={s.step_number}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
                      {s.step_number}
                    </span>
                    <CardTitle className="text-base">{s.title}</CardTitle>
                    <span className="ml-auto text-xs text-muted-foreground">{s.time_estimate}</span>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground pl-12">
                  {s.description}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="my-10">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Automations enabled
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {content.automations.map((a, i) => (
              <Card key={i}>
                <CardContent className="pt-4 flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{a.trigger}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{a.action}</span>
                  <p className="w-full text-xs text-muted-foreground mt-1">{a.example}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <div className="my-10 flex justify-center">
          <PseoCtaButton ctaText={content.cta_text} />
        </div>

        <h2 className="text-xl font-semibold mt-12 mb-4">FAQ</h2>
        <Accordion type="single" collapsible className="w-full">
          {content.faq.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-10 flex justify-center">
          <PseoCtaButton ctaText={content.cta_text} />
        </div>
      </article>
        </PseoContainer>
      </PseoSection>
    </>
  );
}
