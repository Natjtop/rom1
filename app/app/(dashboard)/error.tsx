"use client"

import { useEffect } from "react"
import { AlertTriangle, RotateCcw } from "lucide-react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Dashboard error:", error)
  }, [error])

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex flex-col items-center justify-center py-24 px-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>
        <h2 className="text-[16px] font-semibold text-foreground mb-1">Something went wrong</h2>
        <p className="text-[13px] text-muted-foreground text-center max-w-sm mb-6">
          {error.message || "An unexpected error occurred. Please try again or contact support if the problem persists."}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2.5 sm:py-2 text-[13px] font-medium text-background transition-all duration-150 hover:bg-foreground/90 active:scale-[0.98] min-h-[44px] sm:min-h-0"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Try again
        </button>
      </div>
    </div>
  )
}
