/**
 * pSEO 2.0 — Server-side read of generated JSON. Use in getStaticParams and page components only.
 * In production (standalone), set PSEO_DATA_ROOT to the dir that contains data/generated (e.g. /opt/replyma).
 */
import * as fs from "node:fs";
import * as path from "node:path";
import type { PseoContentType } from "@/types/pseo";

const ROOT =
  typeof process.env.PSEO_DATA_ROOT === "string" && process.env.PSEO_DATA_ROOT
    ? path.resolve(process.env.PSEO_DATA_ROOT)
    : process.cwd();
const GENERATED = path.join(ROOT, "data", "generated");

function generatedDir(contentType: PseoContentType): string {
  return path.join(GENERATED, contentType);
}

export function getGeneratedSlugs(contentType: PseoContentType): string[] {
  const dir = generatedDir(contentType);
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir, { withFileTypes: true });
  return files
    .filter((f) => f.isFile() && f.name.endsWith(".json"))
    .map((f) => f.name.replace(/\.json$/, ""));
}

export function getGeneratedPage<T>(contentType: PseoContentType, slug: string): T | null {
  const filePath = path.join(generatedDir(contentType), `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
