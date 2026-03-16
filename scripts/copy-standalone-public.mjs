#!/usr/bin/env node
/**
 * Copy public/ and .next/static into .next/standalone so that static assets
 * (including widget.js, fonts) are served in production.
 * Ensures /_next/static/media/* (fonts) work by copying media to top-level static.
 * Run after: npm run build
 */
import { cpSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const root = join(fileURLToPath(import.meta.url), '..', '..');
const standalone = join(root, '.next', 'standalone');
const publicDir = join(root, 'public');
const staticDir = join(root, '.next', 'static');
const standalonePublic = join(standalone, 'public');
const standaloneNextStatic = join(standalone, '.next', 'static');

if (!existsSync(standalone)) {
  console.warn('scripts/copy-standalone-public.mjs: .next/standalone not found (run npm run build first)');
  process.exit(0);
}

if (existsSync(publicDir)) {
  mkdirSync(standalonePublic, { recursive: true });
  cpSync(publicDir, standalonePublic, { recursive: true });
  console.log('Copied public/ to .next/standalone/public/ (widget.js and other assets)');
}

if (existsSync(staticDir)) {
  mkdirSync(standaloneNextStatic, { recursive: true });
  cpSync(staticDir, standaloneNextStatic, { recursive: true });
  console.log('Copied .next/static to .next/standalone/.next/static');

  // Next often requests fonts at /_next/static/media/xxx.woff2 (no buildId). Ensure top-level media has all woff2.
  const topLevelMedia = join(standaloneNextStatic, 'media');
  mkdirSync(topLevelMedia, { recursive: true });
  const entries = readdirSync(standaloneNextStatic, { withFileTypes: true });
  let copied = false;
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const srcMedia = join(standaloneNextStatic, e.name, 'media');
    if (existsSync(srcMedia)) {
      cpSync(srcMedia, topLevelMedia, { recursive: true });
      copied = true;
    }
  }
  if (copied) console.log('Merged <buildId>/media into .next/standalone/.next/static/media (fonts)');
}
