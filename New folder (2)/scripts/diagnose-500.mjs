#!/usr/bin/env node
/**
 * SSH to server and diagnose 500 errors on frontend (replyma.com).
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
    console.log('=== PM2 replyma-frontend status ===');
    await run(conn, `pm2 show replyma-frontend 2>/dev/null | head -35`);
    console.log('\n=== Last 80 lines of replyma-frontend error log ===');
    await run(conn, `tail -80 /root/.pm2/logs/replyma-frontend-error-28.log 2>/dev/null || true`);
    console.log('\n=== Last 30 lines of replyma-frontend out log ===');
    await run(conn, `tail -30 /root/.pm2/logs/replyma-frontend-out-28.log 2>/dev/null || true`);
    console.log('\n=== Static dir: .next/standalone/.next/static ===');
    await run(conn, `ls -la ${r}/.next/standalone/.next/static/ 2>/dev/null | head -15 || echo "DIR MISSING"`);
    await run(conn, `ls ${r}/.next/standalone/.next/static/chunks/ 2>/dev/null | head -10 || echo "chunks dir missing"`);
    console.log('\n=== Curl localhost:3001/login ===');
    await run(conn, `curl -sI http://127.0.0.1:3001/login 2>/dev/null | head -20 || true`);
    console.log('\n=== Curl one static chunk (first 5 lines body if 500) ===');
    await run(conn, `curl -sI "http://127.0.0.1:3001/_next/static/chunks/5d420d97975eccac.js" 2>/dev/null | head -15; echo "--- body ---"; curl -s "http://127.0.0.1:3001/_next/static/chunks/5d420d97975eccac.js" 2>/dev/null | head -5 || true`);
    console.log('\n=== Nginx server_name replyma ===');
    await run(conn, `grep -r "server_name" /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ 2>/dev/null | grep -i replyma || true`);
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
