#!/usr/bin/env node
/**
 * SSH to server and print config info (no secrets). Finds DATABASE_URL source for migrations.
 * Usage: SSH_HOST=... SSH_USER=root SSH_PASSWORD=xxx REPLYMA_ROOT=/opt/replyma node scripts/server-info.mjs
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
    console.log('=== backendgeo dir ===');
    await run(conn, `ls -la ${r}/backendgeo/ 2>/dev/null || echo "dir missing"`);
    console.log('\n=== .env in backendgeo ===');
    await run(conn, `test -f ${r}/backendgeo/.env && echo "EXISTS" || echo "MISSING"`);
    await run(conn, `(test -f ${r}/backendgeo/.env && grep -q DATABASE_URL ${r}/backendgeo/.env && echo "DATABASE_URL is set") || echo "DATABASE_URL not in backendgeo/.env"`);
    console.log('\n=== .env in project root ===');
    await run(conn, `(test -f ${r}/.env && echo "EXISTS") || echo "MISSING"`);
    await run(conn, `(test -f ${r}/.env && grep -q DATABASE_URL ${r}/.env && echo "DATABASE_URL is set") || echo "no DATABASE_URL in root .env"`);
    console.log('\n=== PM2 list ===');
    await run(conn, `pm2 list 2>/dev/null || true`);
    console.log('\n=== PM2 show replyma-backend ===');
    await run(conn, `pm2 show replyma-backend 2>/dev/null | head -50 || true`);
    console.log('\n=== run-migrate-with-pm2-env.mjs (how server runs migrate) ===');
    await run(conn, `head -80 ${r}/backendgeo/run-migrate-with-pm2-env.mjs 2>/dev/null || true`);
    console.log('\n=== backendgeo .env.example (var names only) ===');
    await run(conn, `test -f ${r}/backendgeo/.env.example && sed 's/=.*/=***/' ${r}/backendgeo/.env.example | head -20 || echo "no .env.example"`);
    console.log('\n=== replyma-backend process env var NAMES (from /proc) ===');
    await run(conn, `PID=$(pm2 show replyma-backend 2>/dev/null | grep "pid " | head -1 | awk '{print $4}'); echo "Backend PID: $PID"; [ -n "$PID" ] && tr '\\0' '\\n' < /proc/$PID/environ 2>/dev/null | sed 's/=.*//' | sort -u || echo "could not read process env"`);
    console.log('\n=== PM2 ecosystem / env file ===');
    await run(conn, `ls -la ${r}/ecosystem.config.* ${r}/.env* ${r}/backendgeo/.env* 2>/dev/null; cat ${r}/ecosystem.config.js 2>/dev/null | head -60 || true`);
    console.log('\n=== root .env var names (no values) ===');
    await run(conn, `test -f ${r}/.env && sed 's/=.*/=***/' ${r}/.env | head -30 || echo "no root .env"`);
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
