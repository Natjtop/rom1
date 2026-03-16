"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ApiRequestError } from "@/lib/api"
import { Loader2, Mail, ArrowLeft, ShieldCheck } from "lucide-react"

type Step = "credentials" | "otp" | "workspace"

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""

const GOOGLE_SVG = (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

/**
 * Google OAuth button — opens a popup window for Google sign-in.
 * Uses google.accounts.oauth2.initTokenClient (implicit flow).
 * The popup is a real browser window, not a dropdown.
 */
function GoogleButton({ onSuccess, disabled, text = "Continue with Google" }: { onSuccess: (credential: string) => void; disabled?: boolean; text?: string }) {
  const clientRef = useRef<{ requestAccessToken: () => void } | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return

    const init = () => {
      const g = (window as unknown as Record<string, unknown>).google as {
        accounts?: {
          id?: { initialize: (c: unknown) => void }
          oauth2?: { initTokenClient: (c: unknown) => { requestAccessToken: () => void } }
        }
      } | undefined

      // Initialize ID service for credential callback
      if (g?.accounts?.id) {
        g.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: { credential: string }) => onSuccess(response.credential),
        })
      }

      // Initialize OAuth2 token client for popup flow
      if (g?.accounts?.oauth2) {
        clientRef.current = g.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: "email profile",
          callback: async (tokenResponse: { access_token?: string; error?: string }) => {
            if (tokenResponse.error || !tokenResponse.access_token) return
            // Exchange Google access token for user info, then create ID token-like credential
            // We send the access_token to our backend which will verify it with Google
            onSuccess(tokenResponse.access_token)
          },
        })
        setReady(true)
      }
    }

    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]')
    if (existing) {
      // Script loaded but might not be initialized yet
      if ((window as unknown as Record<string, unknown>).google) { init() }
      else { existing.addEventListener("load", init) }
      return
    }

    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.onload = init
    document.head.appendChild(script)
  }, [onSuccess])

  if (!GOOGLE_CLIENT_ID) return null

  return (
    <button
      type="button"
      onClick={() => clientRef.current?.requestAccessToken()}
      disabled={disabled || !ready}
      className="flex w-full h-12 sm:h-10 items-center justify-center gap-3 rounded-xl sm:rounded-lg border border-border bg-background text-[15px] sm:text-[14px] font-medium text-foreground transition-colors hover:bg-secondary/60 disabled:opacity-50 touch-manipulation"
    >
      {GOOGLE_SVG}
      {text}
    </button>
  )
}

function Divider() {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-border" />
      <span className="text-[12px] text-muted-foreground/60 select-none">or</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

export default function LoginPage() {
  const { user, workspace, isLoading, redirectToAppIfAuthenticated, login, verifyLoginOtp, selectWorkspace, googleAuth } = useAuth()
  const params = useSearchParams()
  const welcomeWorkspace = params.get("welcome")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<Step>("credentials")
  const [otpEmail, setOtpEmail] = useState("")
  const [resendCooldown, setResendCooldown] = useState(0)
  const [wsSessionToken, setWsSessionToken] = useState("")
  const [workspaces, setWorkspaces] = useState<Array<{ workspaceId: string; workspaceName: string; workspaceSlug: string; role: string; userName: string }>>([])
  const otpInputRef = useRef<HTMLInputElement>(null)
  const hasRedirectedRef = useRef(false)

  // If already authenticated, redirect to app once (avoids double redirect / loop when effect re-runs after user/workspace update)
  useEffect(() => {
    if (isLoading || hasRedirectedRef.current) return
    if (user && workspace) {
      hasRedirectedRef.current = true
      redirectToAppIfAuthenticated()
    }
  }, [isLoading, user, workspace, redirectToAppIfAuthenticated])

  useEffect(() => {
    if (step === "otp") setTimeout(() => otpInputRef.current?.focus(), 100)
  }, [step])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearInterval(t)
  }, [resendCooldown])

  async function handleSubmitCredentials(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await login(email, password)
      setOtpEmail(res.email)
      if (res.requiresWorkspaceSelection && res.workspaces && res.sessionToken) {
        setWsSessionToken(res.sessionToken)
        setWorkspaces(res.workspaces)
        setStep("workspace")
      } else if (res.requiresOtp) {
        setStep("otp")
        setResendCooldown(60)
      }
      // else: tokens issued and auth context already redirected
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length !== 6) return
    setError("")
    setLoading(true)
    try {
      const result = await verifyLoginOtp(otpEmail, otp)
      if (result.requiresWorkspaceSelection && result.workspaces) {
        setWsSessionToken(result.sessionToken!)
        setWorkspaces(result.workspaces)
        setStep("workspace")
        setLoading(false)
      }
      // else: single workspace — auth context already handles redirect
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Invalid code. Please try again.")
      setLoading(false)
      setOtp("")
    }
  }

  async function handleSelectWorkspace(workspaceId: string) {
    setError("")
    setLoading(true)
    try {
      await selectWorkspace(wsSessionToken, workspaceId)
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to select workspace")
      setLoading(false)
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return
    setError("")
    setLoading(true)
    try {
      await login(email, password)
      setResendCooldown(60)
    } catch { setError("Failed to resend code.") }
    finally { setLoading(false) }
  }

  const handleGoogleSuccess = useCallback(async (credential: string) => {
    setError("")
    setLoading(true)
    try {
      const result = await googleAuth(credential) as any
      if (result?.requiresWorkspaceSelection && result?.workspaces) {
        setWsSessionToken(result.sessionToken)
        setWorkspaces(result.workspaces)
        setStep("workspace")
        setLoading(false)
      }
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Google sign-in failed. Please try again.")
      setLoading(false)
    }
  }, [googleAuth])

  const handleOtpChange = useCallback((value: string) => {
    setOtp(value.replace(/\D/g, "").slice(0, 6))
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl sm:rounded-xl border-0 sm:border sm:border-border/60 bg-background sm:bg-card/95 p-8 sm:p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-[14px] text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (user && workspace) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl sm:rounded-xl border-0 sm:border sm:border-border/60 bg-background sm:bg-card/95 p-8 sm:p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-[14px] text-muted-foreground">Signing you in...</p>
      </div>
    )
  }

  // ─── Workspace Selection Step ───
  if (step === "workspace") {
    const roleBadge: Record<string, { label: string; className: string }> = {
      ADMIN: { label: "Admin", className: "bg-foreground/5 text-foreground/80" },
      AGENT: { label: "Agent", className: "bg-blue-500/10 text-blue-600" },
      VIEWER: { label: "Viewer", className: "bg-emerald-500/10 text-emerald-600" },
    }
    return (
      <div className="rounded-2xl sm:rounded-xl border-0 sm:border sm:border-border/60 bg-background sm:bg-card/95 p-0 sm:p-6 sm:shadow-xl sm:shadow-black/5 sm:backdrop-blur-sm">
        <div className="mb-6 text-center">
          <h1 className="text-[22px] sm:text-[20px] font-semibold text-foreground tracking-tight">Choose workspace</h1>
          <p className="mt-1.5 text-[14px] sm:text-[13px] text-muted-foreground">You have access to multiple workspaces</p>
        </div>
        {error && (
          <div className="mb-4 rounded-xl sm:rounded-lg border border-red-200 bg-red-50 px-4 py-3 sm:px-3 sm:py-2 text-[14px] sm:text-[13px] text-red-600">{error}</div>
        )}
        <div className="flex flex-col gap-2">
          {workspaces.map((ws) => {
            const badge = roleBadge[ws.role] ?? roleBadge.AGENT
            return (
              <button
                key={ws.workspaceId}
                onClick={() => handleSelectWorkspace(ws.workspaceId)}
                disabled={loading}
                className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4 text-left transition-all hover:border-accent/30 hover:shadow-sm active:bg-secondary/50 disabled:opacity-50 touch-manipulation"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-[14px] font-semibold text-accent">
                  {ws.workspaceName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] sm:text-[13px] font-medium text-foreground">{ws.workspaceName}</p>
                  <p className="text-[12px] sm:text-[11px] text-muted-foreground">{ws.workspaceSlug}.replyma.com</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}>
                  {badge.label}
                </span>
              </button>
            )
          })}
        </div>
        {loading && <div className="mt-4 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}
      </div>
    )
  }

  // ─── OTP Step ───
  if (step === "otp") {
    return (
      <div className="rounded-2xl sm:rounded-xl border-0 sm:border sm:border-border/60 bg-background sm:bg-card/95 p-0 sm:p-6 sm:shadow-xl sm:shadow-black/5 sm:backdrop-blur-sm">
        <button
          onClick={() => { setStep("credentials"); setOtp(""); setError("") }}
          className="mb-4 flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors min-h-[44px] touch-manipulation"
        >
          <ArrowLeft className="h-4 w-4" />Back
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground/5">
            <ShieldCheck className="h-7 w-7 text-foreground/70" />
          </div>
          <h1 className="text-[22px] sm:text-[20px] font-semibold text-foreground tracking-tight">Check your email</h1>
          <p className="mt-2 text-[14px] sm:text-[13px] text-muted-foreground leading-relaxed">
            We sent a 6-digit code to<br />
            <span className="font-medium text-foreground">{otpEmail}</span>
          </p>
        </div>

        <form onSubmit={handleVerifyOtp} className="space-y-4">
          {error && (
            <div className="rounded-xl sm:rounded-lg border border-red-200 bg-red-50 px-4 py-3 sm:px-3 sm:py-2 text-[14px] sm:text-[13px] text-red-600 animate-in fade-in duration-200">{error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="otp" className="text-[14px] sm:text-[13px] font-medium">Verification code</Label>
            <Input
              ref={otpInputRef} id="otp" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6}
              placeholder="000000" value={otp} onChange={(e) => handleOtpChange(e.target.value)}
              className="h-14 sm:h-12 rounded-xl sm:rounded-lg text-center text-[24px] sm:text-[20px] font-semibold tracking-[0.3em] font-mono"
              autoComplete="one-time-code"
            />
          </div>
          <Button type="submit" className="w-full h-12 sm:h-9 rounded-xl sm:rounded-lg text-[15px] sm:text-sm font-semibold touch-manipulation" disabled={loading || otp.length !== 6}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & sign in"}
          </Button>
        </form>

        <div className="mt-5 text-center">
          {resendCooldown > 0 ? (
            <p className="text-[13px] text-muted-foreground">Resend code in <span className="font-medium text-foreground tabular-nums">{resendCooldown}s</span></p>
          ) : (
            <button onClick={handleResend} disabled={loading} className="text-[13px] font-medium text-foreground hover:text-foreground/80 transition-colors touch-manipulation disabled:opacity-50">Resend code</button>
          )}
        </div>
      </div>
    )
  }

  // ─── Credentials Step ───
  return (
    <div className="rounded-2xl sm:rounded-xl border-0 sm:border sm:border-border/60 bg-background sm:bg-card/95 p-0 sm:p-6 sm:shadow-xl sm:shadow-black/5 sm:backdrop-blur-sm">
      <div className="mb-6 text-center">
        <h1 className="text-[24px] sm:text-[20px] font-semibold text-foreground tracking-tight">Welcome back</h1>
        <p className="mt-1.5 text-[14px] sm:text-[13px] text-muted-foreground">Sign in to your account</p>
        {welcomeWorkspace && (
          <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-700">
            You've joined <strong>{welcomeWorkspace}</strong>! Sign in to access your workspace.
          </div>
        )}
      </div>

      {/* Google Sign-In */}
      <GoogleButton onSuccess={handleGoogleSuccess} disabled={loading} />
      {GOOGLE_CLIENT_ID && <Divider />}

      <form onSubmit={handleSubmitCredentials} className="space-y-4">
        {error && (
          <div className="rounded-xl sm:rounded-lg border border-red-200 bg-red-50 px-4 py-3 sm:px-3 sm:py-2 text-[14px] sm:text-[13px] text-red-600 animate-in fade-in duration-200">{error}</div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-[14px] sm:text-[13px] font-medium">Email</Label>
          <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="h-12 sm:h-9 rounded-xl sm:rounded-lg text-[16px] sm:text-[14px]" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-[14px] sm:text-[13px] font-medium">Password</Label>
            <Link href="/forgot-password" className="text-[13px] sm:text-[12px] text-muted-foreground hover:text-foreground transition-colors min-h-[44px] sm:min-h-0 flex items-center touch-manipulation">Forgot password?</Link>
          </div>
          <Input id="password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" minLength={8} className="h-12 sm:h-9 rounded-xl sm:rounded-lg text-[16px] sm:text-[14px]" />
        </div>
        <div className="pt-2 sm:pt-1">
          <Button type="submit" className="w-full h-12 sm:h-9 rounded-xl sm:rounded-lg text-[15px] sm:text-sm font-semibold touch-manipulation" disabled={loading}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="flex items-center gap-2"><Mail className="h-4 w-4" />Continue</span>}
          </Button>
        </div>
      </form>

      <p className="mt-6 sm:mt-4 text-center text-[14px] sm:text-[13px] text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-foreground hover:text-foreground/80 transition-colors touch-manipulation">Start free trial</Link>
      </p>
    </div>
  )
}
