/**
 * pSEO 2.0 — TypeScript interfaces and Zod schemas for programmatic SEO content.
 * Used by generation script and Next.js routes.
 */

import { z } from "zod";

// ============== Schema 1: VS Competitor Pages ==============

export interface VSPage {
  meta: { content_type: "vs"; competitor_slug: string; generated_at: string };
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  content: {
    intro: string;
    verdict: string;
    tldr: {
      replyma_best_for: string;
      competitor_best_for: string;
      replyma_price: string;
      competitor_price: string;
    };
    dimensions: {
      dimension: string;
      replyma_score: number;
      competitor_score: number;
      replyma_detail: string;
      competitor_detail: string;
      winner: "replyma" | "competitor" | "tie";
    }[];
    replyma_pros: string[];
    replyma_cons: string[];
    competitor_pros: string[];
    competitor_cons: string[];
    choose_replyma_if: string[];
    choose_competitor_if: string[];
    faq: { question: string; answer: string }[];
    cta_text: string;
  };
}

export const vsPageMetaSchema = z.object({
  content_type: z.literal("vs"),
  competitor_slug: z.string(),
  generated_at: z.string(),
});

export const vsPageSchema = z.object({
  meta: vsPageMetaSchema,
  seo: z.object({
    title: z.string(),
    description: z.string().max(155),
    keywords: z.array(z.string()).min(8).max(10),
  }),
  content: z.object({
    intro: z.string(),
    verdict: z.string(),
    tldr: z.object({
      replyma_best_for: z.string(),
      competitor_best_for: z.string(),
      replyma_price: z.string(),
      competitor_price: z.string(),
    }),
    dimensions: z.array(
      z.object({
        dimension: z.string(),
        replyma_score: z.number().min(1).max(10),
        competitor_score: z.number().min(1).max(10),
        replyma_detail: z.string(),
        competitor_detail: z.string(),
        winner: z.enum(["replyma", "competitor", "tie"]),
      })
    ).length(10),
    replyma_pros: z.array(z.string()).length(5),
    replyma_cons: z.array(z.string()).length(2),
    competitor_pros: z.array(z.string()).length(4),
    competitor_cons: z.array(z.string()).length(4),
    choose_replyma_if: z.array(z.string()).length(4),
    choose_competitor_if: z.array(z.string()).length(4),
    faq: z.array(z.object({ question: z.string(), answer: z.string() })).length(6),
    cta_text: z.string(),
  }),
});

// ============== Schema 2: Alternatives Pages ==============

export interface AlternativesPage {
  meta: { content_type: "alternatives"; original_tool: string; generated_at: string };
  seo: { title: string; description: string; keywords: string[] };
  content: {
    intro: string;
    why_look_for_alternatives: string[];
    alternatives: {
      rank: number;
      name: string;
      tagline: string;
      description: string;
      best_for: string;
      pricing: string;
      ecommerce_native: boolean;
      pros: string[];
      cons: string[];
      url: string;
      is_replyma: boolean;
    }[];
    faq: { question: string; answer: string }[];
    cta_text: string;
  };
}

export const alternativesPageMetaSchema = z.object({
  content_type: z.literal("alternatives"),
  original_tool: z.string(),
  generated_at: z.string(),
});

const alternativeItemSchema = z.object({
  rank: z.number(),
  name: z.string(),
  tagline: z.string(),
  description: z.string(),
  best_for: z.string(),
  pricing: z.string(),
  ecommerce_native: z.boolean(),
  pros: z.array(z.string()).length(3),
  cons: z.array(z.string()).length(2),
  url: z.string(),
  is_replyma: z.boolean(),
});

export const alternativesPageSchema = z.object({
  meta: alternativesPageMetaSchema,
  seo: z.object({
    title: z.string(),
    description: z.string(),
    keywords: z.array(z.string()),
  }),
  content: z.object({
    intro: z.string(),
    why_look_for_alternatives: z.array(z.string()).length(4),
    alternatives: z.array(alternativeItemSchema).length(10),
    faq: z.array(z.object({ question: z.string(), answer: z.string() })).length(5),
    cta_text: z.string(),
  }),
});

// ============== Schema 3: Niche Landing Pages ==============

export type TicketFrequency = "very common" | "common" | "occasional";

export interface NicheLandingPage {
  meta: { content_type: "niche-landing"; niche_slug: string; generated_at: string };
  seo: { title: string; description: string; keywords: string[] };
  content: {
    hero_headline: string;
    hero_subheadline: string;
    problem_section: {
      heading: string;
      pain_points: {
        title: string;
        description: string;
        impact: string;
      }[];
    };
    solution_section: {
      heading: string;
      features: {
        title: string;
        description: string;
        niche_example: string;
      }[];
    };
    automation_examples: {
      ticket_type: string;
      frequency: TicketFrequency;
      replyma_response: string;
    }[];
    stats: {
      value: string;
      label: string;
      source: string;
    }[];
    faq: { question: string; answer: string }[];
    cta_text: string;
  };
}

export const nicheLandingPageMetaSchema = z.object({
  content_type: z.literal("niche-landing"),
  niche_slug: z.string(),
  generated_at: z.string(),
});

export const nicheLandingPageSchema = z.object({
  meta: nicheLandingPageMetaSchema,
  seo: z.object({
    title: z.string(),
    description: z.string(),
    keywords: z.array(z.string()),
  }),
  content: z.object({
    hero_headline: z.string(),
    hero_subheadline: z.string(),
    problem_section: z.object({
      heading: z.string(),
      pain_points: z.array(
        z.object({
          title: z.string(),
          description: z.string(),
          impact: z.string(),
        })
      ).length(5),
    }),
    solution_section: z.object({
      heading: z.string(),
      features: z.array(
        z.object({
          title: z.string(),
          description: z.string(),
          niche_example: z.string(),
        })
      ).length(6),
    }),
    automation_examples: z.array(
      z.object({
        ticket_type: z.string(),
        frequency: z.enum(["very common", "common", "occasional"]),
        replyma_response: z.string(),
      })
    ).length(8),
    stats: z.array(
      z.object({
        value: z.string(),
        label: z.string(),
        source: z.string(),
      })
    ).length(3),
    faq: z.array(z.object({ question: z.string(), answer: z.string() })).length(6),
    cta_text: z.string(),
  }),
});

// ============== Schema 4: Problem/Solution Guides ==============

export interface ProblemGuide {
  meta: { content_type: "problem-guide"; problem_slug: string; generated_at: string };
  seo: { title: string; description: string; keywords: string[] };
  content: {
    intro: string;
    problem_overview: string;
    why_it_matters: string[];
    traditional_approach: {
      description: string;
      downsides: string[];
    };
    ai_approach: {
      description: string;
      steps: {
        step_number: number;
        title: string;
        description: string;
        replyma_feature: string;
      }[];
    };
    results: {
      metric: string;
      improvement: string;
      timeframe: string;
    }[];
    pro_tips: string[];
    faq: { question: string; answer: string }[];
    cta_text: string;
  };
}

export const problemGuideMetaSchema = z.object({
  content_type: z.literal("problem-guide"),
  problem_slug: z.string(),
  generated_at: z.string(),
});

export const problemGuideSchema = z.object({
  meta: problemGuideMetaSchema,
  seo: z.object({
    title: z.string(),
    description: z.string(),
    keywords: z.array(z.string()),
  }),
  content: z.object({
    intro: z.string(),
    problem_overview: z.string(),
    why_it_matters: z.array(z.string()).length(4),
    traditional_approach: z.object({
      description: z.string(),
      downsides: z.array(z.string()).length(4),
    }),
    ai_approach: z.object({
      description: z.string(),
      steps: z.array(
        z.object({
          step_number: z.number(),
          title: z.string(),
          description: z.string(),
          replyma_feature: z.string(),
        })
      ).length(6),
    }),
    results: z.array(
      z.object({
        metric: z.string(),
        improvement: z.string(),
        timeframe: z.string(),
      })
    ).length(4),
    pro_tips: z.array(z.string()).length(5),
    faq: z.array(z.object({ question: z.string(), answer: z.string() })).length(5),
    cta_text: z.string(),
  }),
});

// ============== Schema 5: Integration Pages ==============

export interface IntegrationPage {
  meta: { content_type: "integration"; platform_slug: string; generated_at: string };
  seo: { title: string; description: string; keywords: string[] };
  content: {
    intro: string;
    what_you_can_do: string[];
    setup_steps: {
      step_number: number;
      title: string;
      description: string;
      time_estimate: string;
    }[];
    automations: {
      trigger: string;
      action: string;
      example: string;
    }[];
    faq: { question: string; answer: string }[];
    cta_text: string;
  };
}

export const integrationPageMetaSchema = z.object({
  content_type: z.literal("integration"),
  platform_slug: z.string(),
  generated_at: z.string(),
});

export const integrationPageSchema = z.object({
  meta: integrationPageMetaSchema,
  seo: z.object({
    title: z.string(),
    description: z.string(),
    keywords: z.array(z.string()),
  }),
  content: z.object({
    intro: z.string(),
    what_you_can_do: z.array(z.string()).length(8),
    setup_steps: z.array(
      z.object({
        step_number: z.number(),
        title: z.string(),
        description: z.string(),
        time_estimate: z.string(),
      })
    ).length(5),
    automations: z.array(
      z.object({
        trigger: z.string(),
        action: z.string(),
        example: z.string(),
      })
    ).length(6),
    faq: z.array(z.object({ question: z.string(), answer: z.string() })).length(5),
    cta_text: z.string(),
  }),
});

// ============== Schema 6: Support Checklists ==============

export type ChecklistPriority = "critical" | "high" | "medium" | "low";

export interface SupportChecklist {
  meta: { content_type: "checklist"; checklist_type: string; generated_at: string };
  seo: { title: string; description: string; keywords: string[] };
  content: {
    intro: string;
    phases: {
      phase_name: string;
      phase_number: number;
      items: {
        id: string;
        task: string;
        description: string;
        priority: ChecklistPriority;
        time_estimate: string;
        replyma_automates: boolean;
      }[];
    }[];
    pro_tips: string[];
  };
}

export const supportChecklistMetaSchema = z.object({
  content_type: z.literal("checklist"),
  checklist_type: z.string(),
  generated_at: z.string(),
});

const checklistItemSchema = z.object({
  id: z.string(),
  task: z.string(),
  description: z.string(),
  priority: z.enum(["critical", "high", "medium", "low"]),
  time_estimate: z.string(),
  replyma_automates: z.boolean(),
});

export const supportChecklistSchema = z.object({
  meta: supportChecklistMetaSchema,
  seo: z.object({
    title: z.string(),
    description: z.string(),
    keywords: z.array(z.string()),
  }),
  content: z.object({
    intro: z.string(),
    phases: z.array(
      z.object({
        phase_name: z.string(),
        phase_number: z.number(),
        items: z.array(checklistItemSchema).length(10),
      })
    ).length(4),
    pro_tips: z.array(z.string()).length(5),
  }),
});

// ============== Content type union and schema map ==============

export type PseoContentType =
  | "vs"
  | "alternatives"
  | "niche-landing"
  | "problem-guide"
  | "integration"
  | "checklist";

export type PseoPage =
  | VSPage
  | AlternativesPage
  | NicheLandingPage
  | ProblemGuide
  | IntegrationPage
  | SupportChecklist;

export const pseoSchemaByType: Record<PseoContentType, z.ZodType<unknown>> = {
  vs: vsPageSchema,
  alternatives: alternativesPageSchema,
  "niche-landing": nicheLandingPageSchema,
  "problem-guide": problemGuideSchema,
  integration: integrationPageSchema,
  checklist: supportChecklistSchema,
};
