"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ApiRequestError } from "@/lib/api"
import { Loader2, Check, ShieldCheck, ArrowLeft, CheckCircle2 } from "lucide-react"

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""

const GOOGLE_SVG = (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

function GoogleButton({ onSuccess, disabled }: { onSuccess: (credential: string) => void; disabled?: boolean }) {
  const clientRef = useRef<{ requestAccessToken: () => void } | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    const init = () => {
      const g = (window as unknown as Record<string, unknown>).google as {
        accounts?: { oauth2?: { initTokenClient: (c: unknown) => { requestAccessToken: () => void } } }
      } | undefined
      if (g?.accounts?.oauth2) {
        clientRef.current = g.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: "email profile",
          callback: (tokenResponse: { access_token?: string; error?: string }) => {
            if (tokenResponse.access_token) onSuccess(tokenResponse.access_token)
          },
        })
        setReady(true)
      }
    }
    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]')
    if (existing) {
      if ((window as unknown as Record<string, unknown>).google) init()
      else existing.addEventListener("load", init)
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
      Sign up with Google
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

export default function RegisterPage() {
  const { user, workspace, isLoading, redirectToAppIfAuthenticated, register, googleAuth, verifyLoginOtp } = useAuth()
  const searchParams = useSearchParams()
  const shopifySetupCode = searchParams.get("shopify")
  const isShopifySetup = !!shopifySetupCode

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [workspaceName, setWorkspaceName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [step, setStep] = useState<"form" | "otp">("form")
  const [otpEmail, setOtpEmail] = useState("")
  const [otp, setOtp] = useState("")
  const otpRef = useRef<HTMLInputElement>(null)

  const hasRedirectedRef = useRef(false)

  // If already authenticated, redirect to app once (avoids double redirect / loop when effect re-runs after user/workspace update)
  useEffect(() => {
    if (isLoading || hasRedirectedRef.current) return
    if (user && workspace) {
      hasRedirectedRef.current = true
      redirectToAppIfAuthenticated()
    }
  }, [isLoading, user, workspace, redirectToAppIfAuthenticated])

  const passwordOk = password.length >= 8

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!agreedToTerms) { setError("Please agree to the Terms of Service and Privacy Policy."); return }
    setLoading(true)
    try {
      if (isShopifySetup) {
        // Shopify install flow — complete setup with real email + password
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"
        const res = await fetch(`${API_URL}/shopify/complete-setup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ setupCode: shopifySetupCode, email, password, name }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || "Setup failed")
        // Auto-login with returned tokens
        const { setTokens } = await import("@/lib/api")
        setTokens(data.accessToken, data.refreshToken)
        localStorage.setItem("replyma_user", JSON.stringify(data.user))
        localStorage.setItem("replyma_workspace", JSON.stringify(data.workspace))
        // Redirect to workspace onboarding
        const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "replyma.com"
        const authPayload = encodeURIComponent(JSON.stringify(data))
        window.location.href = `https://${data.workspace.slug}.${rootDomain}/onboarding#auth=${authPayload}`
        return
      }
      // Normal registration flow
      const result = await register({ email, password, name, workspaceName: workspaceName || name })
      if (result?.requiresOtp) {
        setOtpEmail(result.email)
        setStep("otp")
        setLoading(false)
        setTimeout(() => otpRef.current?.focus(), 100)
      }
    } catch (err: any) {
      setError(err instanceof ApiRequestError ? err.message : err?.message || "Something went wrong. Please try again.")
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
      if (result.requiresWorkspaceSelection) {
        // Shouldn't happen for new registration (only 1 workspace), but handle gracefully
      }
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Invalid code. Please try again.")
      setLoading(false)
      setOtp("")
    }
  }

  const handleGoogleSuccess = useCallback(async (credential: string) => {
    setError("")
    setLoading(true)
    try {
      await googleAuth(credential)
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Google sign-up failed. Please try again.")
      setLoading(false)
    }
  }, [googleAuth])

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

  // OTP verification step
  if (step === "otp") {
    return (
      <div className="rounded-2xl sm:rounded-xl border-0 sm:border sm:border-border/60 bg-background sm:bg-card/95 p-0 sm:p-6 sm:shadow-xl sm:shadow-black/5 sm:backdrop-blur-sm">
        <button onClick={() => { setStep("form"); setOtp(""); setError("") }} className="mb-4 flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors min-h-[44px] touch-manipulation">
          <ArrowLeft className="h-4 w-4" />Back
        </button>
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground/5">
            <ShieldCheck className="h-7 w-7 text-foreground/70" />
          </div>
          <h1 className="text-[22px] sm:text-[20px] font-semibold text-foreground tracking-tight">Verify your email</h1>
          <p className="mt-2 text-[14px] sm:text-[13px] text-muted-foreground leading-relaxed">
            We sent a 6-digit code to<br /><span className="font-medium text-foreground">{otpEmail}</span>
          </p>
        </div>
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          {error && <div className="rounded-xl sm:rounded-lg border border-red-200 bg-red-50 px-4 py-3 sm:px-3 sm:py-2 text-[14px] sm:text-[13px] text-red-600">{error}</div>}
          <div className="space-y-2">
            <Label htmlFor="otp" className="text-[14px] sm:text-[13px] font-medium">Verification code</Label>
            <Input ref={otpRef} id="otp" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} placeholder="000000" value={otp} onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 6); setOtp(v); }} className="h-14 sm:h-12 rounded-xl sm:rounded-lg text-center text-[24px] sm:text-[20px] font-semibold tracking-[0.3em] font-mono" autoComplete="one-time-code" />
          </div>
          <Button type="submit" className="w-full h-12 sm:h-9 rounded-xl sm:rounded-lg text-[15px] sm:text-sm font-semibold" disabled={loading || otp.length !== 6}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & create account"}
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className="rounded-2xl sm:rounded-xl border-0 sm:border sm:border-border/60 bg-background sm:bg-card/95 p-0 sm:p-6 sm:shadow-xl sm:shadow-black/5 sm:backdrop-blur-sm">
      <div className="mb-6 text-center">
        <h1 className="text-[24px] sm:text-[20px] font-semibold text-foreground tracking-tight">{isShopifySetup ? "Complete your setup" : "Start your free trial"}</h1>
        <p className="mt-1.5 text-[14px] sm:text-[13px] text-muted-foreground">
          {isShopifySetup ? "Shopify store connected! Set your email and password to continue." : "3 days free \u00b7 No credit card required"}
        </p>
        {isShopifySetup && (
          <>
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> Shopify store connected
            </div>
            <p className="mt-2 text-[12px] text-muted-foreground">
              Already have a Replyma account? Enter the same email below — your store will be linked to your existing workspace.
            </p>
          </>
        )}
      </div>

      {/* Google Sign-Up */}
      <GoogleButton onSuccess={handleGoogleSuccess} disabled={loading} />
      {GOOGLE_CLIENT_ID && <Divider />}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-3.5">
        {error && (
          <div className="rounded-xl sm:rounded-lg border border-red-200 bg-red-50 px-4 py-3 sm:px-3 sm:py-2 text-[14px] sm:text-[13px] text-red-600 animate-in fade-in duration-200">{error}</div>
        )}

        <div className="space-y-2">
          <Label htmlFor="name" className="text-[14px] sm:text-[13px] font-medium">Full name</Label>
          <Input id="name" type="text" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" className="h-12 sm:h-9 rounded-xl sm:rounded-lg text-[16px] sm:text-[14px]" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-[14px] sm:text-[13px] font-medium">Work email</Label>
          <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="h-12 sm:h-9 rounded-xl sm:rounded-lg text-[16px] sm:text-[14px]" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="workspace" className="text-[14px] sm:text-[13px] font-medium">Company name</Label>
          <Input id="workspace" type="text" placeholder="Lumina Skincare" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} required className="h-12 sm:h-9 rounded-xl sm:rounded-lg text-[16px] sm:text-[14px]" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-[14px] sm:text-[13px] font-medium">Password</Label>
          <Input id="password" type="password" placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" minLength={8} className="h-12 sm:h-9 rounded-xl sm:rounded-lg text-[16px] sm:text-[14px]" />
          <div className="flex items-center gap-1.5 pt-0.5">
            <div className={`flex h-4 w-4 items-center justify-center rounded-full transition-colors duration-200 ${passwordOk ? "bg-emerald-500" : "bg-muted"}`}>
              {passwordOk && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
            </div>
            <span className={`text-[13px] sm:text-[11px] transition-colors duration-200 ${passwordOk ? "text-emerald-600" : "text-muted-foreground"}`}>8+ characters</span>
          </div>
        </div>

        {/* Terms checkbox */}
        <label className="flex items-start gap-3 cursor-pointer min-h-[44px] touch-manipulation">
          <span className="relative mt-0.5 flex shrink-0">
            <input type="checkbox" checked={agreedToTerms} onChange={() => setAgreedToTerms(!agreedToTerms)} className="peer sr-only" />
            <span className={`flex h-6 w-6 sm:h-5 sm:w-5 items-center justify-center rounded-lg sm:rounded border-2 transition-colors duration-150 ${
              agreedToTerms ? "border-foreground bg-foreground text-background" : "border-border bg-background"
            }`}>
              {agreedToTerms && <Check className="h-3.5 w-3.5 sm:h-3 sm:w-3" strokeWidth={3} />}
            </span>
          </span>
          <span className="text-[13px] sm:text-[12px] leading-relaxed text-muted-foreground pt-0.5">
            I agree to the{" "}
            <Link href="/terms" className="font-medium text-foreground underline underline-offset-2" onClick={(e) => e.stopPropagation()}>Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" className="font-medium text-foreground underline underline-offset-2" onClick={(e) => e.stopPropagation()}>Privacy Policy</Link>
          </span>
        </label>

        <div className="pt-2 sm:pt-1">
          <Button type="submit" className="w-full h-12 sm:h-9 rounded-xl sm:rounded-lg text-[15px] sm:text-sm font-semibold touch-manipulation" disabled={loading}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create account"}
          </Button>
        </div>
      </form>

      <p className="mt-6 sm:mt-4 text-center text-[14px] sm:text-[13px] text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-foreground hover:text-foreground/80 transition-colors touch-manipulation">Sign in</Link>
      </p>
    </div>
  )
}
