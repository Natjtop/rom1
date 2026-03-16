#!/usr/bin/env node
/**
 * Remove GOOGLE_GMAIL_CLIENT_ID and GOOGLE_GMAIL_CLIENT_SECRET from server .env.
 * Usage: SSH_PASSWORD=xxx node scripts/ssh-remove-gmail-env.mjs
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
      stream.on("data", (d) => { out += d.toString(); });
      stream.stderr.on("data", (d) => { out += d.toString(); });
      stream.on("close", (code) => resolve({ code, out: out.trim() }));
    });
  });
}

const conn = new Client();
conn
  .on("ready", async () => {
    try {
      // 1) Remove from .env
      await run(conn, `sed -i '/^GOOGLE_GMAIL_CLIENT_ID=/d' ${replymaRoot}/.env && sed -i '/^GOOGLE_GMAIL_CLIENT_SECRET=/d' ${replymaRoot}/.env`);
      const { out: envOut } = await run(conn, `grep -E 'GOOGLE_GMAIL' ${replymaRoot}/.env 2>/dev/null || echo '(none)'`);
      console.log("1) .env: removed GOOGLE_GMAIL_* lines. Remaining:", envOut);

      // 2) Remove from ecosystem.config.cjs if present (env block); support both "KEY: value" and "KEY=value"
      const { out: ecoGrep } = await run(conn, `grep -n 'GOOGLE_GMAIL' ${replymaRoot}/ecosystem.config.cjs 2>/dev/null || true`);
      if (ecoGrep && ecoGrep.trim()) {
        console.log("2) ecosystem.config.cjs had GOOGLE_GMAIL at:", ecoGrep.trim());
        await run(conn, `sed -i '/GOOGLE_GMAIL_CLIENT_ID/d;/GOOGLE_GMAIL_CLIENT_SECRET/d' ${replymaRoot}/ecosystem.config.cjs`);
        const { out: afterEco } = await run(conn, `grep 'GOOGLE_GMAIL' ${replymaRoot}/ecosystem.config.cjs 2>/dev/null || echo '(none)'`);
        console.log("   After sed. Remaining:", afterEco);
      } else {
        console.log("2) ecosystem.config.cjs: no GOOGLE_GMAIL_* found (or file missing).");
      }

      // 2b) backendgeo/.env on server (if it exists)
      const { out: backendEnv } = await run(conn, `grep -E 'GOOGLE_GMAIL' ${replymaRoot}/backendgeo/.env 2>/dev/null || echo '(no file or none)'`);
      if (backendEnv && !backendEnv.includes("(no file or none)")) {
        await run(conn, `sed -i '/^GOOGLE_GMAIL_CLIENT_ID=/d;/^GOOGLE_GMAIL_CLIENT_SECRET=/d' ${replymaRoot}/backendgeo/.env 2>/dev/null || true`);
        console.log("2b) backendgeo/.env: removed GOOGLE_GMAIL_*");
      }

      // 3) PM2 caches env in dump — delete app and start again from ecosystem so env is fresh (no Gmail)
      const pm2Backend = process.env.PM2_APP_BACKEND || "replyma-backend";
      await run(conn, `cd ${replymaRoot} && pm2 delete ${pm2Backend} 2>/dev/null || true`);
      const startRes = await run(conn, `cd ${replymaRoot} && pm2 start ecosystem.config.cjs --only ${pm2Backend} 2>&1`);
      console.log("3) pm2 delete + start from ecosystem:", startRes.out ? startRes.out.slice(0, 500) : "ok");
      await run(conn, "pm2 save 2>&1");
      console.log("4) pm2 save done.");
    } catch (e) {
      console.error("Error:", e.message);
      process.exit(1);
    } finally {
      conn.end();
    }
  })
  .on("error", (err) => {
    console.error("SSH error:", err.message);
    process.exit(1);
  })
  .connect({ host, username: user, password });
