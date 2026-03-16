import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { Poppins, Source_Serif_4 } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { Providers } from '@/components/providers'
import './globals.css'

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});
const sourceSerif4 = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif-4",
  display: "swap",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://replyma.com'),
  title: {
    default: 'Replyma - AI-Powered Customer Support for E-commerce',
    template: '%s | Replyma',
  },
  description: 'Resolve up to 80% of support tickets automatically across Email and Live Chat. The AI helpdesk built for Shopify and WooCommerce.',
  generator: 'Replyma',
  applicationName: 'Replyma',
  referrer: 'origin-when-cross-origin',
  icons: {
    icon: [
      { url: '/logobrowser.jpg', sizes: 'any', type: 'image/jpeg' },
    ],
    apple: '/logobrowser.jpg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Replyma',
    title: 'Replyma - AI-Powered Customer Support for E-commerce',
    description: 'Resolve up to 80% of support tickets automatically across Email and Live Chat. The AI helpdesk built for Shopify and WooCommerce.',
    url: 'https://replyma.com',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Replyma - AI Customer Support' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Replyma - AI-Powered Customer Support for E-commerce',
    description: 'Resolve up to 80% of support tickets automatically with AI. Built for Shopify and e-commerce.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://replyma.com',
  },
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''
  const isWidgetRoute = pathname.startsWith('/widget')
  const shopifyApiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || process.env.SHOPIFY_API_KEY

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={isWidgetRoute ? 'replyma-widget-embed' : undefined}
      style={isWidgetRoute ? { background: 'transparent' } as React.CSSProperties : undefined}
    >
      <head>
        <link rel="preload" href="/logo" as="image" />
        {/* Load App Bridge only when in Shopify embed (URL has shop=). Avoids "missing shop" error after OAuth redirects (e.g. Gmail/Microsoft connect). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){if(/[?&]shop=/.test(window.location.search)){var s=document.createElement("script");s.src="https://cdn.shopify.com/shopifycloud/app-bridge.js";document.head.appendChild(s);}})();`,
          }}
        />
        {shopifyApiKey ? <meta name="shopify-api-key" content={shopifyApiKey} /> : null}
      </head>
      <body
        className={`${poppins.variable} ${sourceSerif4.variable} font-sans${isWidgetRoute ? ' replyma-widget-embed' : ''}`}
        style={isWidgetRoute ? { background: 'transparent' } as React.CSSProperties : undefined}
        suppressHydrationWarning
      >
        {isWidgetRoute && (
          <style
            dangerouslySetInnerHTML={{
              __html: 'html.replyma-widget-embed,body.replyma-widget-embed{background:transparent!important;background-color:transparent!important}',
            }}
          />
        )}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-background focus:outline-none"
        >
          Skip to main content
        </a>
        <Providers>
          {children}
          <Toaster position="bottom-right" richColors />
        </Providers>
      </body>
    </html>
  )
}
