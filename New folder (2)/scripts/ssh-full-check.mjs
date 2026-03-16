#!/usr/bin/env node
/**
 * SSH: full server check — PM2, Docker, DB, nginx, add column if needed.
 * Usage: SSH_PASSWORD=xxx node scripts/ssh-full-check.mjs
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
        resolve({ out, code });
      });
    });
  });
}

const conn = new Client();
conn.on("ready", async () => {
  try {
    await run(conn, "pm2 list", "PM2");
    const docker = await run(conn, "docker ps -a --format '{{.Names}} {{.Image}}' 2>/dev/null; echo '---'; docker ps -a 2>/dev/null | head -20", "Docker");
    const out = (docker.out || "").replace(/\r/g, "");
    let pgContainer = null;
    const lines = out.split("\n").filter((l) => l && !l.startsWith("---"));
    for (const line of lines) {
      const name = line.split(/\s+/)[0];
      if (name && (line.toLowerCase().includes("postgres") || line.toLowerCase().includes("pg") || name.includes("db") || name === "postgres")) {
        pgContainer = name;
        break;
      }
    }
    if (pgContainer) {
      const dbs = await run(conn, `docker exec ${pgContainer} psql -U postgres -t -c "SELECT datname FROM pg_database WHERE datistemplate = false;" 2>&1`, "List DBs");
      const dbList = (dbs.out || "").trim().split(/\s+/).filter(Boolean);
      for (const db of dbList.length ? dbList : ["postgres", "replyma"]) {
        const alter = await run(
          conn,
          `docker exec ${pgContainer} psql -U postgres -d ${db} -c 'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notificationsReadAt" TIMESTAMP(3);' 2>&1`,
          "ALTER via docker (db=" + db + ")"
        );
        if (alter.code === 0) {
          console.log("Column added in DB:", db);
          break;
        }
      }
    }
    if (!pgContainer) {
      await run(conn, `cd ${replymaRoot} && echo "--- .env DB vars (masked) ---" && grep -E '^(POSTGRES_HOST|POSTGRES_PORT|POSTGRES_USER|DATABASE_URL|PGHOST|PGPORT)=' .env 2>/dev/null | sed 's/=.*/=***/' || true`, "DB config");
      for (const dbName of ["postgres", "replyma"]) {
        const alterHost = await run(
          conn,
          `cd ${replymaRoot} && (export PGPASSWORD=$(grep -E '^POSTGRES_PASSWORD=' .env 2>/dev/null | cut -d= -f2-); PGPORT=$(grep -E '^POSTGRES_PORT=' .env 2>/dev/null | cut -d= -f2); PGHOST=$(grep -E '^POSTGRES_HOST=' .env 2>/dev/null | cut -d= -f2); psql -h \${PGHOST:-127.0.0.1} -p \${PGPORT:-5432} -U postgres -d ${dbName} -c 'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notificationsReadAt" TIMESTAMP(3);' 2>&1)`,
          "ALTER via psql (db=" + dbName + ")"
        );
        if (alterHost.code === 0) {
          console.log("Column added, db:", dbName);
          break;
        }
      }
      const cwdBackend = replymaRoot + "/backendgeo";
      const pm2Migrate = await run(
        conn,
        "node -e \"const fs=require('fs');const p='/root/.pm2/dump.pm2';if(!fs.existsSync(p)){console.error('No dump');process.exit(1);}const d=JSON.parse(fs.readFileSync(p,'utf8'));const a=d.find(x=>x&&x.name==='replyma-backend');const e=a&&a.pm2_env&&a.pm2_env.env;const u=e&&(e.DATABASE_URL||e.POSTGRES_URL);if(!u){console.error('No DATABASE_URL');process.exit(1);}process.env.DATABASE_URL=u;require('child_process').execSync('node run-migrate.mjs',{env:process.env,cwd:'" + cwdBackend + "',stdio:'inherit'});\" 2>&1",
        "Migration via PM2 DATABASE_URL"
      );
      if (pm2Migrate.code === 0) console.log("Migration applied via run-migrate.mjs");
    }
    await run(conn, "pm2 restart replyma-backend 2>/dev/null; sleep 2; pm2 list", "Restart backend");
    await run(conn, "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4001/health 2>/dev/null || curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4000/health 2>/dev/null", "Health after restart");
    await run(conn, "pm2 logs replyma-backend --nostream --lines 8 --err 2>/dev/null", "Last backend errors");
    console.log("\n--- Summary ---");
    console.log("If login still returns 500: DB is missing column User.notificationsReadAt.");
    console.log("Add DATABASE_URL to " + replymaRoot + "/.env (same URL the backend uses), then run:");
    console.log("  cd " + replymaRoot + "/backendgeo && node run-migrate.mjs && pm2 restart replyma-backend");
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    conn.end();
  }
}).on("error", (err) => {
  console.error("SSH error:", err.message);
  process.exit(1);
}).connect({ host, port: 22, username: user, password });
