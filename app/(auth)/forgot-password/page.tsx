"use client"

import { useState } from "react"
import Link from "next/link"
import { auth } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, Mail } from "lucide-react"
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await auth.forgotPassword(email)
    } catch (err) {
      console.error("Forgot password request failed:", err)
    }
    // Always show success to prevent email enumeration
    setSent(true)
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
        {sent ? (
          <motion.div
            key="success"
            className="text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease }}
          >
            <motion.div
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
            >
              <Mail className="h-6 w-6 text-accent" />
            </motion.div>
            <motion.h1
              className="text-[20px] font-semibold text-foreground"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease, delay: 0.2 }}
            >
              Check your email
            </motion.h1>
            <motion.p
              className="mt-2 text-[13px] text-muted-foreground"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease, delay: 0.28 }}
            >
              If an account exists for <span className="font-medium text-foreground">{email}</span>,
              we&apos;ve sent a password reset link.
            </motion.p>
            <motion.p
              className="mt-1.5 text-[12px] text-muted-foreground/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, ease, delay: 0.34 }}
            >
              Check your spam folder if you don&apos;t see it within a few minutes.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, ease, delay: 0.4 }}
            >
              <Link
                href="/login"
                className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-accent hover:text-accent/80 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to sign in
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
              <h1 className="text-[20px] font-semibold text-foreground">Reset your password</h1>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Enter your email and we&apos;ll send you a reset link
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
                <Label htmlFor="email" className="text-[14px] sm:text-[13px] font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                  className="h-12 sm:h-9 rounded-xl sm:rounded-lg text-[16px] sm:text-[14px]"
                />
              </motion.div>

              <motion.div
                variants={fieldVariants}
                initial="hidden"
                animate="visible"
                custom={1}
              >
                <Button type="submit" className="w-full h-12 sm:h-9 rounded-xl sm:rounded-lg text-[15px] sm:text-sm font-semibold touch-manipulation" disabled={loading}>
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send reset link"}
                </Button>
              </motion.div>
            </form>

            <motion.p
              className="mt-4 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, ease, delay: 0.35 }}
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
