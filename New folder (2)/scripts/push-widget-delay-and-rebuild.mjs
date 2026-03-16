#!/usr/bin/env node
/**
 * Push live-chat-widget.tsx (10s proactive delay) to server, rebuild frontend, restart PM2.
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

const conn = new Client();
conn.on('ready', async () => {
  try {
    const local = path.join(localRoot, 'components/live-chat-widget.tsx');
    if (!fs.existsSync(local)) throw new Error('live-chat-widget.tsx not found');
    await putFile(conn, local, `${r}/components/live-chat-widget.tsx`);
    console.log('Synced live-chat-widget.tsx (proactiveTriggerDelay=10)');
    await run(conn, `cd ${r} && rm -rf .next && npm run build`);
    await run(conn, `cd ${r} && mkdir -p .next/standalone/public .next/standalone/.next/static && (test -d public && cp -r public/. .next/standalone/public/) && (test -d .next/static && cp -r .next/static/. .next/standalone/.next/static/)`);
    await run(conn, `pm2 restart replyma-frontend`);
    console.log('Done. Proactive message now shows after 10s.');
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
