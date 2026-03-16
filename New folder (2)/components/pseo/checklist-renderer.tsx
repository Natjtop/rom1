"use client";

import { useState, useEffect } from "react";
import type { SupportChecklist } from "@/types/pseo";
import { PseoCtaButton, PseoContainer, PseoHero, PseoSection } from "./pseo-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Bot, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizePseoContent } from "@/lib/pseo-format";

const STORAGE_KEY_PREFIX = "pseo_checklist_";

function getStored(slug: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + slug);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function setStored(slug: string, done: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + slug, JSON.stringify([...done]));
  } catch {}
}

interface ChecklistRendererProps {
  data: SupportChecklist;
}

const priorityClass: Record<string, string> = {
  critical: "bg-red-100 text-red-800",
  high: "bg-amber-100 text-amber-800",
  medium: "bg-blue-100 text-blue-800",
  low: "bg-gray-100 text-gray-700",
};

export function ChecklistRenderer({ data }: ChecklistRendererProps) {
  const normalized = normalizePseoContent(data);
  const { meta, seo, content } = normalized;
  const [done, setDone] = useState<Set<string>>(() => getStored(meta.checklist_type));

  useEffect(() => {
    setStored(meta.checklist_type, done);
  }, [meta.checklist_type, done]);

  const allIds = content.phases.flatMap((p) => p.items.map((i) => i.id));
  const completedCount = allIds.filter((id) => done.has(id)).length;
  const totalCount = allIds.length;
  const percent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  const toggle = (id: string) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <PseoHero
        category="resources"
        title={seo.title}
        description={content.intro}
        eyebrow="Actionable checklist"
      >
        <div className="grid gap-4 text-left sm:grid-cols-3">
          <Card className="rounded-2xl border-border/60 bg-background/80 shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm font-medium text-muted-foreground">Overall progress</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{percent}%</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/60 bg-background/80 shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm font-medium text-muted-foreground">Tasks completed</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{completedCount}/{totalCount}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/60 bg-background/80 shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm font-medium text-muted-foreground">Phases</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{content.phases.length}</p>
            </CardContent>
          </Card>
        </div>
      </PseoHero>
      <PseoSection>
        <PseoContainer>
      <article className="space-y-12">
        <Card className="rounded-2xl border-border/60 bg-[var(--surface-sunken)] shadow-sm">
          <CardContent className="p-6 sm:p-8">
          <p className="font-medium text-foreground">Overall progress</p>
          <div className="mt-2 flex items-center gap-4">
            <div className="h-3 flex-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-sm font-medium">{completedCount}/{totalCount} ({percent}%)</span>
          </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          {content.phases.map((phase) => {
            const phaseIds = phase.items.map((i) => i.id);
            const phaseDone = phaseIds.filter((id) => done.has(id)).length;
            const phasePercent = phaseIds.length
              ? Math.round((phaseDone / phaseIds.length) * 100)
              : 0;

            return (
              <Card key={phase.phase_number} className="rounded-2xl border-border/60 shadow-sm">
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="text-lg">
                      Phase {phase.phase_number}: {phase.phase_name}
                    </CardTitle>
                    <span className="text-sm text-muted-foreground">
                      {phaseDone}/{phaseIds.length} ({phasePercent}%)
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {phase.items.map((item) => (
                    <label
                      key={item.id}
                      htmlFor={item.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 p-4 transition-colors",
                        done.has(item.id) && "bg-muted/30"
                      )}
                    >
                      <Checkbox
                        id={item.id}
                        checked={done.has(item.id)}
                        onCheckedChange={() => toggle(item.id)}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-medium text-sm text-foreground">{item.task}</p>
                          {done.has(item.id) ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                              <CheckCircle2 className="h-3 w-3" />
                              Done
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span
                            className={cn(
                              "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
                              priorityClass[item.priority] ?? "bg-gray-100"
                            )}
                          >
                            {item.priority}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" /> {item.time_estimate}
                          </span>
                          {item.replyma_automates && (
                            <span className="inline-flex items-center gap-1 rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                              <Bot className="h-3 w-3" /> Replyma automates this
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="rounded-2xl border-border/60 bg-[var(--surface-sunken)] shadow-sm">
          <CardContent className="p-6 sm:p-8">
          <p className="font-medium text-foreground">Pro tips</p>
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

        <div className="my-10 flex justify-center">
          <PseoCtaButton ctaText="Try Replyma free" />
        </div>
      </article>
        </PseoContainer>
      </PseoSection>
    </>
  );
}
