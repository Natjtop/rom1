#!/usr/bin/env node
/**
 * On server: read DATABASE_URL from ecosystem.config.cjs, write backendgeo/.env, run prisma migrate deploy.
 * Usage: SSH_HOST=... SSH_USER=root SSH_PASSWORD=xxx node scripts/migrate-from-ecosystem-remote.mjs
 */
import { Client } from 'ssh2';
import fs from 'node:fs';
import path from 'node:path';

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

// One-liner: node reads ecosystem, extracts replyma-backend env, writes .env with DATABASE_URL (and REDIS_URL so prisma has no other missing vars), then prisma migrate deploy
const createEnvAndMigrate = `
cd ${replymaRoot} && node -e "
const fs = require('fs');
const path = require('path');
const ec = require('${replymaRoot}/ecosystem.config.cjs');
const app = ec.apps.find(a => a.name === 'replyma-backend');
if (!app || !app.env || !app.env.DATABASE_URL) {
  console.error('DATABASE_URL not found in ecosystem');
  process.exit(1);
}
const envPath = path.join('${replymaRoot}', 'backendgeo', '.env');
const lines = [
  'DATABASE_URL=' + app.env.DATABASE_URL,
  'REDIS_URL=' + (app.env.REDIS_URL || 'redis://127.0.0.1:6379'),
  'NODE_ENV=production',
];
fs.writeFileSync(envPath, lines.join('\\n') + '\\n');
console.log('Wrote', envPath, 'with DATABASE_URL');
"
`;

const conn = new Client();
conn.on('ready', async () => {
  try {
    await run(conn, createEnvAndMigrate);
    // If DB already has schema (P3005), baseline: mark existing migrations as applied
    await run(conn, `cd ${replymaRoot}/backendgeo && for d in prisma/migrations/*/; do [ -f "\${d}migration.sql" ] && npx prisma migrate resolve --applied "\$(basename "\$d")" 2>/dev/null; done; true`);
    await run(conn, `cd ${replymaRoot}/backendgeo && npx prisma migrate deploy`);
    console.log('\nMigrations applied.');
    await run(conn, `pm2 restart ${pm2Backend} 2>/dev/null || echo "PM2 ${pm2Backend} not found"`);
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
