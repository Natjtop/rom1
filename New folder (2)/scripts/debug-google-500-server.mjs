#!/usr/bin/env node
/**
 * SSH: find GOOGLE_CLIENT_ID source, trigger POST /auth/google, capture error log.
 */
import { Client } from 'ssh2';

const host = process.env.SSH_HOST || '88.198.40.210';
const user = process.env.SSH_USER || 'root';
const password = process.env.SSH_PASSWORD;
const r = process.env.REPLYMA_ROOT || '/opt/replyma';

if (!password) {
  console.error('Set SSH_PASSWORD');
  process.exit(1);
}

function run(conn, cmd, label) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      if (label) console.log('\n--- ' + label + ' ---');
      stream.on('data', (d) => process.stdout.write(d));
      stream.stderr.on('data', (d) => process.stderr.write(d));
      stream.on('close', (code) => (code === 0 ? resolve() : reject(new Error('exit ' + code))));
    });
  });
}

const conn = new Client();
conn.on('ready', async () => {
  try {
    await run(conn, `grep -h "GOOGLE_CLIENT_ID" ${r}/.env ${r}/backendgeo/.env 2>/dev/null | sed 's/=.*/=***/'`, 'GOOGLE_CLIENT_ID in .env files');
    await run(conn, `grep -A2 -B2 "GOOGLE_CLIENT_ID\\|google" ${r}/ecosystem.config.cjs ${r}/ecosystem.config.js 2>/dev/null | head -30`, 'ecosystem.config GOOGLE');
    await run(conn, `pm2 show replyma-backend 2>/dev/null | grep -E "script path|exec cwd|GOOGLE"`, 'PM2 replyma-backend cwd/env');
    await run(conn, `F=$(ls -t /root/.pm2/logs/replyma-backend-error*.log 2>/dev/null | head -1); echo "Log: $F"; tail -5 "$F"`, 'Last 5 lines error log (before request)');
    await run(conn, `echo "Empty body:"; curl -s -o /dev/null -w "%{http_code}" -X POST "http://127.0.0.1:4001/api/v1/auth/google" -H "Content-Type: application/json" -d '{}'; echo ""`, 'POST empty body');
    await run(conn, `echo "Fake token:"; curl -s -o /dev/null -w "%{http_code}" -X POST "http://127.0.0.1:4001/api/v1/auth/google" -H "Content-Type: application/json" -d '{"credential":"fake"}'; echo ""`, 'POST fake token');
    await run(conn, `sleep 1; F=$(ls -t /root/.pm2/logs/replyma-backend-error*.log 2>/dev/null | head -1); echo "Error log (last 50 lines):"; tail -50 "$F"`, 'Backend error log');
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
