#!/usr/bin/env node
/**
 * SSH: apply Shopping Assistant migration (Workspace columns) on server DB.
 * Fixes: "The column Workspace.shoppingAssistantEnabled does not exist" -> 500 on auth/google, settings, widget/proactive.
 */
import { Client } from 'ssh2';

const host = process.env.SSH_HOST || '88.198.40.210';
const user = process.env.SSH_USER || 'root';
const password = process.env.SSH_PASSWORD;
const r = process.env.REPLYMA_ROOT || '/opt/replyma';

if (!password) {
  console.error('Set SSH_PASSWORD');
  process.exit(1);
}

function run(conn, cmd, label) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      if (label) console.log('\n--- ' + label + ' ---');
      stream.on('data', (d) => process.stdout.write(d));
      stream.stderr.on('data', (d) => process.stderr.write(d));
      stream.on('close', (code) => (code === 0 ? resolve() : reject(new Error('exit ' + code))));
    });
  });
}

const conn = new Client();
conn.on('ready', async () => {
  try {
    const writeAndRun = `
      cd ${r}/backendgeo &&
      URL=$(node -e "const ec=require('${r}/ecosystem.config.cjs');const a=ec.apps.find(x=>x.name==='replyma-backend');console.log(a&&a.env&&a.env.DATABASE_URL||'')" 2>/dev/null) || URL=$(grep -E '^DATABASE_URL=' .env 2>/dev/null | sed 's/^DATABASE_URL=//');
      [ -z "$URL" ] && echo "No DATABASE_URL" && exit 1;
      cat > /tmp/sa_mig.sql << 'SQLEOF'
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "shoppingAssistantEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "shoppingAssistantPromptOverride" TEXT;
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "shoppingDiscountStrategy" TEXT;
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "shoppingProductRecommendationConfig" JSONB;
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "shoppingProactiveCampaigns" JSONB;
SQLEOF
      psql "$URL" -v ON_ERROR_STOP=1 -f /tmp/sa_mig.sql && echo "Migration OK"
    `;
    await run(conn, writeAndRun, 'Apply migration');
    await run(conn, 'pm2 restart replyma-backend', 'Restart backend');
    await run(conn, 'sleep 3; curl -s -o /dev/null -w "GET /settings: %{http_code}\n" http://127.0.0.1:4001/api/v1/settings; curl -s -o /dev/null -w "POST /auth/google: %{http_code}\n" -X POST http://127.0.0.1:4001/api/v1/auth/google -H "Content-Type: application/json" -d \'{"credential":"x"}\'', 'Verify');
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  } finally {
    conn.end();
  }
}).on('error', (err) => {
  console.error('SSH error:', err.message);
  process.exit(1);
}).connect({ host, port: 22, username: user, password });
