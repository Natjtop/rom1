#!/usr/bin/env node
/**
 * Upload backend fix files to server via SFTP and rebuild/restart backend.
 * Usage: SSH_PASSWORD=xxx node scripts/deploy-backend-fix.mjs
 */
import { Client } from "ssh2";
import { readFileSync } from "fs";
import { join, dirname, posix } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const backendRoot = join(projectRoot, "backendgeo");

const host = process.env.SSH_HOST || "88.198.40.210";
const user = process.env.SSH_USER || "root";
const password = process.env.SSH_PASSWORD;
const remoteRoot = process.env.REPLYMA_ROOT || "/opt/replyma";

if (!password) {
  console.error("Set SSH_PASSWORD");
  process.exit(1);
}

const files = [
  ["backendgeo/src/workers/messageProcessor.ts", "backendgeo/src/workers/messageProcessor.ts"],
  ["backendgeo/src/services/flowEngine.ts", "backendgeo/src/services/flowEngine.ts"],
  ["backendgeo/src/controllers/webhooks.controller.ts", "backendgeo/src/controllers/webhooks.controller.ts"],
];

function run(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = "";
      stream.on("data", (d) => {
        out += d.toString();
        process.stdout.write(d);
      });
      stream.stderr.on("data", (d) => process.stderr.write(d));
      stream.on("close", (code) => {
        if (code === 0) resolve(out);
        else reject(new Error("exit " + code));
      });
    });
  });
}

function upload(conn, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      const content = readFileSync(join(projectRoot, localPath), "utf8");
      const remoteFull = remotePath.startsWith("/") ? remotePath : posix.join(remoteRoot, remotePath);
      const remoteDir = posix.dirname(remoteFull);
      sftp.mkdir(remoteDir, { recursive: true }, (mkdirErr) => {
        if (mkdirErr && mkdirErr.code !== 4) return reject(mkdirErr);
        const stream = sftp.createWriteStream(remoteFull);
        stream.write(content, "utf8", (writeErr) => {
          if (writeErr) return reject(writeErr);
          stream.end(() => resolve());
        });
      });
    });
  });
}

const conn = new Client();
conn
  .on("ready", async () => {
    try {
      for (const [local, remote] of files) {
        console.log("Uploading", local, "->", remote);
        await upload(conn, local, remote);
      }
      console.log("\nBuilding backend and restarting PM2...");
      await run(conn, `cd ${remoteRoot}/backendgeo && npm run build`);
      await run(conn, "pm2 restart replyma-backend");
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
