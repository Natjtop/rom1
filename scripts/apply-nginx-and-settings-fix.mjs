#!/usr/bin/env node
/**
 * 1. Fix nginx wildcard: alias to standalone static so fonts/media 404 on *.replyma.com are fixed.
 * 2. Reload nginx.
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
      stream.on('data', (d) => process.stdout.write(d));
      stream.stderr.on('data', (d) => process.stderr.write(d));
      stream.on('close', (code) => { if (code === 0) resolve(); else reject(new Error('exit ' + code)); });
    });
  });
}

const conn = new Client();
conn.on('ready', async () => {
  try {
    const r = replymaRoot;
    const cfg = '/etc/nginx/sites-enabled/replyma-wildcard';
    // 1) _next/static must win over regex ".*.woff2" -> use ^~ so prefix wins
    await run(conn, `sed -i 's|location /_next/static/|location ^~ /_next/static/|' ${cfg}`);
    // 2) serve from standalone (files are in .next/standalone/.next/static/)
    await run(conn, `sed -i 's|alias ${r}/.next/static/|alias ${r}/.next/standalone/.next/static/|g' ${cfg}`);
    console.log('Updated replyma-wildcard: ^~ /_next/static and alias to standalone');
    await run(conn, 'nginx -t');
    await run(conn, 'systemctl reload nginx');
    console.log('Nginx reloaded.');
    await run(conn, `curl -s -o /dev/null -w "Font from local nginx: %{http_code}\\n" -k -H "Host: roman-ahi8.replyma.com" "https://127.0.0.1/_next/static/media/051742360c26797e-s.p.102b7f24.woff2"`);
    console.log('If 200 above but 404 in browser: purge Cloudflare cache for *.replyma.com (Caching → Purge).');
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
