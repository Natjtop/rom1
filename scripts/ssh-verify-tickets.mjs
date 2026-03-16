#!/usr/bin/env node
/** Verify tickets fix on server: backend has notIn CLOSED, then restart backend. */
import { Client } from "ssh2";

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
      stream.on("data", (d) => { out += d.toString(); process.stdout.write(d); });
      stream.stderr.on("data", (d) => { out += d.toString(); process.stderr.write(d); });
      stream.on("close", (code) => (code === 0 ? resolve(out) : reject(new Error("exit " + code))));
    });
  });
}

const conn = new Client();
conn.on("ready", async () => {
  try {
    const path = `${replymaRoot}/backendgeo/src/controllers/tickets.controller.ts`;
    const out = await run(conn, `grep -n "notIn" "${path}" 2>/dev/null || echo "FILE_NOT_FOUND"`);
    if (out.includes("FILE_NOT_FOUND") || !out.includes("CLOSED")) {
      console.error("\n[FAIL] Backend tickets.controller.ts on server does not contain listTickets fix (notIn CLOSED). Run: npm run deploy:quick");
      process.exitCode = 1;
    } else {
      console.log("\n[OK] Backend has listTickets exclusion fix.");
    }
    await run(conn, `pm2 restart ${pm2Backend} && pm2 list`);
    console.log("\nBackend restarted.");
  } catch (e) {
    console.error("Error:", e.message);
    process.exitCode = 1;
  } finally {
    conn.end();
  }
}).on("error", (err) => {
  console.error("SSH error:", err.message);
  process.exit(1);
}).connect({ host, port: 22, username: user, password });