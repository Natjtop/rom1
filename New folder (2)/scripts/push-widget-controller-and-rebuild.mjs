#!/usr/bin/env node
/**
 * Sync widget.controller.ts to server, rebuild backend, restart PM2.
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
    const local = path.join(localRoot, 'backendgeo/src/controllers/widget.controller.ts');
    const remote = `${replymaRoot}/backendgeo/src/controllers/widget.controller.ts`;
    if (!fs.existsSync(local)) throw new Error('widget.controller.ts not found');
    await run(conn, `mkdir -p ${replymaRoot}/backendgeo/src/controllers`);
    await putFile(conn, local, remote);
    console.log('Synced widget.controller.ts');
    await run(conn, `cd ${replymaRoot}/backendgeo && npm run build`);
    await run(conn, 'pm2 restart replyma-backend');
    console.log('Done. Verifying proactive endpoint...');
    await run(conn, `sleep 2 && curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:4001/api/v1/widget/proactive?workspaceId=x&sessionId=y"`);
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
