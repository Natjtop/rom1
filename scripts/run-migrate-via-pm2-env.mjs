#!/usr/bin/env node
/**
 * SSH to server, upload run-migrate-with-pm2-env.mjs, run it in backendgeo.
 * Usage: SSH_PASSWORD=xxx node scripts/run-migrate-via-pm2-env.mjs
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
      const localPath = join(__dirname, "..", "backendgeo", "run-raw-alter-deleted-at.mjs");
      if (!existsSync(localPath)) {
        console.error("Not found:", localPath);
        process.exit(1);
      }
      const sftp = await getSftp(conn);
      await putBuffer(sftp, readFileSync(localPath), `${replymaRoot}/backendgeo/run-raw-alter-deleted-at.mjs`);
      console.log("Uploaded run-raw-alter-deleted-at.mjs\n--- Adding Ticket.deletedAt via Prisma ---\n");
      await run(conn, `cd ${replymaRoot}/backendgeo && node run-raw-alter-deleted-at.mjs`);
      console.log("\nDone.");
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