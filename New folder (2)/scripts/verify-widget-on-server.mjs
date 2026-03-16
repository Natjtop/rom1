#!/usr/bin/env node
/**
 * Verify that widget.js on the server contains the embed-match-marketing fix.
 * Run locally: SSH_PASSWORD=xxx node scripts/verify-widget-on-server.mjs
 * Or on server: head -15 public/widget.js .next/standalone/public/widget.js 2>/dev/null; grep -l DESKTOP_IFRAME_INSET_PX public/widget.js .next/standalone/public/widget.js 2>/dev/null && echo "OK: new widget" || echo "MISSING: update widget"
 */
import { Client } from "ssh2";

const host = process.env.SSH_HOST || "88.198.40.210";
const user = process.env.SSH_USER || "root";
const password = process.env.SSH_PASSWORD;
const replymaRoot = process.env.REPLYMA_ROOT || "/opt/replyma";

if (!password) {
  console.error("Set SSH_PASSWORD to run verification.");
  process.exit(1);
}

const conn = new Client();
conn
  .on("ready", () => {
    conn.exec(
      `grep -l "DESKTOP_IFRAME_INSET_PX\\|20260306-embed-match-marketing" ${replymaRoot}/public/widget.js ${replymaRoot}/.next/standalone/public/widget.js 2>/dev/null || true; echo "---"; head -5 ${replymaRoot}/public/widget.js 2>/dev/null || echo "public/widget.js not found"; echo "---"; head -5 ${replymaRoot}/.next/standalone/public/widget.js 2>/dev/null || echo "standalone/public/widget.js not found"`,
      (err, stream) => {
        if (err) {
          console.error(err);
          conn.end();
          process.exit(1);
        }
        let out = "";
        stream.on("data", (d) => { out += d.toString(); });
        stream.stderr.on("data", (d) => { out += d.toString(); });
        stream.on("close", (code) => {
          console.log(out);
          if (out.includes("DESKTOP_IFRAME_INSET_PX") || out.includes("20260306-embed-match-marketing")) {
            console.log("\n✓ Widget on server contains embed-match-marketing fix.");
          } else {
            console.log("\n✗ Widget on server is OLD (no DESKTOP_IFRAME_INSET_PX). Run deploy with BUILD_FRONTEND=1 and wait for completion.");
          }
          conn.end();
        });
      }
    );
  })
  .on("error", (err) => {
    console.error("SSH error:", err.message);
    process.exit(1);
  })
  .connect({ host, port: 22, username: user, password });
