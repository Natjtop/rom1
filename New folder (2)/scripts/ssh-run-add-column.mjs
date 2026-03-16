#!/usr/bin/env node
/**
 * SSH to server, find DATABASE_URL, run ALTER for User.notificationsReadAt, restart backend.
 * Usage: SSH_PASSWORD=xxx node scripts/ssh-run-add-column.mjs
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

function run(conn, cmd, label) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = "";
      stream.on("data", (d) => { out += d.toString(); process.stdout.write(d); });
      stream.stderr.on("data", (d) => { out += d.toString(); process.stderr.write(d); });
      stream.on("close", (code) => {
        if (label) console.log("\n--- " + label + " ---\n");
        resolve({ out, code });
      });
    });
  });
}

const conn = new Client();
conn.on("ready", async () => {
  try {
    // 1) On server: extract DATABASE_URL to temp file
    const F = "/tmp/replyma_db_url";
    await run(conn, `grep -E '^DATABASE_URL=' ${replymaRoot}/.env 2>/dev/null | cut -d= -f2- | sed 's/^["\x27]//;s/["\x27]$//' > ${F}`, "Extract from .env");
    const checkEnv = await run(conn, `test -s ${F} && echo ok || echo empty`, "");
    if ((checkEnv.out || "").trim() !== "ok") {
      await run(conn, `node -p "try{const c=require('${replymaRoot}/ecosystem.config.cjs');const a=c.apps&&(c.apps[0]||c.apps);const e=a&&(a.env||a.env_production||{});e.DATABASE_URL||''}catch(e){''}" 2>/dev/null > ${F}`, "Extract from ecosystem");
    }
    const checkEco = await run(conn, `test -s ${F} && echo ok || echo empty`, "");
    if ((checkEco.out || "").trim() !== "ok") {
      await run(conn, `node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync("/root/.pm2/dump.pm2","utf8"));const a=d.find(x=>x&&x.name==="replyma-backend");const e=a&&a.pm2_env&&a.pm2_env.env;console.log(e&&e.DATABASE_URL||"");' 2>/dev/null > ${F}`, "Extract from PM2 dump");
    }
    const hasUrl = await run(conn, `test -s ${F} && head -c 3 ${F} && echo "..."`, "");
    if (!(hasUrl.out || "").trim()) {
      console.error("DATABASE_URL not found in .env, ecosystem, or PM2 dump. Add it to " + replymaRoot + "/.env and run again.");
      return;
    }
    // 2) Run ALTER via Node reading URL from file (no shell URL parsing)
    const rawCmd = `
      cd ${replymaRoot}/backendgeo && node -e "
        const fs=require('fs');
        const u=fs.readFileSync('/tmp/replyma_db_url','utf8').trim();
        if(!u){console.error('No DATABASE_URL');process.exit(1);}
        process.env.DATABASE_URL=u;
        const {PrismaClient}=require('@prisma/client');
        const p=new PrismaClient();
        p.\\$executeRawUnsafe('ALTER TABLE \\\"User\\\" ADD COLUMN IF NOT EXISTS \\\"notificationsReadAt\\\" TIMESTAMP(3);')
          .then(()=>p.\\$disconnect())
          .then(()=>console.log('Column added.'))
          .catch(e=>{console.error(e);process.exit(1);});
      " 2>&1
    `;
    const alter = await run(conn, rawCmd, "ALTER TABLE");
    if (alter.code !== 0) return;
    await run(conn, `rm -f ${F}; pm2 restart replyma-backend 2>/dev/null; sleep 2; pm2 list`, "Restart backend");
    console.log("Done. Try login.");
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    conn.end();
  }
}).on("error", (err) => {
  console.error("SSH error:", err.message);
  process.exit(1);
}).connect({ host, port: 22, username: user, password });
