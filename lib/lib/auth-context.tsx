"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { auth as authApi, setTokens, clearTokens, loadTokens, getAccessToken } from "./api"

// Cookie helpers for cross-subdomain user/workspace data
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
import type { User, Workspace, Role, AuthResponse } from "./types"

interface AuthUser {
  id: string
  email: string
  name: string
  role: Role
  avatarUrl: string | null
}

interface AuthWorkspace {
  id: string
  slug: string
  name: string
}

interface AuthContextValue {
  user: AuthUser | null
  workspace: AuthWorkspace | null
  isLoading: boolean
  isAuthenticated: boolean
  /** If already authenticated, redirects to app (inbox). Call from login/register pages. */
  redirectToAppIfAuthenticated: () => void
  /** Re-read tokens and user/workspace from cookies (e.g. after from_login=1 on subdomain to avoid redirect loop). */
  reloadSessionFromStorage: () => void
  login: (email: string, password: string) => Promise<{
    requiresOtp: boolean
    email: string
    requiresWorkspaceSelection?: boolean
    sessionToken?: string
    workspaces?: Array<{ workspaceId: string; workspaceName: string; workspaceSlug: string; role: string; userName: string }>
  }>
  verifyLoginOtp: (email: string, otp: string) => Promise<{ requiresWorkspaceSelection: boolean; sessionToken?: string; workspaces?: Array<{ workspaceId: string; workspaceName: string; workspaceSlug: string; role: string; userName: string }> }>
  selectWorkspace: (sessionToken: string, workspaceId: string) => Promise<void>
  googleAuth: (credential: string) => Promise<any>
  register: (data: { email: string; password: string; name: string; workspaceName: string }) => Promise<any>
  logout: () => Promise<void>
  updateUser: (updates: Partial<AuthUser>) => void
  updateWorkspace: (updates: Partial<AuthWorkspace>) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

const USER_KEY = "replyma_user"
const WORKSPACE_KEY = "replyma_workspace"
const LOGOUT_SYNC_KEY = "replyma_logout_sync"

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [workspace, setWorkspace] = useState<AuthWorkspace | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Restore session from URL hash (invite redirect), cookies, or localStorage
  useEffect(() => {
    // force_logout=1: user was removed from workspace or session invalid; clear all auth and show login (avoids redirect loop)
    if (typeof window !== "undefined" && window.location.search.includes("force_logout=1")) {
      clearTokens()
      deleteCookie(USER_KEY)
      deleteCookie(WORKSPACE_KEY)
      deleteCookie(LOGOUT_SYNC_KEY)
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem(WORKSPACE_KEY)
      const params = new URLSearchParams(window.location.search)
      params.delete("force_logout")
      const q = params.toString()
      window.history.replaceState(null, "", window.location.pathname + (q ? "?" + q : ""))
      setUser(null)
      setWorkspace(null)
      setIsLoading(false)
      return
    }

    // Cross-subdomain logout sync: if another origin logged out, clear this origin too.
    if (getCookie(LOGOUT_SYNC_KEY) === "1") {
      clearTokens()
      deleteCookie(USER_KEY)
      deleteCookie(WORKSPACE_KEY)
      deleteCookie(LOGOUT_SYNC_KEY)
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem(WORKSPACE_KEY)
    }

    // Check for auth payload in URL hash (from invite auto-login)
    if (typeof window !== "undefined" && window.location.hash.startsWith("#auth=")) {
      try {
        const payload = JSON.parse(decodeURIComponent(window.location.hash.slice(6)))
        if (payload.accessToken && payload.user && payload.workspace) {
          setTokens(payload.accessToken, payload.refreshToken)
          const u = payload.user
          const w = payload.workspace
          setUser({ id: u.id, email: u.email, name: u.name, role: u.role as any, avatarUrl: u.avatarUrl ?? null })
          setWorkspace({ id: w.id, slug: w.slug, name: w.name })
          localStorage.setItem(USER_KEY, JSON.stringify(u))
          localStorage.setItem(WORKSPACE_KEY, JSON.stringify(w))
          setCookie(USER_KEY, JSON.stringify(u))
          setCookie(WORKSPACE_KEY, JSON.stringify(w))
          // Clean the hash from URL without reload
          window.history.replaceState(null, "", window.location.pathname + window.location.search)
          setIsLoading(false)
          return
        }
      } catch {
        // Invalid hash payload — continue with normal flow
      }
    }

    loadTokens()
    const token = getAccessToken()
    if (token && token !== "demo-token") {
      try {
        const storedUser = localStorage.getItem(USER_KEY) || getCookie(USER_KEY)
        const storedWorkspace = localStorage.getItem(WORKSPACE_KEY) || getCookie(WORKSPACE_KEY)
        if (storedUser && storedWorkspace) {
          const u = JSON.parse(storedUser)
          const w = JSON.parse(storedWorkspace)

          // Detect subdomain mismatch: if current subdomain doesn't match stored workspace slug,
          // auto-switch to the correct workspace for this subdomain.
          const hostname = typeof window !== "undefined" ? window.location.hostname : ""
          const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "replyma.com"
          const currentSlug = hostname.endsWith(`.${rootDomain}`) ? hostname.replace(`.${rootDomain}`, "") : ""

          if (currentSlug && w.slug && currentSlug !== w.slug && currentSlug !== "www") {
            // JWT is for a different workspace — need to switch
            import("./api").then(async ({ auth: authApi, setTokens: setTk }) => {
              try {
                const workspacesRes = await authApi.listWorkspaces()
                const target = workspacesRes.workspaces.find((ws: any) => ws.workspaceSlug === currentSlug)
                if (target) {
                  const switchRes = await authApi.switchWorkspace(target.workspaceId)
                  setTk(switchRes.accessToken, switchRes.refreshToken)
                  const newU = switchRes.user
                  const newW = switchRes.workspace
                  setUser({ id: newU.id, email: newU.email, name: newU.name, role: newU.role as any, avatarUrl: newU.avatarUrl })
                  setWorkspace({ id: newW.id, slug: newW.slug, name: newW.name })
                  localStorage.setItem(USER_KEY, JSON.stringify(newU))
                  localStorage.setItem(WORKSPACE_KEY, JSON.stringify(newW))
                  setCookie(USER_KEY, JSON.stringify(newU))
                  setCookie(WORKSPACE_KEY, JSON.stringify(newW))
                } else {
                  // No access to this workspace — redirect to login
                  clearTokens()
                  window.location.href = `https://${rootDomain}/login`
                }
              } catch {
                // Switch failed — redirect to login
                clearTokens()
                window.location.href = `https://${rootDomain}/login`
              } finally {
                setIsLoading(false)
              }
            })
            return // Don't setIsLoading(false) yet — async switch in progress
          }

          setUser(u)
          setWorkspace(w)
          if (!localStorage.getItem(USER_KEY)) localStorage.setItem(USER_KEY, storedUser)
          if (!localStorage.getItem(WORKSPACE_KEY)) localStorage.setItem(WORKSPACE_KEY, storedWorkspace)
        }
      } catch {
        clearTokens()
        deleteCookie(USER_KEY)
        deleteCookie(WORKSPACE_KEY)
        localStorage.removeItem(USER_KEY)
        localStorage.removeItem(WORKSPACE_KEY)
      }
    } else if (token === "demo-token") {
      clearTokens()
      deleteCookie(USER_KEY)
      deleteCookie(WORKSPACE_KEY)
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem(WORKSPACE_KEY)
    }
    setIsLoading(false)
  }, [])

  const handleAuthResponse = useCallback((res: AuthResponse) => {
    setTokens(res.accessToken, res.refreshToken)
    const u: AuthUser = {
      id: res.user.id,
      email: res.user.email,
      name: res.user.name,
      role: res.user.role,
      avatarUrl: res.user.avatarUrl ?? null,
    }
    const w: AuthWorkspace = {
      id: res.workspace.id,
      slug: res.workspace.slug,
      name: res.workspace.name,
    }
    setUser(u)
    setWorkspace(w)
    // Store in both localStorage and cookies (cookies share across subdomains)
    const uJson = JSON.stringify(u)
    const wJson = JSON.stringify(w)
    localStorage.setItem(USER_KEY, uJson)
    localStorage.setItem(WORKSPACE_KEY, wJson)
    setCookie(USER_KEY, uJson)
    setCookie(WORKSPACE_KEY, wJson)
  }, [])

  const navigateToWorkspace = useCallback((slug: string, onboardingComplete?: boolean) => {
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "replyma.com"
    const path = onboardingComplete ? "/inbox" : "/onboarding"
    if (typeof window !== "undefined" && window.location.hostname.includes(rootDomain)) {
      // Add from_login=1 so dashboard can skip one "redirect to login" and avoid redirect loop (sessionStorage is origin-specific and empty on subdomain)
      const fullPath = path + (path.includes("?") ? "&" : "?") + "from_login=1"
      window.location.href = `https://${slug}.${rootDomain}${fullPath}`
    } else {
      router.push(path)
    }
  }, [router])

  const login = useCallback(async (email: string, password: string): Promise<{ requiresOtp: boolean; email: string; requiresWorkspaceSelection?: boolean; sessionToken?: string; workspaces?: Array<{ workspaceId: string; workspaceName: string; workspaceSlug: string; role: string; userName: string }> }> => {
    const res = await authApi.login({ email, password }) as any
    if (res.requiresWorkspaceSelection && res.workspaces) {
      return { requiresOtp: false, email: res.email ?? email, requiresWorkspaceSelection: true, sessionToken: res.sessionToken, workspaces: res.workspaces }
    }
    if (res.accessToken && res.workspace) {
      handleAuthResponse(res)
      navigateToWorkspace(res.workspace.slug, res.onboardingComplete)
      return { requiresOtp: false, email }
    }
    return { requiresOtp: true, email: res.email ?? email }
  }, [handleAuthResponse, navigateToWorkspace])

  const redirectToAppIfAuthenticated = useCallback(() => {
    if (!user || !workspace) return
    loadTokens()
    const token = getAccessToken()
    if (!token || token === "demo-token") return
    if (typeof window !== "undefined") window.sessionStorage.setItem("replyma_from_login_redirect", "1")
    navigateToWorkspace(workspace.slug, true)
  }, [user, workspace, navigateToWorkspace, router])

  const reloadSessionFromStorage = useCallback(() => {
    loadTokens()
    const token = getAccessToken()
    if (!token || token === "demo-token") return
    try {
      const storedUser = localStorage.getItem(USER_KEY) || getCookie(USER_KEY)
      const storedWorkspace = localStorage.getItem(WORKSPACE_KEY) || getCookie(WORKSPACE_KEY)
      if (storedUser && storedWorkspace) {
        const u = JSON.parse(storedUser)
        const w = JSON.parse(storedWorkspace)
        setUser({ id: u.id, email: u.email, name: u.name, role: u.role, avatarUrl: u.avatarUrl ?? null })
        setWorkspace({ id: w.id, slug: w.slug, name: w.name })
        if (!localStorage.getItem(USER_KEY)) localStorage.setItem(USER_KEY, storedUser)
        if (!localStorage.getItem(WORKSPACE_KEY)) localStorage.setItem(WORKSPACE_KEY, storedWorkspace)
      }
    } catch {
      // Ignore parse errors
    }
  }, [])

  const verifyLoginOtp = useCallback(async (email: string, otp: string) => {
    const res = await authApi.verifyLoginOtp({ email, otp })
    // Multi-workspace: if user has multiple workspaces, return selection data
    if (res.requiresWorkspaceSelection && res.workspaces) {
      return { requiresWorkspaceSelection: true as const, sessionToken: res.sessionToken!, workspaces: res.workspaces }
    }
    // Single workspace: proceed as normal
    handleAuthResponse(res as any)
    navigateToWorkspace((res as any).workspace.slug, (res as any).onboardingComplete)
    return { requiresWorkspaceSelection: false as const }
  }, [handleAuthResponse, navigateToWorkspace])

  const selectWorkspace = useCallback(async (sessionToken: string, workspaceId: string) => {
    try {
      const res = await authApi.selectWorkspace({ sessionToken, workspaceId })
      handleAuthResponse(res)
      navigateToWorkspace(res.workspace.slug, res.onboardingComplete)
    } catch (err) {
      clearTokens()
      throw err
    }
  }, [handleAuthResponse, navigateToWorkspace])

  const googleAuth = useCallback(async (credential: string) => {
    try {
      const res = await authApi.googleAuth(credential) as any
      // Multi-workspace: return workspace selection data
      if (res.requiresWorkspaceSelection && res.workspaces) {
        return { requiresWorkspaceSelection: true as const, sessionToken: res.sessionToken!, workspaces: res.workspaces }
      }
      handleAuthResponse(res)
      navigateToWorkspace(res.workspace.slug, res.onboardingComplete)
      return { requiresWorkspaceSelection: false as const }
    } catch (err) {
      clearTokens()
      throw err
    }
  }, [handleAuthResponse, navigateToWorkspace])

  const register = useCallback(async (data: { email: string; password: string; name: string; workspaceName: string }) => {
    const res = await authApi.register(data) as any
    // Registration now requires OTP verification (same as login)
    if (res.requiresOtp) {
      return { requiresOtp: true as const, email: res.email as string }
    }
    // Fallback: if backend returns tokens directly (shouldn't happen but safe)
    handleAuthResponse(res)
    navigateToWorkspace(res.workspace.slug, false)
    return { requiresOtp: false as const }
  }, [handleAuthResponse, navigateToWorkspace])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // Ignore errors — we're logging out regardless
    }
    // Tell other subdomains/origins to purge local auth cache on next load.
    setCookie(LOGOUT_SYNC_KEY, "1", 1)
    clearTokens()
    setUser(null)
    setWorkspace(null)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(WORKSPACE_KEY)
    deleteCookie(USER_KEY)
    deleteCookie(WORKSPACE_KEY)
    // Redirect to main domain login
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "replyma.com"
    if (typeof window !== "undefined" && window.location.hostname !== rootDomain) {
      window.location.href = `https://${rootDomain}/login`
    } else {
      router.push("/login")
    }
  }, [router])

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return prev
      const next = { ...prev, ...updates }
      localStorage.setItem(USER_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const updateWorkspace = useCallback((updates: Partial<AuthWorkspace>) => {
    setWorkspace(prev => {
      if (!prev) return prev
      const next = { ...prev, ...updates }
      const wJson = JSON.stringify(next)
      localStorage.setItem(WORKSPACE_KEY, wJson)
      setCookie(WORKSPACE_KEY, wJson)
      return next
    })
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        workspace,
        isLoading,
        isAuthenticated: !!user,
        redirectToAppIfAuthenticated,
        reloadSessionFromStorage,
        login,
        verifyLoginOtp,
        selectWorkspace,
        googleAuth,
        register,
        logout,
        updateUser,
        updateWorkspace,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
