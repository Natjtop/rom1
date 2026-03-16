#!/usr/bin/env node
/**
 * Push all live chat widget files to server (iframe + on-site), rebuild frontend, restart PM2.
 * Updates: widget UI, widget.js loader, widget iframe page, marketing layout widget.
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

function putFile(conn, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      sftp.fastPut(localPath, remotePath, (e) => (e ? reject(e) : resolve()));
    });
  });
}

const files = [
  'components/live-chat-widget.tsx',
  'public/widget.js',
  'app/widget/[workspaceId]/page.tsx',
  'app/widget/[workspaceId]/widget-client.tsx',
  'app/widget/layout.tsx',
  'components/marketing/widget-in-layout.tsx',
  'components/widget-embed-script.tsx',
  'app/(marketing)/layout.tsx',
];

const conn = new Client();
conn.on('ready', async () => {
  try {
    for (const file of files) {
      const local = path.join(localRoot, file);
      const remoteDir = `${r}/${path.dirname(file).replace(/\\/g, '/')}`;
      const remote = `${r}/${file.replace(/\\/g, '/')}`;
      if (!fs.existsSync(local)) {
        console.warn('Skip (not found):', file);
        continue;
      }
      await run(conn, `mkdir -p '${remoteDir}'`);
      await putFile(conn, local, remote);
      console.log('Synced', file);
    }
    console.log('Building frontend...');
    await run(conn, `cd ${r} && rm -rf .next && npm run build`);
    await run(conn, `cd ${r} && node scripts/copy-standalone-public.mjs 2>/dev/null || true`);
    await run(conn, `cd ${r} && mkdir -p .next/standalone/public .next/standalone/.next/static && (test -d public && cp -r public/. .next/standalone/public/) && (test -d .next/static && cp -r .next/static/. .next/standalone/.next/static/)`);
    await run(conn, 'pm2 restart replyma-frontend');
    console.log('Done. Live chat widget (iframe + on-site) updated on server.');
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
