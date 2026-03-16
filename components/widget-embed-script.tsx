"use client"

import { useEffect } from "react"

const WORKSPACE_ID = "cmmbvaqlu000gj550x9hhkcqu"

/**
 * Injects the Replyma widget script (same snippet customers add to their site).
 * Use only on /test so the widget loads in an iframe — identical to customer experience.
 */
export function WidgetEmbedScript() {
  useEffect(() => {
    if (typeof document === "undefined") return
    const script = document.createElement("script")
    /* On localhost, bypass cache so /test always loads latest widget.js */
    const isLocal = typeof window !== "undefined" && /^localhost$|^127\.\d+\.\d+\.\d+$/.test(window.location.hostname)
    script.src = "/widget.js" + (isLocal ? "?t=" + Date.now() : "")
    script.setAttribute("data-workspace-id", WORKSPACE_ID)
    script.async = true
    document.body.appendChild(script)
    return () => {
      try {
        window.dispatchEvent(new CustomEvent("replyma:destroy"))
      } catch {
        /* noop */
      }
      script.remove()
    }
  }, [])
  return null
}
