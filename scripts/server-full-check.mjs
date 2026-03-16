#!/usr/bin/env node
/**
 * SSH to server: full health check — PM2, disk, API, backend/frontend logs, DB, static.
 * Usage: SSH_PASSWORD=xxx node scripts/server-full-check.mjs
 */
import { Client } from "ssh2";

const host = process.env.SSH_HOST || "88.198.40.210";
const user = process.env.SSH_USER || "root";
const password = process.env.SSH_PASSWORD;
const replymaRoot = process.env.REPLYMA_ROOT || "/opt/replyma";
const pm2Backend = process.env.PM2_APP_BACKEND || "replyma-backend";
const pm2Frontend = process.env.PM2_APP_FRONTEND || "replyma-frontend";

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
      stream.on("close", (code) => resolve({ code, out }));
    });
  });
}

const conn = new Client();
conn
  .on("ready", async () => {
    try {
      console.log("========== PM2 list ==========\n");
      await run(conn, `pm2 list 2>&1`);

      console.log("\n========== Disk & memory ==========\n");
      await run(conn, `df -h / 2>&1; echo "---"; free -h 2>&1`);

      console.log("\n========== Backend process (replyma-backend) ==========\n");
      await run(conn, `pm2 describe ${pm2Backend} 2>&1 | head -40`);

      console.log("\n========== Frontend process (replyma-frontend) ==========\n");
      await run(conn, `pm2 describe ${pm2Frontend} 2>&1 | head -40`);

      console.log("\n========== Backend logs (last 30 lines) ==========\n");
      await run(conn, `pm2 logs ${pm2Backend} --lines 30 --nostream 2>&1`);

      console.log("\n========== Backend error log (last 15) ==========\n");
      await run(conn, `pm2 logs ${pm2Backend} --err --lines 15 --nostream 2>&1`);

      console.log("\n========== API health: GET /api/v1/tickets?limit=5 ==========\n");
      await run(conn, `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4000/api/v1/tickets?limit=5 2>&1; echo ""`);

      console.log("\n========== Frontend root (200?) ==========\n");
      await run(conn, `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ 2>&1; echo ""`);

      console.log("\n========== Static .next/standalone ==========\n");
      await run(conn, `ls -la ${replymaRoot}/.next/standalone/.next/static/ 2>&1; ls ${replymaRoot}/.next/standalone/public/ 2>&1 | head -10`);

      console.log("\n========== PostgreSQL (local) ==========\n");
      await run(conn, `su - postgres -c "psql -d postgres -t -c \"SELECT 1; SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='Ticket';\" 2>&1" || echo "su/psql failed"`);

      console.log("\n========== Done ==========");
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