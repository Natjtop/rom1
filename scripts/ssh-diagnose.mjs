#!/usr/bin/env node
/**
 * SSH to server and run diagnostics (PM2, nginx, static files, curl).
 * Usage: SSH_PASSWORD=xxx node scripts/ssh-diagnose.mjs
 */
import { Client } from 'ssh2';

const host = process.env.SSH_HOST || '88.198.40.210';
const user = process.env.SSH_USER || 'root';
const password = process.env.SSH_PASSWORD;
const replymaRoot = process.env.REPLYMA_ROOT || '/opt/replyma';

if (!password) {
  console.error('Set SSH_PASSWORD');
  process.exit(1);
}

function run(conn, cmd, label) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('data', (d) => { out += d.toString(); });
      stream.stderr.on('data', (d) => { out += d.toString(); });
      stream.on('close', (code) => {
        if (label) console.log('\n--- ' + label + ' ---\n');
        console.log(out);
        resolve(out);
      });
    });
  });
}

const conn = new Client();
conn.on('ready', async () => {
  try {
    await run(conn, 'pm2 list', 'PM2');
    await run(conn, 'cat /etc/nginx/sites-enabled/replyma', 'Nginx replyma');
    await run(conn, 'curl -sI http://127.0.0.1:3001/', 'Headers 3001');
    await run(conn, `echo "=== .next/static ===" && ls ${replymaRoot}/.next/static/css/ 2>/dev/null | head -5`, 'CSS from .next/static');
    await run(conn, `echo "=== standalone ===" && ls ${replymaRoot}/.next/standalone/.next/static/css/ 2>/dev/null | head -5`, 'CSS from standalone');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    conn.end();
  }
}).on('error', (err) => {
  console.error('SSH error:', err.message);
  process.exit(1);
}).connect({ host, port: 22, username: user, password });
