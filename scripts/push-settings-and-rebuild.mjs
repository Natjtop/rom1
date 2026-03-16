#!/usr/bin/env node
/**
 * Sync settings.controller.ts to server, rebuild backend, restart PM2.
 */
import { Client } from 'ssh2';
import fs from 'node:fs';
import path from 'node:path';

const host = process.env.SSH_HOST || '88.198.40.210';
const user = process.env.SSH_USER || 'root';
const password = process.env.SSH_PASSWORD;
const replymaRoot = process.env.REPLYMA_ROOT || '/opt/replyma';
const localRoot = process.cwd();

if (!password) {
  console.error('Set SSH_PASSWORD');
  process.exit(1);
}

function run(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      stream.on('data', (d) => process.stdout.write(d));
      stream.stderr.on('data', (d) => process.stderr.write(d));
      stream.on('close', (code) => (code === 0 ? resolve() : reject(new Error('exit ' + code))));
    });
  });
}

function putFile(conn, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      sftp.fastPut(localPath, remotePath, (e) => (e ? reject(e) : resolve()));
    });
  });
}

const conn = new Client();
conn.on('ready', async () => {
  try {
    const local = path.join(localRoot, 'backendgeo/src/controllers/settings.controller.ts');
    const remote = `${replymaRoot}/backendgeo/src/controllers/settings.controller.ts`;
    if (!fs.existsSync(local)) throw new Error('settings.controller.ts not found');
    await run(conn, `mkdir -p ${replymaRoot}/backendgeo/src/controllers`);
    await putFile(conn, local, remote);
    console.log('Synced settings.controller.ts');
    await run(conn, `cd ${replymaRoot}/backendgeo && npm run build`);
    await run(conn, 'pm2 restart replyma-backend');
    console.log('Done. GET /api/v1/settings with auth may still 500; check: tail -50 /root/.pm2/logs/replyma-backend-error-*.log');
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
