#!/usr/bin/env node
/**
 * Verify that the Live Chat widget will work for users on their sites.
 * Checks: widget.js is served as JS, widget page loads, API endpoints respond.
 * Usage: node scripts/verify-widget-embed.mjs [BASE_URL]
 * Default BASE_URL = https://replyma.com, API = https://api.replyma.com
 */
const BASE = process.argv[2] || 'https://replyma.com';
const API_BASE = process.env.API_BASE || BASE.replace(/^(https?:\/\/)(www\.)?/, '$1api.');

async function main() {
  console.log('Live Chat widget verification');
  console.log('  Frontend:', BASE);
  console.log('  API:', API_BASE);
  let passed = 0;
  let failed = 0;

  // 1. widget.js must return JavaScript (not HTML)
  const r1 = await globalThis.fetch(BASE + '/widget.js', { method: 'GET', redirect: 'follow' });
  const ct = r1.headers.get('content-type') || '';
  const isJs = r1.ok && (ct.includes('javascript') || ct.includes('application/javascript'));
  if (isJs) {
    console.log('\x1b[32m✓\x1b[0m widget.js returns JavaScript (Content-Type: ' + ct + ')');
    passed++;
  } else {
    console.log('\x1b[31m✗\x1b[0m widget.js must return JavaScript. Got status=' + r1.status + ' Content-Type=' + ct + ' (if text/html, fix: copy public/ to .next/standalone/public/ or use nginx alias)');
    failed++;
  }

  // 2. Widget page (iframe target) returns 200
  const r2 = await globalThis.fetch(BASE + '/widget/test-workspace-id', { method: 'GET', redirect: 'follow' });
  if (r2.ok) {
    console.log('\x1b[32m✓\x1b[0m Widget page /widget/<id> returns 200');
    passed++;
  } else {
    console.log('\x1b[31m✗\x1b[0m Widget page returned ' + r2.status);
    failed++;
  }

  // 3. API health (backend exposes /health at root)
  const r3 = await globalThis.fetch(API_BASE + '/health', { method: 'GET' }).catch(() => null);
  if (r3 && r3.ok) {
    console.log('\x1b[32m✓\x1b[0m API health OK');
    passed++;
  } else {
    console.log('\x1b[31m✗\x1b[0m API health failed (status ' + (r3 ? r3.status : 'network error') + ')');
    failed++;
  }

  // 4. Widget settings endpoint (public, no auth) - 404 is OK for fake ID
  const r4 = await globalThis.fetch(API_BASE + '/api/v1/widget/settings/00000000-0000-0000-0000-000000000000', { method: 'GET' }).catch(() => null);
  const ok4 = r4 && (r4.status === 200 || r4.status === 404);
  if (ok4) {
    console.log('\x1b[32m✓\x1b[0m Widget settings API responds (200 or 404)');
    passed++;
  } else {
    console.log('\x1b[31m✗\x1b[0m Widget settings API: status ' + (r4 ? r4.status : 'network error'));
    failed++;
  }

  console.log('');
  if (failed === 0) {
    console.log('\x1b[32mAll checks passed. Widget will work on customer sites.\x1b[0m');
    process.exit(0);
  } else {
    console.log('\x1b[31m' + failed + ' check(s) failed. Fix before relying on the embed.\x1b[0m');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
