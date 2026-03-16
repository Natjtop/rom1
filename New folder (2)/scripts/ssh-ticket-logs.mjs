#!/usr/bin/env node
/**
 * SSH to server and grep backend logs for a ticket ID (AI processing, errors).
 * Usage: SSH_PASSWORD=xxx node scripts/ssh-ticket-logs.mjs [ticketId]
 */
import { Client } from "ssh2";

const host = process.env.SSH_HOST || "88.198.40.210";
const user = process.env.SSH_USER || "root";
const password = process.env.SSH_PASSWORD;
const ticketId = process.argv[2] || "cmmgf05m10015j5bny6h4ngx2";

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
      stream.on("close", (code) => resolve({ out, code }));
    });
  });
}

const conn = new Client();
conn.on("ready", async () => {
  try {
    console.log("\n--- PM2 backend log (last 500 lines) grep for ticket", ticketId, "---\n");
    await run(conn, `pm2 logs replyma-backend --nostream --lines 500 2>/dev/null | grep -i "${ticketId}" || echo "(no matches)"`);
    console.log("\n--- Backend err log (last 200) ---\n");
    await run(conn, `tail -200 /root/.pm2/logs/replyma-backend-error-35.log 2>/dev/null | grep -i "${ticketId}\\|AI Engine\\|Bedrock\\|MessageProcessor" || echo "(no matches)"`);
    console.log("\n--- Backend out log (last 300) AI / ticket ---\n");
    await run(conn, `tail -300 /root/.pm2/logs/replyma-backend-out-35.log 2>/dev/null | grep -i "${ticketId}\\|AI Engine\\|responseLength\\|GPT response" || echo "(no matches)"`);
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    conn.end();
  }
}).on("error", (err) => {
  console.error("SSH error:", err.message);
  process.exit(1);
}).connect({ host, port: 22, username: user, password });
