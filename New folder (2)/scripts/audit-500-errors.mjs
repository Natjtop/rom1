#!/usr/bin/env node
/**
 * SSH: audit all 500 errors - tail backend error log, grep for stack traces and error messages.
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
      if (label) console.log('\n========== ' + label + ' ==========');
      stream.on('data', (d) => process.stdout.write(d));
      stream.stderr.on('data', (d) => process.stderr.write(d));
      stream.on('close', (code) => (code === 0 ? resolve() : reject(new Error('exit ' + code))));
    });
  });
}

const conn = new Client();
conn.on('ready', async () => {
  try {
    await run(conn, `F=$(ls -t /root/.pm2/logs/replyma-backend-error*.log 2>/dev/null | head -1); wc -l "$F"; echo "File: $F"`, '1. Backend error log size');
    await run(conn, `F=$(ls -t /root/.pm2/logs/replyma-backend-out*.log 2>/dev/null | head -1); echo "Out log (last 100):"; tail -100 "$F"`, '2. Backend OUT log (last 100)');
    await run(conn, `grep " 500 " /var/log/nginx/access.log 2>/dev/null | tail -30 || grep " 500 " /var/log/nginx/*.log 2>/dev/null | tail -20`, '3. Nginx: recent 500 responses');
    await run(conn, `F=$(ls -t /root/.pm2/logs/replyma-backend-error*.log 2>/dev/null | head -1); tail -300 "$F"`, '4. Raw error log (last 300 lines)');
    await run(conn, `curl -s -o /dev/null -w "%{http_code}" -X GET "http://127.0.0.1:4001/api/v1/settings" -H "Content-Type: application/json"`, '5. GET /settings (no auth)');
    await run(conn, `curl -s -o /dev/null -w "%{http_code}" -X POST "http://127.0.0.1:4001/api/v1/auth/google" -H "Content-Type: application/json" -d '{"credential":"x"}'`, '6. POST /auth/google (invalid)');
    await run(conn, `curl -s -w "\\n%{http_code}" -X GET "http://127.0.0.1:4001/api/v1/settings" -H "Content-Type: application/json" -H "Authorization: Bearer invalid.jwt.token" | tail -5`, '7. GET /settings with invalid JWT (may 500?)');
    await run(conn, `sleep 2; F=$(ls -t /root/.pm2/logs/replyma-backend-error*.log 2>/dev/null | head -1); echo "Error log after requests:"; tail -80 "$F"`, '8. Error log after requests');
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
