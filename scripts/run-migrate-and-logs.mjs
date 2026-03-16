#!/usr/bin/env node
/**
 * One-off: SSH to server, run prisma migrate deploy in backendgeo, then show last backend logs.
 * Usage: SSH_PASSWORD=xxx node scripts/run-migrate-and-logs.mjs
 */
import { Client } from "ssh2";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const host = process.env.SSH_HOST || "88.198.40.210";
const user = process.env.SSH_USER || "root";
const password = process.env.SSH_PASSWORD;
const replymaRoot = process.env.REPLYMA_ROOT || "/opt/replyma";
const pm2Backend = process.env.PM2_APP_BACKEND || "replyma-backend";

if (!password) {
  console.error("Set SSH_PASSWORD");
  process.exit(1);
}

function run(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = "";
      stream.on("data", (d) => {
        const s = d.toString();
        out += s;
        process.stdout.write(s);
      });
      stream.stderr.on("data", (d) => process.stderr.write(d.toString()));
      stream.on("close", (code) => (code === 0 ? resolve(out) : reject(new Error("exit " + code))));
    });
  });
}

function getSftp(conn) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => (err ? reject(err) : resolve(sftp)));
  });
}

function putBuffer(sftp, buffer, remotePath) {
  return new Promise((resolve, reject) => {
    const stream = sftp.createWriteStream(remotePath);
    stream.on("error", reject);
    stream.on("close", resolve);
    stream.end(buffer);
  });
}

const conn = new Client();
conn
  .on("ready", async () => {
    try {
      console.log("--- Running migrations ---\n");
      try {
        await run(conn, `cd ${replymaRoot}/backendgeo && node run-migrate.mjs`);
      } catch (e1) {
        console.log("\nFirst attempt failed. Uploading run-migrate-port-5432.mjs and retrying with port 5432...\n");
        const localPath = join(__dirname, "..", "backendgeo", "run-migrate-port-5432.mjs");
        if (existsSync(localPath)) {
          const sftp = await getSftp(conn);
          const content = readFileSync(localPath);
          await putBuffer(sftp, content, `${replymaRoot}/backendgeo/run-migrate-port-5432.mjs`);
          await run(conn, `cd ${replymaRoot}/backendgeo && node run-migrate-port-5432.mjs`);
        } else {
          console.error("run-migrate-port-5432.mjs not found locally. Run deploy to sync it, or fix DATABASE_URL port on server.");
          throw e1;
        }
      }
      console.log("\n--- Last 60 lines of backend PM2 logs ---\n");
      await run(conn, `pm2 logs ${pm2Backend} --lines 60 --nostream 2>&1 || true`);
    } catch (e) {
      console.error("\nError:", e.message);
      process.exit(1);
    } finally {
      conn.end();
    }
  })
  .on("error", (err) => {
    console.error("SSH error:", err.message);
    process.exit(1);
  })
  .connect({ host, port: 22, username: user, password });
