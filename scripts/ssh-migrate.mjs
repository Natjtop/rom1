#!/usr/bin/env node
/**
 * SSH: run Prisma migrate deploy in backendgeo.
 * Usage: SSH_PASSWORD=xxx node scripts/ssh-migrate.mjs
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
        if (code !== 0) reject(new Error("exit " + code));
        else resolve(out);
      });
    });
  });
}

const conn = new Client();
conn
  .on("ready", async () => {
    let ok = false;
    try {
      await run(conn, `cd ${replymaRoot}/backendgeo && node run-migrate.mjs`, "Prisma migrate deploy");
      ok = true;
    } catch (_) {
      console.log("Trying PM2 dump for DATABASE_URL...");
      try {
        await run(conn, `cd ${replymaRoot}/backendgeo && node -e 'const f=require("fs"),p=require("path"),e=require("child_process").execSync;const d=JSON.parse(f.readFileSync(p.join(process.env.HOME||"/root",".pm2","dump.pm2"),"utf8"));const a=d.find(x=>x.name==="replyma-backend");const u=a&&a.pm2_env&&a.pm2_env.env&&(a.pm2_env.env.DATABASE_URL||a.pm2_env.env.POSTGRES_URL);if(!u){console.error("No DATABASE_URL");process.exit(1);}f.mkdirSync(p.join(__dirname,"prisma"),{recursive:true});f.writeFileSync(p.join(__dirname,"prisma",".env"),"DATABASE_URL="+u);e("npx prisma migrate deploy",{cwd:__dirname,stdio:"inherit"});'`, "Migrate via PM2 env");
        ok = true;
      } catch (e2) {
        console.error("Migration failed:", e2.message);
        try {
          await run(conn, `docker ps --format '{{.Names}}' 2>/dev/null | xargs -I {} sh -c 'docker exec {} psql -U postgres -c "ALTER TABLE \\"User\\" ADD COLUMN IF NOT EXISTS \\"notificationsReadAt\\" TIMESTAMP(3);" 2>/dev/null' 2>/dev/null || true`, "Try docker postgres ALTER");
        } catch (_) {}
      }
    }
    await run(conn, "pm2 restart replyma-backend", "PM2 restart backend");
    if (!ok) {
      await run(conn, "pm2 show replyma-backend 2>&1 | head -80", "PM2 show (env might list DATABASE_URL)");
      console.error("\nTo fix login/auth 500: add column. On server run:");
      console.error("  Add to /opt/replyma/.env: DATABASE_URL=postgresql://USER:PASS@HOST:PORT/DB");
      console.error("  Then: cd /opt/replyma/backendgeo && node run-migrate.mjs");
      process.exit(1);
    }
    conn.end();
  })
  .on("error", (err) => {
    console.error("SSH error:", err.message);
    process.exit(1);
  })
  .connect({ host, port: 22, username: user, password });