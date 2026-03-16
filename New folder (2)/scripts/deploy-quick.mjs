#!/usr/bin/env node
/**
 * Quick deploy: sync only backend + inbox/api, build backend, restart backend (and optionally frontend).
 * Use when you changed ticket logic / inbox and want a fast update without full Next.js build.
 * Usage: SSH_PASSWORD=xxx node scripts/deploy-quick.mjs
 */
import { Client } from "ssh2";
import fs from "node:fs";
import path from "node:path";

const host = process.env.SSH_HOST || "88.198.40.210";
const user = process.env.SSH_USER || "root";
const password = process.env.SSH_PASSWORD;
const replymaRoot = process.env.REPLYMA_ROOT || "/opt/replyma";
const pm2Backend = process.env.PM2_APP_BACKEND || "replyma-backend";
const pm2Frontend = process.env.PM2_APP_FRONTEND || "replyma-frontend";
const buildFrontend = process.env.BUILD_FRONTEND === "1";
const runGoogleAccount = process.env.RUN_GOOGLE_ACCOUNT === "1";
const localRoot = process.cwd();

const quickSyncPaths = [
  "backendgeo/src",
  "backendgeo/scripts",
  "backendgeo/prisma",
  "backendgeo/run-migrate.mjs",
  "backendgeo/run-migrate-from-pm2.mjs",
  "backendgeo/run-add-notifications-column.mjs",
  "backendgeo/package.json",
  "docs",
  "lib/api.ts",
  "lib/auth-context.tsx",
  "lib/types.ts",
  "app/(dashboard)/inbox/page.tsx",
  "app/(dashboard)/layout.tsx",
  "app/(dashboard)/billing/page.tsx",
  "app/(dashboard)/notifications/page.tsx",
  "app/(dashboard)/channels/[type]/page.tsx",
  "app/(marketing)/layout.tsx",
  "app/(marketing)/privacy/page.tsx",
  "app/(marketing)/features/shopping-assistant/page.tsx",
  "app/widget",
  "app/(portal)/[slug]",
  "app/(marketing)/terms/page.tsx",
  "components/marketing/legal-markdown.tsx",
  "components/marketing/logo.tsx",
  "components/marketing/logo-marquee.tsx",
  "components/live-chat-widget.tsx",
  "public/widget.js",
  "app/layout.tsx",
  "app/globals.css",
  "app/logo/route.ts",
  "next.config.mjs",
  "package.json",
  "package-lock.json",
  "scripts/copy-standalone-public.mjs",
  "scripts/deploy-quick.mjs",
  "deploy/deploy-server.sh",
  "app/sitemap.ts",
  "app/robots.ts",
  "app/(marketing)",
  // "data/generated" — sync separately if needed; omit to avoid ECONNRESET during long sync; hub + static + help-center still in sitemap
];

if (!password) {
  console.error("Set SSH_PASSWORD");
  process.exit(1);
}

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else if (e.isFile()) out.push(full);
  }
  return out;
}

function run(conn, cmd) {
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
      stream.on("close", (code) => (code === 0 ? resolve(out) : reject(new Error("exit " + code))));
    });
  });
}

function getSftp(conn) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => (err ? reject(err) : resolve(sftp)));
  });
}

function putFile(sftp, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    sftp.fastPut(localPath, remotePath, (err) => (err ? reject(err) : resolve()));
  });
}

const conn = new Client();
conn
  .on("ready", async () => {
    try {
      await run(conn, `cd ${replymaRoot} && git pull --no-edit 2>/dev/null || true`);
      const gmailId = process.env.GOOGLE_GMAIL_CLIENT_ID;
      const gmailSecret = process.env.GOOGLE_GMAIL_CLIENT_SECRET;
      if (gmailId && gmailSecret) {
        const esc = (s) => String(s).replace(/'/g, "'\"'\"'").replace(/\$/g, "\\$");
        await run(conn, `cd ${replymaRoot} && touch .env && (grep -v '^GOOGLE_GMAIL_CLIENT_ID=' .env | grep -v '^GOOGLE_GMAIL_CLIENT_SECRET=' > .env.gmail.tmp) && mv .env.gmail.tmp .env && echo 'GOOGLE_GMAIL_CLIENT_ID=${esc(gmailId)}' >> .env && echo 'GOOGLE_GMAIL_CLIENT_SECRET=${esc(gmailSecret)}' >> .env`);
        console.log("Updated GOOGLE_GMAIL_* on server .env");
      }
      const sftp = await getSftp(conn);
      for (const rel of quickSyncPaths) {
        const localPath = path.join(localRoot, rel);
        if (!fs.existsSync(localPath)) continue;
        const stat = fs.statSync(localPath);
        const files = stat.isDirectory() ? walk(localPath) : [localPath];
        for (const filePath of files) {
          const relative = path.relative(localRoot, filePath).replace(/\\/g, "/");
          const remotePath = `${replymaRoot}/${relative}`;
          await run(conn, `mkdir -p "$(dirname '${remotePath}')"`);
          await putFile(sftp, filePath, remotePath);
          console.log("Synced:", relative);
        }
      }
      await run(conn, `cd ${replymaRoot}/backendgeo && npm install`);
      await run(conn, `cd ${replymaRoot}/backendgeo && npx prisma generate`);
      await run(conn, `cd ${replymaRoot}/backendgeo && npx prisma migrate deploy 2>/dev/null || true`);
      await run(conn, `cd ${replymaRoot}/backendgeo && npm run build`);
      if (gmailId && gmailSecret) {
        const escSh = (s) => String(s).replace(/'/g, "'\"'\"'");
        await run(conn, `cd ${replymaRoot}/backendgeo && GOOGLE_GMAIL_CLIENT_ID='${escSh(gmailId)}' GOOGLE_GMAIL_CLIENT_SECRET='${escSh(gmailSecret)}' node scripts/patch-gmail-ecosystem.mjs ${replymaRoot}/ecosystem.config.cjs 2>/dev/null || true`);
      }
      await run(conn, `pm2 restart ${pm2Backend} --update-env`);
      if (runGoogleAccount) {
        console.log("\nCreating/updating forgoogle@replyma.com account...");
        await run(conn, `cd ${replymaRoot}/backendgeo && node scripts/run-google-account-with-env.cjs`);
      }
      if (buildFrontend) {
        await run(conn, `rm -rf '${replymaRoot}/app/(marketing)/test'`);
        console.log("\nBuilding frontend (BUILD_FRONTEND=1)...");
        await run(conn, `cd ${replymaRoot} && (npm ci 2>/dev/null || npm install) && npm run build`);
        // Ensure standalone has public + static (fix 500 / MIME on CSS/JS: server must serve these from .next/standalone).
        await run(conn, `cd ${replymaRoot} && node scripts/copy-standalone-public.mjs 2>/dev/null || true`);
        await run(conn, `cd ${replymaRoot} && mkdir -p .next/standalone/public .next/standalone/.next/static && (test -d public && cp -r public/. .next/standalone/public/) && (test -d .next/static && cp -r .next/static/. .next/standalone/.next/static/) && true`);
        await run(conn, `cd ${replymaRoot} && rm -f public/sitemap.xml .next/standalone/public/sitemap.xml`);
        await run(conn, `cd ${replymaRoot} && mkdir -p .next/standalone/data && (test -d data/generated && cp -r data/generated .next/standalone/data/) || true`);
        await run(conn, `cd ${replymaRoot} && (ls .next/standalone/.next/static/ 2>/dev/null | head -3 || echo "WARN: .next/standalone/.next/static empty?")`);
        await run(conn, `pm2 restart ${pm2Frontend}`);
        console.log("Frontend restarted.");
      }
      console.log("\n--- Verification ---");
      const envCheck = await run(conn, `grep -q '^GOOGLE_GMAIL_CLIENT_ID=' ${replymaRoot}/.env 2>/dev/null && echo 'GMAIL_ENV_SET' || echo 'GMAIL_ENV_MISSING'`).catch(() => "");
      if (String(envCheck).includes("GMAIL_ENV_SET")) console.log("OK: GOOGLE_GMAIL_* present in server .env");
      else console.log("WARN: GOOGLE_GMAIL_CLIENT_ID not found in server .env - set env and run deploy with GOOGLE_GMAIL_CLIENT_ID/SECRET");
      console.log("\nQuick deploy done. Backend restarted." + (buildFrontend ? " Frontend rebuilt and restarted." : " To update inbox UI, run: BUILD_FRONTEND=1 node scripts/deploy-quick.mjs or npm run deploy"));
    } catch (e) {
      console.error("\nDeploy error:", e.message);
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