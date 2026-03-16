"use client"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface ShopifyContextType {
  isEmbedded: boolean
  shopOrigin: string | null
  host: string | null
}

const ShopifyContext = createContext<ShopifyContextType>({
  isEmbedded: false,
  shopOrigin: null,
  host: null,
})

export function ShopifyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ShopifyContextType>({
    isEmbedded: false,
    shopOrigin: null,
    host: null,
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shop = params.get("shop")
    const host = params.get("host")
    const hasShopifyBridge = !!(window as Window & { shopify?: unknown }).shopify
    if (shop && host) {
      setState({ isEmbedded: true, shopOrigin: shop, host })
      return
    }
    if (hasShopifyBridge) {
      setState((prev) => ({ ...prev, isEmbedded: true }))
    }
  }, [])

  return (
    <ShopifyContext.Provider value={state}>
      {children}
    </ShopifyContext.Provider>
  )
}

export const useShopify = () => useContext(ShopifyContext)
