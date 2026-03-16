#!/usr/bin/env node
/**
 * SSH to server: check PM2 backend status and fetch recent error logs.
 * Usage: SSH_PASSWORD=xxx node scripts/ssh-backend-logs.mjs
 */
import { Client } from "ssh2";

const host = process.env.SSH_HOST || "88.198.40.210";
const user = process.env.SSH_USER || "root";
const password = process.env.SSH_PASSWORD;
const pm2Backend = process.env.PM2_APP_BACKEND || "replyma-backend";

if (!password) {
  console.error("Set SSH_PASSWORD");
  process.exit(1);
}

function run(conn, cmd, label) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = "";
      stream.on("data", (d) => {
        out += d.toString();
        process.stdout.write(d);
      });
      stream.stderr.on("data", (d) => {
        out += d.toString();
        process.stderr.write(d);
      });
      stream.on("close", (code) => {
        if (label) console.log("\n--- " + label + " ---\n");
        resolve(out);
      });
    });
  });
}

const conn = new Client();
conn
  .on("ready", async () => {
    try {
      await run(conn, "pm2 list", "PM2 list");
      await run(conn, `pm2 logs ${pm2Backend} --nostream --lines 80 --err`, "PM2 backend stderr (last 80)");
      await run(conn, `pm2 logs ${pm2Backend} --nostream --lines 30`, "PM2 backend last 30 lines");
      await run(conn, "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4000/health 2>/dev/null || echo 'fail'", "Backend health check");
      await run(conn, "curl -s -X POST http://127.0.0.1:4000/api/v1/auth/google -H 'Content-Type: application/json' -d '{}' -w '\\nHTTP %{http_code}' 2>/dev/null | tail -5", "Auth google POST (expect 400/500 body)");
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