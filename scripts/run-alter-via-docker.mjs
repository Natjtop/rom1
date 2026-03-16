#!/usr/bin/env node
/**
 * SSH to server: find Postgres (docker or local), run ALTER for Ticket.deletedAt.
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

const sql = `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Ticket' AND column_name='deletedAt') THEN ALTER TABLE "Ticket" ADD COLUMN "deletedAt" TIMESTAMP(3); END IF; END $$; CREATE INDEX IF NOT EXISTS "Ticket_workspaceId_deletedAt_idx" ON "Ticket"("workspaceId", "deletedAt");`;

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
      const tmpSql = "/tmp/alter.sql";
      const sftp = await getSftp(conn);
      await putBuffer(sftp, Buffer.from(sql, "utf8"), tmpSql);

      console.log("--- Containers (postgres) ---\n");
      const r = await run(conn, `docker ps --format '{{.Names}} {{.Ports}}' 2>/dev/null | grep -i postgres || true; docker ps -a --format '{{.Names}}' 2>/dev/null | head -20`);
      console.log(r.out);

      const runInContainer = (name, user = "postgres") =>
        run(conn, `docker exec ${name} psql -U ${user} -d postgres -f /tmp/alter.sql 2>&1`);

      console.log("\n--- Try: docker exec (copy sql into container) ---\n");
      const listRes = await run(conn, `docker ps --format '{{.Names}}' 2>/dev/null`);
      const names = (listRes.out || "").trim().split(/\s+/).filter(Boolean);
      const toTry = names.length ? names : ["postgres", "postgresql", "db", "replyma-db", "replyma-postgres", "replyma_db", "replyma_postgres"];
      for (const name of toTry) {
        if (!name) continue;
        const runRes = await run(conn, `docker cp /tmp/alter.sql ${name}:/tmp/alter.sql 2>&1 && docker exec ${name} psql -U postgres -d postgres -f /tmp/alter.sql 2>&1`);
        if (runRes.code === 0) {
          console.log(runRes.out);
          console.log("\nDone. Column deletedAt added.");
          conn.end();
          return;
        }
        if (!runRes.out.includes("No such container")) process.stdout.write(runRes.out);
      }

      console.log("\n--- Try: local psql as postgres user (su) ---\n");
      const local = await run(conn, `su - postgres -c "psql -d postgres -f ${tmpSql}" 2>&1`);
      if (local.code === 0 && !local.out.includes('relation "Ticket" does not exist') && !local.out.includes("ERROR:")) {
        console.log(local.out);
        console.log("\nDone. Column deletedAt added.");
        conn.end();
        return;
      }
      process.stdout.write(local.out);
      if (local.out.includes('relation "Ticket" does not exist')) {
        console.error("\n[Note] Local postgres has no Ticket table — app likely uses another DB (e.g. port 5433 or remote).");
      }

      console.log("\n--- Try: local psql with -U postgres ---\n");
      const local2 = await run(conn, `psql -U postgres -d postgres -f ${tmpSql} 2>&1`);
      if (local2.code === 0) {
        console.log(local2.out);
        console.log("\nDone. Column deletedAt added.");
        conn.end();
        return;
      }
      process.stdout.write(local2.out);

      console.error("\nCould not run ALTER. Run manually on server:");
      console.error("  psql -U postgres -d postgres -f /tmp/alter.sql");
      console.error("  or: docker exec <postgres-container> psql -U postgres -d postgres -f /tmp/alter.sql");
      process.exit(1);
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