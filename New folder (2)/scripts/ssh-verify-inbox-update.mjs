#!/usr/bin/env node
/**
 * Verify that inbox/lastMessageAt changes are on the server.
 * Usage: SSH_PASSWORD=xxx node scripts/ssh-verify-inbox-update.mjs
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
      stream.on("close", (code) => resolve({ out, code }));
    });
  });
}

const conn = new Client();
conn.on("ready", async () => {
  try {
    const checks = [];
    const t = await run(conn, `grep -l "lastMessageAt" ${replymaRoot}/backendgeo/src/controllers/tickets.controller.ts 2>/dev/null && grep -c "lastMessageAt" ${replymaRoot}/backendgeo/src/controllers/tickets.controller.ts`);
    checks.push({ name: "Backend tickets.controller.ts has lastMessageAt", ok: (t.out || "").trim().split(/\n/)[0] && parseInt((t.out || "").trim().split(/\n/).pop(), 10) > 0 });
    const p = await run(conn, `grep "lastMessageAt" "${replymaRoot}/app/(dashboard)/inbox/page.tsx" 2>/dev/null | head -3`);
    checks.push({ name: "Frontend inbox/page.tsx has lastMessageAt logic", ok: (p.out || "").trim().length > 0 });
    const l = await run(conn, `grep "lastMessageAt" ${replymaRoot}/lib/types.ts 2>/dev/null`);
    checks.push({ name: "lib/types.ts has lastMessageAt", ok: (l.out || "").trim().length > 0 });
    const build = await run(conn, `grep -l "lastMessageAt" ${replymaRoot}/backendgeo/dist/controllers/tickets.controller.js 2>/dev/null | head -1`);
    checks.push({ name: "Backend built (dist has lastMessageAt)", ok: (build.out || "").trim().length > 0 });
    console.log("\n--- Verification ---\n");
    for (const c of checks) {
      console.log(c.ok ? "[OK]" : "[MISS]", c.name);
    }
    const allOk = checks.every((c) => c.ok);
    console.log(allOk ? "\nAll checks passed. Changes are on server." : "\nSome checks failed.");
    process.exitCode = allOk ? 0 : 1;
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
