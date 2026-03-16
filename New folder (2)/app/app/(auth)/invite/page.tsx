"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { team as teamApi } from "@/lib/api"
import { ApiRequestError, setTokens } from "@/lib/api"
import { Loader2, UserPlus, CheckCircle2 } from "lucide-react"

// Cookie helper — must match auth-context.tsx domain logic
function setInviteCookie(name: string, value: string) {
  const rootDomain = typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_ROOT_DOMAIN || window.location.hostname.split(".").slice(-2).join("."))
    : "replyma.com"
  const expires = new Date(Date.now() + 30 * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; domain=.${rootDomain}; SameSite=Lax; Secure`
}

function InviteForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""
  const isAutoLogin = searchParams.get("auto") === "1"
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState<{ workspace: string; slug: string } | null>(null)

  // Auto-login: existing user clicking invite link → accept immediately without password
  useEffect(() => {
    if (!isAutoLogin || !token) return
    let cancelled = false
    setLoading(true)
    teamApi.acceptInvite({ token, password: undefined as any })
      .then((res) => {
        if (cancelled) return
        setTokens(res.accessToken, res.refreshToken)
        const userJson = JSON.stringify(res.user)
        const wsJson = JSON.stringify(res.workspace)
        localStorage.setItem("replyma_user", userJson)
        localStorage.setItem("replyma_workspace", wsJson)
        setInviteCookie("replyma_user", userJson)
        setInviteCookie("replyma_workspace", wsJson)
        setSuccess({ workspace: res.workspace.name, slug: res.workspace.slug })
        const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "replyma.com"
        const authPayload = encodeURIComponent(JSON.stringify({
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
          user: res.user,
          workspace: res.workspace,
        }))
        setTimeout(() => {
          window.location.href = `https://${res.workspace.slug}.${rootDomain}/inbox#auth=${authPayload}`
        }, 1000)
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false)
          setError("This invite link has expired. Please sign in to access your workspace.")
        }
      })
    return () => { cancelled = true }
  }, [isAutoLogin, token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) { setError("Invalid invite link"); return }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return }
    setError("")
    setLoading(true)
    try {
      const res = await teamApi.acceptInvite({ token, password, name: name || undefined })
      // Save tokens to cookies (cross-subdomain) AND localStorage
      setTokens(res.accessToken, res.refreshToken)
      // Save user + workspace to BOTH localStorage AND cookies
      // This is critical: redirect goes to a different subdomain where localStorage is empty
      const userJson = JSON.stringify(res.user)
      const wsJson = JSON.stringify(res.workspace)
      localStorage.setItem("replyma_user", userJson)
      localStorage.setItem("replyma_workspace", wsJson)
      setInviteCookie("replyma_user", userJson)
      setInviteCookie("replyma_workspace", wsJson)

      setSuccess({ workspace: res.workspace.name, slug: res.workspace.slug })
      // Pass auth via URL hash fragment — cookies unreliable across subdomains with Cloudflare
      const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "replyma.com"
      const authPayload = encodeURIComponent(JSON.stringify({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        user: res.user,
        workspace: res.workspace,
      }))
      setTimeout(() => {
        window.location.href = `https://${res.workspace.slug}.${rootDomain}/inbox#auth=${authPayload}`
      }, 1500)
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Invalid or expired invite link")
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="rounded-2xl sm:rounded-xl border-0 sm:border sm:border-border/60 bg-background sm:bg-card/95 p-6 sm:shadow-xl sm:shadow-black/5 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 sm:h-12 sm:w-12 items-center justify-center rounded-2xl sm:rounded-xl bg-red-500/10">
          <UserPlus className="h-7 w-7 sm:h-6 sm:w-6 text-red-500" />
        </div>
        <h1 className="text-[22px] sm:text-[20px] font-semibold text-foreground tracking-tight">Invalid invite link</h1>
        <p className="mt-2 text-[14px] sm:text-[13px] text-muted-foreground">This link is invalid or has expired. Please ask your team admin for a new invitation.</p>
      </div>
    )
  }

  if (success) {
    return (
      <div className="rounded-2xl sm:rounded-xl border-0 sm:border sm:border-border/60 bg-background sm:bg-card/95 p-0 sm:p-6 sm:shadow-xl sm:shadow-black/5 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 sm:h-12 sm:w-12 items-center justify-center rounded-2xl sm:rounded-xl bg-emerald-500/10">
          <CheckCircle2 className="h-7 w-7 sm:h-6 sm:w-6 text-emerald-500" />
        </div>
        <h1 className="text-[22px] sm:text-[20px] font-semibold text-foreground tracking-tight">Welcome aboard!</h1>
        <p className="mt-2 text-[14px] sm:text-[13px] text-muted-foreground">
          You've joined <strong>{success.workspace}</strong>. Redirecting to your dashboard...
        </p>
        <Loader2 className="mx-auto mt-4 h-5 w-5 animate-spin text-muted-foreground/50" />
      </div>
    )
  }

  return (
    <div className="rounded-2xl sm:rounded-xl border-0 sm:border sm:border-border/60 bg-background sm:bg-card/95 p-0 sm:p-6 sm:shadow-xl sm:shadow-black/5">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 sm:h-12 sm:w-12 items-center justify-center rounded-2xl sm:rounded-xl bg-accent/10">
          <UserPlus className="h-7 w-7 sm:h-6 sm:w-6 text-accent" />
        </div>
        <h1 className="text-[22px] sm:text-[20px] font-semibold text-foreground tracking-tight">Join your team</h1>
        <p className="mt-1.5 text-[14px] sm:text-[13px] text-muted-foreground">Set your password to accept the invitation</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="rounded-xl sm:rounded-lg border border-red-200 bg-red-50 px-4 py-3 sm:px-3 sm:py-2 text-[14px] sm:text-[13px] text-red-600">{error}</div>}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-[14px] sm:text-[13px] font-medium">Your name (optional)</Label>
          <Input id="name" type="text" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="h-12 sm:h-9 rounded-xl sm:rounded-lg text-[16px] sm:text-[14px]" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-[14px] sm:text-[13px] font-medium">Password</Label>
          <Input id="password" type="password" placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" className="h-12 sm:h-9 rounded-xl sm:rounded-lg text-[16px] sm:text-[14px]" />
        </div>
        <div className="pt-2 sm:pt-1">
          <Button type="submit" className="w-full h-12 sm:h-9 rounded-xl sm:rounded-lg text-[15px] sm:text-sm font-semibold touch-manipulation" disabled={loading}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Accept invitation"}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default function InvitePage() {
  return (
    <Suspense fallback={<div className="rounded-xl border border-border/60 bg-card/95 p-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <InviteForm />
    </Suspense>
  )
}
