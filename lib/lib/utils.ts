import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Extract up to 2 initials from a full name */
export function getInitials(name: string, max = 2): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0].toUpperCase())
    .slice(0, max)
    .join('')
}

/** Shared framer-motion fade-up preset for whileInView sections */
export const fadeUp = {
  initial: { opacity: 0, y: 8 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.3 },
} as const

/** Card container class (rounded-xl border bg-card) */
export const cardClass = 'rounded-xl border border-border/60 bg-card'

/** Primary marketing CTA button class (dark, Stripe-style) */
export const btnPrimary =
  'inline-flex items-center gap-2 rounded-lg bg-foreground px-6 py-2.5 text-[14px] font-medium text-background transition-colors duration-200 hover:bg-foreground/90'

/** Primary dashboard action button class (accent) */
export const btnAccent =
  'inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-[13px] font-medium text-accent-foreground transition-colors duration-150 hover:bg-accent/90 cursor-pointer'

/** Secondary outline button class */
export const btnSecondary =
  'inline-flex items-center gap-2 rounded-lg border border-border/60 px-4 py-2 text-[13px] font-medium text-foreground transition-colors duration-150 hover:bg-secondary/60 cursor-pointer'

/** Standard input class */
export const inputClass =
  'h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-colors'

/** Stagger children animation preset for Framer Motion */
export const staggerContainer = {
  initial: {},
  whileInView: {
    transition: { staggerChildren: 0.06 },
  },
  viewport: { once: true },
} as const

/** Fade up child for use inside stagger containers */
export const fadeUpChild = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
} as const

/** Scale in animation preset */
export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true },
  transition: { duration: 0.4 },
} as const

/** Slide in from left animation */
export const slideInLeft = {
  initial: { opacity: 0, x: -20 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true },
  transition: { duration: 0.4 },
} as const

/** Slide in from right animation */
export const slideInRight = {
  initial: { opacity: 0, x: 20 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true },
  transition: { duration: 0.4 },
} as const

/** Live chat uses placeholder emails (visitor-*@livechat.replyma.com) when customer has no email */
const LIVE_CHAT_PLACEHOLDER_EMAIL = /^visitor-.+@livechat\.replyma\.com$/i
/** True if email is present and not a live-chat placeholder */
export function isRealCustomerEmail(email: string | null | undefined): boolean {
  if (!email || !email.trim()) return false
  return !LIVE_CHAT_PLACEHOLDER_EMAIL.test(email.trim())
}

/** Format number with K/M suffix */
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}
