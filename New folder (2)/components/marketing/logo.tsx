"use client"

import { useState, useEffect } from "react"

const LOGO_CACHE_KEY = "replyma_logo_dataurl"

function getCachedLogoSrc(): string | null {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem(LOGO_CACHE_KEY)
  } catch {
    return null
  }
}

export function ReplymaLogo({ className = "h-7 w-7" }: { className?: string }) {
  const [src, setSrc] = useState<string>(() => getCachedLogoSrc() ?? "/logo")

  useEffect(() => {
    if (src !== "/logo") return
    fetch("/logo")
      .then((r) => r.blob())
      .then((blob) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const dataUrl = reader.result as string
          if (dataUrl) {
            try {
              localStorage.setItem(LOGO_CACHE_KEY, dataUrl)
            } catch {
              // quota or disabled
            }
          }
        }
        reader.readAsDataURL(blob)
      })
      .catch(() => {})
  }, [src])

  return (
    <span className={`inline-block shrink-0 overflow-hidden ${className}`}>
      <img
        role="img"
        aria-label="Logo"
        src={src}
        alt=""
        width={32}
        height={32}
        className="h-full w-full object-contain object-center"
        loading="eager"
        fetchPriority="high"
        suppressHydrationWarning
      />
    </span>
  )
}
