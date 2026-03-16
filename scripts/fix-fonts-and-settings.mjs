#!/usr/bin/env node
/**
 * Diagnose and fix: 404 for fonts on *.replyma.com, 500 for GET /api/v1/settings.
 */
import { Client } from 'ssh2';
import fs from 'node:fs';
import path from 'node:path';

const host = process.env.SSH_HOST || '88.198.40.210';
const user = process.env.SSH_USER || 'root';
const password = process.env.SSH_PASSWORD;
const replymaRoot = process.env.REPLYMA_ROOT || '/opt/replyma';
const localRoot = process.cwd();

if (!password) {
  console.error('Set SSH_PASSWORD');
  process.exit(1);
}

function run(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('data', (d) => { out += d.toString(); process.stdout.write(d); });
      stream.stderr.on('data', (d) => { process.stderr.write(d); });
      stream.on('close', (code) => { if (code === 0) resolve(out); else reject(new Error('exit ' + code)); });
    });
  });
}

const conn = new Client();
conn.on('ready', async () => {
  try {
    const r = replymaRoot;
    console.log('========== 1. Where are woff2 fonts on server? ==========');
    await run(conn, `find ${r}/.next/standalone -name "*.woff2" 2>/dev/null | head -20`);
    console.log('\n========== 2. List .next/standalone/.next/static ==========');
    await run(conn, `ls -la ${r}/.next/standalone/.next/static/ 2>/dev/null`);
    await run(conn, `ls ${r}/.next/standalone/.next/static/*/media/*.woff2 2>/dev/null | head -10`);
    await run(conn, `ls ${r}/.next/standalone/.next/static/media/*.woff2 2>/dev/null | head -5`);
    console.log('\n========== 3. Nginx: roman-ahi8 / wildcard replyma ==========');
    await run(conn, `grep -l "replyma\\|roman" /etc/nginx/sites-enabled/* 2>/dev/null`);
    await run(conn, `cat /etc/nginx/sites-enabled/replyma-wildcard 2>/dev/null`);
    console.log('\n========== 4. Curl font from localhost:3001 (path with and without buildId) ==========');
    const buildId = (await run(conn, `cat ${r}/.next/standalone/.next/BUILD_ID 2>/dev/null`)).trim();
    console.log('BUILD_ID:', buildId);
    await run(conn, `curl -s -o /dev/null -w "GET /_next/static/media/051742360c26797e-s.p.102b7f24.woff2 -> %{http_code}\\n" http://127.0.0.1:3001/_next/static/media/051742360c26797e-s.p.102b7f24.woff2; true`);
    await run(conn, `curl -s -o /dev/null -w "GET /_next/static/${buildId}/media/051742360c26797e-s.p.102b7f24.woff2 -> %{http_code}\\n" "http://127.0.0.1:3001/_next/static/${buildId}/media/051742360c26797e-s.p.102b7f24.woff2"; true`);
    console.log('\n========== 5. Backend: GET /api/v1/settings (needs auth - expect 401?) ==========');
    await run(conn, `curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:4001/api/v1/settings"; echo ""`);
    await run(conn, `curl -s "http://127.0.0.1:4001/api/v1/settings" | head -3`);
    console.log('\n========== 6. Curl font via roman-ahi8.replyma.com (from server) ==========');
    await run(conn, `curl -s -o /dev/null -w "%{http_code}" -H "Host: roman-ahi8.replyma.com" "http://127.0.0.1/_next/static/media/051742360c26797e-s.p.102b7f24.woff2" 2>/dev/null; echo " (via 127.0.0.1)"`);
    await run(conn, `curl -s -o /dev/null -w "%{http_code}" "https://roman-ahi8.replyma.com/_next/static/media/051742360c26797e-s.p.102b7f24.woff2" -k 2>/dev/null; echo " (https roman-ahi8)"`);
    console.log('\n========== 7. Backend error log (last 30 lines) ==========');
    await run(conn, 'tail -30 /root/.pm2/logs/replyma-backend-error-58.log 2>/dev/null; true');
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  } finally {
    conn.end();
  }
}).on('error', (err) => {
  console.error('SSH error:', err.message);
  process.exit(1);
}).connect({ host, port: 22, username: user, password });
