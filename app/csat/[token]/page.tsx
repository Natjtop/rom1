"use client"

import { use, useState, useEffect } from "react"
import { Star, CheckCircle2, Loader2, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"

interface SurveyData {
  token: string
  alreadyResponded: boolean
  rating: number | null
  workspace: { name: string; logoUrl: string | null }
  ticketSubject: string | null
}

export default function CsatSurveyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [survey, setSurvey] = useState<SurveyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [feedback, setFeedback] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/csat/survey/${token}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Survey not found")
        const data = await res.json()
        setSurvey(data)
        if (data.alreadyResponded) {
          setSelectedRating(data.rating)
          setSubmitted(true)
        }
      })
      .catch(() => setError("This survey link is invalid or has expired."))
      .finally(() => setLoading(false))
  }, [token])

  async function handleSubmit() {
    if (!selectedRating) return
    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/csat/survey/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: selectedRating, feedback: feedback.trim() || null }),
      })
      if (!res.ok) throw new Error("Failed")
      setSubmitted(true)
    } catch {
      setError("Failed to submit. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error && !survey) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-[15px] text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (!survey) return null

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-8 shadow-sm text-center">
          {/* Workspace branding */}
          <p className="text-[13px] font-medium text-muted-foreground mb-1">{survey.workspace.name}</p>

          {submitted ? (
            <>
              <div className="mx-auto mb-4 mt-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <h1 className="text-[22px] font-semibold text-foreground">Thank you!</h1>
              <p className="mt-2 text-[14px] text-muted-foreground">
                Your feedback helps us improve our support.
              </p>
              {selectedRating && (
                <div className="mt-4 flex items-center justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={cn("h-6 w-6", n <= selectedRating ? "fill-amber-400 text-amber-400" : "text-border")}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <h1 className="mt-4 text-[22px] font-semibold text-foreground">
                How was your experience?
              </h1>
              {survey.ticketSubject && (
                <p className="mt-1 text-[13px] text-muted-foreground">
                  Regarding: <span className="font-medium text-foreground/70">{survey.ticketSubject}</span>
                </p>
              )}

              {/* Star rating */}
              <div className="mt-6 flex items-center justify-center gap-0.5 sm:gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setSelectedRating(n)}
                    aria-label={`Rate ${n} out of 5 stars`}
                    className="group p-1.5 sm:p-2 min-h-[44px] min-w-[44px] flex items-center justify-center transition-transform hover:scale-110 active:scale-95 touch-manipulation"
                  >
                    <Star
                      className={cn(
                        "h-8 w-8 sm:h-10 sm:w-10 transition-colors",
                        selectedRating && n <= selectedRating
                          ? "fill-amber-400 text-amber-400"
                          : "text-border hover:text-amber-300"
                      )}
                    />
                  </button>
                ))}
              </div>
              <div className="mt-2 flex justify-between px-2 text-[11px] text-muted-foreground/50">
                <span>Poor</span>
                <span>Excellent</span>
              </div>

              {/* Feedback textarea */}
              {selectedRating && (
                <div className="mt-5">
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Any additional feedback? (optional)"
                    rows={3}
                    className="w-full rounded-lg border border-border/60 bg-background px-3 py-2.5 text-[16px] sm:text-[14px] text-foreground placeholder:text-muted-foreground/40 focus:border-foreground/20 focus:outline-none focus:ring-2 focus:ring-foreground/5 resize-none"
                  />
                </div>
              )}

              {/* Submit button */}
              {selectedRating && (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="mt-4 w-full rounded-lg bg-foreground px-6 py-3 min-h-[48px] text-[14px] font-semibold text-background transition-all hover:bg-foreground/90 active:scale-[0.98] disabled:opacity-50 touch-manipulation"
                >
                  {submitting ? "Submitting..." : "Submit feedback"}
                </button>
              )}

              {error && <p className="mt-3 text-[13px] text-red-500">{error}</p>}
            </>
          )}
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground/40">
          Powered by Replyma
        </p>
      </div>
    </div>
  )
}
