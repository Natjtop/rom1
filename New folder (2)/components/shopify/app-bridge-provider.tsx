"use client"

import { useShopify } from "@/lib/shopify-context"
import { useEffect, useState, type ReactNode } from "react"

/**
 * Shopify App Bridge Provider.
 * Requires App Bridge script from Shopify CDN in the document head.
 */
export function ShopifyAppBridgeProvider({ children }: { children: ReactNode }) {
  const { isEmbedded, host } = useShopify()
  const [bridgeReady, setBridgeReady] = useState(false)

  useEffect(() => {
    if (!isEmbedded || !host) return

    const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY
    if (!apiKey) {
      console.warn("[Shopify] NEXT_PUBLIC_SHOPIFY_API_KEY not set - skipping App Bridge")
      setBridgeReady(true)
      return
    }

    const timeout = window.setTimeout(() => setBridgeReady(true), 3000)
    const check = () => {
      if ((window as Window & { shopify?: unknown }).shopify) {
        clearTimeout(timeout)
        setBridgeReady(true)
      }
    }

    check()
    window.addEventListener("load", check)
    return () => {
      clearTimeout(timeout)
      window.removeEventListener("load", check)
    }
  }, [isEmbedded, host])

  if (!isEmbedded) {
    return <>{children}</>
  }

  if (!bridgeReady) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
      </div>
    )
  }

  return <>{children}</>
}