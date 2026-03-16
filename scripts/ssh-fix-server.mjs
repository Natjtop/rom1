#!/usr/bin/env node
/**
 * SSH: fix nginx so (1) _next/static is proxied to Node, (2) HTML has no-cache.
 * Usage: SSH_PASSWORD=xxx node scripts/ssh-fix-server.mjs
 */
import { Client } from 'ssh2';

const host = process.env.SSH_HOST || '88.198.40.210';
const user = process.env.SSH_USER || 'root';
const password = process.env.SSH_PASSWORD;

if (!password) {
  console.error('Set SSH_PASSWORD');
  process.exit(1);
}

function run(conn, cmd, label) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('data', (d) => { out += d.toString(); process.stdout.write(d); });
      stream.stderr.on('data', (d) => { out += d.toString(); process.stderr.write(d); });
      stream.on('close', (code) => {
        if (label) console.log('\n--- ' + label + ' ---');
        resolve(out);
      });
    });
  });
}

const conn = new Client();
conn.on('ready', async () => {
  try {
    await run(conn, 'ls -la /opt/replyma/.next/static/css/ 2>&1 | head -8', 'Check static/css');
    await run(conn, 'ls -la /opt/replyma/.next/standalone/.next/static/css/ 2>&1 | head -8', 'Check standalone static/css');
    // 1) Replace alias with proxy_pass for _next/static so Node serves files
    await run(conn, `perl -i -0pe 's|location /_next/static/ \\{\\s+alias /opt/replyma/.next/static/;\\s+expires 365d;\\s+access_log off;\\s+add_header Cache-Control "public, immutable";\\s+\\}|location /_next/static/ {\\n        proxy_pass http://127.0.0.1:3001;\\n        proxy_http_version 1.1;\\n        proxy_set_header Host \\$host;\\n        proxy_set_header X-Real-IP \\$remote_addr;\\n        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;\\n        proxy_set_header X-Forwarded-Proto \\$scheme;\\n        add_header Cache-Control "public, max-age=31536000, immutable";\\n    }|s' /etc/nginx/sites-enabled/replyma 2>&1`, 'Nginx: proxy _next/static to Node');
    // 2) Add no-cache for HTML in location /
    await run(conn, `grep -q 'proxy_hide_header Cache-Control' /etc/nginx/sites-enabled/replyma || sed -i 's/proxy_cache_bypass \\\\$http_upgrade;/proxy_cache_bypass \\$http_upgrade;\\n        proxy_hide_header Cache-Control;\\n        add_header Cache-Control "no-cache, no-store, must-revalidate" always;/' /etc/nginx/sites-enabled/replyma`, 'Nginx: no-cache for HTML');
    await run(conn, 'nginx -t 2>&1', 'Nginx test');
    await run(conn, 'systemctl reload nginx 2>&1', 'Nginx reload');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    conn.end();
  }
}).on('error', (err) => {
  console.error('SSH error:', err.message);
  process.exit(1);
}).connect({ host, port: 22, username: user, password });
