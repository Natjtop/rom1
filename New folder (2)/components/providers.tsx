"use client"

import { AuthProvider } from "@/lib/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { ErrorBoundary } from "@/components/error-boundary"
import { ShopifyProvider } from "@/lib/shopify-context"
import { ShopifyAppBridgeProvider } from "@/components/shopify/app-bridge-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ShopifyProvider>
        <ShopifyAppBridgeProvider>
          <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" disableTransitionOnChange>
            <AuthProvider>{children}</AuthProvider>
          </ThemeProvider>
        </ShopifyAppBridgeProvider>
      </ShopifyProvider>
    </ErrorBoundary>
  )
}
