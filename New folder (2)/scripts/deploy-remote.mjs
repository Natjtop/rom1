#!/usr/bin/env node
/**
 * Deploy Replyma frontend via SSH: pull, build, restart PM2.
 * Usage: SSH_HOST=88.198.40.210 SSH_USER=root SSH_PASSWORD=xxx REPLYMA_ROOT=/opt/replyma node scripts/deploy-remote.mjs
 */
import { Client } from 'ssh2';
import fs from 'node:fs';
import path from 'node:path';

const host = process.env.SSH_HOST || '88.198.40.210';
const user = process.env.SSH_USER || 'root';
const password = process.env.SSH_PASSWORD;
const replymaRoot = process.env.REPLYMA_ROOT || '/opt/replyma';
const pm2Frontend = process.env.PM2_APP_FRONTEND || 'replyma-frontend';
const pm2Backend = process.env.PM2_APP_BACKEND || 'replyma-backend';
const checkOnly = process.env.CHECK_ONLY === '1';
const localRoot = process.cwd();
const syncPaths = [
  'public/widget.js',
  'app/(marketing)',
  'app/(auth)',
  'components/marketing',
  'components/live-chat-widget.tsx',
  'app/(marketing)/layout.tsx',
  'components/marketing/hero-section.tsx',
  'app/(dashboard)/inbox/page.tsx',
  'app/(dashboard)/inbox/loading.tsx',
  'app/(dashboard)/analytics/loading.tsx',
  'app/(dashboard)/customers/loading.tsx',
  'app/(dashboard)/loading.tsx',
  'components/dashboard/skeleton.tsx',
  'app/(dashboard)/layout.tsx',
  'app/(dashboard)/notifications/page.tsx',
  'app/(dashboard)/settings/page.tsx',
  'components/dashboard/inbox/ticket-list.tsx',
  'app/(dashboard)/team/page.tsx',
  'app/(dashboard)/channels/[type]/page.tsx',
  'app/demo/page.tsx',
  'app/(dashboard)/settings/integrations/page.tsx',
  'app/(dashboard)/billing/page.tsx',
  'app/(dashboard)/onboarding/page.tsx',
  'app/(marketing)/pricing/page.tsx',
  'app/(marketing)/features/live-chat/page.tsx',
  'app/(marketing)/features/shopping-assistant',
  'app/(dashboard)/settings/shopping-assistant',
  'app/widget/[workspaceId]/page.tsx',
  'app/widget/[workspaceId]/widget-client.tsx',
  'lib/auth-context.tsx',
  'lib/api.ts',
  'lib/types.ts',
  'app/layout.tsx',
  'backendgeo/src/controllers/tickets.controller.ts',
  'backendgeo/src/controllers/channels.controller.ts',
  'backendgeo/src/controllers/notifications.controller.ts',
  'backendgeo/src/controllers/customers.controller.ts',
  'backendgeo/src/routes/notifications.routes.ts',
  'backendgeo/src/controllers/team.controller.ts',
  'backendgeo/src/controllers/integrations.controller.ts',
  'backendgeo/src/controllers/rules.controller.ts',
  'backendgeo/src/routes/integrations.routes.ts',
  'backendgeo/src/routes/channels.routes.ts',
  'backendgeo/src/controllers/shopify.controller.ts',
  'backendgeo/src/controllers/widget.controller.ts',
  'backendgeo/src/controllers/settings.controller.ts',
  'backendgeo/src/services/aiEngine.ts',
  'backendgeo/src/services/shopifyService.ts',
  'backendgeo/src/services/channelDispatcher.ts',
  'backendgeo/src/services/emailChannelService.ts',
  'backendgeo/src/services/emailAccountHelper.ts',
  'backendgeo/src/services/flowEngine.ts',
  'backendgeo/src/workers/emailIngest.ts',
  'backendgeo/src/middleware/auth.ts',
  'backendgeo/src/app.ts',
  'middleware.ts',
  'next.config.mjs',
  // pSEO 2.0 — routes live under (marketing); components, types, sitemap, data
  'app/(marketing)/integrations',
  'components/pseo',
  'lib/pseo-data.ts',
  'lib/pseo-format.ts',
  'types/pseo.ts',
  'app/sitemap.ts',
  'data/generated',
  'data/competitors.ts',
  'data/niches.ts',
  // Shopping Assistant: migrations + widget/settings
  'backendgeo/prisma/migrations',
  'backendgeo/prisma/schema.prisma',
];

function walkFiles(rootDir) {
  const out = [];
  const stack = [rootDir];
  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile()) {
        out.push(full);
      }
    }
  }
  return out;
}

if (!password) {
  console.error('Set SSH_PASSWORD (e.g. export SSH_PASSWORD=yourpass)');
  process.exit(1);
}

function run(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '';
      let errOut = '';
      stream.on('data', (d) => { out += d.toString(); process.stdout.write(d); });
      stream.stderr.on('data', (d) => { errOut += d.toString(); process.stderr.write(d); });
      stream.on('close', (code) => code === 0 ? resolve(out) : reject(new Error('exit ' + code)));
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
    sftp.fastPut(localPath, remotePath, (err) => (err ? reject(err) : resolve(undefined)));
  });
}

const conn = new Client();
conn.on('ready', async () => {
  try {
    if (checkOnly) {
      await run(conn, `bash -lc 'cd ${replymaRoot} && echo \"[server widget check]\" && ls -l public/widget.js && echo \"--- head ---\" && sed -n \"1,120p\" public/widget.js && echo \"--- markers ---\" && grep -nE \"isHostDesktop|OPEN_PANEL_HEIGHT_DESKTOP|OPEN_BOTTOM_OFFSET|\\\\?desktop=\" public/widget.js || true'`);
      await run(conn, `bash -lc 'cd ${replymaRoot} && echo \"\\n[server static check]\" && ls -ld .next/static .next/standalone/.next/static || true && ls -l .next/standalone/.next/static/chunks | head -n 20 || true && ls -l .next/standalone/.next/static/media | head -n 20 || true'`);
      await run(conn, `bash -lc 'echo \"\\n[public url check]\" && for u in \"https://replyma.com/_next/static/chunks/5ea2bf935ce9c0e8.js\" \"https://replyma.com/_next/static/chunks/5a830cc500fcf663.js\" \"https://replyma.com/_next/static/chunks/a43a2e0e3b99740b.js\" \"https://replyma.com/_next/static/chunks/c6bdbb692a854e4a.js\" \"https://replyma.com/_next/static/media/051742360c26797e-s.p.102b7f24.woff2\" \"https://replyma.com/_next/static/media/83afe278b6a6bb3c-s.p.3a6ba036.woff2\" \"https://replyma.com/_next/static/css/886512159809c214.css\"; do echo \"--- $u\"; curl -sSI \"$u\" | sed -n \"1,8p\"; done'`);
      console.log('\nCheck done.');
      conn.end();
      return;
    }
    await run(conn, `cd ${replymaRoot} && git pull --no-edit 2>/dev/null || true`);

    // Sync critical frontend files from local workspace to server after git pull.
    const sftp = await getSftp(conn);
    for (const rel of syncPaths) {
      const localPath = path.join(localRoot, rel);
      if (!fs.existsSync(localPath)) continue;

      const stat = fs.statSync(localPath);
      const files = stat.isDirectory() ? walkFiles(localPath) : [localPath];
      for (const filePath of files) {
        const relativeFromRoot = path.relative(localRoot, filePath).replace(/\\/g, '/');
        const remotePath = `${replymaRoot}/${relativeFromRoot}`;
        await run(conn, `mkdir -p "$(dirname '${remotePath}')"`);
        await putFile(sftp, filePath, remotePath);
        console.log(`Synced: ${relativeFromRoot}`);
      }
    }
    // Remove stale marketing artifacts that were deleted locally.
    await run(conn, `rm -rf '${replymaRoot}/app/(marketing)/demo' '${replymaRoot}/app/(marketing)/loading.tsx'`);
    // Remove old pSEO routes at app root (now under app/(marketing)/) to avoid duplicate route build error.
    await run(conn, `rm -rf '${replymaRoot}/app/for' '${replymaRoot}/app/vs' '${replymaRoot}/app/alternatives' '${replymaRoot}/app/guides' '${replymaRoot}/app/resources'`);
    await run(conn, `cd ${replymaRoot} && npm ci 2>/dev/null || npm install`);
    await run(conn, `(cd ${replymaRoot}/backendgeo && npx prisma generate) || true`);
    await run(conn, `cd ${replymaRoot} && npm run build`);
    await run(conn, `cd ${replymaRoot} && node scripts/copy-standalone-public.mjs 2>/dev/null || true`);
    await run(conn, `cd ${replymaRoot} && mkdir -p .next/standalone/public .next/standalone/.next/static && (test -d public && cp -r public/. .next/standalone/public/) && (test -d .next/static && cp -r .next/static/. .next/standalone/.next/static/) && true`);
    await run(conn, `cd ${replymaRoot} && mkdir -p .next/standalone/data && cp -r data/generated .next/standalone/data/ 2>/dev/null || true`);
    await run(conn, `bash -lc 'set -e; FILES=$(grep -Ril "location = /widget.js" /etc/nginx/sites-enabled /etc/nginx/conf.d 2>/dev/null || true); if [ -z "$FILES" ]; then echo "No nginx widget.js location found"; exit 0; fi; for f in $FILES; do if grep -q "public, max-age=14400" "$f"; then perl -0777 -i -pe '"'"'"'"'"'"'"'"'s/add_header\\s+Cache-Control\\s+"public,\\s*max-age=14400";/add_header Cache-Control "no-store, no-cache, must-revalidate, max-age=0" always;\\n        add_header Pragma "no-cache" always;\\n        add_header Expires "0" always;/g'"'"'"'"'"'"'"'"' "$f"; echo "Patched $f"; fi; done; nginx -t && systemctl reload nginx'`);
    await run(conn, `(cd ${replymaRoot}/backendgeo 2>/dev/null && (npm ci 2>/dev/null || npm install) && npm run build) || true`);
    await run(conn, `(cd ${replymaRoot}/backendgeo 2>/dev/null && npx prisma migrate deploy) || echo "Prisma migrate deploy skipped or failed (check DATABASE_URL in backendgeo/.env)"`);
    await run(conn, `pm2 restart ${pm2Frontend} 2>/dev/null || echo "PM2 app ${pm2Frontend} not found"`);
    await run(conn, `pm2 restart ${pm2Backend} 2>/dev/null || echo "PM2 app ${pm2Backend} not found"`);
    await run(conn, `bash -lc 'cd ${replymaRoot} && echo \"\\n[widget.js server check]\" && ls -l public/widget.js && echo \"--- head ---\" && sed -n \"1,120p\" public/widget.js && echo \"--- markers ---\" && grep -nE \"isHostDesktop|OPEN_PANEL_HEIGHT_DESKTOP|OPEN_BOTTOM_OFFSET|\\\\?desktop=\" public/widget.js || true'`);
    await run(conn, `bash -lc 'cd ${replymaRoot} && echo \"\\n[server static check]\" && ls -ld .next/static .next/standalone/.next/static || true && ls -l .next/standalone/.next/static/chunks | head -n 20 || true && ls -l .next/standalone/.next/static/media | head -n 20 || true'`);
    await run(conn, `bash -lc 'echo \"\\n[public url check]\" && for u in \"https://replyma.com/_next/static/chunks/5ea2bf935ce9c0e8.js\" \"https://replyma.com/_next/static/chunks/5a830cc500fcf663.js\" \"https://replyma.com/_next/static/chunks/a43a2e0e3b99740b.js\" \"https://replyma.com/_next/static/chunks/c6bdbb692a854e4a.js\" \"https://replyma.com/_next/static/media/051742360c26797e-s.p.102b7f24.woff2\" \"https://replyma.com/_next/static/media/83afe278b6a6bb3c-s.p.3a6ba036.woff2\" \"https://replyma.com/_next/static/css/886512159809c214.css\"; do echo \"--- $u\"; curl -sSI \"$u\" | sed -n \"1,8p\"; done'`);
    console.log('\nDeploy done.');
  } catch (e) {
    console.error('\nDeploy error:', e.message);
    process.exit(1);
  } finally {
    conn.end();
  }
}).on('error', (err) => {
  console.error('SSH error:', err.message);
  process.exit(1);
}).connect({
  host,
  port: 22,
  username: user,
  password,
});
