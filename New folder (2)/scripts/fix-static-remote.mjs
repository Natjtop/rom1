#!/usr/bin/env node
/**
 * Fix 500 / MIME errors for JS/CSS on server: re-copy static into standalone and restart frontend.
 * Use when replyma.com returns 500 for /_next/static/* (e.g. after failed or partial deploy).
 * Usage: SSH_HOST=... SSH_USER=root SSH_PASSWORD=xxx REPLYMA_ROOT=/opt/replyma node scripts/fix-static-remote.mjs
 */
import { Client } from 'ssh2';

const host = process.env.SSH_HOST || '88.198.40.210';
const user = process.env.SSH_USER || 'root';
const password = process.env.SSH_PASSWORD;
const replymaRoot = process.env.REPLYMA_ROOT || '/opt/replyma';
const pm2Frontend = process.env.PM2_APP_FRONTEND || 'replyma-frontend';

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
    await run(conn, `cd ${replymaRoot} && node scripts/copy-standalone-public.mjs 2>/dev/null || true`);
    await run(conn, `cd ${replymaRoot} && mkdir -p .next/standalone/public .next/standalone/.next/static && (test -d public && cp -r public/. .next/standalone/public/) && (test -d .next/static && cp -r .next/static/. .next/standalone/.next/static/) && true`);
    await run(conn, `cd ${replymaRoot} && echo "Static dir:" && ls -la .next/standalone/.next/static/ 2>/dev/null | head -5`);
    await run(conn, `pm2 restart ${pm2Frontend} 2>/dev/null || echo "PM2 app ${pm2Frontend} not found"`);
    console.log('\nStatic fix done. If 500 persists, run full deploy (build may have failed).');
  } catch (e) {
    console.error('\nError:', e.message);
    process.exit(1);
  } finally {
    conn.end();
  }
}).on('error', (err) => {
  console.error('SSH error:', err.message);
  process.exit(1);
}).connect({ host, port: 22, username: user, password });
