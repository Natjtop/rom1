"use client"

import { useState, useMemo, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { auth } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ApiRequestError } from "@/lib/api"
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const ease = [0.23, 1, 0.32, 1] as const

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease },
  },
}

const fieldVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease, delay: 0.15 + i * 0.06 },
  }),
}

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: "", color: "bg-muted" }

  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { score: 1, label: "Weak", color: "bg-red-500" }
  if (score <= 2) return { score: 2, label: "Fair", color: "bg-orange-500" }
  if (score <= 3) return { score: 3, label: "Good", color: "bg-amber-500" }
  if (score === 4) return { score: 4, label: "Strong", color: "bg-emerald-500" }
  return { score: 5, label: "Very strong", color: "bg-emerald-500" }
}

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const strength = useMemo(() => getPasswordStrength(password), [password])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password !== confirm) {
      setError("Passwords do not match")
      return
    }

    if (!token) {
      setError("Invalid reset link")
      return
    }

    setLoading(true)

    try {
      await auth.resetPassword(token, password)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password. Please try again.")
    }
    setLoading(false)
  }

  return (
    <motion.div
      className="rounded-xl border border-border/60 bg-card/95 p-4 sm:p-6 shadow-xl shadow-black/5 backdrop-blur-sm"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            className="text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease }}
          >
            <motion.div
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
            >
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </motion.div>
            <motion.h1
              className="text-[20px] font-semibold text-foreground"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease, delay: 0.2 }}
            >
              Password reset
            </motion.h1>
            <motion.p
              className="mt-2 text-[13px] text-muted-foreground"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease, delay: 0.28 }}
            >
              Your password has been successfully reset.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, ease, delay: 0.36 }}
            >
              <Link
                href="/login"
                className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-accent hover:text-accent/80 transition-colors"
              >
                Sign in with your new password
              </Link>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease }}
          >
            <motion.div
              className="mb-6 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease, delay: 0.08 }}
            >
              <h1 className="text-[20px] font-semibold text-foreground">Set new password</h1>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Enter your new password below
              </p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="sync">
                {error && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: "auto", marginBottom: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.25, ease }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-600">
                      {error}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                className="space-y-1.5"
                variants={fieldVariants}
                initial="hidden"
                animate="visible"
                custom={0}
              >
                <Label htmlFor="password" className="text-[14px] sm:text-[13px] font-medium">New password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  minLength={8}
                  autoFocus
                  className="h-12 sm:h-9 rounded-xl sm:rounded-lg text-[16px] sm:text-[14px]"
                />
                {/* Password strength indicator */}
                {password.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                            level <= strength.score ? strength.color : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-[11px] transition-colors duration-200 ${
                      strength.score <= 1
                        ? "text-red-500"
                        : strength.score <= 2
                          ? "text-orange-500"
                          : strength.score <= 3
                            ? "text-amber-500"
                            : "text-emerald-500"
                    }`}>
                      {strength.label}
                    </p>
                  </div>
                )}
              </motion.div>

              <motion.div
                className="space-y-1.5"
                variants={fieldVariants}
                initial="hidden"
                animate="visible"
                custom={1}
              >
                <Label htmlFor="confirm" className="text-[14px] sm:text-[13px] font-medium">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="Repeat your password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  minLength={8}
                  className="h-12 sm:h-9 rounded-xl sm:rounded-lg text-[16px] sm:text-[14px]"
                />
                {confirm.length > 0 && password !== confirm && (
                  <p className="text-[11px] text-red-500 pt-0.5">
                    Passwords do not match
                  </p>
                )}
              </motion.div>

              <motion.div
                variants={fieldVariants}
                initial="hidden"
                animate="visible"
                custom={2}
              >
                <Button type="submit" className="w-full h-12 sm:h-9 rounded-xl sm:rounded-lg text-[15px] sm:text-sm font-semibold touch-manipulation" disabled={loading || (confirm.length > 0 && password !== confirm)}>
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Reset password"}
                </Button>
              </motion.div>
            </form>

            <motion.p
              className="mt-4 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, ease, delay: 0.4 }}
            >
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent hover:text-accent/80 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to sign in
              </Link>
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="rounded-xl border border-border/60 bg-card/95 p-4 sm:p-6 shadow-xl shadow-black/5 backdrop-blur-sm text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
