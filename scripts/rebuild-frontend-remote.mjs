#!/usr/bin/env node
/**
 * Fix 500 on replyma.com: clean .next, full build, copy static, restart frontend.
 * Run on server when ChunkLoadError / MODULE_NOT_FOUND for server/chunks/ssr.
 * Usage: SSH_HOST=... SSH_USER=root SSH_PASSWORD=xxx REPLYMA_ROOT=/opt/replyma node scripts/rebuild-frontend-remote.mjs
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
    const r = replymaRoot;
    console.log('Regenerating Prisma client in backendgeo (so root build type-check passes)...');
    await run(conn, `cd ${r}/backendgeo && npx prisma generate 2>/dev/null || true`);
    console.log('Removing old .next for clean build...');
    await run(conn, `cd ${r} && rm -rf .next`);
    console.log('Running npm run build (this may take several minutes)...');
    await run(conn, `cd ${r} && npm run build`);
    console.log('Copying static and public into standalone...');
    await run(conn, `cd ${r} && node scripts/copy-standalone-public.mjs 2>/dev/null || true`);
    await run(conn, `cd ${r} && mkdir -p .next/standalone/public .next/standalone/.next/static && (test -d public && cp -r public/. .next/standalone/public/) && (test -d .next/static && cp -r .next/static/. .next/standalone/.next/static/) && true`);
    await run(conn, `cd ${r} && mkdir -p .next/standalone/data && cp -r data/generated .next/standalone/data/ 2>/dev/null || true`);
    console.log('Verifying server chunks exist...');
    await run(conn, `ls ${r}/.next/standalone/.next/server/chunks/ssr/ 2>/dev/null | head -5 || echo "WARN: no ssr chunks"`);
    await run(conn, `pm2 restart ${pm2Frontend} 2>/dev/null || echo "PM2 ${pm2Frontend} not found"`);
    console.log('\nFrontend rebuild done. Try https://replyma.com again.');
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
