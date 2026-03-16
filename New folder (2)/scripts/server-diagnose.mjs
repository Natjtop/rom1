#!/usr/bin/env node
/**
 * SSH to server: show backend logs (last 120 lines), list static/media, check backend process.
 * Usage: SSH_PASSWORD=xxx node scripts/server-diagnose.mjs
 */
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
      stream.on("data", (d) => {
        const s = d.toString();
        out += s;
        process.stdout.write(s);
      });
      stream.stderr.on("data", (d) => process.stderr.write(d.toString()));
      stream.on("close", (code) => (code === 0 ? resolve(out) : resolve(out)));
    });
  });
}

const conn = new Client();
conn
  .on("ready", async () => {
    try {
      console.log("=== Backend PM2 logs (last 120 lines) ===\n");
      await run(conn, `pm2 logs ${pm2Backend} --lines 120 --nostream 2>&1`);
      console.log("\n=== .next/standalone/.next/static structure ===\n");
      await run(conn, `ls -la ${replymaRoot}/.next/standalone/.next/static/ 2>&1`);
      await run(conn, `find ${replymaRoot}/.next/standalone/.next/static -name "*.woff2" 2>/dev/null | head -20`);
      console.log("\n=== .next/static (source) media ===\n");
      await run(conn, `find ${replymaRoot}/.next/static -type d -name media 2>/dev/null; find ${replymaRoot}/.next/static -name "*.woff2" 2>/dev/null | head -10`);
      console.log("\n=== PM2 list ===\n");
      await run(conn, `pm2 list 2>&1`);
    } catch (e) {
      console.error(e.message);
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
