"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/api"
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react"

function VerifyEmailForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token) { setStatus("error"); setError("Missing verification token"); return }

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"
    fetch(`${API_BASE}/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).then(async (res) => {
      if (res.ok) { setStatus("success") }
      else {
        const data = await res.json().catch(() => ({ message: "Verification failed" }))
        setError(data.message || "Invalid or expired verification link")
        setStatus("error")
      }
    }).catch(() => { setError("Unable to connect to server"); setStatus("error") })
  }, [token])

  if (status === "loading") {
    return (
      <div className="rounded-xl border border-border/60 bg-card/95 p-8 text-center shadow-xl shadow-black/5">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-3 text-[14px] text-muted-foreground">Verifying your email...</p>
      </div>
    )
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-border/60 bg-card/95 p-8 text-center shadow-xl shadow-black/5">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="h-7 w-7 text-emerald-500" />
        </div>
        <h1 className="text-[20px] font-semibold text-foreground">Email verified</h1>
        <p className="mt-2 text-[13px] text-muted-foreground">Your email has been verified successfully.</p>
        <Link href="/inbox" className="mt-6 inline-flex items-center gap-2 text-[13px] font-medium text-accent hover:text-accent/80 transition-colors">
          Go to dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card/95 p-8 text-center shadow-xl shadow-black/5">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
        <AlertTriangle className="h-7 w-7 text-red-500" />
      </div>
      <h1 className="text-[20px] font-semibold text-foreground">Verification failed</h1>
      <p className="mt-2 text-[13px] text-muted-foreground">{error}</p>
      <Link href="/login" className="mt-6 inline-flex items-center gap-2 text-[13px] font-medium text-accent hover:text-accent/80 transition-colors">
        Back to sign in
      </Link>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="rounded-xl border border-border/60 bg-card/95 p-8 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <VerifyEmailForm />
    </Suspense>
  )
}
