"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * /channels has no [type] — redirect to default channel so only one channel loads.
 * Sidebar links to /channels/email; users can switch to Live Chat via in-page nav.
 */
export default function ChannelsIndexPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/channels/email")
  }, [router])
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <p className="text-[13px] text-muted-foreground">Redirecting to Channels…</p>
    </div>
  )
}
