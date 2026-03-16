#!/usr/bin/env node
/**
 * Read-only server health check: PM2, nginx, backend, frontend, key endpoints.
 * No writes, no restarts, no config changes.
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
    console.log('========== 1. PM2 status ==========');
    await run(conn, 'pm2 list');
    console.log('\n========== 2. Nginx ==========');
    await run(conn, 'nginx -t 2>&1; true');
    await run(conn, 'systemctl is-active nginx 2>/dev/null; true');
    console.log('\n========== 3. Backend (localhost:4001) ==========');
    await run(conn, 'curl -s -o /dev/null -w "GET /api/v1/health -> %{http_code}\\n" http://127.0.0.1:4001/api/v1/health; true');
    await run(conn, 'curl -s -o /dev/null -w "GET /api/v1/widget/proactive -> %{http_code}\\n" "http://127.0.0.1:4001/api/v1/widget/proactive?workspaceId=x&sessionId=y"; true');
    await run(conn, 'curl -s http://127.0.0.1:4001/api/v1/health 2>/dev/null | head -1; true');
    console.log('\n========== 4. Frontend (localhost:3001) ==========');
    await run(conn, 'curl -s -o /dev/null -w "GET /login -> %{http_code}\\n" http://127.0.0.1:3001/login; true');
    await run(conn, 'curl -s -o /dev/null -w "GET / -> %{http_code}\\n" http://127.0.0.1:3001/; true');
    console.log('\n========== 5. Public URLs (from server) ==========');
    await run(conn, 'curl -s -o /dev/null -w "https://replyma.com/ -> %{http_code}\\n" https://replyma.com/; true');
    await run(conn, 'curl -s -o /dev/null -w "https://replyma.com/login -> %{http_code}\\n" https://replyma.com/login; true');
    await run(conn, 'curl -s -o /dev/null -w "https://api.replyma.com/api/v1/widget/proactive -> %{http_code}\\n" "https://api.replyma.com/api/v1/widget/proactive?workspaceId=x&sessionId=y"; true');
    console.log('\n========== 6. Replyma processes (memory) ==========');
    await run(conn, 'pm2 list | grep -E "replyma|id\\s*│" || true');
    console.log('\n========== 7. Backend error log (last 5 lines) ==========');
    await run(conn, 'tail -5 /root/.pm2/logs/replyma-backend-error-58.log 2>/dev/null; true');
    console.log('\n========== 8. Frontend error log (last 5 lines) ==========');
    await run(conn, 'tail -5 /root/.pm2/logs/replyma-frontend-error-28.log 2>/dev/null; true');
    console.log('\n========== 9. Disk (replyma root) ==========');
    await run(conn, `df -h ${r} 2>/dev/null | tail -1`);
    await run(conn, `du -sh ${r}/.next ${r}/backendgeo/dist 2>/dev/null; true`);
    console.log('\n========== 10. Key files present ==========');
    await run(conn, `test -f ${r}/.next/standalone/server.js && echo "standalone/server.js: OK" || echo "standalone/server.js: MISSING"`);
    await run(conn, `test -d ${r}/.next/standalone/.next/server/chunks/ssr && echo "server/chunks/ssr: OK" || echo "server/chunks/ssr: MISSING"`);
    await run(conn, `test -f ${r}/backendgeo/dist/index.js && echo "backend dist/index.js: OK" || echo "backend dist: MISSING"`);
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
