"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { X, Send, Sparkles, ArrowDown, ShoppingBag, Maximize2, Minimize2 } from "lucide-react"
import { subscribeToLivechat, unsubscribeFromLivechat, PusherEvents } from "@/lib/pusher-client"

/** Product summary for Shopping Assistant cards (from AI message metadata.products). */
interface ProductSummary {
  id: string
  title: string
  handle: string
  featuredImage?: string
  price: string
  variantId: string
}

interface Message {
  id: string
  role: "customer" | "ai"
  content: string
  time: string
  quickReplies?: string[]
  products?: ProductSummary[]
}

interface LiveChatWidgetProps {
  workspaceId?: string
  proactiveTriggerDelay?: number
  greeting?: string
  accentColor?: string
  accentGradientPreset?: string
  textIconColor?: string
  headerTextColor?: string
  headerSubtextColor?: string
  panelBackgroundColor?: string
  assistantBubbleColor?: string
  assistantTextColor?: string
  userBubbleColor?: string
  userTextColor?: string
  inputBackgroundColor?: string
  inputTextColor?: string
  quickReplyBackgroundColor?: string
  quickReplyTextColor?: string
  quickReplyBorderColor?: string
  launcherIconColor?: string
  proactiveBackgroundColor?: string
  proactiveTextColor?: string
  proactiveSubtextColor?: string
  quickReplies?: string[]
  proactiveTitle?: string
  proactiveSubtitle?: string
  assistantName?: string
  /** When true, desktop opens as floating box above FAB. Mobile behavior depends on embedMode/forceDesktopLayout. */
  floatingOnly?: boolean
  /** Bottom offset for floating panel in px (when floatingOnly=true). */
  floatingPanelBottomOffset?: number
  /** When true, apply embed-specific design (used on customer sites). Same behavior, slightly different look. */
  embedMode?: boolean
  /** Force desktop paddings/sizes even inside narrow iframe viewport. */
  forceDesktopLayout?: boolean
}

/** Inset so launcher shadow isn’t clipped by iframe edge (needs ~18px for shadow blur). */
const EMBED_DESKTOP_LAUNCHER_INSET_PX = 18
/** Panel bottom in embed desktop so chat sits above launcher (inset + launcher slot height 80). */
const EMBED_PANEL_BOTTOM_PX = EMBED_DESKTOP_LAUNCHER_INSET_PX + 80
/** Symmetric inset so panel shadow has equal room left and right (no cut-off left, no excess right). */
const EMBED_PANEL_HORIZ_INSET_PX = 10
const EMBED_PROTOCOL_VERSION = 1
const MSG_READY = "replyma:ready"
const MSG_SET_STATE = "replyma:set-state"
const MSG_STATE_REQUEST = "replyma:state-request"
const MSG_STATE_APPLIED = "replyma:state-applied"
const MSG_LEGACY_RESIZE = "replyma:widget:resize"
const MSG_LEGACY_RESIZE_DONE = "replyma:widget:resizeDone"
const MSG_RESIZE_DONE = "replyma:resize-done"
const EMBED_OPEN_ACK_FALLBACK_MS = 400

/** Launcher icon size (24px in 56px button). */
const LAUNCHER_ICON_SIZE = 24

/** Launcher button: MessageSquare (Lucide) icon, animates to X when open. */
function CustomChatIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
    </svg>
  )
}

function LauncherButton({
  isOpen,
  onToggle,
  embedMode,
  reducedMotion,
  background,
  iconColor,
}: {
  isOpen: boolean
  onToggle: () => void
  embedMode: boolean
  reducedMotion: boolean
  background: string
  iconColor: string
}) {
  const iconTransition = { type: "spring" as const, damping: 20, stiffness: 300 }
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileHover={reducedMotion ? undefined : { scale: 1.05 }}
      whileTap={reducedMotion ? undefined : { scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className={`relative flex h-14 w-14 items-center justify-center rounded-full transition-shadow duration-300 touch-manipulation cursor-pointer ${embedMode ? "" : "hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]"}`}
      style={{
        background: embedMode ? (background || "#0a0a0a") : background,
        color: iconColor,
        boxShadow: "0 2px 6px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06), 0 8px 18px rgba(0,0,0,0.05)",
        ...(embedMode ? { WebkitBackfaceVisibility: "hidden" as const, backfaceVisibility: "hidden" as const, isolation: "isolate" as const } : {}),
      }}
      aria-label={isOpen ? "Close chat" : "Open chat"}
    >
      <span className="relative flex items-center justify-center overflow-hidden" style={{ width: LAUNCHER_ICON_SIZE, height: LAUNCHER_ICON_SIZE }}>
        <motion.span
          initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
          animate={{ opacity: isOpen ? 1 : 0, rotate: isOpen ? 0 : -90, scale: isOpen ? 1 : 0.5 }}
          transition={iconTransition}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <X size={LAUNCHER_ICON_SIZE} className="shrink-0" />
        </motion.span>
        <motion.span
          initial={{ opacity: 1, rotate: 0, scale: 1 }}
          animate={{ opacity: isOpen ? 0 : 1, rotate: isOpen ? 90 : 0, scale: isOpen ? 0.5 : 1 }}
          transition={iconTransition}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <CustomChatIcon size={LAUNCHER_ICON_SIZE} className="shrink-0" />
        </motion.span>
      </span>
    </motion.button>
  )
}

let msgCounter = 0
function uid() { return `m-${Date.now()}-${++msgCounter}` }
function getTime() { return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) }
function toRgba(color: string, alpha: number): string {
  const fallback = `rgba(10, 10, 10, ${alpha})`
  try {
    const hex = color.trim().replace("#", "")
    const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex
    if (full.length !== 6) return fallback
    const r = parseInt(full.slice(0, 2), 16)
    const g = parseInt(full.slice(2, 4), 16)
    const b = parseInt(full.slice(4, 6), 16)
    if ([r, g, b].some((n) => Number.isNaN(n))) return fallback
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  } catch {
    return fallback
  }
}

function parseOrigin(url: string): string | null {
  try {
    return new URL(url).origin
  } catch {
    return null
  }
}

export function LiveChatWidget({
  workspaceId = "",
  proactiveTriggerDelay = 10,
  greeting = "Hi there! 👋 How can I help you today?",
  accentColor,
  accentGradientPreset = "none",
  textIconColor,
  headerTextColor = "#ffffff",
  headerSubtextColor = "#d9d9d9",
  panelBackgroundColor = "#f8f9fa",
  assistantBubbleColor = "#ffffff",
  assistantTextColor = "#1a1a1a",
  userBubbleColor,
  userTextColor = "#ffffff",
  inputBackgroundColor = "#f5f5f5",
  inputTextColor = "#1a1a1a",
  quickReplyBackgroundColor = "#ffffff",
  quickReplyTextColor = "#333333",
  quickReplyBorderColor = "#e5e7eb",
  launcherIconColor = "#ffffff",
  proactiveBackgroundColor = "#ffffff",
  proactiveTextColor = "#1a1a1a",
  proactiveSubtextColor = "#888888",
  quickReplies: defaultQuickReplies = ["Track my order", "Return or exchange", "Product question"],
  proactiveTitle = "Need help finding the right product?",
  proactiveSubtitle = "Our AI assistant can help you decide",
  assistantName = "AI Shopping Assistant",
  floatingOnly = false,
  floatingPanelBottomOffset = 72,
  embedMode = false,
  forceDesktopLayout = false,
}: LiveChatWidgetProps) {
  // Keep the same visual baseline in marketing and embedded widget; workspace settings still override this.
  const resolvedAccent = accentColor ?? "#0a0a0a"
  function getContrastingColor(value: string): string {
    try {
      const hex = value.replace("#", "")
      const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex
      if (full.length !== 6) return "#ffffff"
      const r = parseInt(full.slice(0, 2), 16)
      const g = parseInt(full.slice(2, 4), 16)
      const b = parseInt(full.slice(4, 6), 16)
      const yiq = (r * 299 + g * 587 + b * 114) / 1000
      return yiq >= 160 ? "#0f172a" : "#ffffff"
    } catch {
      return "#ffffff"
    }
  }

  const gradientMap: Record<string, [string, string]> = {
    sunset: ["#ff3b00", "#ff00a8"],
    ocean: ["#0047ff", "#00e5ff"],
    aurora: ["#00d84a", "#00b8ff"],
  }
  const accentGradient = gradientMap[accentGradientPreset]
  const accentSurfaceBackground = accentGradient
    ? `linear-gradient(135deg, ${accentGradient[0]}, ${accentGradient[1]})`
    : resolvedAccent
  const accentTextSource = accentGradient ? accentGradient[1] : resolvedAccent
  const accentTextAndIconColor = textIconColor ?? getContrastingColor(accentTextSource)
  const customerMessageColor = userTextColor || accentTextAndIconColor
  const launcherGlyphColor = launcherIconColor || accentTextAndIconColor
  const compactEmbedSizing = embedMode && !forceDesktopLayout

  /** Dark theme: use theme colors for panel, header, bubbles, input. Light theme: keep hardcoded light UI. */
  function luminance(hex: string): number {
    const h = (hex || "").replace("#", "")
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h
    if (full.length !== 6) return 0
    const r = parseInt(full.slice(0, 2), 16) / 255
    const g = parseInt(full.slice(2, 4), 16) / 255
    const b = parseInt(full.slice(4, 6), 16) / 255
    return 0.299 * r + 0.587 * g + 0.114 * b
  }
  const panelLum = luminance(panelBackgroundColor ?? "#f8f9fa")
  const isDarkTheme = panelLum < 0.5
  const dark = isDarkTheme
    ? {
        panelBg: panelBackgroundColor ?? "#0c0c0c",
        panelBorder: quickReplyBorderColor ?? "rgba(255,255,255,0.08)",
        headerBg: panelBackgroundColor ?? "#0c0c0c",
        headerBorder: quickReplyBorderColor ?? "rgba(255,255,255,0.08)",
        headerText: headerTextColor ?? "#fafafa",
        headerSubtext: headerSubtextColor ?? "#a1a1aa",
        messageAreaBg: panelBackgroundColor ?? "#0c0c0c",
        assistantBubble: assistantBubbleColor ?? "#18181b",
        assistantText: assistantTextColor ?? "#e4e4e7",
        userBubble: userBubbleColor ?? "#ffffff",
        userText: userTextColor ?? "#0a0a0a",
        inputBg: inputBackgroundColor ?? "#27272a",
        inputText: inputTextColor ?? "#fafafa",
        inputBorder: quickReplyBorderColor ?? "#3f3f46",
        quickReplyBg: quickReplyBackgroundColor ?? "#18181b",
        quickReplyText: quickReplyTextColor ?? "#e4e4e7",
        quickReplyBorder: quickReplyBorderColor ?? "#3f3f46",
        mutedText: headerSubtextColor ?? "#a1a1aa",
        buttonHover: "rgba(255,255,255,0.08)",
        buttonActive: "rgba(255,255,255,0.14)",
        quickReplyHover: "rgba(255,255,255,0.1)",
        scrollBtnHover: "rgba(255,255,255,0.12)",
        linkHover: headerTextColor ?? "#fafafa",
        cardHoverBorder: "rgba(255,255,255,0.12)",
        inputFocusBorder: "rgba(255,255,255,0.22)",
      }
    : null
  const prefersReducedMotion = useReducedMotion()
  const [isSafari, setIsSafari] = useState(false)
  useEffect(() => {
    if (typeof navigator === "undefined") return
    const ua = navigator.userAgent
    setIsSafari(/Safari\//.test(ua) && !/Chrom(e|ium)\//.test(ua))
  }, [])
  const noAnimation = !!prefersReducedMotion || isSafari
  const mobileFullscreenOpen = !floatingOnly || (!embedMode && !forceDesktopLayout)
  const widgetApiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"
  const [open, setOpen] = useState(false)
  const [isPhoneViewport, setIsPhoneViewport] = useState(false)
  /** In embed with desktop host, iframe is narrow (368px) so matchMedia would say "phone"; use desktop animation anyway. */
  const useDesktopPanelAnimation = !embedMode ? !isPhoneViewport : (forceDesktopLayout || !isPhoneViewport)
  /** In embed, treat as mobile (full screen + hide launcher when open) only when host said mobile (desktop=0). Do not use isPhoneViewport — iframe is 368px on desktop so it would wrongly force mobile. */
  const embedMobile = embedMode && !forceDesktopLayout
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [unread, setUnread] = useState(0)
  const [proactiveShown, setProactiveShown] = useState(false)
  const [proactiveDismissed, setProactiveDismissed] = useState(false)
  const [proactiveMessage, setProactiveMessage] = useState<string | null>(null)
  const mountTimeRef = useRef(Date.now())
  const sessionContextRef = useRef<{ cartValue?: number; currentUrl?: string; exitIntent?: boolean }>({})
  const [customerEmail, setCustomerEmail] = useState("")
  const [emailCollected, setEmailCollected] = useState(false)
  const [customerMsgCount, setCustomerMsgCount] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const openRef = useRef(open)
  openRef.current = open
  const emailRef = useRef(customerEmail)
  emailRef.current = customerEmail
  const [sessionId] = useState(() =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`
  )
  const [ticketId, setTicketId] = useState<string | null>(null)
  const [apiAvailable, setApiAvailable] = useState(true)
  const pusherBoundRef = useRef(false)
  const replyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const parentOriginRef = useRef<string | null>(null)
  const requestSeqRef = useRef(0)
  const awaitingOpenRequestIdRef = useRef<number | null>(null)
  const lastSentModeRef = useRef<"open" | "proactive" | "closed" | null>(null)
  const lastSentExpandedRef = useRef<boolean>(false)
  const wasOpenRef = useRef(open)
  const pendingOpenRef = useRef(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    parentOriginRef.current = parseOrigin(document.referrer)
    const mq = window.matchMedia("(max-width: 639px)")
    const apply = () => setIsPhoneViewport(mq.matches)
    apply()
    if (mq.addEventListener) {
      mq.addEventListener("change", apply)
      return () => mq.removeEventListener("change", apply)
    }
    mq.addListener(apply)
    return () => mq.removeListener(apply)
  }, [])

  useEffect(() => {
    wasOpenRef.current = open
  }, [open])

  // ─── Session context: send to backend and fetch proactive message ───
  const sendSessionContextAndMaybeProactive = useCallback(
    async (dwellTimeSeconds?: number, exitIntent?: boolean) => {
      if (!workspaceId) return
      const ctx = sessionContextRef.current
      const payload = {
        workspaceId,
        sessionId,
        cartValue: ctx.cartValue,
        dwellTimeSeconds: dwellTimeSeconds ?? Math.floor((Date.now() - mountTimeRef.current) / 1000),
        currentUrl: ctx.currentUrl,
        exitIntent: exitIntent ?? ctx.exitIntent,
      }
      try {
        await fetch(`${widgetApiBase}/widget/session-context`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } catch { /* ignore */ }
      try {
        const res = await fetch(
          `${widgetApiBase}/widget/proactive?workspaceId=${encodeURIComponent(workspaceId)}&sessionId=${encodeURIComponent(sessionId)}`
        )
        if (!res.ok) return
        const data = (await res.json()) as { message?: string | null }
        if (data.message) setProactiveMessage(data.message)
      } catch { /* ignore */ }
    },
    [workspaceId, sessionId, widgetApiBase],
  )

  // ─── Proactive: dwell-time trigger ─── (in embed desktop resize iframe first so card isn't clipped)
  useEffect(() => {
    if (!proactiveTriggerDelay || open || proactiveDismissed) return
    const t = setTimeout(async () => {
      await sendSessionContextAndMaybeProactive()
      if (embedMode && !embedMobile) {
        const origin = parentOriginRef.current ?? "*"
        const post = (p: Record<string, unknown>) => { if (typeof window !== "undefined" && window.parent !== window) window.parent.postMessage(p, origin) }
        post({ type: MSG_SET_STATE, version: EMBED_PROTOCOL_VERSION, state: "proactive" })
        post({ type: MSG_LEGACY_RESIZE, mode: "proactive", accentColor: resolvedAccent })
        requestAnimationFrame(() => requestAnimationFrame(() => setProactiveShown(true)))
      } else {
        setProactiveShown(true)
      }
    }, proactiveTriggerDelay * 1000)
    return () => clearTimeout(t)
  }, [proactiveTriggerDelay, open, proactiveDismissed, sendSessionContextAndMaybeProactive, embedMode, embedMobile, resolvedAccent])

  // ─── Proactive: exit-intent (desktop) ───
  useEffect(() => {
    if (open || proactiveDismissed) return
    const handler = async (e: MouseEvent) => {
      if (e.clientY <= 5) {
        await sendSessionContextAndMaybeProactive(undefined, true)
        if (embedMode && !embedMobile) {
          const origin = parentOriginRef.current ?? "*"
          const post = (p: Record<string, unknown>) => { if (typeof window !== "undefined" && window.parent !== window) window.parent.postMessage(p, origin) }
          post({ type: MSG_SET_STATE, version: EMBED_PROTOCOL_VERSION, state: "proactive" })
          post({ type: MSG_LEGACY_RESIZE, mode: "proactive", accentColor: resolvedAccent })
          requestAnimationFrame(() => requestAnimationFrame(() => setProactiveShown(true)))
        } else {
          setProactiveShown(true)
        }
      }
    }
    document.addEventListener("mouseout", handler)
    return () => document.removeEventListener("mouseout", handler)
  }, [open, proactiveDismissed, sendSessionContextAndMaybeProactive, embedMode, embedMobile, resolvedAccent])

  // ─── Initial session context (so backend has session key) ───
  useEffect(() => {
    if (!workspaceId) return
    fetch(`${widgetApiBase}/widget/session-context`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, sessionId, dwellTimeSeconds: 0 }),
    }).catch(() => {})
  }, [workspaceId, sessionId, widgetApiBase])

  // ─── Listen for replyma:sessionContext from parent page ───
  useEffect(() => {
    if (typeof window === "undefined" || window.parent === window) return
    const handler = (e: MessageEvent) => {
      const data = (e.data || {}) as Record<string, unknown>
      if (data.type !== "replyma:sessionContext") return
      const payload = data.payload as Record<string, unknown> | undefined
      if (payload) {
        if (typeof payload.cartValue === "number") sessionContextRef.current.cartValue = payload.cartValue
        if (typeof payload.currentUrl === "string") sessionContextRef.current.currentUrl = payload.currentUrl
        if (payload.exitIntent === true) sessionContextRef.current.exitIntent = true
      }
      if (workspaceId) {
        sendSessionContextAndMaybeProactive(
          typeof payload?.dwellTimeSeconds === "number" ? payload.dwellTimeSeconds : undefined,
          payload?.exitIntent === true,
        ).catch(() => {})
      }
    }
    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [workspaceId, sendSessionContextAndMaybeProactive])

  // ─── Greeting on first open ───
  const greetingDone = useRef(false)
  useEffect(() => {
    if (open && !greetingDone.current) {
      greetingDone.current = true
      setProactiveShown(false)
      const t = setTimeout(() => {
        setMessages([{ id: uid(), role: "ai", content: greeting, time: getTime(), quickReplies: defaultQuickReplies }])
      }, 250)
      return () => clearTimeout(t)
    }
  }, [open, greeting, defaultQuickReplies])

  // ─── Auto-scroll to bottom ───
  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
    })
  }, [])

  useEffect(() => {
    if (!scrollRef.current) return
    const el = scrollRef.current
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 150
    if (near) scrollToEnd()
  }, [messages, isTyping, scrollToEnd])

  // ─── Scroll to bottom when re-opening ───
  useEffect(() => {
    if (open && messages.length > 0) scrollToEnd()
  }, [open, scrollToEnd, messages.length])

  // ─── Scroll-to-bottom button tracking ───
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const fn = () => setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 150)
    el.addEventListener("scroll", fn, { passive: true })
    return () => el.removeEventListener("scroll", fn)
  }, [])

  // ─── Focus input on open ───
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 250)
  }, [open])

  // ─── Lock body scroll on mobile (only when panel is full-screen) ───
  useEffect(() => {
    if (!open || !mobileFullscreenOpen || embedMode) return
    const mq = window.matchMedia("(max-width: 639px)")
    if (!mq.matches) return
    const y = window.scrollY
    Object.assign(document.body.style, { position: "fixed", top: `-${y}px`, left: "0", right: "0", overflow: "hidden" })
    return () => {
      Object.assign(document.body.style, { position: "", top: "", left: "", right: "", overflow: "" })
      window.scrollTo(0, y)
    }
  }, [open, mobileFullscreenOpen, embedMode])

  const postToParent = useCallback((payload: Record<string, unknown>) => {
    if (typeof window === "undefined" || window.parent === window) return
    const targetOrigin = parentOriginRef.current ?? "*"
    window.parent.postMessage(payload, targetOrigin)
  }, [])

  /** Sync state to parent (closed/proactive/open). When open, includes expanded so iframe can resize. */
  const sendStateToParent = useCallback(
    (state: "open" | "proactive" | "closed", expanded?: boolean) => {
      postToParent({
        type: MSG_SET_STATE,
        version: EMBED_PROTOCOL_VERSION,
        state,
        ...(state === "open" && typeof expanded === "boolean" ? { expanded } : {}),
      })
      postToParent({ type: MSG_LEGACY_RESIZE, mode: state, accentColor: resolvedAccent })
    },
    [postToParent, resolvedAccent],
  )

  /** Request open and wait for parent ack (desktop embed). Sets pendingOpenRef; ack handler or fallback calls applyEmbedOpen. */
  const requestOpenAndWait = useCallback(() => {
    requestSeqRef.current += 1
    const requestId = requestSeqRef.current
    pendingOpenRef.current = true
    awaitingOpenRequestIdRef.current = requestId
    postToParent({ type: MSG_STATE_REQUEST, version: EMBED_PROTOCOL_VERSION, requestId, state: "open" })
    postToParent({ type: MSG_LEGACY_RESIZE, mode: "open", accentColor: resolvedAccent })
  }, [postToParent, resolvedAccent])

  const embedOpenFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const applyEmbedOpen = useCallback(() => {
    if (embedOpenFallbackRef.current) {
      clearTimeout(embedOpenFallbackRef.current)
      embedOpenFallbackRef.current = null
    }
    setOpen(true)
    setUnread(0)
    setProactiveShown(false)
    pendingOpenRef.current = false
    awaitingOpenRequestIdRef.current = null
  }, [])

  useEffect(() => {
    if (!embedMode) return
    let cancelled = false
    const id1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) postToParent({ type: MSG_READY, version: EMBED_PROTOCOL_VERSION })
      })
    })
    return () => {
      cancelled = true
      cancelAnimationFrame(id1)
    }
  }, [embedMode, postToParent])

  useEffect(() => {
    if (!embedMode || typeof window === "undefined") return
    const handler = (e: MessageEvent) => {
      if (e.source !== window.parent) return
      const allowed =
        !parentOriginRef.current ||
        e.origin === parentOriginRef.current ||
        e.origin === window.location.origin
      if (!allowed) return
      const data = (e.data || {}) as Record<string, unknown>
      if (!pendingOpenRef.current || typeof data.type !== "string") return
      const isOpenAck =
        (data.type === MSG_STATE_APPLIED && data.state === "open" && data.requestId === awaitingOpenRequestIdRef.current) ||
        data.type === MSG_RESIZE_DONE ||
        data.type === MSG_LEGACY_RESIZE_DONE
      if (isOpenAck) {
        applyEmbedOpen()
      }
    }
    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [embedMode, applyEmbedOpen])

  useEffect(() => () => {
    if (embedOpenFallbackRef.current) clearTimeout(embedOpenFallbackRef.current)
  }, [])

  const displayState: "open" | "proactive" | "closed" =
    open ? "open" : proactiveShown && !proactiveDismissed ? "proactive" : "closed"
  useEffect(() => {
    if (!embedMode) return
    if (lastSentModeRef.current === displayState && (displayState !== "open" || lastSentExpandedRef.current === isExpanded)) return
    lastSentModeRef.current = displayState
    lastSentExpandedRef.current = isExpanded
    sendStateToParent(displayState, displayState === "open" ? isExpanded : undefined)
  }, [embedMode, displayState, isExpanded, sendStateToParent])

  const handleLauncherOpen = useCallback(() => {
    if (embedMobile) {
      sendStateToParent("open")
      setOpen(true)
      setUnread(0)
      setProactiveShown(false)
    } else if (embedMode) {
      if (pendingOpenRef.current) return
      setOpen(true)
      setUnread(0)
      setProactiveShown(false)
      requestOpenAndWait()
      embedOpenFallbackRef.current = setTimeout(() => {
        if (pendingOpenRef.current) applyEmbedOpen()
        embedOpenFallbackRef.current = null
      }, EMBED_OPEN_ACK_FALLBACK_MS)
    } else {
      setOpen(true)
      setUnread(0)
      setProactiveShown(false)
    }
  }, [embedMobile, embedMode, sendStateToParent, requestOpenAndWait, applyEmbedOpen])

  // ─── Pusher: real-time AI replies ───
  useEffect(() => {
    if (!workspaceId || pusherBoundRef.current) return
    try {
      const ch = subscribeToLivechat(workspaceId, sessionId)
      pusherBoundRef.current = true
      ch.bind(PusherEvents.MESSAGE_NEW, (data: {
        ticketId: string
        message?: { role: string; content: string; metadata?: { products?: ProductSummary[]; quickReplies?: string[] } }
      }) => {
        const role = data.message?.role
        const content = data.message?.content
        if (!role || !content || (role !== "AI" && role !== "HUMAN")) return
        const products = data.message?.metadata?.products as ProductSummary[] | undefined
        const quickReplies = data.message?.metadata?.quickReplies as string[] | undefined
        setTicketId((cur) => {
          if (cur && data.ticketId === cur) {
            if (replyTimerRef.current) { clearTimeout(replyTimerRef.current); replyTimerRef.current = null }
            setIsTyping(false)
            setMessages((prev) => [...prev, {
              id: uid(),
              role: "ai",
              content,
              time: getTime(),
              ...(products?.length ? { products } : {}),
              ...(quickReplies?.length ? { quickReplies } : {}),
            }])
            if (!openRef.current) setUnread((n) => n + 1)
          }
          return cur
        })
      })
      return () => { ch.unbind_all(); unsubscribeFromLivechat(workspaceId, sessionId); pusherBoundRef.current = false }
    } catch { /* pusher unavailable */ }
  }, [workspaceId])

  // ─── Cleanup timer on unmount ───
  useEffect(() => () => { if (replyTimerRef.current) clearTimeout(replyTimerRef.current) }, [])

  // ─── Send message ───
  const sendMessage = useCallback(async (text: string) => {
    const msg = text.trim()
    if (!msg || isTyping) return
    setMessages((prev) => [...prev, { id: uid(), role: "customer", content: msg, time: getTime() }])
    setCustomerMsgCount((n) => n + 1)
    setInput("")

    if (!workspaceId || !apiAvailable) {
      setIsTyping(true)
      replyTimerRef.current = setTimeout(() => {
        replyTimerRef.current = null; setIsTyping(false)
        setMessages((p) => [...p, { id: uid(), role: "ai", content: "Thanks for your message! Our team will get back to you shortly.", time: getTime() }])
      }, 1500)
      return
    }

    setIsTyping(true)
    try {
      const res = await fetch(`${widgetApiBase}/webhooks/livechat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, email: emailRef.current, name: "", message: msg, sessionId }),
      })
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json()
      if (data.ticketId) setTicketId(data.ticketId)
      replyTimerRef.current = setTimeout(() => {
        replyTimerRef.current = null
        setIsTyping((c) => {
          if (c) { setMessages((p) => [...p, { id: uid(), role: "ai", content: "Thanks for your patience! Our team is looking into this.", time: getTime() }]); return false }
          return c
        })
      }, 20000)
    } catch {
      setApiAvailable(false); setIsTyping(false)
      setMessages((p) => [...p, { id: uid(), role: "ai", content: "Our team will get back to you shortly.", time: getTime() }])
    }
  }, [isTyping, workspaceId, apiAvailable, sessionId])

  function handleSend() { sendMessage(input) }
  function handleQuickReply(text: string) { sendMessage(text) }
  function handleCloseChat() {
    inputRef.current?.blur()
    if (embedMode) setProactiveShown(false)
    setOpen(false)
  }

  // ─── Message grouping helpers ───
  function isFirst(i: number) { return i === 0 || messages[i - 1]?.role !== messages[i]?.role }
  function isLast(i: number) { return i === messages.length - 1 || messages[i + 1]?.role !== messages[i]?.role }

  // ─── Bubble border-radius ───
  function bubbleRadius(isCustomer: boolean, first: boolean, last: boolean) {
    if (first && last) return "rounded-2xl"
    if (isCustomer) return first ? "rounded-2xl rounded-br-lg" : last ? "rounded-2xl rounded-tr-lg" : "rounded-r-lg rounded-l-2xl"
    return first ? "rounded-2xl rounded-bl-lg" : last ? "rounded-2xl rounded-tl-lg" : "rounded-r-2xl rounded-l-lg"
  }

  const panelSizeClass = floatingOnly && forceDesktopLayout
    ? isExpanded ? "h-[800px] max-h-[calc(100vh-100px)] w-[460px]" : "h-[600px] w-[380px]"
    : embedMode && !embedMobile
      ? isExpanded ? "h-[700px] max-w-[560px]" : "h-[600px] max-w-[380px]"
      : isExpanded ? "sm:h-[80vh] sm:max-h-[800px] sm:w-[460px] md:w-[600px]" : "sm:h-[600px] sm:w-[380px]"

  const panelPositionClass = floatingOnly
    ? forceDesktopLayout
      ? "absolute right-0 bottom-[80px] rounded-3xl"
      : embedMode
        ? embedMobile ? "fixed inset-0 rounded-t-3xl" : "absolute left-[12px] right-[12px] bottom-[80px] w-[calc(100%-24px)] rounded-3xl"
        : "fixed inset-0 sm:absolute sm:inset-auto sm:right-0 sm:bottom-[80px] rounded-t-3xl sm:rounded-3xl"
    : embedMode
      ? embedMobile ? "fixed inset-0 rounded-t-3xl" : "absolute left-[12px] right-[12px] bottom-[80px] w-[calc(100%-24px)] rounded-3xl"
      : "fixed inset-0 sm:absolute sm:inset-auto sm:bottom-[80px] sm:right-0 rounded-t-3xl sm:rounded-3xl"

  const panelTransitionClass = noAnimation
    ? "transition-none"
    : embedMode && !embedMobile
      ? "transition-[width,height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
      : "transition-all duration-300 ease-in-out"

  return (
    <div
      className={`fixed z-[999999] pointer-events-none [&>*]:pointer-events-auto ${dark ? "replyma-dark" : ""} ${
        embedMode ? "inset-0" : "bottom-0 right-0 sm:bottom-6 sm:right-6 pb-[env(safe-area-inset-bottom)]"
      }`}
      style={{
        ...(embedMode ? { background: "transparent", WebkitTextSizeAdjust: "100%", textSizeAdjust: "100%" } : {}),
        ...(dark
          ? {
              ["--rd-btn-hover" as string]: dark.buttonHover,
              ["--rd-btn-active" as string]: dark.buttonActive,
              ["--rd-qr-hover" as string]: dark.quickReplyHover,
              ["--rd-scroll-hover" as string]: dark.scrollBtnHover,
              ["--rd-link-hover" as string]: dark.linkHover,
              ["--rd-card-hover-border" as string]: dark.cardHoverBorder,
              ["--rd-input-focus" as string]: dark.inputFocusBorder,
            }
          : {}),
      }}
    >
      {dark && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
.replyma-dark .replyma-d-header-btn:hover { background: var(--rd-btn-hover) !important; }
.replyma-dark .replyma-d-header-btn:active { background: var(--rd-btn-active) !important; }
.replyma-dark .replyma-d-qr:hover { background: var(--rd-qr-hover) !important; }
.replyma-dark .replyma-d-qr:active { opacity: 0.92; }
.replyma-dark .replyma-d-scroll-btn:hover { background: var(--rd-scroll-hover) !important; box-shadow: 0 4px 14px rgba(0,0,0,0.25); }
.replyma-dark .replyma-d-scroll-btn:active { opacity: 0.9; }
.replyma-dark .replyma-d-link:hover { color: var(--rd-link-hover) !important; opacity: 1; }
.replyma-dark .replyma-d-card:hover { box-shadow: 0 0 0 1px var(--rd-card-hover-border), 0 4px 12px rgba(0,0,0,0.2); }
.replyma-dark .replyma-d-input:focus { border-color: var(--rd-input-focus) !important; outline: none; box-shadow: 0 0 0 2px var(--rd-input-focus); }
.replyma-dark .replyma-d-send:hover { opacity: 0.92; }
.replyma-dark .replyma-d-send:active { transform: scale(0.96); }
.replyma-dark .replyma-d-proactive-dismiss:hover { opacity: 0.85; background: rgba(255,255,255,0.12) !important; }
.replyma-dark .replyma-d-proactive-dismiss:active { opacity: 0.75; }
.replyma-dark .replyma-d-add-btn:hover { opacity: 0.92; }
.replyma-dark .replyma-d-add-btn:active { transform: scale(0.96); }
`,
          }}
        />
      )}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={noAnimation || embedMode ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={noAnimation || embedMode ? { duration: 0 } : { duration: 0.2, ease: "easeInOut" }}
            className={`flex flex-col overflow-visible pointer-events-auto z-0 ${panelPositionClass} ${panelSizeClass} ${panelTransitionClass}`}
            style={{
              transformOrigin: "bottom right",
              ...(floatingOnly ? { bottom: `${floatingPanelBottomOffset}px` } : {}),
              ...(embedMobile ? { position: "fixed" as const, top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", minHeight: "100dvh" } : {}),
              ...(embedMode && !embedMobile ? { position: "absolute" as const, left: EMBED_PANEL_HORIZ_INSET_PX, right: EMBED_PANEL_HORIZ_INSET_PX, bottom: EMBED_PANEL_BOTTOM_PX, width: "auto", height: isExpanded ? 700 : 600, minHeight: isExpanded ? 700 : 600 } : {}),
              ...(floatingOnly && !embedMode && isPhoneViewport ? { position: "fixed" as const, top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", minHeight: "100dvh" } : {}),
              /* In embed, fill expanded area with panel color so host page never shows through (no white flash on open). */
              backgroundColor: embedMode ? (dark?.panelBg ?? panelBackgroundColor ?? "#ffffff") : "transparent",
              willChange: "transform, opacity, width, height",
              WebkitBackfaceVisibility: "hidden",
              transform: "translateZ(0)",
            }}
            aria-hidden={false}
          >
            <div
              className={`relative flex flex-col overflow-hidden rounded-3xl sm:rounded-3xl flex-1 min-h-0 border ${dark ? "" : "border-black/[0.08] bg-white"}`}
              style={{
                ...(dark ? { backgroundColor: dark.panelBg, borderColor: dark.panelBorder } : {}),
                boxShadow: embedMode
                  ? (dark ? "0 12px 40px -12px rgba(0,0,0,0.16)" : "0 12px 40px -12px rgba(0,0,0,0.06), 0 0 18px rgba(0,0,0,0.015)")
                  : (dark ? "0 12px 40px -12px rgba(0,0,0,0.35)" : "0 12px 40px -12px rgba(0,0,0,0.15), 0 0 20px rgba(0,0,0,0.03)"),
              }}
            >
              {/* Header */}
              <div
                className={`relative flex flex-col justify-center px-6 py-[15px] shrink-0 border-b z-10 ${dark ? "" : "bg-white border-black/5"}`}
                style={dark ? { backgroundColor: dark.headerBg, borderColor: dark.headerBorder } : undefined}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm" style={{ background: accentSurfaceBackground }}>
                      <Sparkles className="h-5 w-5" style={{ color: launcherGlyphColor }} />
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[16px] font-semibold leading-tight truncate" style={dark ? { color: dark.headerText } : undefined}>{assistantName}</p>
                      <p className={`text-[13px] leading-tight mt-0.5 ${dark ? "" : "text-slate-500"}`} style={dark ? { color: dark.headerSubtext } : undefined}>Typically replies instantly</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className={`h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-200 touch-manipulation cursor-pointer replyma-d-header-btn ${dark ? "" : "hover:bg-slate-100 active:bg-slate-200 text-slate-400 hover:text-slate-700"} ${embedMode && !embedMobile ? "flex" : "hidden sm:flex"}`}
                      style={dark ? { color: dark.headerSubtext } : undefined}
                      aria-label={isExpanded ? "Collapse chat" : "Expand chat"}
                    >
                      {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={handleCloseChat}
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-200 touch-manipulation cursor-pointer replyma-d-header-btn ${dark ? "" : "hover:bg-slate-100 active:bg-slate-200 text-slate-500 hover:text-slate-900"}`}
                      style={dark ? { color: dark.headerText } : undefined}
                      aria-label="Close chat"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages area */}
              <div
                ref={scrollRef}
                className={`relative flex-1 overflow-y-auto overscroll-contain min-h-0 ${dark ? "" : "bg-slate-50/50"}`}
                style={dark ? { backgroundColor: dark.messageAreaBg } : undefined}
              >
                <div className="flex flex-col gap-1 p-5 pb-4">
                  {messages.map((msg, idx) => {
                    const f = isFirst(idx), l = isLast(idx), isCust = msg.role === "customer"
                    return (
                      <div key={msg.id}>
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ type: "spring", damping: 25, stiffness: 300 }}
                          className={`flex items-end gap-2 ${isCust ? "justify-end" : "justify-start"} ${f ? "mt-4" : "mt-1"}`}
                        >
                          {!isCust && (
                            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${l ? "visible" : "invisible"}`} style={{ background: accentSurfaceBackground }}>
                              <Sparkles className="h-3.5 w-3.5" style={{ color: launcherGlyphColor }} />
                            </div>
                          )}
                          <div className="flex flex-col max-w-[80%]">
                            <div
                              className={`px-4 py-3 text-[14px] leading-relaxed whitespace-pre-wrap break-words ${bubbleRadius(isCust, f, l)} ${
                                isCust ? "shadow-sm" : dark ? "shadow-sm border" : "shadow-sm border border-black/5"
                              }`}
                              style={
                                isCust
                                  ? { background: dark ? dark.userBubble : accentSurfaceBackground, color: dark ? dark.userText : customerMessageColor }
                                  : dark
                                    ? { background: dark.assistantBubble, color: dark.assistantText, borderColor: dark.quickReplyBorder }
                                    : { background: "#ffffff", color: "#1e293b" }
                              }
                            >
                              {msg.content}
                            </div>
                            {msg.products && msg.products.length > 0 && !isCust && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {msg.products.slice(0, 6).map((p) => {
                                  const productUrl = typeof window !== "undefined" ? `${window.location.origin}/products/${p.handle}` : "#"
                                  const handleAddToCart = (e: React.MouseEvent) => {
                                    e.preventDefault()
                                    if (typeof window === "undefined" || window.parent === window) return
                                    const origin = document.referrer ? new URL(document.referrer).origin : "*"
                                    window.parent.postMessage(
                                      { type: "replyma:addToCart", variantId: p.variantId, quantity: 1, productId: p.id, handle: p.handle, title: p.title },
                                      origin
                                    )
                                  }
                                  return (
                                    <div
                                      key={p.id}
                                      className={`flex items-center gap-3 rounded-2xl border overflow-hidden shadow-sm transition-shadow w-full max-w-[240px] min-w-0 p-2 ${dark ? "replyma-d-card" : "hover:shadow-md border-slate-200 bg-white"}`}
                                      style={dark ? { backgroundColor: dark.assistantBubble, borderColor: dark.quickReplyBorder } : undefined}
                                    >
                                      <a href={productUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 min-w-0 flex-1 shrink-0">
                                        {p.featuredImage ? (
                                          <img src={p.featuredImage} alt="" className="h-12 w-12 rounded-xl object-cover shrink-0 border border-slate-100" />
                                        ) : (
                                          <div className={`h-12 w-12 shrink-0 flex items-center justify-center rounded-xl ${dark ? "" : "bg-slate-100"}`} style={dark ? { backgroundColor: dark.inputBg } : undefined} aria-hidden><ShoppingBag className="h-5 w-5" style={dark ? { color: dark.mutedText } : undefined} /></div>
                                        )}
                                        <div className="flex-1 min-w-0 py-1 pr-1">
                                          <p className={`text-[13px] font-semibold truncate ${dark ? "" : "text-slate-900"}`} style={dark ? { color: dark.assistantText } : undefined}>{p.title}</p>
                                          <p className={`text-[12px] mt-0.5 ${dark ? "" : "text-slate-500"}`} style={dark ? { color: dark.mutedText } : undefined}>${p.price}</p>
                                        </div>
                                      </a>
                                      <button
                                        type="button"
                                        onClick={handleAddToCart}
                                        className={`shrink-0 ml-1 mr-1 px-3 py-2 rounded-xl text-[12px] font-semibold text-white active:scale-95 transition-all touch-manipulation ${dark ? "replyma-d-add-btn" : "hover:opacity-90"}`}
                                        style={{ background: resolvedAccent }}
                                      >
                                        Add
                                      </button>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                            {l && <span className={`mt-1.5 text-[11px] font-medium ${dark ? "" : "text-slate-400"} ${isCust ? "text-right mr-1" : "ml-1"}`} style={dark ? { color: dark.mutedText } : undefined}>{msg.time}</span>}
                          </div>
                        </motion.div>

                        {/* Quick reply chips */}
                        {msg.quickReplies && l && !isCust && idx === messages.length - 1 && !isTyping && (
                          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.15 }} className="flex flex-wrap gap-2 mt-3 ml-10">
                            {msg.quickReplies.map((qr) => (
                              <button
                                key={qr}
                                onClick={() => handleQuickReply(qr)}
                                className={`rounded-full px-4 py-2 text-[13px] font-medium border active:scale-95 transition-colors duration-150 touch-manipulation cursor-pointer ${
                                  dark
                                    ? "replyma-d-qr"
                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                                }`}
                                style={
                                  dark
                                    ? { backgroundColor: dark.quickReplyBg, color: dark.quickReplyText, borderColor: dark.quickReplyBorder }
                                    : undefined
                                }
                              >
                                {qr}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </div>
                    )
                  })}

                  {/* Typing indicator */}
                  {isTyping && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="flex items-end gap-2 mt-4">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ background: accentSurfaceBackground }}>
                        <Sparkles className="h-3.5 w-3.5" style={{ color: launcherGlyphColor }} />
                      </div>
                      <div
                        className={`flex items-center gap-1.5 rounded-2xl rounded-bl-sm shadow-sm border px-4 py-3.5 ${dark ? "" : "border-black/5 bg-white"}`}
                        style={dark ? { backgroundColor: dark.assistantBubble, borderColor: dark.quickReplyBorder } : undefined}
                      >
                        {[0, 1, 2].map((i) => (
                          <motion.span key={i} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dark ? dark.mutedText : "#94a3b8" }} animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Scroll to bottom */}
                {showScrollBtn && (
                  <div className="sticky bottom-4 flex justify-center pointer-events-none">
                    <button
                      onClick={scrollToEnd}
                      className={`pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full shadow-md transition-all duration-200 ${dark ? "replyma-d-scroll-btn" : "hover:shadow-lg"}`}
                      style={dark ? { backgroundColor: dark.assistantBubble, color: dark.assistantText } : { backgroundColor: "#ffffff", color: "#64748b" }}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

{/* Email collection */}
              {!emailCollected && customerMsgCount >= 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className={`border-t px-4 py-3 shrink-0 z-10 ${dark ? "" : "border-slate-100 bg-white"}`}
                  style={dark ? { backgroundColor: dark.panelBg, borderColor: dark.headerBorder } : undefined}
                >
                  <form onSubmit={(e) => { e.preventDefault(); if (customerEmail.includes("@")) setEmailCollected(true) }} className="flex items-center gap-2">
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="Your email (for follow-ups)"
                      className={`flex-1 min-w-0 rounded-lg border px-3 focus:outline-none focus:ring-2 transition-all replyma-d-input ${compactEmbedSizing ? "h-8 text-[12px]" : "h-9 text-[13px]"}`}
                      style={dark ? { backgroundColor: dark.inputBg, color: dark.inputText, borderColor: dark.inputBorder } : { borderColor: "#e2e8f0" }}
                    />
                    <button type="submit" disabled={!customerEmail.includes("@")} className={`rounded-lg px-3 h-9 text-[12px] font-semibold disabled:opacity-50 touch-manipulation shrink-0 transition-opacity cursor-pointer ${dark ? "replyma-d-send" : ""}`} style={{ background: accentSurfaceBackground, color: launcherGlyphColor }}>Save</button>
                    <button type="button" onClick={() => setEmailCollected(true)} className={`text-[12px] font-medium shrink-0 px-1 transition-colors cursor-pointer replyma-d-link ${dark ? "" : "text-slate-400 hover:text-slate-600"}`} style={dark ? { color: dark.mutedText } : undefined}>Skip</button>
                  </form>
                </motion.div>
              )}

              {/* Input */}
              <div
                className={`border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shrink-0 z-10 ${dark ? "" : "border-black/5 bg-white"}`}
                style={dark ? { backgroundColor: dark.panelBg, borderColor: dark.headerBorder } : undefined}
              >
                <form onSubmit={(e) => { e.preventDefault(); handleSend() }} className="relative flex items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Message..."
                    disabled={isTyping}
                    className={`w-full rounded-xl border pl-4 pr-12 focus:outline-none focus:ring-2 disabled:opacity-50 transition-all shadow-sm replyma-d-input ${compactEmbedSizing ? "h-10 text-[13px]" : "h-11 text-[14px]"}`}
                    style={dark ? { backgroundColor: dark.inputBg, color: dark.inputText, borderColor: dark.inputBorder } : { borderColor: "#e2e8f0" }}
                  />
                  <button type="submit" disabled={!input.trim() || isTyping} className={`absolute right-1.5 flex shrink-0 items-center justify-center rounded-lg active:scale-95 disabled:opacity-40 touch-manipulation transition-all h-8 w-8 shadow-sm cursor-pointer replyma-d-send ${dark ? "" : "hover:opacity-90"}`} style={{ background: accentSurfaceBackground, color: launcherGlyphColor }}>
                    <Send className="h-4 w-4 ml-0.5" />
                  </button>
                </form>
                <a href="https://replyma.com" target="_blank" rel="noopener noreferrer" className={`mt-2.5 flex items-center justify-center gap-1.5 text-[10px] font-medium transition-colors duration-200 replyma-d-link ${dark ? "" : "text-slate-400 hover:text-slate-600"}`} style={dark ? { color: dark.mutedText } : undefined}>
                  <Sparkles className="h-3 w-3" />
                  Powered by Replyma
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Launcher — in embed desktop: fixed-size slot at bottom-right so button never reflows when proactive appears */}
      <div
        className={`z-10 transition-opacity duration-200 ${
          embedMode && !embedMobile
            ? "fixed m-0 pb-[env(safe-area-inset-bottom)] flex flex-col items-end justify-end"
            : embedMode
              ? "fixed right-4 bottom-4 m-0 pb-[env(safe-area-inset-bottom)] flex flex-col items-end gap-4"
              : "relative m-4 sm:m-0 flex flex-col items-end gap-4"
        }`}
        style={{
          ...(open && (embedMode ? embedMobile : isPhoneViewport) ? { opacity: 0, visibility: "hidden" as const, pointerEvents: "none" } : {}),
          ...(embedMode && !embedMobile
            ? {
                right: EMBED_DESKTOP_LAUNCHER_INSET_PX,
                bottom: EMBED_DESKTOP_LAUNCHER_INSET_PX,
                width: 80,
                height: 80,
                minWidth: 80,
                minHeight: 80,
                background: "transparent",
                isolation: "isolate" as const,
                contain: "layout style" as const,
                overflow: "visible" as const,
                willChange: "transform" as const,
                transform: "translateZ(0)" as const,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                justifyContent: "flex-end",
              }
            : embedMode
              ? { background: "transparent", minWidth: 60, minHeight: 60, isolation: "isolate" as const, transform: "translateZ(0)" as const }
              : {}),
        }}
      >
        {/* Proactive card: theme colors; in embed desktop absolute above slot, resize iframe first so not clipped */}
        <AnimatePresence>
          {!open && proactiveShown && !proactiveDismissed && (
            <motion.div
              initial={noAnimation ? { opacity: 1 } : { opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={noAnimation ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.95 }}
              transition={noAnimation ? { duration: 0 } : { type: "spring", damping: 25, stiffness: 300 }}
              className={`group relative rounded-2xl rounded-br-sm px-5 py-4 border cursor-pointer ${
                embedMode && !embedMobile ? "w-[280px] max-w-[min(280px,calc(100vw-48px))]" : embedMode ? "max-w-[min(280px,calc(100%-24px))]" : "max-w-[280px]"
              }`}
              style={{
                backgroundColor: proactiveBackgroundColor ?? "#ffffff",
                borderColor: (() => {
                  const bg = proactiveBackgroundColor ?? "#ffffff"
                  const r = parseInt(bg.slice(1, 3), 16)
                  const g = parseInt(bg.slice(3, 5), 16)
                  const b = parseInt(bg.slice(5, 7), 16)
                  const yiq = (r * 299 + g * 587 + b * 114) / 1000
                  return yiq >= 160 ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.12)"
                })(),
                boxShadow: (() => {
                  const bg = proactiveBackgroundColor ?? "#ffffff"
                  const r = parseInt(bg.slice(1, 3), 16)
                  const g = parseInt(bg.slice(3, 5), 16)
                  const b = parseInt(bg.slice(5, 7), 16)
                  const yiq = (r * 299 + g * 587 + b * 114) / 1000
                  return yiq >= 160 ? "0 4px 20px rgba(0,0,0,0.08)" : "0 4px 20px rgba(0,0,0,0.25)"
                })(),
                ...(embedMode && !embedMobile
                  ? {
                      position: "absolute" as const,
                      bottom: "100%",
                      right: 0,
                      marginBottom: 4,
                      marginRight: 0,
                      transform: "none",
                      minWidth: 240,
                    }
                  : embedMode
                    ? { marginRight: 0, transform: "none" }
                    : { transform: "translateX(calc(30px - 50%))" }),
              }}
              onClick={handleLauncherOpen}
            >
              <button
                onClick={(e) => { e.stopPropagation(); setProactiveDismissed(true); setProactiveShown(false) }}
                className={`absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full border shadow-sm transition-all duration-200 cursor-pointer opacity-0 group-hover:opacity-100 ${dark ? "replyma-d-proactive-dismiss" : "hover:opacity-80"}`}
                style={{
                  backgroundColor: (() => {
                    const bg = proactiveBackgroundColor ?? "#ffffff"
                    const r = parseInt(bg.slice(1, 3), 16)
                    const g = parseInt(bg.slice(3, 5), 16)
                    const b = parseInt(bg.slice(5, 7), 16)
                    const yiq = (r * 299 + g * 587 + b * 114) / 1000
                    return yiq >= 160 ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.15)"
                  })(),
                  borderColor: proactiveSubtextColor ? `${proactiveSubtextColor}40` : "rgba(0,0,0,0.08)",
                  color: proactiveSubtextColor ?? "#64748b",
                }}
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <div className="relative flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full mt-0.5" style={{ background: accentSurfaceBackground }}>
                  <Sparkles className="h-4 w-4" style={{ color: launcherGlyphColor }} />
                </div>
                <div className="min-w-0 flex-1">
                  {proactiveMessage ? (
                    <p className="text-[14px] font-medium leading-snug whitespace-pre-wrap break-words" style={{ color: proactiveTextColor ?? "#1a1a1a" }}>{proactiveMessage}</p>
                  ) : (
                    <>
                      <p className="text-[14px] font-semibold leading-snug" style={{ color: proactiveTextColor ?? "#1a1a1a" }}>{proactiveTitle}</p>
                      <p className="text-[13px] mt-1 leading-snug" style={{ color: proactiveSubtextColor ?? "#64748b" }}>{proactiveSubtitle}</p>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative inline-flex items-center justify-center shrink-0" style={embedMode && !embedMobile ? { transform: "translateZ(0)" } : undefined}>
          <LauncherButton
            isOpen={open}
            onToggle={() => (open ? handleCloseChat() : handleLauncherOpen())}
            embedMode={embedMode}
            reducedMotion={!!noAnimation}
            background={accentSurfaceBackground}
            iconColor={launcherGlyphColor}
          />
        </div>
      </div>
    </div>
  )
}
