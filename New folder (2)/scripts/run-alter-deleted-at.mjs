#!/usr/bin/env node
/**
 * SSH to server and add Ticket.deletedAt via psql (local postgres or DATABASE_URL from .env).
 * Tries: 1) psql as postgres user (local), 2) psql $DATABASE_URL from .env (with port 5432 and 5433).
 */
import { Client } from "ssh2";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const host = process.env.SSH_HOST || "88.198.40.210";
const user = process.env.SSH_USER || "root";
const password = process.env.SSH_PASSWORD;
const replymaRoot = process.env.REPLYMA_ROOT || "/opt/replyma";

if (!password) {
  console.error("Set SSH_PASSWORD");
  process.exit(1);
}

const sql = `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Ticket' AND column_name = 'deletedAt'
  ) THEN
    ALTER TABLE "Ticket" ADD COLUMN "deletedAt" TIMESTAMP(3);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "Ticket_workspaceId_deletedAt_idx" ON "Ticket"("workspaceId", "deletedAt");
`;

function run(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = "";
      stream.on("data", (d) => {
        out += d.toString();
        process.stdout.write(d);
      });
      stream.stderr.on("data", (d) => process.stderr.write(d));
      stream.on("close", (code) => resolve({ code, out }));
    });
  });
}

function getSftp(conn) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => (err ? reject(err) : resolve(sftp)));
  });
}

function putBuffer(sftp, buffer, remotePath) {
  return new Promise((resolve, reject) => {
    const stream = sftp.createWriteStream(remotePath);
    stream.on("error", reject);
    stream.on("close", resolve);
    stream.end(buffer);
  });
}

const conn = new Client();
conn
  .on("ready", async () => {
    try {
      const tmpSql = `${replymaRoot}/backendgeo/.alter-deleted-at.sql`;
      const sftp = await getSftp(conn);
      await putBuffer(sftp, Buffer.from(sql, "utf8"), tmpSql);

      console.log("--- Try 1: psql as postgres user (local socket) ---\n");
      let r = await run(conn, `psql -U postgres -d postgres -f ${tmpSql} 2>&1`);
      if (r.code === 0) {
        console.log("\nDone. Column deletedAt added.");
        await run(conn, `rm -f ${tmpSql}`);
        conn.end();
        return;
      }

      console.log("\n--- Try 2: psql with DATABASE_URL from .env (port 5432) ---\n");
      const envCmd = `cd ${replymaRoot} && (test -f .env && export $(grep -v '^#' .env | xargs) && echo "$DATABASE_URL" | sed 's/:5433\\//:5432\\//g' > /tmp/dburl.txt) || true`;
      await run(conn, envCmd);
      r = await run(conn, `cd ${replymaRoot}/backendgeo && (test -f ../.env && . ../.env 2>/dev/null; URL=$(echo "$DATABASE_URL" | sed 's/:5433\\//:5432\\//g'); if [ -n "$URL" ]; then psql "$URL" -f ${tmpSql} 2>&1; else echo "No DATABASE_URL"; exit 1; fi)`);
      if (r.code === 0) {
        console.log("\nDone. Column deletedAt added.");
        await run(conn, `rm -f ${tmpSql}`);
        conn.end();
        return;
      }

      console.log("\n--- Try 3: psql with DATABASE_URL as-is (port 5433) ---\n");
      r = await run(conn, `cd ${replymaRoot}/backendgeo && (. ../.env 2>/dev/null; if [ -n "$DATABASE_URL" ]; then psql "$DATABASE_URL" -f ${tmpSql} 2>&1; else echo "No DATABASE_URL"; exit 1; fi)`);
      if (r.code === 0) {
        console.log("\nDone. Column deletedAt added.");
      } else {
        console.error("\nAll attempts failed. Run on server manually:");
        console.error(`  psql '<DATABASE_URL>' -f ${tmpSql}`);
        console.error("Or: cd backendgeo && npx prisma migrate deploy");
        process.exit(1);
      }
      await run(conn, `rm -f ${tmpSql}`);
    } catch (e) {
      console.error("\nError:", e.message);
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