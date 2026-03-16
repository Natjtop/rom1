#!/usr/bin/env node
/**
 * Run Prisma migrations on remote server via SSH (no sync, no build).
 * Usage: SSH_HOST=... SSH_USER=root SSH_PASSWORD=xxx REPLYMA_ROOT=/opt/replyma node scripts/migrate-remote.mjs
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
    // On server, backendgeo/.env must exist with DATABASE_URL (e.g. postgresql://user:pass@host:5432/dbname)
    await run(conn, `bash -c 'cd ${replymaRoot}/backendgeo && ([ -f .env ] && grep -q DATABASE_URL .env && echo "Found .env with DATABASE_URL" || echo "WARN: Add DATABASE_URL to backendgeo/.env on server")'`);
    await run(conn, `bash -c 'cd ${replymaRoot}/backendgeo && set -a && [ -f .env ] && . ./.env && set +a && npx prisma migrate deploy'`);
    console.log('\nMigrations applied.');
    await run(conn, `pm2 restart ${pm2Backend} 2>/dev/null || echo "PM2 app ${pm2Backend} not found"`);
    console.log('Backend restarted.');
  } catch (e) {
    console.error('\nError:', e.message);
    process.exit(1);
  } finally {
    conn.end();
  }
}).on('error', (err) => {
  console.error('SSH error:', err.message);
  process.exit(1);
}).connect({ host, port: 22, username: user, password });
