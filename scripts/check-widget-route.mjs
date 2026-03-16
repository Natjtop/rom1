#!/usr/bin/env node
/**
 * SSH to server: verify widget/proactive route exists and respond.
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
    console.log('=== Backend app.ts: widget/proactive route ===');
    await run(conn, `grep -n "widget/proactive\\|widgetSessionLimiter" ${r}/backendgeo/src/app.ts 2>/dev/null || true`);
    console.log('\n=== Backend dist: app and widget controller ===');
    await run(conn, `ls -la ${r}/backendgeo/dist/app.js ${r}/backendgeo/dist/controllers/widget*.js 2>/dev/null || true`);
    await run(conn, `grep -n "widget/proactive\\|widgetSessionLimiter" ${r}/backendgeo/dist/app.js 2>/dev/null | head -5 || echo "not found in dist"`);
    console.log('\n=== Curl from server to localhost (backend port 4001) ===');
    await run(conn, `curl -s -w "\\nHTTP_CODE:%{http_code}" "http://127.0.0.1:4001/api/v1/widget/proactive?workspaceId=test&sessionId=test"`);
    console.log('\n=== Backend error log (last 25 lines) ===');
    await run(conn, `tail -25 /root/.pm2/logs/replyma-backend-error-58.log 2>/dev/null || true`);
    console.log('\n=== Curl to api.replyma.com (external) ===');
    await run(conn, `curl -s -o /dev/null -w "%{http_code}" "https://api.replyma.com/api/v1/widget/proactive?workspaceId=test&sessionId=test"`);
    console.log('');
    await run(conn, `curl -s "https://api.replyma.com/api/v1/widget/proactive?workspaceId=test&sessionId=test" 2>/dev/null | head -5`);
    console.log('\n=== Nginx: api.replyma.com proxy target ===');
    await run(conn, `grep -A2 "api.replyma.com\\|server_name api" /etc/nginx/sites-enabled/replyma 2>/dev/null | head -20`);
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
