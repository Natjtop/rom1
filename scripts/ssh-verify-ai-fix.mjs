#!/usr/bin/env node
/**
 * Verify AI fix (Agent response strip, too short escalation) is present in backend dist on server.
 * Usage: SSH_PASSWORD=xxx node scripts/ssh-verify-ai-fix.mjs
 */
import { Client } from "ssh2";

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
        out += d.toString();
        process.stdout.write(d);
      });
      stream.stderr.on("data", (d) => process.stderr.write(d));
      stream.on("close", (code) => resolve(out));
    });
  });
}

const conn = new Client();
conn
  .on("ready", async () => {
    try {
      const distPath = `${replymaRoot}/backendgeo/dist/services/aiEngine.js`;
      await run(conn, `grep -c "Agent response" ${distPath} 2>/dev/null || echo 0`);
      await run(conn, `grep -c "Response too short" ${distPath} 2>/dev/null || echo 0`);
      await run(conn, `grep -c "Do NOT include any label" ${distPath} 2>/dev/null || echo 0`);
      console.log("\nIf counts above are > 0, AI fix is deployed.");
      await run(conn, "pm2 list | grep replyma");
    } catch (e) {
      console.error("Error:", e.message);
    } finally {
      conn.end();
    }
  })
  .on("error", (err) => {
    console.error("SSH error:", err.message);
    process.exit(1);
  })
  .connect({ host, port: 22, username: user, password });
