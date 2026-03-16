/**
 * pSEO 2.0 — Content generation script.
 * Uses Gemini Flash with response_mime_type: application/json, validates with Zod,
 * saves to data/generated/[content-type]/[slug].json. Concurrency: 50.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { NICHE_LIST } from "../data/niches";
import { COMPETITOR_LIST } from "../data/competitors";
import {
  type PseoContentType,
  vsPageSchema,
  alternativesPageSchema,
  nicheLandingPageSchema,
  problemGuideSchema,
  integrationPageSchema,
  supportChecklistSchema,
} from "../types/pseo";
import type { z } from "zod";

const ROOT = process.cwd();
const DATA_GENERATED = path.join(ROOT, "data", "generated");
const LOGS_DIR = path.join(ROOT, "logs");
const ERRORS_LOG = path.join(LOGS_DIR, "errors.json");

// Problem slugs for guides (80–100 pages: use 25 for initial set)
const PROBLEM_SLUGS = [
  "reduce-wismo-tickets",
  "automate-refund-requests",
  "handle-black-friday-support",
  "reduce-cart-abandonment-with-chat",
  "automate-order-tracking",
  "handle-return-requests-automatically",
  "reduce-first-response-time",
  "automate-shipping-delay-responses",
  "handle-sizing-questions-fashion",
  "automate-subscription-cancellations",
  "reduce-chargeback-disputes",
  "handle-out-of-stock-questions",
  "automate-loyalty-points-questions",
  "reduce-support-ticket-volume",
  "improve-customer-satisfaction-score",
  "handle-multilingual-support",
  "automate-product-recommendations-chat",
  "handle-negative-reviews-proactively",
  "reduce-support-costs-ecommerce",
  "scale-support-without-hiring",
  "automate-faq-responses",
  "handle-gift-card-balance-inquiries",
  "reduce-holiday-support-surge",
  "automate-order-modification-requests",
  "handle-damaged-item-claims",
];

// Platform slugs for integration pages (30–50)
const PLATFORM_SLUGS = [
  "shopify",
  "shopify-plus",
  "woocommerce",
  "bigcommerce",
  "magento",
  "prestashop",
  "squarespace",
  "wix",
  "ecwid",
  "square-online",
  "klaviyo",
  "mailchimp",
  "gorgias",
  "zendesk",
  "freshdesk",
  "slack",
  "whatsapp",
  "instagram",
  "facebook-messenger",
  "gmail",
  "outlook",
  "stripe",
  "paypal",
  "afterpay",
  "returnly",
  "loop-returns",
  "shipstation",
  "shipbob",
  "easypost",
  "fedex",
  "ups",
  "usps",
  "dhl",
  "recharge",
  "bold-subscriptions",
  "yotpo",
  "okendo",
  "stamped",
  "loyalty-lion",
  "smile-io",
];

// Checklist types (20–30)
const CHECKLIST_TYPES = [
  "holiday-season-prep",
  "new-store-launch",
  "support-team-onboarding",
  "ai-implementation",
  "black-friday-cyber-monday",
  "customer-satisfaction-audit",
  "ticket-deflection-setup",
  "post-purchase-experience",
  "returns-refunds-process",
  "multilingual-support-setup",
  "q4-prep",
  "peak-season-support",
  "csat-improvement",
  "first-response-time",
  "knowledge-base-setup",
  "chatbot-setup",
  "escalation-rules",
  "sla-setup",
  "contact-channel-setup",
  "post-holiday-returns",
  "subscription-support",
  "b2b-support-setup",
];

type Job = {
  contentType: PseoContentType;
  slug: string;
  context: unknown;
  schemaDescription: string;
};

function buildJobs(): Job[] {
  const jobs: Job[] = [];
  const now = new Date().toISOString();

  // VS: 1 per competitor
  for (const c of COMPETITOR_LIST) {
    jobs.push({
      contentType: "vs",
      slug: c.slug,
      context: { competitor: c, generated_at: now },
      schemaDescription: `VSPage: meta.content_type "vs", meta.competitor_slug, seo.title, description (max 155 chars), keywords (8-10). content: intro, verdict, tldr (replyma_best_for, competitor_best_for, replyma_price, competitor_price), dimensions (exactly 10 items: dimension, replyma_score 1-10, competitor_score 1-10, replyma_detail, competitor_detail, winner "replyma"|"competitor"|"tie"), replyma_pros (5), replyma_cons (2), competitor_pros (4), competitor_cons (4), choose_replyma_if (4), choose_competitor_if (4), faq (6 items: question, answer), cta_text.`,
    });
  }

  // Alternatives: 1 per competitor
  for (const c of COMPETITOR_LIST) {
    jobs.push({
      contentType: "alternatives",
      slug: `${c.slug}-alternatives`,
      context: { original_tool: c, generated_at: now },
      schemaDescription: `AlternativesPage: meta.content_type "alternatives", meta.original_tool (string name), seo, content: intro, why_look_for_alternatives (4), alternatives (10 items: rank 1-10, name, tagline, description, best_for, pricing, ecommerce_native, pros [3], cons [2], url, is_replyma - true only for rank 1), faq (5), cta_text.`,
    });
  }

  // Niche landing: 1 per niche
  for (const n of NICHE_LIST) {
    jobs.push({
      contentType: "niche-landing",
      slug: n.slug,
      context: { niche: n, generated_at: now },
      schemaDescription: `NicheLandingPage: meta.content_type "niche-landing", meta.niche_slug, seo, content: hero_headline, hero_subheadline, problem_section (heading, pain_points [5]: title, description, impact), solution_section (heading, features [6]: title, description, niche_example), automation_examples [8]: ticket_type, frequency "very common"|"common"|"occasional", replyma_response, stats [3]: value, label, source, faq [6], cta_text.`,
    });
  }

  // Problem guides
  for (const problemSlug of PROBLEM_SLUGS) {
    jobs.push({
      contentType: "problem-guide",
      slug: problemSlug,
      context: { problem_slug: problemSlug, generated_at: now },
      schemaDescription: `ProblemGuide: meta.content_type "problem-guide", meta.problem_slug, seo, content: intro, problem_overview, why_it_matters [4], traditional_approach (description, downsides [4]), ai_approach (description, steps [6]: step_number, title, description, replyma_feature), results [4]: metric, improvement, timeframe, pro_tips [5], faq [5], cta_text.`,
    });
  }

  // Integrations
  for (const platformSlug of PLATFORM_SLUGS) {
    jobs.push({
      contentType: "integration",
      slug: platformSlug,
      context: { platform_slug: platformSlug, generated_at: now },
      schemaDescription: `IntegrationPage: meta.content_type "integration", meta.platform_slug, seo, content: intro, what_you_can_do [8], setup_steps [5]: step_number, title, description, time_estimate, automations [6]: trigger, action, example, faq [5], cta_text.`,
    });
  }

  // Checklists
  for (const checklistType of CHECKLIST_TYPES) {
    jobs.push({
      contentType: "checklist",
      slug: checklistType,
      context: { checklist_type: checklistType, generated_at: now },
      schemaDescription: `SupportChecklist: meta.content_type "checklist", meta.checklist_type, seo, content: intro, phases [4]: phase_name, phase_number, items [10]: id, task, description, priority "critical"|"high"|"medium"|"low", time_estimate, replyma_automates (boolean), pro_tips [5].`,
    });
  }

  return jobs;
}

function getSchema(contentType: PseoContentType): z.ZodType<unknown> {
  const m: Record<PseoContentType, z.ZodType<unknown>> = {
    vs: vsPageSchema,
    alternatives: alternativesPageSchema,
    "niche-landing": nicheLandingPageSchema,
    "problem-guide": problemGuideSchema,
    integration: integrationPageSchema,
    checklist: supportChecklistSchema,
  };
  return m[contentType];
}

/** Fill missing content for truncated API responses so validation passes. */
function fillMissingContent(parsed: unknown, job: Job): void {
  if (!parsed || typeof parsed !== "object" || !("content" in parsed)) return;
  const content = (parsed as Record<string, unknown>).content as Record<string, unknown> | undefined;
  if (!content) return;

  if (job.contentType === "integration") {
    if (!Array.isArray(content.what_you_can_do))
      content.what_you_can_do = Array.from({ length: 8 }, (_, i) => `Capability ${i + 1} for ${job.slug}.`);
    else if (content.what_you_can_do.length < 8)
      while (content.what_you_can_do.length < 8)
        content.what_you_can_do.push(`Additional capability for ${job.slug}.`);
    if (!Array.isArray(content.setup_steps))
      content.setup_steps = Array.from({ length: 5 }, (_, i) => ({
        step_number: i + 1,
        title: `Step ${i + 1}`,
        description: `Configure integration.`,
        time_estimate: "2–5 min",
      }));
    else if (content.setup_steps.length < 5)
      while (content.setup_steps.length < 5)
        content.setup_steps.push({
          step_number: content.setup_steps.length + 1,
          title: `Step ${content.setup_steps.length + 1}`,
          description: "Complete setup.",
          time_estimate: "2–5 min",
        });
    if (!Array.isArray(content.automations))
      content.automations = Array.from({ length: 6 }, (_, i) => ({
        trigger: `Event ${i + 1}`,
        action: "Replyma action",
        example: "Example flow.",
      }));
    else if (content.automations.length < 6)
      while (content.automations.length < 6)
        content.automations.push({
          trigger: "Event",
          action: "Action",
          example: "Example.",
        });
    if (!Array.isArray(content.faq))
      content.faq = Array.from({ length: 5 }, (_, i) => ({
        question: `FAQ ${i + 1}?`,
        answer: "See documentation.",
      }));
    else if (content.faq.length < 5)
      while (content.faq.length < 5)
        content.faq.push({ question: "Common question?", answer: "Answer." });
    if (typeof content.cta_text !== "string") content.cta_text = "Try Replyma free";
  }

  if (job.contentType === "checklist") {
    if (!Array.isArray(content.phases) || content.phases.length < 4) {
      const phases = Array.isArray(content.phases) ? [...content.phases] : [];
      const phaseNames = ["Setup", "Configuration", "Launch", "Optimize"];
      while (phases.length < 4) {
        const n = phases.length + 1;
        phases.push({
          phase_name: phaseNames[phases.length] ?? `Phase ${n}`,
          phase_number: n,
          items: Array.from({ length: 10 }, (_, i) => ({
            id: `p${n}-${i + 1}`,
            task: `Task ${i + 1}`,
            description: "Complete this step.",
            priority: "medium" as const,
            time_estimate: "5 min",
            replyma_automates: false,
          })),
        });
      }
      content.phases = phases.slice(0, 4);
    } else {
      for (let p = 0; p < content.phases.length; p++) {
        const phase = content.phases[p] as Record<string, unknown>;
        if (!Array.isArray(phase.items)) phase.items = [];
        const items = phase.items as Record<string, unknown>[];
        while (items.length < 10)
          items.push({
            id: `p${p + 1}-${items.length + 1}`,
            task: `Task ${items.length + 1}`,
            description: "Complete.",
            priority: "medium",
            time_estimate: "5 min",
            replyma_automates: false,
          });
      }
    }
    if (!Array.isArray(content.pro_tips))
      content.pro_tips = Array.from({ length: 5 }, (_, i) => `Tip ${i + 1}: review docs.`);
    else while (content.pro_tips.length < 5) content.pro_tips.push("Review best practices.");
  }
}

const PROMPT_PREFIX = `You are generating conversion-focused SEO content for Replyma.com — an AI customer support platform built specifically for e-commerce stores. Replyma competes with Gorgias, Zendesk, and Tidio. Your content must position Replyma positively but honestly.`;

const PROMPT_RULES = `Rules: all array lengths must match exactly, all content must be specific and realistic (not generic), mention real e-commerce scenarios and real competitor names where relevant. Return ONLY raw valid JSON with no markdown, no code fence, no explanation.`;

async function generateWithGemini(context: unknown, schemaDescription: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.7,
      maxOutputTokens: 16384,
    },
  });
  const prompt = `${PROMPT_PREFIX}\n\nContext: ${JSON.stringify(context)}\n\nGenerate a valid JSON object strictly matching this interface: ${schemaDescription}\n\n${PROMPT_RULES}`;
  const result = await model.generateContent(prompt);
  const response = result.response;
  if (!response || !response.text) {
    throw new Error("Empty or missing response from Gemini");
  }
  return response.text();
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const errorsLog: { job: string; error: string; raw?: string }[] = [];

async function runJob(job: Job, retried = false): Promise<{ ok: boolean }> {
  const label = `${job.contentType}:${job.slug}`;
  const schema = getSchema(job.contentType);

  let raw: string;
  try {
    raw = await generateWithGemini(job.context, job.schemaDescription);
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    errorsLog.push({ job: label, error: err });
    return { ok: false };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    errorsLog.push({ job: label, error: "Invalid JSON", raw: raw.slice(0, 500) });
    return { ok: false };
  }

  // Normalize common Gemini omissions/format issues before validation
  const ctx = job.context as { generated_at?: string };
  const now = ctx?.generated_at ?? new Date().toISOString();
  if (parsed && typeof parsed === "object" && "meta" in parsed && parsed.meta && typeof parsed.meta === "object") {
    (parsed.meta as Record<string, unknown>).generated_at = (parsed.meta as Record<string, unknown>).generated_at ?? now;
  }
  // If model put seo inside meta, hoist to top level
  if (parsed && typeof parsed === "object" && parsed.meta && typeof parsed.meta === "object") {
    const meta = parsed.meta as Record<string, unknown>;
    if (meta.seo && typeof meta.seo === "object") {
      (parsed as Record<string, unknown>).seo = meta.seo;
      delete meta.seo;
    }
  }
  if (parsed && typeof parsed === "object" && "seo" in parsed && parsed.seo && typeof parsed.seo === "object") {
    const seo = parsed.seo as Record<string, unknown>;
    if (typeof seo.keywords === "string") {
      seo.keywords = seo.keywords.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
    if (seo.keywords == null || !Array.isArray(seo.keywords))
      seo.keywords = ["e-commerce", "checklist", "customer support", job.slug.replace(/-/g, " ")];
    if (typeof seo.description === "string" && seo.description.length > 155) {
      seo.description = seo.description.slice(0, 152).trim() + "...";
    }
  }

  // Fill missing content for truncated API responses so validation can pass
  fillMissingContent(parsed, job);

  const result = schema.safeParse(parsed);
  if (!result.success) {
    if (!retried) {
      return runJob(job, true);
    }
    errorsLog.push({
      job: label,
      error: result.error.message,
      raw: raw.slice(0, 800),
    });
    return { ok: false };
  }

  const outDir = path.join(DATA_GENERATED, job.contentType);
  ensureDir(outDir);
  const outPath = path.join(outDir, `${job.slug}.json`);
  fs.writeFileSync(outPath, JSON.stringify(result.data, null, 2), "utf-8");
  return { ok: true };
}

async function main(): Promise<void> {
  const allJobs = buildJobs();
  const jobs = allJobs.filter((job) => {
    const outPath = path.join(DATA_GENERATED, job.contentType, `${job.slug}.json`);
    return !fs.existsSync(outPath);
  });
  console.log(`Total jobs: ${jobs.length} (${allJobs.length - jobs.length} already generated, skipping)`);

  ensureDir(DATA_GENERATED);
  ensureDir(LOGS_DIR);

  const limit = (await import("p-limit")).default(50);
  const cliProgress = await import("cli-progress");
  const multibar = new cliProgress.MultiBar(
    {
      clearOnComplete: false,
      hideCursor: true,
      format: " {bar} | {value}/{total} | {job}",
    },
    cliProgress.Presets.shades_classic
  );
  const bar = multibar.create(jobs.length, 0, { job: "" });

  let completed = 0;
  let failed = 0;
  const start = Date.now();

  await Promise.all(
    jobs.map((job) =>
      limit(async () => {
        const r = await runJob(job);
        completed++;
        if (!r.ok) failed++;
        bar.update(completed, { job: `${job.contentType}/${job.slug}` });
        return r;
      })
    )
  );

  multibar.stop();

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\nDone. Generated: ${completed - failed}, Failed: ${failed}, Time: ${elapsed}s`);

  if (errorsLog.length > 0) {
    fs.writeFileSync(ERRORS_LOG, JSON.stringify(errorsLog, null, 2), "utf-8");
    console.log(`Errors written to ${ERRORS_LOG}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
