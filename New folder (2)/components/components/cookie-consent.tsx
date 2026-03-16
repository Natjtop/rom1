"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

export function CookieConsent() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent")
    if (!consent) setShow(true)
  }, [])

  const accept = () => {
    localStorage.setItem("cookie-consent", "accepted")
    setShow(false)
  }

  const reject = () => {
    localStorage.setItem("cookie-consent", "rejected")
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-background border-t shadow-[0_-4px_20px_-4px_rgb(0_0_0/0.08)]">
      <div className="max-w-4xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="text-sm text-muted-foreground">
          We use cookies to improve your experience. By continuing, you agree to our use of cookies.
        </p>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={reject} className="flex-1 sm:flex-none min-h-[44px] sm:min-h-0">Reject</Button>
          <Button size="sm" onClick={accept} className="flex-1 sm:flex-none min-h-[44px] sm:min-h-0">Accept</Button>
        </div>
      </div>
    </div>
  )
}
