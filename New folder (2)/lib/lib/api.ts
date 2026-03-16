import type { ApiError, AuthResponse } from "./types"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"

type ShopifyWindow = Window & {
  shopify?: {
    idToken?: () => Promise<string>
  }
}

/** API base for the live-chat widget. When widget runs on replyma.com, use api.replyma.com so it works even if build had no NEXT_PUBLIC_API_URL. */
export function getWidgetApiBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL
  if (fromEnv && !fromEnv.includes("localhost")) return fromEnv
  if (typeof window !== "undefined") {
    const h = window.location.hostname
    if (h === "replyma.com" || h === "www.replyma.com") return "https://api.replyma.com/api/v1"
  }
  return fromEnv || "http://localhost:4000/api/v1"
}

/** Server-only: API base for widget settings fetch (no window). Use in RSC. */
export function getWidgetApiBaseServer(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL
  if (fromEnv?.includes("localhost")) return fromEnv
  if (fromEnv) return fromEnv
  return "https://api.replyma.com/api/v1"
}

// ─── Token management ───────────────────────────────

let accessToken: string | null = null
let refreshToken: string | null = null
let embeddedTokenCache: { token: string; expiresAt: number } | null = null

// Cookie helpers — domain=.replyma.com shares cookies across all subdomains
const ROOT_DOMAIN = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_ROOT_DOMAIN || window.location.hostname.split(".").slice(-2).join("."))
  : "replyma.com"

function setCookie(name: string, value: string, days = 30) {
  if (typeof document === "undefined") return
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; domain=.${ROOT_DOMAIN}; SameSite=Lax; Secure`
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return
  // Remove both shared-domain and host-only variants.
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${ROOT_DOMAIN}; SameSite=Lax; Secure`
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`
}

export function setTokens(access: string, refresh: string) {
  accessToken = access
  refreshToken = refresh
  if (typeof window !== "undefined") {
    // Store in both cookies (cross-subdomain) and localStorage (fast access)
    setCookie("access_token", access)
    setCookie("refresh_token", refresh)
    localStorage.setItem("access_token", access)
    localStorage.setItem("refresh_token", refresh)
  }
}

const AUTH_USER_KEY = "replyma_user"
const AUTH_WORKSPACE_KEY = "replyma_workspace"

export function clearTokens() {
  accessToken = null
  refreshToken = null
  if (typeof window !== "undefined") {
    deleteCookie("access_token")
    deleteCookie("refresh_token")
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem(AUTH_USER_KEY)
    localStorage.removeItem(AUTH_WORKSPACE_KEY)
    deleteCookie(AUTH_USER_KEY)
    deleteCookie(AUTH_WORKSPACE_KEY)
  }
}

export function loadTokens() {
  if (typeof window !== "undefined") {
    // Try localStorage first (faster), fall back to cookies (cross-subdomain)
    accessToken = localStorage.getItem("access_token") || getCookie("access_token")
    refreshToken = localStorage.getItem("refresh_token") || getCookie("refresh_token")
    // Sync: if cookie has token but localStorage doesn't, populate localStorage
    if (accessToken && !localStorage.getItem("access_token")) {
      localStorage.setItem("access_token", accessToken)
    }
    if (refreshToken && !localStorage.getItem("refresh_token")) {
      localStorage.setItem("refresh_token", refreshToken)
    }
  }
}

export function getAccessToken(): string | null {
  if (!accessToken && typeof window !== "undefined") {
    accessToken = localStorage.getItem("access_token") || getCookie("access_token")
  }
  return accessToken
}

function isEmbeddedShopifyRuntime(): boolean {
  if (typeof window === "undefined") return false
  const w = window as ShopifyWindow
  return !!w.shopify && typeof w.shopify.idToken === "function"
}

async function getShopifySessionToken(forceRefresh = false): Promise<string | null> {
  if (!isEmbeddedShopifyRuntime()) return null
  if (!forceRefresh && embeddedTokenCache && embeddedTokenCache.expiresAt > Date.now()) {
    return embeddedTokenCache.token
  }

  try {
    const w = window as ShopifyWindow
    const token = await w.shopify!.idToken!()
    // Session token TTL is ~1 minute. Cache briefly to avoid token request on every call.
    embeddedTokenCache = { token, expiresAt: Date.now() + 25_000 }
    return token
  } catch {
    return null
  }
}

export async function getAuthBearerToken(): Promise<string | null> {
  const shopifyToken = await getShopifySessionToken()
  if (shopifyToken) return shopifyToken
  return getAccessToken()
}

// ─── Token refresh ──────────────────────────────────

let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const stored = refreshToken || localStorage.getItem("refresh_token")
    if (!stored) throw new Error("No refresh token")

    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: stored }),
    })

    if (!res.ok) {
      clearTokens()
      throw new Error("Refresh failed")
    }

    const data = await res.json()
    setTokens(data.accessToken, data.refreshToken)
    return data.accessToken as string
  })()

  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

// ─── Core fetch wrapper ─────────────────────────────

export class ApiRequestError extends Error {
  code: string
  statusCode: number
  details?: Record<string, string[]>

  constructor(error: ApiError, statusCode: number) {
    super(error.message)
    this.name = "ApiRequestError"
    this.code = error.code
    this.statusCode = statusCode
    this.details = error.details
  }
}

interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown
  noAuth?: boolean
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { body, noAuth, ...init } = options
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  }

  let usingShopifySessionToken = false
  if (!noAuth) {
    const token = await getAuthBearerToken()
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
      usingShopifySessionToken = isEmbeddedShopifyRuntime()
    }
  }

  let res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  // Auto-refresh on 401 (skip for demo tokens)
  const isDemoToken = getAccessToken() === "demo-token"
  if (res.status === 401 && !noAuth && usingShopifySessionToken) {
    const refreshed = await getShopifySessionToken(true)
    if (refreshed) {
      headers["Authorization"] = `Bearer ${refreshed}`
      res = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      })
    }
  } else if (res.status === 401 && !noAuth && !isDemoToken) {
    try {
      const newToken = await refreshAccessToken()
      headers["Authorization"] = `Bearer ${newToken}`
      res = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      })
    } catch {
      clearTokens()
      if (typeof window !== "undefined") {
        const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN || (window.location.hostname.includes("localhost") ? "" : "replyma.com")
        const loginPath = "/login?force_logout=1"
        window.location.href = root ? `https://${root}${loginPath}` : loginPath
      }
      throw new Error("Session expired")
    }
  }

  if (!res.ok) {
    const parsed = await res.json().catch(() => null) as Record<string, unknown> | null
    const parsedMessage =
      (typeof parsed?.message === "string" ? parsed.message : undefined) ||
      (typeof parsed?.error === "string" ? parsed.error : undefined)
    const parsedCode = typeof parsed?.code === "string" ? parsed.code : undefined
    const parsedDetails = parsed && "details" in parsed ? (parsed.details as Record<string, string[]> | undefined) : undefined

    if ((res.status === 401 || res.status === 403) && !noAuth && parsedCode === "WORKSPACE_ACCESS_REVOKED") {
      clearTokens()
      if (typeof window !== "undefined") {
        const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN || (window.location.hostname.includes("localhost") ? "" : "replyma.com")
        const loginPath = "/login?force_logout=1"
        window.location.href = root ? `https://${root}${loginPath}` : loginPath
      }
    }

    const normalized: ApiError = {
      status: "error",
      code: parsedCode || "UNKNOWN",
      message: parsedMessage || res.statusText || "Request failed",
      ...(parsedDetails ? { details: parsedDetails } : {}),
    }

    throw new ApiRequestError(normalized, res.status)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ─── Auth API ───────────────────────────────────────

export const auth = {
  register(data: { email: string; password: string; name: string; workspaceName: string }) {
    return apiFetch<{ requiresOtp: true; email: string; message: string }>("/auth/register", { method: "POST", body: data, noAuth: true })
  },
  login(data: { email: string; password: string }) {
    return apiFetch<
      | { requiresOtp: true; email: string; message: string }
      | (AuthResponse & { requiresWorkspaceSelection?: false })
      | { requiresWorkspaceSelection: true; sessionToken: string; workspaces: Array<{ workspaceId: string; workspaceName: string; workspaceSlug: string; role: string; userName: string }> }
    >("/auth/login", { method: "POST", body: data, noAuth: true })
  },
  verifyLoginOtp(data: { email: string; otp: string }) {
    return apiFetch<AuthResponse & { requiresWorkspaceSelection?: boolean; sessionToken?: string; workspaces?: Array<{ workspaceId: string; workspaceName: string; workspaceSlug: string; role: string; userName: string }> }>("/auth/verify-login-otp", { method: "POST", body: data, noAuth: true })
  },
  selectWorkspace(data: { sessionToken: string; workspaceId: string }) {
    return apiFetch<AuthResponse>("/auth/select-workspace", { method: "POST", body: data, noAuth: true })
  },
  listWorkspaces() {
    return apiFetch<{ workspaces: Array<{ workspaceId: string; workspaceName: string; workspaceSlug: string; role: string; userId: string; isCurrent: boolean; isOwner?: boolean }> }>("/auth/workspaces")
  },
  switchWorkspace(workspaceId: string) {
    return apiFetch<AuthResponse>("/auth/switch-workspace", { method: "POST", body: { workspaceId } })
  },
  leaveWorkspace() {
    return apiFetch<{ success: boolean; redirectWorkspace: { slug: string; name: string } | null }>("/auth/leave-workspace", { method: "POST" })
  },
  googleAuth(credential: string) {
    return apiFetch<AuthResponse & { requiresWorkspaceSelection?: boolean; sessionToken?: string; workspaces?: Array<{ workspaceId: string; workspaceName: string; workspaceSlug: string; role: string; userName: string }> }>("/auth/google", { method: "POST", body: { credential }, noAuth: true })
  },
  logout() {
    const stored = refreshToken || localStorage.getItem("refresh_token")
    return apiFetch<{ success: boolean }>("/auth/logout", {
      method: "POST",
      body: { refreshToken: stored },
    })
  },
  forgotPassword(email: string) {
    return apiFetch<{ success: boolean; message: string }>("/auth/forgot-password", {
      method: "POST",
      body: { email },
      noAuth: true,
    })
  },
  resetPassword(token: string, password: string) {
    return apiFetch<{ success: boolean; message: string }>("/auth/reset-password", {
      method: "POST",
      body: { token, password },
      noAuth: true,
    })
  },
  changePassword(data: { currentPassword?: string; newPassword: string }) {
    return apiFetch<{ success: boolean }>("/auth/change-password", {
      method: "POST",
      body: data,
    })
  },
  hasPassword() {
    return apiFetch<{ hasPassword: boolean }>("/auth/has-password")
  },
  requestDeleteAccountCode() {
    return apiFetch<{ success: boolean; message: string }>("/auth/delete-account/request-code", {
      method: "POST",
    })
  },
  confirmDeleteAccount(otp: string) {
    return apiFetch<{ success: boolean; message: string; redirectWorkspace: { slug: string; name: string } | null }>("/auth/delete-account/confirm", {
      method: "POST",
      body: { otp },
    })
  },
  requestDeleteWorkspaceCode() {
    return apiFetch<{ success: boolean; message: string }>("/auth/delete-workspace/request-code", {
      method: "POST",
    })
  },
  confirmDeleteWorkspace(data: { otp: string; confirmation: string }) {
    return apiFetch<{ success: boolean; message: string }>("/auth/delete-workspace/confirm", {
      method: "POST",
      body: data,
    })
  },
}

// ─── Tickets API ────────────────────────────────────

export const tickets = {
  list(params?: Record<string, string>) {
    const qs = params ? "?" + new URLSearchParams(params).toString() : ""
    return apiFetch<{ data: import("./types").Ticket[]; nextCursor: string | null; hasMore: boolean }>(`/tickets${qs}`)
  },
  counts() {
    return apiFetch<Record<string, number>>("/tickets/counts")
  },
  get(id: string) {
    return apiFetch<import("./types").Ticket>(`/tickets/${id}`)
  },
  create(data: { customerEmail: string; customerName?: string; channel: string; subject?: string; message: string; priority?: string }) {
    return apiFetch<import("./types").Ticket>("/tickets", { method: "POST", body: data })
  },
  update(id: string, data: Partial<{ status: string; priority: string; tags: string[]; assignedAgentId: string; teamId: string }>) {
    return apiFetch<import("./types").Ticket>(`/tickets/${id}`, { method: "PATCH", body: data })
  },
  delete(id: string) {
    return apiFetch<void>(`/tickets/${id}`, { method: "DELETE" })
  },
  merge(id: string, targetId: string) {
    return apiFetch<import("./types").Ticket>(`/tickets/${id}/merge`, { method: "POST", body: { targetTicketId: targetId } })
  },
  snooze(id: string, until: string) {
    return apiFetch<import("./types").Ticket>(`/tickets/${id}/snooze`, { method: "POST", body: { snoozeUntil: until } })
  },
  assign(id: string, data: { agentId?: string; teamId?: string }) {
    return apiFetch<import("./types").Ticket>(`/tickets/${id}/assign`, { method: "POST", body: data })
  },
  bulk(data: { ticketIds: string[]; action: string; value?: unknown }) {
    return apiFetch<{ updated: number }>("/tickets/bulk", { method: "POST", body: data })
  },
  getShopifyData(id: string) {
    return apiFetch<unknown>(`/tickets/${id}/shopify`)
  },
  shopifyRefund(id: string, data: { orderId: string; amount?: number; reason?: string }) {
    return apiFetch<{ success: boolean }>(`/tickets/${id}/shopify/refund`, { method: "POST", body: data })
  },
  shopifyCancel(id: string, data: { orderId: string; reason?: string }) {
    return apiFetch<{ success: boolean }>(`/tickets/${id}/shopify/cancel`, { method: "POST", body: data })
  },
}

// ─── Messages API ───────────────────────────────────

export const messages = {
  list(ticketId: string) {
    return apiFetch<import("./types").Message[]>(`/messages/tickets/${ticketId}/messages`).then(r => (r as any).data ?? r)
  },
  send(ticketId: string, data: { content: string; isInternal?: boolean }) {
    return apiFetch<import("./types").Message>(`/messages/tickets/${ticketId}/messages`, { method: "POST", body: data })
  },
  aiImprove(ticketId: string, content: string) {
    return apiFetch<{ improved: string }>(`/messages/tickets/${ticketId}/ai-improve`, { method: "POST", body: { content } })
  },
}

// ─── Macros API ─────────────────────────────────────

export const macros = {
  list() {
    return apiFetch<import("./types").Macro[]>("/macros").then(r => (r as any).data ?? r)
  },
  create(data: { name: string; body: string; subject?: string; tags?: string[] }) {
    return apiFetch<import("./types").Macro>("/macros", { method: "POST", body: data })
  },
  update(id: string, data: Partial<{ name: string; body: string; subject: string; tags: string[] }>) {
    return apiFetch<import("./types").Macro>(`/macros/${id}`, { method: "PUT", body: data })
  },
  delete(id: string) {
    return apiFetch<void>(`/macros/${id}`, { method: "DELETE" })
  },
}

// ─── Rules API ──────────────────────────────────────

export const rules = {
  list() {
    return apiFetch<import("./types").Rule[]>("/rules").then(r => (r as any).data ?? r)
  },
  create(data: { name: string; type: string; conditions: unknown; actions: unknown; priority?: number }) {
    return apiFetch<import("./types").Rule>("/rules", { method: "POST", body: data })
  },
  update(id: string, data: Partial<{ name: string; isEnabled: boolean; conditions: unknown; actions: unknown; priority: number }>) {
    return apiFetch<import("./types").Rule>(`/rules/${id}`, { method: "PUT", body: data })
  },
  delete(id: string) {
    return apiFetch<void>(`/rules/${id}`, { method: "DELETE" })
  },
}

// ─── Team API ───────────────────────────────────────

export const team = {
  listMembers() {
    return apiFetch<import("./types").User[]>("/team/members").then(r => (r as any).data ?? r)
  },
  invite(data: { email: string; name: string; role: string }) {
    return apiFetch<import("./types").User>("/team/invite", { method: "POST", body: data })
  },
  updateMember(id: string, data: Partial<{ role: string; status: string }>) {
    return apiFetch<import("./types").User>(`/team/members/${id}`, { method: "PATCH", body: data })
  },
  removeMember(id: string) {
    return apiFetch<void>(`/team/members/${id}`, { method: "DELETE" })
  },
  acceptInvite(data: { token: string; password: string; name?: string }) {
    return apiFetch<AuthResponse>("/team/accept-invite", { method: "POST", body: data, noAuth: true })
  },
  updateProfile(data: { name?: string; avatarUrl?: string }) {
    return apiFetch<import("./types").User>("/team/profile", { method: "PATCH", body: data })
  },
}

// ─── AI API ─────────────────────────────────────────

export const ai = {
  getSettings() {
    return apiFetch<{ aiTone: string; autoReplyEnabled: boolean; escalateKeywords: string[]; returnPolicy: string | null }>("/ai/settings")
  },
  updateSettings(data: { aiTone?: string; autoReplyEnabled?: boolean; escalateKeywords?: string[]; returnPolicy?: string }) {
    return apiFetch<import("./types").Workspace>("/ai/settings", { method: "PUT", body: data })
  },
  testReply(message: string) {
    return apiFetch<{ reply: string }>("/ai/test-reply", { method: "POST", body: { message } })
  },
}

// ─── Channels API ───────────────────────────────────

export const channels = {
  list() {
    return apiFetch<import("./types").ChannelConfig[]>("/channels").then(r => (r as any).data ?? r)
  },
  configure(type: string, credentials: Record<string, unknown>) {
    return apiFetch<import("./types").ChannelConfig>(`/channels/${type.toLowerCase()}`, {
      method: "POST",
      body: credentials,
    })
  },
  delete(id: string) {
    return apiFetch<void>(`/channels/${id}`, { method: "DELETE" })
  },
  setupEmail(data: { mode: string; fromEmail?: string; displayName?: string }) {
    return apiFetch<{ forwardingAddress: string; status: string }>("/channels/email/setup", {
      method: "POST",
      body: data,
    })
  },
  getEmailStatus() {
    return apiFetch<{
      mode: string | null
      fromEmail: string | null
      displayName: string | null
      forwardingAddress: string | null
      forwardingVerified: boolean
      domainVerified: boolean
      dnsRecords: Array<{ type: string; name: string; value: string; verified: boolean }> | null
      gmailConnected?: boolean
      gmailEmail?: string | null
      microsoftConnected?: boolean
      microsoftEmail?: string | null
      connectedProvider?: string | null
      connectedEmail?: string | null
      connectedName?: string | null
      connectedAt?: string | null
      accounts?: Array<{ id: string; provider: string; email: string; name: string; isDefault: boolean; connectedAt: string }>
    }>(`/channels/email/status?_t=${Date.now()}`)
  },
  verifyDomain(data: { domain: string; sendingEmail: string }) {
    return apiFetch<{
      dnsRecords: Array<{ type: string; name: string; value: string; verified: boolean }>
      domainVerified: boolean
    }>("/channels/email/verify-domain", { method: "POST", body: data })
  },
  getDomainVerificationStatus() {
    return apiFetch<{
      dnsRecords: Array<{ type: string; name: string; value: string; verified: boolean }>
      domainVerified: boolean
    }>("/channels/email/verify-domain/status")
  },
  verifyForwarding() {
    return apiFetch<{ verified: boolean; message: string }>("/channels/email/verify-forwarding", {
      method: "POST",
    })
  },
  removeDomain() {
    return apiFetch<void>("/channels/email/domain", { method: "DELETE" })
  },
  removeForwardingEmail() {
    return apiFetch<{ success: boolean }>("/channels/email/forwarding", { method: "DELETE" })
  },
  gmailAuth() {
    return apiFetch<{ url: string }>("/channels/gmail/auth")
  },
  gmailDisconnect() {
    return apiFetch<{ success: boolean }>("/channels/gmail/disconnect", { method: "POST" })
  },
  microsoftAuth() {
    return apiFetch<{ url: string }>("/channels/microsoft/auth")
  },
  microsoftDisconnect() {
    return apiFetch<{ success: boolean }>("/channels/microsoft/disconnect", { method: "POST" })
  },
  configureLiveChat(data: {
    isEnabled?: boolean
    accentColor?: string
    accentGradientPreset?: string
    textIconColor?: string
    headerTextColor?: string
    headerSubtextColor?: string
    panelBackgroundColor?: string
    assistantBubbleColor?: string
    assistantTextColor?: string
    userBubbleColor?: string
    userTextColor?: string
    inputBackgroundColor?: string
    inputTextColor?: string
    quickReplyBackgroundColor?: string
    quickReplyTextColor?: string
    quickReplyBorderColor?: string
    launcherIconColor?: string
    proactiveBackgroundColor?: string
    proactiveTextColor?: string
    proactiveSubtextColor?: string
    greeting?: string
    quickReplies?: string[]
    assistantName?: string
  }) {
    return apiFetch<{ configured: boolean }>("/channels/live-chat", { method: "POST", body: data })
  },
  getWidgetSettings() {
    return apiFetch<{
      isEnabled: boolean
      accentColor: string
      accentGradientPreset: string
      textIconColor: string
      headerTextColor: string
      headerSubtextColor: string
      panelBackgroundColor: string
      assistantBubbleColor: string
      assistantTextColor: string
      userBubbleColor: string
      userTextColor: string
      inputBackgroundColor: string
      inputTextColor: string
      quickReplyBackgroundColor: string
      quickReplyTextColor: string
      quickReplyBorderColor: string
      launcherIconColor: string
      proactiveBackgroundColor: string
      proactiveTextColor: string
      proactiveSubtextColor: string
      greeting: string
      quickReplies: string[]
      assistantName: string
      proactiveTitle: string
      proactiveSubtitle: string
      workspaceId: string
    }>("/channels/live-chat/settings")
  },
  updateWidgetSettings(data: Record<string, unknown>) {
    return apiFetch<{ success: boolean }>("/channels/live-chat/settings", { method: "PUT", body: data })
  },
  removeEmailAccount(accountId: string) {
    return apiFetch<{ success: boolean }>(`/channels/email/accounts/${accountId}`, { method: "DELETE" })
  },
  setDefaultEmailAccount(accountId: string) {
    return apiFetch<{ success: boolean }>(`/channels/email/accounts/${accountId}/default`, { method: "PATCH" })
  },
}

// ─── Analytics API ──────────────────────────────────

export const analytics = {
  overview(params?: Record<string, string>) {
    const qs = params ? "?" + new URLSearchParams(params).toString() : ""
    return apiFetch<import("./types").AnalyticsOverview>(`/analytics/overview${qs}`)
  },
  volume(params?: Record<string, string>) {
    const qs = params ? "?" + new URLSearchParams(params).toString() : ""
    return apiFetch<{ data: { date: string; total: number; aiResolved: number; escalated: number }[] }>(`/analytics/volume${qs}`)
  },
  channels(params?: Record<string, string>) {
    const qs = params ? "?" + new URLSearchParams(params).toString() : ""
    return apiFetch<{ data: { channel: string; count: number }[] }>(`/analytics/channels${qs}`)
  },
  agents(params?: Record<string, string>) {
    const qs = params ? "?" + new URLSearchParams(params).toString() : ""
    return apiFetch<{ data: { id: string; name: string; status: string; ticketsHandled: number }[] }>(`/analytics/agents${qs}`)
  },
  csat(params?: Record<string, string>) {
    const qs = params ? "?" + new URLSearchParams(params).toString() : ""
    return apiFetch<{ averageScore: number; totalSurveys: number; responseRate: number }>(`/analytics/csat${qs}`)
  },
  revenue(params?: Record<string, string>) {
    const qs = params ? "?" + new URLSearchParams(params).toString() : ""
    return apiFetch<{ revenueAttributed: number; revenueByChannel: { channel: string; revenue: number }[]; revenueTimeline: { date: string; revenue: number }[] }>(`/analytics/revenue${qs}`)
  },
}

// ─── Billing API ────────────────────────────────────

export const billing = {
  getPlan() {
    return apiFetch<{ plan: string; trialEndsAt: string | null; hasStripeSubscription?: boolean; cancelAtPeriodEnd?: boolean; usage: Record<string, number> }>("/billing/plan")
  },
  getInvoices() {
    return apiFetch<{ data: { id: string; date: string; description: string; amount: string; status: string; pdfUrl?: string }[] }>("/billing/invoices")
  },
  changePlan(plan: string) {
    return apiFetch<{ success: boolean; plan: string; redirectUrl?: string }>("/billing/change", { method: "POST", body: { plan } })
  },
  createCheckout(plan: string, annual = false) {
    return apiFetch<{ url: string }>("/billing/stripe/checkout", { method: "POST", body: { plan, annual } })
  },
  createPortal() {
    return apiFetch<{ url: string }>("/billing/stripe/portal", { method: "POST" })
  },
  cancelSubscription() {
    return apiFetch<{ success: boolean }>("/billing/cancel", { method: "POST" })
  },
}

// ─── Help Center API ────────────────────────────────

export const helpcenter = {
  list() {
    return apiFetch<import("./types").HelpArticle[]>("/helpcenter/articles").then(r => (r as any).data ?? r)
  },
  get(id: string) {
    return apiFetch<import("./types").HelpArticle>(`/helpcenter/articles/${id}`)
  },
  create(data: { title: string; content: string; isPublished?: boolean }) {
    return apiFetch<import("./types").HelpArticle>("/helpcenter/articles", { method: "POST", body: data })
  },
  update(id: string, data: Partial<{ title: string; content: string; isPublished: boolean }>) {
    return apiFetch<import("./types").HelpArticle>(`/helpcenter/articles/${id}`, { method: "PUT", body: data })
  },
  delete(id: string) {
    return apiFetch<void>(`/helpcenter/articles/${id}`, { method: "DELETE" })
  },
}

// ─── Customers API ──────────────────────────────────

export const customers = {
  list(params?: Record<string, string>) {
    const qs = params ? "?" + new URLSearchParams(params).toString() : ""
    return apiFetch<{ data: { email: string; name: string; ticketCount: number; ltv: number }[]; total: number }>(`/customers${qs}`)
  },
  get(email: string) {
    return apiFetch<{ email: string; name: string; tickets: import("./types").Ticket[]; shopifyData?: unknown }>(`/customers/${encodeURIComponent(email)}`)
  },
}

// ─── Integrations API ───────────────────────────────

export const integrations = {
  list() {
    return apiFetch<import("./types").Integration[]>("/integrations").then(r => (r as any).data ?? r)
  },
  configure(type: string, config: Record<string, unknown>) {
    return apiFetch<import("./types").Integration>(`/integrations/${type.toLowerCase()}`, { method: "POST", body: config })
  },
  delete(type: string) {
    return apiFetch<void>(`/integrations/${type.toLowerCase()}`, { method: "DELETE" })
  },
}

// ─── SLA API ────────────────────────────────────────

export const sla = {
  list() {
    return apiFetch<import("./types").SlaPolicy[]>("/sla")
  },
  create(data: { name: string; priority: string; firstResponseMins: number; resolutionMins: number; businessHoursOnly?: boolean }) {
    return apiFetch<import("./types").SlaPolicy>("/sla", { method: "POST", body: data })
  },
  update(id: string, data: Partial<{ name: string; priority: string; firstResponseMins: number; resolutionMins: number; isEnabled: boolean; businessHoursOnly: boolean }>) {
    return apiFetch<import("./types").SlaPolicy>(`/sla/${id}`, { method: "PUT", body: data })
  },
  delete(id: string) {
    return apiFetch<void>(`/sla/${id}`, { method: "DELETE" })
  },
}

// ─── Audit Log API ──────────────────────────────────

export const auditLog = {
  list(params?: Record<string, string>) {
    const qs = params ? "?" + new URLSearchParams(params).toString() : ""
    return apiFetch<{ data: import("./types").AuditLog[]; nextCursor: string | null; hasMore: boolean }>(`/audit${qs}`)
  },
}

// ─── Tags API ──────────────────────────────────────

export const tags = {
  list() {
    return apiFetch<{ data: import("./types").Tag[] }>("/tags")
  },
  create(data: { name: string; color?: string }) {
    return apiFetch<import("./types").Tag>("/tags", { method: "POST", body: data })
  },
  update(id: string, data: Partial<{ name: string; color: string }>) {
    return apiFetch<import("./types").Tag>(`/tags/${id}`, { method: "PUT", body: data })
  },
  delete(id: string) {
    return apiFetch<void>(`/tags/${id}`, { method: "DELETE" })
  },
}

// ─── Saved Views API ───────────────────────────────

export const savedViews = {
  list() {
    return apiFetch<{ data: import("./types").SavedView[] }>("/saved-views")
  },
  create(data: { name: string; filters: Record<string, unknown>; isShared?: boolean }) {
    return apiFetch<import("./types").SavedView>("/saved-views", { method: "POST", body: data })
  },
  update(id: string, data: Partial<{ name: string; filters: Record<string, unknown>; isShared: boolean }>) {
    return apiFetch<import("./types").SavedView>(`/saved-views/${id}`, { method: "PUT", body: data })
  },
  delete(id: string) {
    return apiFetch<void>(`/saved-views/${id}`, { method: "DELETE" })
  },
}

// ─── Flows API ─────────────────────────────────────

export const flows = {
  list() {
    return apiFetch<import("./types").Flow[]>("/flows").then(r => (r as any).data ?? r)
  },
  get(id: string) {
    return apiFetch<import("./types").Flow>(`/flows/${id}`)
  },
  create(data: { name: string; trigger: string; nodes: unknown; edges: unknown }) {
    return apiFetch<import("./types").Flow>("/flows", { method: "POST", body: data })
  },
  update(id: string, data: Partial<{ name: string; trigger: string; nodes: unknown; edges: unknown; isEnabled: boolean }>) {
    return apiFetch<import("./types").Flow>(`/flows/${id}`, { method: "PUT", body: data })
  },
  delete(id: string) {
    return apiFetch<void>(`/flows/${id}`, { method: "DELETE" })
  },
}

// ─── Workspace / Settings API ───────────────────────

export const workspace = {
  get() {
    return apiFetch<import("./types").Workspace>("/settings")
  },
  update(data: Partial<{ name: string; slug: string; businessHoursJson: unknown; [key: string]: unknown }>) {
    return apiFetch<import("./types").Workspace>("/settings", { method: "PUT", body: data })
  },
}

// ─── Settings Extensions API ────────────────────────

export const settingsApi = {
  getWebhooks() {
    return apiFetch<{ data: { id: string; url: string; events: string[]; secret: string; isEnabled: boolean; createdAt: string }[] }>("/settings/webhooks")
  },
  createWebhook(data: { url: string; events: string[] }) {
    return apiFetch<{ id: string; url: string; secret: string }>("/settings/webhooks", { method: "POST", body: data })
  },
  updateWebhook(id: string, data: Partial<{ url: string; events: string[]; isEnabled: boolean }>) {
    return apiFetch<{ id: string }>(`/settings/webhooks/${id}`, { method: "PUT", body: data })
  },
  deleteWebhook(id: string) {
    return apiFetch<void>(`/settings/webhooks/${id}`, { method: "DELETE" })
  },

  getApiKeys() {
    return apiFetch<{ data: { id: string; name: string; prefix: string; createdAt: string; lastUsedAt: string | null; expiresAt: string | null }[] }>("/settings/api-keys")
  },
  createApiKey(data: { name: string; expiresInDays?: number }) {
    return apiFetch<{ id: string; name: string; key: string; prefix: string }>("/settings/api-keys", { method: "POST", body: data })
  },
  revokeApiKey(id: string) {
    return apiFetch<void>(`/settings/api-keys/${id}`, { method: "DELETE" })
  },

  getTemplates() {
    return apiFetch<{ data: { id: string; name: string; subject: string; body: string; type: string; createdAt: string; updatedAt: string }[] }>("/settings/email-templates")
  },
  createTemplate(data: { name: string; subject: string; body: string; type?: string }) {
    return apiFetch<{ id: string; name: string }>("/settings/email-templates", { method: "POST", body: data })
  },
  updateTemplate(id: string, data: Partial<{ name: string; subject: string; body: string }>) {
    return apiFetch<{ id: string }>(`/settings/email-templates/${id}`, { method: "PUT", body: data })
  },
  deleteTemplate(id: string) {
    return apiFetch<void>(`/settings/email-templates/${id}`, { method: "DELETE" })
  },

  exportTickets() {
    return apiFetch<string>("/settings/export/tickets")
  },
  exportCustomers() {
    return apiFetch<string>("/settings/export/customers")
  },
}

// ─── Segments API ──────────────────────────────────

export const segments = {
  list() {
    return apiFetch<{ data: { id: string; name: string; description: string | null; filters: Record<string, unknown>; customerCount: number; createdAt: string }[] }>("/segments")
  },
  create(data: { name: string; description?: string; filters: Record<string, unknown> }) {
    return apiFetch<{ id: string; name: string; filters: Record<string, unknown> }>("/segments", { method: "POST", body: data })
  },
  update(id: string, data: Partial<{ name: string; description: string; filters: Record<string, unknown> }>) {
    return apiFetch<{ id: string; name: string }>(`/segments/${id}`, { method: "PUT", body: data })
  },
  delete(id: string) {
    return apiFetch<void>(`/segments/${id}`, { method: "DELETE" })
  },
}

// ─── Attachments API ───────────────────────────────

export const attachments = {
  async upload(file: File) {
    const formData = new FormData()
    formData.append("file", file)
    const token = await getAuthBearerToken()
    const res = await fetch(`${API_BASE}/attachments`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
    if (!res.ok) throw new Error("Upload failed")
    return res.json() as Promise<{
      id: string
      filename: string
      size: number
      mimeType: string
      url: string
      key: string
    }>
  },
  getUrl(key: string) {
    return apiFetch<{ url: string }>(`/attachments/${encodeURIComponent(key)}`)
  },
}

// ─── Notifications API ─────────────────────────────

export const notifications = {
  get() {
    return apiFetch<{
      email: boolean; push: boolean
      ticketAssigned: boolean; ticketEscalated: boolean
      newTicket: boolean; csatResponse: boolean; weeklyDigest: boolean
    }>("/notifications/preferences")
  },
  update(data: {
    email?: boolean; push?: boolean
    ticketAssigned?: boolean; ticketEscalated?: boolean
    newTicket?: boolean; csatResponse?: boolean; weeklyDigest?: boolean
  }) {
    return apiFetch<Record<string, boolean>>("/notifications/preferences", { method: "PUT", body: data })
  },
  recent() {
    return apiFetch<{ data: { id: string; title: string; description: string; time: string; unread: boolean }[] }>("/notifications/recent")
  },
  markAllRead() {
    return apiFetch<{ success: boolean }>("/notifications/mark-all-read", { method: "POST" })
  },
}
