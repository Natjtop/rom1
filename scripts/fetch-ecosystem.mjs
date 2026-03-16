#!/usr/bin/env node
import { Client } from 'ssh2';
const host = process.env.SSH_HOST || '88.198.40.210';
const user = process.env.SSH_USER || 'root';
const password = process.env.SSH_PASSWORD;
if (!password) { console.error('Set SSH_PASSWORD'); process.exit(1); }
function run(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      stream.on('data', (d) => { out += d.toString(); process.stdout.write(d); });
      stream.stderr.on('data', (d) => process.stderr.write(d));
      stream.on('close', (code) => (code === 0 ? resolve(out) : reject(new Error('exit ' + code))));
    });
  });
}
const conn = new Client();
conn.on('ready', async () => {
  try {
    await run(conn, 'cat /opt/replyma/ecosystem.config.cjs');
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  } finally {
    conn.end();
  }
}).on('error', (err) => {
  console.error('SSH error:', err.message);
  process.exit(1);
}).connect({ host, port: 22, username: user, password });
