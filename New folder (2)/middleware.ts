import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Middleware: Wildcard subdomain routing for workspace dashboards.
 *
 * URL structure:
 *   replyma.com          → marketing site
 *   app.replyma.com      → redirect to replyma.com (legacy)
 *   {slug}.replyma.com   → dashboard for workspace {slug}
 *   api.replyma.com      → backend (handled by nginx, never hits Next.js)
 *   ws.replyma.com       → websocket (handled by nginx)
 *
 * How it works:
 *   1. Extract subdomain from Host header
 *   2. If subdomain is a workspace slug → rewrite to /dashboard routes
 *   3. If no subdomain (replyma.com) → serve marketing/auth pages normally
 *   4. Auth pages (/login, /register) always on replyma.com (no subdomain)
 */

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "replyma.com"

// Subdomains that are NOT workspace slugs
const RESERVED_SUBDOMAINS = new Set([
  "www",
  "api",
  "ws",
  "app",
  "mail",
  "smtp",
  "imap",
  "ftp",
  "admin",
  "status",
  "docs",
  "cdn",
])

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get("host") || ""

  // Remove port for local dev
  const host = hostname.split(":")[0]

  // Check if this is a subdomain request
  // e.g., "luminaskincare.replyma.com" → subdomain = "luminaskincare"
  let subdomain: string | null = null

  if (host.endsWith(`.${ROOT_DOMAIN}`)) {
    subdomain = host.replace(`.${ROOT_DOMAIN}`, "")
  }

  // www → redirect to apex domain
  if (subdomain === "www") {
    return NextResponse.redirect(new URL(url.pathname + url.search, `https://${ROOT_DOMAIN}`))
  }

  // No subdomain or reserved → pass through normally
  if (!subdomain || RESERVED_SUBDOMAINS.has(subdomain)) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-pathname", url.pathname)
    const response = NextResponse.next({ request: { headers: requestHeaders } })
    if (url.pathname.startsWith("/widget")) {
      response.headers.set("Content-Security-Policy", "frame-ancestors *")
      // Widget HTML must not be edge-cached with stale chunk/css hashes.
      response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
      response.headers.set("Pragma", "no-cache")
      response.headers.set("Expires", "0")
    } else {
      response.headers.set("Content-Security-Policy", "frame-ancestors 'self' https://admin.shopify.com https://*.myshopify.com")
    }
    response.headers.delete("X-Frame-Options")
    return response
  }

  // This is a workspace subdomain like luminaskincare.replyma.com
  // Store the slug in a header so pages can read it
  const response = NextResponse.rewrite(url)
  response.headers.set("x-workspace-slug", subdomain)

  // If accessing root of subdomain → redirect to /inbox
  if (url.pathname === "/") {
    url.pathname = "/inbox"
    return NextResponse.redirect(url)
  }

  // Auth pages should be on the main domain, not subdomains
  if (url.pathname.startsWith("/login") || url.pathname.startsWith("/register") || url.pathname.startsWith("/forgot-password") || url.pathname.startsWith("/reset-password") || url.pathname.startsWith("/invite")) {
    return NextResponse.redirect(new URL(url.pathname + url.search, `https://${ROOT_DOMAIN}`))
  }

  // Marketing pages should be on the main domain
  if (url.pathname.startsWith("/pricing") || url.pathname.startsWith("/features") || url.pathname.startsWith("/about") || url.pathname.startsWith("/blog") || url.pathname.startsWith("/vs-")) {
    return NextResponse.redirect(new URL(url.pathname, `https://${ROOT_DOMAIN}`))
  }

  return NextResponse.next()
}

export const config = {
  // Match all paths except static files and API
  matcher: [
    "/((?!api/|_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map|txt|xml|woff|woff2)$).*)",
  ],
}
