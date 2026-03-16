#!/usr/bin/env node
/**
 * Rebuild backend on server and restart PM2 (fixes missing widget/proactive route in running app).
 */
import { Client } from 'ssh2';

const host = process.env.SSH_HOST || '88.198.40.210';
const user = process.env.SSH_USER || 'root';
const password = process.env.SSH_PASSWORD;
const replymaRoot = process.env.REPLYMA_ROOT || '/opt/replyma';
const pm2Backend = process.env.PM2_APP_BACKEND || 'replyma-backend';

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
    console.log('Rebuilding backend...');
    await run(conn, `cd ${r}/backendgeo && npm run build`);
    console.log('Restarting replyma-backend...');
    await run(conn, `pm2 restart ${pm2Backend}`);
    console.log('Verifying GET /api/v1/widget/proactive...');
    await run(conn, `sleep 2 && curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:4001/api/v1/widget/proactive?workspaceId=test&sessionId=test"`);
    console.log('');
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
