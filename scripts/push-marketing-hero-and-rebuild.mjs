#!/usr/bin/env node
/**
 * Push marketing hero CTA changes to server, rebuild frontend, restart PM2.
 */
import { Client } from 'ssh2';
import fs from 'node:fs';
import path from 'node:path';

const host = process.env.SSH_HOST || '88.198.40.210';
const user = process.env.SSH_USER || 'root';
const password = process.env.SSH_PASSWORD;
const r = process.env.REPLYMA_ROOT || '/opt/replyma';
const localRoot = process.cwd();

if (!password) {
  console.error('Set SSH_PASSWORD');
  process.exit(1);
}

function run(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      stream.on('data', (d) => process.stdout.write(d));
      stream.stderr.on('data', (d) => process.stderr.write(d));
      stream.on('close', (code) => (code === 0 ? resolve() : reject(new Error('exit ' + code))));
    });
  });
}

const files = [
  'components/marketing/hero-section.tsx',
  'components/marketing/inbox-mockup.tsx',
  'app/(marketing)/page.tsx',
  'lib/plans.ts',
  'types/pseo.ts',
  'app/(marketing)/pricing/page.tsx',
  'app/(marketing)/about/page.tsx',
  'app/(marketing)/features/ai-agent/page.tsx',
  'app/(marketing)/features/inbox/page.tsx',
  'app/(marketing)/features/shopping-assistant/page.tsx',
  'app/(marketing)/features/shopify/page.tsx',
  'app/(marketing)/features/macros/page.tsx',
  'app/(marketing)/features/analytics/page.tsx',
  'app/(marketing)/features/live-chat/page.tsx',
  'app/(marketing)/partners/page.tsx',
  'app/(marketing)/vs-zendesk/page.tsx',
  'app/(marketing)/vs-gorgias/page.tsx',
];

function uploadAll(conn) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      const uploads = files
        .filter((fileRel) => fs.existsSync(path.join(localRoot, fileRel)))
        .map((fileRel) => {
          const local = path.join(localRoot, fileRel);
          const remote = `${r}/${fileRel.replace(/\\/g, '/')}`;
          return new Promise((res, rej) => {
            sftp.fastPut(local, remote, (e) => (e ? rej(e) : res()));
          });
        });
      Promise.all(uploads).then(resolve).catch(reject);
    });
  });
}

const conn = new Client();
conn.on('ready', async () => {
  try {
    const dirs = [...new Set(files.map((f) => `${r}/${path.dirname(f).replace(/\\/g, '/')}`))];
    await run(conn, `mkdir -p ${dirs.map((d) => `'${d}'`).join(' ')}`);
    await uploadAll(conn);
    for (const fileRel of files) {
      if (fs.existsSync(path.join(localRoot, fileRel))) console.log('Synced', fileRel);
    }
    console.log('Building frontend...');
    await run(conn, `cd ${r} && rm -rf .next && npm run build`);
    await run(conn, `cd ${r} && mkdir -p .next/standalone/public .next/standalone/.next/static && (test -d public && cp -r public/. .next/standalone/public/) && (test -d .next/static && cp -r .next/static/. .next/standalone/.next/static/)`);
    await run(conn, 'pm2 restart replyma-frontend');
    console.log('Done. Marketing hero CTA updated on server.');
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
