/**
 * pSEO 2.0 — Submit generated page URLs to Google Indexing API.
 * Prioritizes VS and niche landing pages. Max 200 URLs per day (API quota).
 * Logs to logs/indexing-submitted.json. Run daily via cron: 0 9 * * * npx tsx scripts/submit-indexing.ts
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { getGeneratedSlugs } from "../lib/pseo-data";

const ROOT = process.cwd();
const LOGS_DIR = path.join(ROOT, "logs");
const SUBMITTED_LOG = path.join(LOGS_DIR, "indexing-submitted.json");
const DAILY_LIMIT = 200;
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://replyma.com";

type LogEntry = { url: string; submittedAt: string; type: string };

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function collectUrls(): { url: string; type: string }[] {
  const urls: { url: string; type: string }[] = [];

  // Priority 1: VS and niche (highest commercial intent)
  const vsSlugs = getGeneratedSlugs("vs");
  vsSlugs.forEach((slug) => urls.push({ url: `${BASE_URL}/vs/${slug}`, type: "vs" }));
  const nicheSlugs = getGeneratedSlugs("niche-landing");
  nicheSlugs.forEach((slug) => urls.push({ url: `${BASE_URL}/for/${slug}`, type: "niche-landing" }));

  // Priority 2: alternatives, guides
  const altSlugs = getGeneratedSlugs("alternatives");
  altSlugs.forEach((slug) => urls.push({ url: `${BASE_URL}/alternatives/${slug}`, type: "alternatives" }));
  const guideSlugs = getGeneratedSlugs("problem-guide");
  guideSlugs.forEach((slug) => urls.push({ url: `${BASE_URL}/guides/${slug}`, type: "problem-guide" }));

  // Priority 3: integrations, checklists
  const integrationSlugs = getGeneratedSlugs("integration");
  integrationSlugs.forEach((slug) =>
    urls.push({ url: `${BASE_URL}/integrations/${slug}`, type: "integration" })
  );
  const checklistSlugs = getGeneratedSlugs("checklist");
  checklistSlugs.forEach((slug) =>
    urls.push({ url: `${BASE_URL}/resources/checklists/${slug}`, type: "checklist" })
  );

  // Hub pages
  urls.push({ url: `${BASE_URL}/vs`, type: "hub" });
  urls.push({ url: `${BASE_URL}/alternatives`, type: "hub" });
  urls.push({ url: `${BASE_URL}/for`, type: "hub" });
  urls.push({ url: `${BASE_URL}/guides`, type: "hub" });
  urls.push({ url: `${BASE_URL}/integrations`, type: "hub" });
  urls.push({ url: `${BASE_URL}/resources`, type: "hub" });

  return urls;
}

async function main(): Promise<void> {
  ensureDir(LOGS_DIR);

  const allUrls = collectUrls();
  const toSubmit = allUrls.slice(0, DAILY_LIMIT);
  const now = new Date().toISOString();

  let submitted: LogEntry[] = [];
  const keyFile = process.env.GOOGLE_INDEXING_SERVICE_ACCOUNT ?? path.join(ROOT, "service_account.json");

  if (!fs.existsSync(keyFile)) {
    console.warn("Service account key not found at", keyFile);
    console.warn("Set GOOGLE_INDEXING_SERVICE_ACCOUNT or add service_account.json. Skipping submission.");
    console.log("URLs that would be submitted:", toSubmit.length);
    process.exit(0);
    return;
  }

  try {
    const { google } = await import("googleapis");
    const auth = new google.auth.GoogleAuth({
      keyFile,
      scopes: ["https://www.googleapis.com/auth/indexing"],
    });
    const indexing = google.indexing({ version: "v3", auth });

    for (const { url, type } of toSubmit) {
      try {
        await indexing.urlNotifications.publish({
          requestBody: { url, type: "URL_UPDATED" },
        });
        submitted.push({ url, submittedAt: now, type });
        process.stdout.write(".");
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("\nFailed:", url, msg);
      }
    }
  } catch (err) {
    console.error("Indexing API error:", err);
    process.exit(1);
  }

  if (submitted.length > 0) {
    let existing: LogEntry[] = [];
    if (fs.existsSync(SUBMITTED_LOG)) {
      try {
        existing = JSON.parse(fs.readFileSync(SUBMITTED_LOG, "utf-8")) as LogEntry[];
      } catch {}
    }
    const combined = [...submitted, ...existing].slice(0, 5000);
    fs.writeFileSync(SUBMITTED_LOG, JSON.stringify(combined, null, 2), "utf-8");
  }

  console.log("\nSubmitted:", submitted.length, "of", toSubmit.length, "URLs. Total available:", allUrls.length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
