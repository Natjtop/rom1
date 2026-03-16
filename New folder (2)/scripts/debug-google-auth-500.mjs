#!/usr/bin/env node
/**
 * SSH to server: check GOOGLE_CLIENT_ID, tail backend error log for auth/google 500.
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
      if (label) console.log('\n--- ' + label + ' ---');
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
    await run(conn, `grep -E "GOOGLE_CLIENT_ID|GOOGLE_CLIENT_SECRET" ${r}/backendgeo/.env 2>/dev/null | sed 's/=.*/=***/' || echo "(no .env or no GOOGLE_*)"`, 'backendgeo/.env GOOGLE_* (masked)');
    await run(conn, `test -f ${r}/backendgeo/.env && (grep -q '^GOOGLE_CLIENT_ID=.' ${r}/backendgeo/.env && echo 'GOOGLE_CLIENT_ID is set' || echo 'GOOGLE_CLIENT_ID missing or empty') || echo 'No backendgeo/.env'`, 'GOOGLE_CLIENT_ID in .env');
    await run(conn, 'pm2 env replyma-backend 2>/dev/null | grep -E "GOOGLE_CLIENT_ID|GOOGLE_CLIENT_SECRET" | sed "s/=.*/=***/" || echo "(GOOGLE_* not in PM2 env)"', 'PM2 replyma-backend env GOOGLE_*');
    await run(conn, 'F=$(ls -t /root/.pm2/logs/replyma-backend-error*.log 2>/dev/null | head -1); echo "Log: $F"; tail -200 "$F" 2>/dev/null', 'Backend error log (last 200 lines)');
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
