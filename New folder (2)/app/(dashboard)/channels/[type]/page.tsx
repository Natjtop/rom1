"use client"

import { use, useState, useEffect, useCallback } from "react"
import {
  Mail,
  MessageSquare,
  Radio,
  CheckCircle2,
  Circle,
  Loader2,
  X,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  Send,
  Shield,
  ArrowRight,
  ExternalLink,
  Maximize2,
  Minimize2,
} from "lucide-react"
import Link from "next/link"
import type { WidgetSettingsPayload } from "@/app/widget/[workspaceId]/widget-client"
import { cn, inputClass, btnAccent, btnSecondary } from "@/lib/utils"
import { toast } from "sonner"
import { ApiRequestError, channels as channelsApi } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { ChannelsTypeSkeleton } from "@/components/dashboard/skeleton"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"
const WIDGET_SCRIPT_VERSION = "v2-legacy"
const PUBLIC_MAILBOX_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "yahoo.com",
  "ymail.com",
  "aol.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "protonmail.com",
  "proton.me",
  "gmx.com",
  "mail.com",
  "yandex.com",
  "zoho.com",
])

function normalizeDomain(input: string): string {
  return input.trim().toLowerCase().replace(/\.+$/, "")
}

type AccentGradientId = "sunset" | "ocean" | "aurora"

type LiveChatThemePreset = {
  id: string
  name: string
  preview: string
  settings: {
    accentColor: string
    accentGradientPreset: AccentGradientId | "none"
    textIconColor?: string
  } & Partial<WidgetSettingsPayload>
}

// ─── Channel definitions ─────────────────────────────────────

const CHANNEL_DEFINITIONS: Record<string, {
  name: string
  icon: React.ElementType
  description: string
  setupInstructions: string
  fields: Array<{ label: string; key: string; type: string; placeholder: string }>
}> = {
  email: {
    name: "Email",
    icon: Mail,
    description: "Receive and respond to customer emails directly from Replyma.",
    setupInstructions: "",
    fields: [],
  },
  live_chat: {
    name: "Live Chat",
    icon: MessageSquare,
    description: "Embed the Replyma chat widget on your website.",
    setupInstructions: "Add this script tag before </body> on your website.",
    fields: [],
  },
}

// Ordered channel types for sidebar navigation
const CHANNEL_ORDER = ["email", "live_chat"]

// ─── Live Chat Widget Settings Component ──────────

// Matches replyma.com widget: accent #0a0a0a, white panel, black/neutral text. No dirty grays — use #1a2c44 for muted.
const WIDGET_THEME_DEFAULTS = {
  accentColor: "#0a0a0a",
  accentGradientPreset: "none",
  textIconColor: "#ffffff",
  headerTextColor: "#0a0a0a",
  headerSubtextColor: "#1a2c44",
  panelBackgroundColor: "#ffffff",
  assistantBubbleColor: "#ffffff",
  assistantTextColor: "#0a0a0a",
  userBubbleColor: "#0a0a0a",
  userTextColor: "#ffffff",
  inputBackgroundColor: "#f4f4f5",
  inputTextColor: "#0a0a0a",
  quickReplyBackgroundColor: "#ffffff",
  quickReplyTextColor: "#0a0a0a",
  quickReplyBorderColor: "#e5e7eb",
  launcherIconColor: "#ffffff",
  proactiveBackgroundColor: "#ffffff",
  proactiveTextColor: "#0a0a0a",
  proactiveSubtextColor: "#1a2c44",
} as const
const ACCENT_GRADIENTS: Array<{ id: "sunset" | "ocean" | "aurora"; name: string; preview: string }> = [
  { id: "sunset", name: "Sunset", preview: "linear-gradient(135deg, #ff3b00, #ff00a8)" },
  { id: "ocean", name: "Ocean", preview: "linear-gradient(135deg, #0047ff, #00e5ff)" },
  { id: "aurora", name: "Aurora", preview: "linear-gradient(135deg, #00d84a, #00b8ff)" },
]
const GRADIENT_SECOND_COLOR: Record<"sunset" | "ocean" | "aurora", string> = {
  sunset: "#ff00a8",
  ocean: "#00e5ff",
  aurora: "#00b8ff",
}
// Light themes (Replyma first, then alternatives)
const LIVECHAT_LIGHT_PRESETS: LiveChatThemePreset[] = [
  {
    id: "replyma",
    name: "Replyma",
    preview: "#0a0a0a",
    settings: {
      accentColor: "#0a0a0a",
      accentGradientPreset: "none",
      textIconColor: "#ffffff",
      headerTextColor: "#0a0a0a",
      headerSubtextColor: "#1a2c44",
      panelBackgroundColor: "#ffffff",
      assistantBubbleColor: "#ffffff",
      assistantTextColor: "#0a0a0a",
      userBubbleColor: "#0a0a0a",
      userTextColor: "#ffffff",
      inputBackgroundColor: "#f4f4f5",
      inputTextColor: "#0a0a0a",
      quickReplyBackgroundColor: "#ffffff",
      quickReplyTextColor: "#0a0a0a",
      quickReplyBorderColor: "#e5e7eb",
      launcherIconColor: "#ffffff",
      proactiveBackgroundColor: "#ffffff",
      proactiveTextColor: "#0a0a0a",
      proactiveSubtextColor: "#1a2c44",
    },
  },
  {
    id: "indigoPro",
    name: "Indigo Pro",
    preview: "#4f46e5",
    settings: {
      accentColor: "#4f46e5",
      accentGradientPreset: "none",
      textIconColor: "#ffffff",
      headerTextColor: "#1e293b",
      headerSubtextColor: "#1a2c44",
      panelBackgroundColor: "#ffffff",
      assistantBubbleColor: "#ffffff",
      assistantTextColor: "#1e293b",
      userBubbleColor: "#4f46e5",
      userTextColor: "#ffffff",
      inputBackgroundColor: "#f1f5f9",
      inputTextColor: "#1a2c44",
      quickReplyBackgroundColor: "#ffffff",
      quickReplyTextColor: "#3730a3",
      quickReplyBorderColor: "#e5e7eb",
      launcherIconColor: "#ffffff",
      proactiveBackgroundColor: "#ffffff",
      proactiveTextColor: "#1e293b",
      proactiveSubtextColor: "#1a2c44",
    },
  },
  {
    id: "slate",
    name: "Slate",
    preview: "#475569",
    settings: {
      accentColor: "#475569",
      accentGradientPreset: "none",
      textIconColor: "#ffffff",
      headerTextColor: "#1e293b",
      headerSubtextColor: "#1a2c44",
      panelBackgroundColor: "#f8fafc",
      assistantBubbleColor: "#ffffff",
      assistantTextColor: "#1e293b",
      userBubbleColor: "#475569",
      userTextColor: "#ffffff",
      inputBackgroundColor: "#f1f5f9",
      inputTextColor: "#1a2c44",
      quickReplyBackgroundColor: "#ffffff",
      quickReplyTextColor: "#1a2c44",
      quickReplyBorderColor: "#e5e7eb",
      launcherIconColor: "#ffffff",
      proactiveBackgroundColor: "#ffffff",
      proactiveTextColor: "#1e293b",
      proactiveSubtextColor: "#1a2c44",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    preview: "#0d9488",
    settings: {
      accentColor: "#0d9488",
      accentGradientPreset: "none",
      textIconColor: "#ffffff",
      headerTextColor: "#134e4a",
      headerSubtextColor: "#0d9488",
      panelBackgroundColor: "#f0fdfa",
      assistantBubbleColor: "#ffffff",
      assistantTextColor: "#134e4a",
      userBubbleColor: "#0d9488",
      userTextColor: "#ffffff",
      inputBackgroundColor: "#ccfbf1",
      inputTextColor: "#134e4a",
      quickReplyBackgroundColor: "#ffffff",
      quickReplyTextColor: "#0f766e",
      quickReplyBorderColor: "#99f6e4",
      launcherIconColor: "#ffffff",
      proactiveBackgroundColor: "#ffffff",
      proactiveTextColor: "#134e4a",
      proactiveSubtextColor: "#0d9488",
    },
  },
  {
    id: "forest",
    name: "Forest",
    preview: "#15803d",
    settings: {
      accentColor: "#15803d",
      accentGradientPreset: "none",
      textIconColor: "#ffffff",
      headerTextColor: "#14532d",
      headerSubtextColor: "#166534",
      panelBackgroundColor: "#f0fdf4",
      assistantBubbleColor: "#ffffff",
      assistantTextColor: "#14532d",
      userBubbleColor: "#15803d",
      userTextColor: "#ffffff",
      inputBackgroundColor: "#dcfce7",
      inputTextColor: "#166534",
      quickReplyBackgroundColor: "#ffffff",
      quickReplyTextColor: "#166534",
      quickReplyBorderColor: "#bbf7d0",
      launcherIconColor: "#ffffff",
      proactiveBackgroundColor: "#ffffff",
      proactiveTextColor: "#14532d",
      proactiveSubtextColor: "#16a34a",
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    preview: "#ea580c",
    settings: {
      accentColor: "#ea580c",
      accentGradientPreset: "none",
      textIconColor: "#ffffff",
      headerTextColor: "#9a3412",
      headerSubtextColor: "#c2410c",
      panelBackgroundColor: "#fff7ed",
      assistantBubbleColor: "#ffffff",
      assistantTextColor: "#9a3412",
      userBubbleColor: "#ea580c",
      userTextColor: "#ffffff",
      inputBackgroundColor: "#ffedd5",
      inputTextColor: "#9a3412",
      quickReplyBackgroundColor: "#ffffff",
      quickReplyTextColor: "#c2410c",
      quickReplyBorderColor: "#fed7aa",
      launcherIconColor: "#ffffff",
      proactiveBackgroundColor: "#ffffff",
      proactiveTextColor: "#9a3412",
      proactiveSubtextColor: "#ea580c",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    preview: "#6366f1",
    settings: {
      accentColor: "#6366f1",
      accentGradientPreset: "none",
      textIconColor: "#ffffff",
      headerTextColor: "#e2e8f0",
      headerSubtextColor: "#94a3b8",
      panelBackgroundColor: "#0f172a",
      assistantBubbleColor: "#1e293b",
      assistantTextColor: "#e2e8f0",
      userBubbleColor: "#6366f1",
      userTextColor: "#ffffff",
      inputBackgroundColor: "#1e293b",
      inputTextColor: "#e2e8f0",
      quickReplyBackgroundColor: "#1e293b",
      quickReplyTextColor: "#c7d2fe",
      quickReplyBorderColor: "#334155",
      launcherIconColor: "#ffffff",
      proactiveBackgroundColor: "#0f172a",
      proactiveTextColor: "#e2e8f0",
      proactiveSubtextColor: "#94a3b8",
    },
  },
  {
    id: "rose",
    name: "Rose",
    preview: "#e11d48",
    settings: {
      accentColor: "#e11d48",
      accentGradientPreset: "none",
      textIconColor: "#ffffff",
      headerTextColor: "#881337",
      headerSubtextColor: "#be123c",
      panelBackgroundColor: "#fff1f2",
      assistantBubbleColor: "#ffffff",
      assistantTextColor: "#881337",
      userBubbleColor: "#e11d48",
      userTextColor: "#ffffff",
      inputBackgroundColor: "#ffe4e6",
      inputTextColor: "#9f1239",
      quickReplyBackgroundColor: "#ffffff",
      quickReplyTextColor: "#be123c",
      quickReplyBorderColor: "#fecdd3",
      launcherIconColor: "#ffffff",
      proactiveBackgroundColor: "#ffffff",
      proactiveTextColor: "#881337",
      proactiveSubtextColor: "#e11d48",
    },
  },
  {
    id: "mint",
    name: "Mint",
    preview: "#10b981",
    settings: {
      accentColor: "#10b981",
      accentGradientPreset: "none",
      textIconColor: "#ffffff",
      headerTextColor: "#065f46",
      headerSubtextColor: "#059669",
      panelBackgroundColor: "#ecfdf5",
      assistantBubbleColor: "#ffffff",
      assistantTextColor: "#065f46",
      userBubbleColor: "#10b981",
      userTextColor: "#ffffff",
      inputBackgroundColor: "#d1fae5",
      inputTextColor: "#047857",
      quickReplyBackgroundColor: "#ffffff",
      quickReplyTextColor: "#059669",
      quickReplyBorderColor: "#a7f3d0",
      launcherIconColor: "#ffffff",
      proactiveBackgroundColor: "#ffffff",
      proactiveTextColor: "#065f46",
      proactiveSubtextColor: "#10b981",
    },
  },
  {
    id: "plum",
    name: "Plum",
    preview: "#7c3aed",
    settings: {
      accentColor: "#7c3aed",
      accentGradientPreset: "none",
      textIconColor: "#ffffff",
      headerTextColor: "#4c1d95",
      headerSubtextColor: "#6d28d9",
      panelBackgroundColor: "#faf5ff",
      assistantBubbleColor: "#ffffff",
      assistantTextColor: "#4c1d95",
      userBubbleColor: "#7c3aed",
      userTextColor: "#ffffff",
      inputBackgroundColor: "#ede9fe",
      inputTextColor: "#5b21b6",
      quickReplyBackgroundColor: "#ffffff",
      quickReplyTextColor: "#6d28d9",
      quickReplyBorderColor: "#e9d5ff",
      launcherIconColor: "#ffffff",
      proactiveBackgroundColor: "#ffffff",
      proactiveTextColor: "#4c1d95",
      proactiveSubtextColor: "#7c3aed",
    },
  },
]
// Dark themes: neutral white/grey accent. Muted text uses clean cool gray #94a3b8 (no dirty zinc #a1a1aa).
const LIVECHAT_DARK_PRESETS: LiveChatThemePreset[] = [
  {
    id: "obsidian",
    name: "Obsidian",
    preview: "#0c0c0c",
    settings: {
      accentColor: "#ffffff",
      accentGradientPreset: "none",
      textIconColor: "#0a0a0a",
      headerTextColor: "#fafafa",
      headerSubtextColor: "#94a3b8",
      panelBackgroundColor: "#0c0c0c",
      assistantBubbleColor: "#18181b",
      assistantTextColor: "#e4e4e7",
      userBubbleColor: "#ffffff",
      userTextColor: "#0a0a0a",
      inputBackgroundColor: "#27272a",
      inputTextColor: "#fafafa",
      quickReplyBackgroundColor: "#18181b",
      quickReplyTextColor: "#e4e4e7",
      quickReplyBorderColor: "#3f3f46",
      launcherIconColor: "#0a0a0a",
      proactiveBackgroundColor: "#0c0c0c",
      proactiveTextColor: "#e4e4e7",
      proactiveSubtextColor: "#94a3b8",
    },
  },
  {
    id: "navy",
    name: "Navy",
    preview: "#0c1929",
    settings: {
      accentColor: "#ffffff",
      accentGradientPreset: "none",
      textIconColor: "#0a0a0a",
      headerTextColor: "#f0f9ff",
      headerSubtextColor: "#94a3b8",
      panelBackgroundColor: "#0c1929",
      assistantBubbleColor: "#0f2744",
      assistantTextColor: "#e0f2fe",
      userBubbleColor: "#ffffff",
      userTextColor: "#0a0a0a",
      inputBackgroundColor: "#0f2744",
      inputTextColor: "#e0f2fe",
      quickReplyBackgroundColor: "#0f2744",
      quickReplyTextColor: "#e0f2fe",
      quickReplyBorderColor: "#1e3a5f",
      launcherIconColor: "#0a0a0a",
      proactiveBackgroundColor: "#0c1929",
      proactiveTextColor: "#e0f2fe",
      proactiveSubtextColor: "#94a3b8",
    },
  },
  {
    id: "forestNight",
    name: "Forest Night",
    preview: "#052e16",
    settings: {
      accentColor: "#ffffff",
      accentGradientPreset: "none",
      textIconColor: "#0a0a0a",
      headerTextColor: "#ecfdf5",
      headerSubtextColor: "#94a3b8",
      panelBackgroundColor: "#052e16",
      assistantBubbleColor: "#064e3b",
      assistantTextColor: "#d1fae5",
      userBubbleColor: "#ffffff",
      userTextColor: "#0a0a0a",
      inputBackgroundColor: "#064e3b",
      inputTextColor: "#d1fae5",
      quickReplyBackgroundColor: "#064e3b",
      quickReplyTextColor: "#d1fae5",
      quickReplyBorderColor: "#065f46",
      launcherIconColor: "#0a0a0a",
      proactiveBackgroundColor: "#052e16",
      proactiveTextColor: "#d1fae5",
      proactiveSubtextColor: "#94a3b8",
    },
  },
  {
    id: "wine",
    name: "Wine",
    preview: "#1a0a0f",
    settings: {
      accentColor: "#ffffff",
      accentGradientPreset: "none",
      textIconColor: "#0a0a0a",
      headerTextColor: "#fdf2f8",
      headerSubtextColor: "#94a3b8",
      panelBackgroundColor: "#1a0a0f",
      assistantBubbleColor: "#2d1520",
      assistantTextColor: "#fce7f3",
      userBubbleColor: "#ffffff",
      userTextColor: "#0a0a0a",
      inputBackgroundColor: "#2d1520",
      inputTextColor: "#fce7f3",
      quickReplyBackgroundColor: "#2d1520",
      quickReplyTextColor: "#fce7f3",
      quickReplyBorderColor: "#451a30",
      launcherIconColor: "#0a0a0a",
      proactiveBackgroundColor: "#1a0a0f",
      proactiveTextColor: "#fce7f3",
      proactiveSubtextColor: "#94a3b8",
    },
  },
  {
    id: "carbon",
    name: "Carbon",
    preview: "#171717",
    settings: {
      accentColor: "#ffffff",
      accentGradientPreset: "none",
      textIconColor: "#0a0a0a",
      headerTextColor: "#fafafa",
      headerSubtextColor: "#94a3b8",
      panelBackgroundColor: "#171717",
      assistantBubbleColor: "#262626",
      assistantTextColor: "#e4e4e7",
      userBubbleColor: "#ffffff",
      userTextColor: "#0a0a0a",
      inputBackgroundColor: "#262626",
      inputTextColor: "#fafafa",
      quickReplyBackgroundColor: "#262626",
      quickReplyTextColor: "#e4e4e7",
      quickReplyBorderColor: "#404040",
      launcherIconColor: "#0a0a0a",
      proactiveBackgroundColor: "#171717",
      proactiveTextColor: "#e4e4e7",
      proactiveSubtextColor: "#94a3b8",
    },
  },
]

function getReadableOnColor(value: string): string {
  const hex = value.replace("#", "")
  const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex
  if (full.length !== 6) return "#ffffff"
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 160 ? "#0f172a" : "#ffffff"
}

const LIVECHAT_PREVIEW_MESSAGES = [
  { id: "assistant-1", role: "assistant", text: "Hi there! I'm Replyma AI, ready to answer any question." },
  { id: "customer-1", role: "customer", text: "When will my order ship?" },
  { id: "assistant-2", role: "assistant", text: "Orders usually ship within 24 hours. Want a tracking link?" },
] as const

function LiveChatSettings({ workspaceId, copied, onCopyEmbed }: { workspaceId: string; copied: boolean; onCopyEmbed: () => void }) {
  const [settings, setSettings] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const mergedSettings: Record<string, any> = { ...WIDGET_THEME_DEFAULTS, ...settings }

  // Ensure hex colors always have # so preset comparison and preview render correctly
  function normalizeHexColors(obj: Record<string, any>): Record<string, any> {
    const hexKeys = ["accentColor", "textIconColor", "headerTextColor", "headerSubtextColor", "panelBackgroundColor", "assistantBubbleColor", "assistantTextColor", "userBubbleColor", "userTextColor", "inputBackgroundColor", "inputTextColor", "quickReplyBackgroundColor", "quickReplyTextColor", "quickReplyBorderColor", "launcherIconColor", "proactiveBackgroundColor", "proactiveTextColor", "proactiveSubtextColor"]
    const out = { ...obj }
    for (const key of hexKeys) {
      const v = out[key]
      if (typeof v === "string" && v.trim() && !v.startsWith("#")) {
        const raw = v.trim()
        if (/^[0-9a-fA-F]{3}$/.test(raw) || /^[0-9a-fA-F]{6}$/.test(raw)) out[key] = "#" + raw
      }
    }
    return out
  }

  useEffect(() => {
    channelsApi.getWidgetSettings().then((r) => {
      // If backend didn't return a saved theme (no accentColor), use Replyma default so preview isn't green/other
      const hasSavedTheme = r && typeof r === "object" && r.accentColor != null
      const merged = hasSavedTheme ? { ...WIDGET_THEME_DEFAULTS, ...normalizeHexColors(r as Record<string, any>) } : { ...WIDGET_THEME_DEFAULTS }
      setSettings(merged)
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      // Send mergedSettings so accentColor and all theme keys are always included (avoids theme not updating when only preset was applied)
      await channelsApi.updateWidgetSettings(mergedSettings)
      toast.success("Widget settings saved")
      toast("Appearance updates on customer sites can take a few minutes due to browser cache, CDN cache, and already-open chat sessions.")
    } catch { toast.error("Failed to save") }
    setSaving(false)
  }

  function update(key: string, value: unknown) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

function applyPreset(preset: LiveChatThemePreset) {
  const accentSource = preset.settings.accentGradientPreset === "none"
    ? preset.settings.accentColor
    : GRADIENT_SECOND_COLOR[preset.settings.accentGradientPreset]
  const paletteSource = accentSource || preset.settings.accentColor || "#0a0a0a"
  const textColor = preset.settings.textIconColor ?? getReadableOnColor(paletteSource)
  setSettings((prev) => ({ ...prev, ...preset.settings, textIconColor: textColor }))
}

  if (!loaded) return <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>

  return (
    <div className="flex flex-col gap-6">
      {/* Widget Appearance */}
      <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-5 space-y-4">
        <h3 className="text-[14px] font-semibold text-foreground">Widget Appearance</h3>

        {/* Theme Presets */}
        <div>
          <label className="mb-2 block text-[12px] font-medium text-muted-foreground">Theme Presets</label>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Light</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {LIVECHAT_LIGHT_PRESETS.map((preset) => {
                  const selected =
                    mergedSettings.accentGradientPreset === preset.settings.accentGradientPreset &&
                    mergedSettings.accentColor === preset.settings.accentColor &&
                    (mergedSettings.panelBackgroundColor ?? preset.settings.panelBackgroundColor) === preset.settings.panelBackgroundColor &&
                    (mergedSettings.assistantBubbleColor ?? preset.settings.assistantBubbleColor) === preset.settings.assistantBubbleColor
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className={cn("rounded-lg border px-2 py-2 text-left transition-colors", selected ? "border-foreground" : "border-border/60")}
                    >
                      <div className="mb-1 h-6 w-full rounded" style={{ background: preset.preview }} />
                      <span className="text-[11px] font-medium text-foreground">{preset.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Dark</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {LIVECHAT_DARK_PRESETS.map((preset) => {
                  const selected =
                    mergedSettings.accentGradientPreset === preset.settings.accentGradientPreset &&
                    mergedSettings.accentColor === preset.settings.accentColor &&
                    (mergedSettings.panelBackgroundColor ?? preset.settings.panelBackgroundColor) === preset.settings.panelBackgroundColor &&
                    (mergedSettings.assistantBubbleColor ?? preset.settings.assistantBubbleColor) === preset.settings.assistantBubbleColor
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className={cn("rounded-lg border px-2 py-2 text-left transition-colors", selected ? "border-foreground" : "border-border/60")}
                    >
                      <div className="mb-1 h-6 w-full rounded" style={{ background: preset.preview }} />
                      <span className="text-[11px] font-medium text-foreground">{preset.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-[11px] text-amber-900">
            Theme updates on customer sites can take a few minutes due to browser cache, CDN cache, and already-open chat sessions.
          </div>
        </div>

        {/* Assistant Name */}
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-muted-foreground">Assistant Name</label>
          <input
            type="text"
            value={mergedSettings.assistantName || ""}
            onChange={(e) => update("assistantName", e.target.value)}
            placeholder="AI Support"
            maxLength={20}
            className="h-10 sm:h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-[14px] sm:text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20"
          />
        </div>

        {/* Greeting */}
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-muted-foreground">Welcome Message</label>
          <textarea
            value={mergedSettings.greeting || ""}
            onChange={(e) => update("greeting", e.target.value)}
            placeholder="Hi! 👋 How can we help you today?"
            maxLength={500}
            rows={2}
            className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-[14px] sm:text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/20 resize-none"
          />
        </div>

        {/* Quick Replies */}
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-muted-foreground">Quick Replies (up to 5)</label>
          <div className="space-y-2">
            {(mergedSettings.quickReplies || []).map((reply: string, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={reply}
                  onChange={(e) => {
                    const arr = [...(mergedSettings.quickReplies || [])]
                    arr[i] = e.target.value
                    update("quickReplies", arr)
                  }}
                  maxLength={100}
                  className="h-9 flex-1 rounded-lg border border-border/60 bg-background px-3 text-[13px] text-foreground focus:border-accent/40 focus:outline-none"
                />
                <button
                  onClick={() => {
                    const arr = [...(mergedSettings.quickReplies || [])]
                    arr.splice(i, 1)
                    update("quickReplies", arr)
                  }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {(mergedSettings.quickReplies || []).length < 5 && (
              <button
                onClick={() => update("quickReplies", [...(mergedSettings.quickReplies || []), ""])}
                className="text-[12px] font-medium text-accent hover:text-accent/80 transition-colors"
              >
                + Add quick reply
              </button>
            )}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex h-10 sm:h-9 w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-[13px] font-semibold text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Save settings
        </button>
      </div>

      {/* Embed Code */}
      <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-5 space-y-3">
        <h3 className="text-[14px] font-semibold text-foreground">Embed Code</h3>
        <p className="text-[12px] text-muted-foreground">Place this code before the closing &lt;/body&gt; tag on your website.</p>
        <pre className="w-full overflow-x-auto rounded-lg border border-border/60 bg-background p-3 text-[12px] text-foreground font-mono leading-relaxed">
{`<script
  src="https://replyma.com/widget.js?v=${WIDGET_SCRIPT_VERSION}"
  data-workspace-id="${workspaceId}"
  async
></script>`}
        </pre>
        <button
          onClick={onCopyEmbed}
          className={cn(btnSecondary, "w-full sm:w-auto justify-center h-[44px] sm:h-9")}
        >
          {copied ? <><Check className="h-3.5 w-3.5 text-emerald-500" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy embed code</>}
        </button>
      </div>

      {/* Preview */}
      <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-5">
        <h3 className="text-[14px] font-semibold text-foreground mb-3">Preview</h3>
        <LiveChatPreview settings={mergedSettings} />
      </div>
    </div>
  )
}

/** Same chat icon as in live-chat-widget (star/burst) — used in preview launcher. */
function PreviewLauncherIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
    </svg>
  )
}

/** Bubble radius matching live-chat-widget bubbleRadius(): first/last per role. */
function previewBubbleRadius(isCustomer: boolean, first: boolean, last: boolean): string {
  if (first && last) return "rounded-2xl"
  if (isCustomer) return first ? "rounded-2xl rounded-br-lg" : last ? "rounded-2xl rounded-tr-lg" : "rounded-r-lg rounded-l-2xl"
  return first ? "rounded-2xl rounded-bl-lg" : last ? "rounded-2xl rounded-tl-lg" : "rounded-r-2xl rounded-l-lg"
}

function isDarkHex(hex: string): boolean {
  const h = (hex || "").replace("#", "")
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h
  if (full.length !== 6) return false
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 < 160
}

/** Preview: light theme = 1:1 widget (white/slate). Dark theme = full theme colors. */
function LiveChatPreview({ settings }: { settings: Record<string, any> }) {
  const accentGradient = ACCENT_GRADIENTS.find((g) => g.id === settings.accentGradientPreset)
  const accentSurfaceBackground = accentGradient?.preview || settings.accentColor || "#0a0a0a"
  const launcherGlyphColor = settings.launcherIconColor ?? settings.textIconColor ?? getReadableOnColor(settings.accentColor || "#0a0a0a")
  const userBubbleBg = accentGradient ? accentSurfaceBackground : (settings.userBubbleColor || settings.accentColor || "#0a0a0a")
  const userBubbleText = settings.userTextColor ?? launcherGlyphColor
  const previewReplies: string[] = (
    Array.isArray(settings.quickReplies) && settings.quickReplies.length > 0
      ? settings.quickReplies
      : ["Track my order", "Return or exchange"]
  ).slice(0, 2)

  const darkTheme = isDarkHex(settings.panelBackgroundColor || "#ffffff")
  const panelBg = settings.panelBackgroundColor || "#ffffff"
  const headerBg = darkTheme ? panelBg : "#ffffff"
  const headerText = darkTheme ? (settings.headerTextColor || "#fafafa") : "#0f172a"
  const headerSubtext = darkTheme ? (settings.headerSubtextColor || "#94a3b8") : "#1a2c44"
  const msgAreaBg = darkTheme ? panelBg : undefined
  const assistantBg = darkTheme ? (settings.assistantBubbleColor || "#18181b") : "#ffffff"
  const assistantText = darkTheme ? (settings.assistantTextColor || "#e4e4e7") : "#1e293b"
  const inputBg = darkTheme ? (settings.inputBackgroundColor || "#27272a") : undefined
  const inputText = darkTheme ? (settings.inputTextColor || "#fafafa") : undefined
  const quickBg = darkTheme ? (settings.quickReplyBackgroundColor || "#27272a") : undefined
  const quickBorder = darkTheme ? (settings.quickReplyBorderColor || "#3f3f46") : undefined
  const quickText = darkTheme ? (settings.quickReplyTextColor || "#e4e4e7") : undefined
  const footerColor = darkTheme ? (settings.headerSubtextColor || settings.proactiveSubtextColor || "#94a3b8") : undefined
  const borderColor = darkTheme ? (settings.quickReplyBorderColor || "rgba(255,255,255,0.08)") : undefined
  const btnMutedBg = darkTheme ? "rgba(255,255,255,0.1)" : undefined

  return (
    <div className="mx-auto w-full max-w-[360px]">
      <div
        className="relative flex flex-col overflow-hidden rounded-3xl flex-1 min-h-0 border"
        style={{
          backgroundColor: headerBg,
          borderColor: darkTheme ? borderColor : "rgba(0,0,0,0.08)",
          boxShadow: darkTheme ? "0 12px 40px -12px rgba(0,0,0,0.4)" : "0 12px 40px -12px rgba(0,0,0,0.15), 0 0 20px rgba(0,0,0,0.03)",
        }}
      >
        <div
          className="relative flex flex-col px-6 py-5 shrink-0 z-10 border-b"
          style={{
            backgroundColor: headerBg,
            borderColor: darkTheme ? borderColor : "rgba(0,0,0,0.05)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm"
                style={{ background: accentSurfaceBackground }}
              >
                <Sparkles className="h-5 w-5" style={{ color: launcherGlyphColor }} />
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[16px] font-semibold leading-tight truncate" style={{ color: headerText }}>{settings.assistantName || "Replyma AI"}</p>
                <p className="text-[13px] leading-tight mt-0.5" style={{ color: headerSubtext }}>Typically replies instantly</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: btnMutedBg ?? "rgb(241 245 249)", color: headerSubtext }}>
                <Maximize2 className="h-4 w-4" />
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: btnMutedBg ?? "rgb(241 245 249)", color: headerText }}>
                <X className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        <div
          className="relative flex-1 min-h-0"
          style={msgAreaBg ? { backgroundColor: msgAreaBg } : undefined}
        >
          <div className={`flex flex-col gap-1 p-5 pb-4 ${!msgAreaBg ? "bg-slate-50/50" : ""}`}>
            {LIVECHAT_PREVIEW_MESSAGES.map((msg, idx) => {
              const first = idx === 0 || LIVECHAT_PREVIEW_MESSAGES[idx - 1]?.role !== msg.role
              const last = idx === LIVECHAT_PREVIEW_MESSAGES.length - 1 || LIVECHAT_PREVIEW_MESSAGES[idx + 1]?.role !== msg.role
              const isCust = msg.role === "customer"
              const showSmallAvatar = !isCust && last
              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${isCust ? "justify-end" : "justify-start"} ${first ? "mt-4" : "mt-1"}`}
                >
                  {!isCust && (
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${showSmallAvatar ? "visible" : "invisible"}`}
                      style={{ background: accentSurfaceBackground }}
                    >
                      <Sparkles className="h-3.5 w-3.5" style={{ color: launcherGlyphColor }} />
                    </div>
                  )}
                  <div className="flex flex-col max-w-[80%]">
                    <div
                      className={`px-4 py-3 text-[14px] leading-relaxed whitespace-pre-wrap break-words shadow-sm ${previewBubbleRadius(isCust, first, last)} ${isCust ? "" : "border"}`}
                      style={{
                        ...(isCust ? { backgroundColor: userBubbleBg, color: userBubbleText } : { background: assistantBg, color: assistantText, borderColor: darkTheme ? (settings.quickReplyBorderColor || "rgba(255,255,255,0.08)") : "rgba(0,0,0,0.05)" }),
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                </div>
              )
            })}
            <div className="flex flex-wrap gap-2 mt-3 ml-10">
              {previewReplies.map((reply: string) => (
                <span
                  key={reply}
                  className="rounded-full px-4 py-2 text-[13px] font-medium border shadow-sm"
                  style={{
                    backgroundColor: quickBg ?? "white",
                    borderColor: quickBorder ?? "rgb(226 232 240)",
                    color: quickText ?? "rgb(51 65 85)",
                  }}
                >
                  {reply}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div
          className="border-t p-3 shrink-0 z-10"
          style={{
            backgroundColor: headerBg,
            borderColor: darkTheme ? borderColor : "rgba(0,0,0,0.05)",
          }}
        >
          <div className="relative flex items-center">
            <div
              className="w-full rounded-xl border pl-4 pr-12 h-11 text-[14px] shadow-sm flex items-center"
              style={{
                backgroundColor: inputBg ?? "white",
                color: inputText ?? "#0f172a",
                borderColor: darkTheme ? "rgba(255,255,255,0.12)" : "rgb(226 232 240)",
              }}
            >
              Message...
            </div>
            <div
              className="absolute right-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm"
              style={{ background: accentSurfaceBackground, color: launcherGlyphColor }}
            >
              <Send className="h-4 w-4 ml-0.5" />
            </div>
          </div>
          <a href="https://replyma.com" target="_blank" rel="noopener noreferrer" className="mt-2.5 flex items-center justify-center gap-1.5 text-[10px] font-medium" style={{ color: footerColor ?? "#94a3b8" }}>
            <Sparkles className="h-3 w-3" />
            Powered by Replyma
          </a>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full shadow-lg"
          style={{
            background: accentSurfaceBackground,
            color: launcherGlyphColor,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        >
          <PreviewLauncherIcon size={24} color="currentColor" />
        </div>
      </div>
    </div>
  )
}

export default function ChannelPage({
  params,
}: {
  params: Promise<{ type: string }>
}) {
  const { type } = use(params)
  const { workspace, user } = useAuth()
  const workspaceId = workspace?.id || "YOUR_WORKSPACE_ID"
  const [loading, setLoading] = useState(true)
  // Track connected status per channel from API
  const [connectedChannels, setConnectedChannels] = useState<Record<string, boolean>>({})
  // Track loaded credential values from API
  const [loadedCredentials, setLoadedCredentials] = useState<Record<string, Record<string, string>>>({})

  const channelDef = CHANNEL_DEFINITIONS[type] || CHANNEL_DEFINITIONS["email"]
  const isChannelConnected = connectedChannels[type] ?? false

  const [fieldValues, setFieldValues] = useState<Record<string, string>>(
    Object.fromEntries(channelDef.fields.map((f) => [f.key, ""]))
  )
  const [testState, setTestState] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [saveState, setSaveState] = useState<"idle" | "loading" | "saved">("idle")
  const [copied, setCopied] = useState(false)

  // ─── Email-specific state ─────────────────────────
  const [emailMode, setEmailMode] = useState<"managed" | "forwarding">("managed")
  const [emailStep, setEmailStep] = useState(1)
  const [emailFromAddress, setEmailFromAddress] = useState("")
  const [emailDisplayName, setEmailDisplayName] = useState("")
  const [forwardingAddress, setForwardingAddress] = useState("")
  const [forwardingConfirmed, setForwardingConfirmed] = useState(false)
  const [forwardingVerifyState, setForwardingVerifyState] = useState<"idle" | "loading" | "verified" | "failed">("idle")
  const [domainVerifyState, setDomainVerifyState] = useState<"idle" | "loading" | "verified" | "failed">("idle")
  const [dnsRecords, setDnsRecords] = useState<Array<{ type: string; name: string; value: string; verified: boolean }>>([])
  const [emailSetupLoading, setEmailSetupLoading] = useState(false)
  const [emailSetupComplete, setEmailSetupComplete] = useState(false)
  const [managedAddress, setManagedAddress] = useState("")
  const [managedDisplayName, setManagedDisplayName] = useState("")
  const [managedSetupLoading, setManagedSetupLoading] = useState(false)
  const [removeForwardingLoading, setRemoveForwardingLoading] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [connectedProvider, setConnectedProvider] = useState<{ provider: string; email: string; name: string; connectedAt: string } | null>(null)
  const [emailAccounts, setEmailAccounts] = useState<Array<{ id: string; provider: string; email: string; name: string; isDefault: boolean; connectedAt: string }>>([])
  const sendingDomain = normalizeDomain(emailFromAddress.split("@")[1] || "")
  const canVerifyDomain = !!sendingDomain && !PUBLIC_MAILBOX_DOMAINS.has(sendingDomain)
  const canManageEmailChannel = user?.role === "ADMIN"
  const forwardingConnected = emailMode === "forwarding" && !!emailFromAddress && forwardingVerifyState === "verified"
  const totalConnectedEmails = emailAccounts.length + (forwardingConnected ? 1 : 0)
  const isConnected = type === "email"
    ? !!managedAddress || forwardingConnected || emailAccounts.length > 0 || (connectedChannels.email ?? false)
    : isChannelConnected

  const fetchChannels = useCallback(async () => {
    try {
      setLoading(true)
      const result = await channelsApi.list()
      const apiChannels = Array.isArray(result) ? result : []
      const connected: Record<string, boolean> = {}
      const creds: Record<string, Record<string, string>> = {}

      for (const apiCh of apiChannels) {
        const apiType = ((apiCh.type as string) ?? "").toLowerCase()
        connected[apiType] = (apiCh.isEnabled as boolean) ?? true
        const credentials = (apiCh.credentials as Record<string, string>) ?? {}
        creds[apiType] = credentials
      }

      setConnectedChannels(connected)
      setLoadedCredentials(creds)
    } catch {
      // Keep defaults
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchChannels() }, [fetchChannels])

  // Fetch email channel status on mount or when switching to email
  const fetchEmailStatus = useCallback(async () => {
    try {
      const status = await channelsApi.getEmailStatus()
      console.log("[EMAIL STATUS]", JSON.stringify(status))
      setManagedAddress(status.forwardingAddress || "")
      setForwardingAddress(status.forwardingAddress || "")
      setManagedDisplayName(status.displayName || "")
      setEmailFromAddress(status.fromEmail || "")
      setEmailDisplayName(status.displayName || "")

      if (status.mode === "managed") {
        setEmailMode("managed")
        setEmailStep(1)
        setForwardingConfirmed(false)
        setForwardingVerifyState("idle")
        setDomainVerifyState(status.domainVerified ? "verified" : "idle")
        setDnsRecords(status.dnsRecords || [])
        setEmailSetupComplete(true)
      } else if (status.mode === "forwarding") {
        setEmailMode("forwarding")
        setForwardingVerifyState(status.forwardingVerified ? "verified" : "idle")
        setDomainVerifyState(status.domainVerified ? "verified" : "idle")
        if (status.dnsRecords) setDnsRecords(status.dnsRecords)
        if (status.forwardingVerified) {
          setEmailStep(1)
          setForwardingConfirmed(true)
        } else if (status.forwardingAddress) {
          setEmailStep(2)
        }
        setEmailSetupComplete(!!status.fromEmail || !!status.forwardingAddress || status.forwardingVerified)
      } else {
        setEmailMode("managed")
        setEmailStep(1)
        setForwardingConfirmed(false)
        setForwardingVerifyState("idle")
        setDomainVerifyState("idle")
        setDnsRecords([])
        setEmailSetupComplete(false)
      }
      const hasVerifiedForwarding = status.mode === "forwarding" && !!status.fromEmail && !!status.forwardingVerified
      const hasConnectedEmail = status.mode === "managed" || hasVerifiedForwarding || (status.accounts?.length || 0) > 0
      setConnectedChannels((prev) => ({ ...prev, email: hasConnectedEmail }))
      // Set multi-account data
      if (status.accounts && status.accounts.length > 0) {
        setEmailAccounts(status.accounts)
        const defaultAcc = status.accounts.find((a: any) => a.isDefault) || status.accounts[0]
        setConnectedProvider(defaultAcc ? { provider: defaultAcc.provider, email: defaultAcc.email, name: defaultAcc.name, connectedAt: defaultAcc.connectedAt } : null)
      } else {
        setEmailAccounts([])
        setConnectedProvider(null)
      }
    } catch {
      // No email set up yet — use defaults
    }
  }, [])

  useEffect(() => {
    if (type === "email") {
      fetchEmailStatus()
    }
  }, [type, fetchEmailStatus])

  // Pre-fill field values when channel type changes or credentials are loaded
  useEffect(() => {
    const def = CHANNEL_DEFINITIONS[type]
    if (!def) return
    const existingCreds = loadedCredentials[type] ?? {}
    setFieldValues(
      Object.fromEntries(def.fields.map((f) => [f.key, existingCreds[f.key] ?? ""]))
    )
    setTestState("idle")
    setSaveState("idle")
  }, [type, loadedCredentials])

  // ─── Email handler: managed setup ──────────────────
  const handleManagedSetup = async () => {
    setManagedSetupLoading(true)
    try {
      // Setup (may already exist — that's OK)
      try {
        await channelsApi.setupEmail({
          mode: "managed",
          displayName: managedDisplayName || undefined,
        })
      } catch {
        // Already set up — continue to fetch status
      }
      // Always fetch status to get the real address
      const status = await channelsApi.getEmailStatus()
      const addr = status?.forwardingAddress || ""
      if (addr) {
        setManagedAddress(addr)
        setManagedDisplayName(status?.displayName || managedDisplayName)
        setEmailMode("managed")
        setEmailSetupComplete(true)
        setConnectedChannels((prev) => ({ ...prev, email: true }))
        toast.success(`Your email: ${addr}`)
      } else {
        toast.error("Setup succeeded but no address returned. Please refresh.")
      }
    } catch (err) {
      toast.error("Failed to set up managed email")
    } finally {
      setManagedSetupLoading(false)
    }
  }

  // ─── Email handler: forwarding Step 1 → Step 2 ───
  const handleForwardingContinue = async () => {
    if (!emailFromAddress) {
      toast.error("Please enter your support email address")
      return
    }
    setEmailSetupLoading(true)
    try {
      const result = await channelsApi.setupEmail({
        mode: "forwarding",
        fromEmail: emailFromAddress,
        displayName: emailDisplayName || undefined,
      })
      setForwardingAddress(result.forwardingAddress)
      setEmailStep(2)
    } catch {
      toast.error("Failed to set up email forwarding")
    } finally {
      setEmailSetupLoading(false)
    }
  }

  // ─── Email handler: verify forwarding ─────────────
  const handleVerifyForwarding = async () => {
    if (!forwardingConfirmed) {
      toast.error("Please confirm that you have set up email forwarding")
      return
    }
    setForwardingVerifyState("loading")
    try {
      const result = await channelsApi.verifyForwarding()
      let verified = !!result.verified
      if (!verified) {
        // Forwarding verification can be delayed by provider routing.
        // Poll status for up to ~90s so user doesn't need to keep retrying manually.
        const maxAttempts = 30
        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
          await new Promise((resolve) => setTimeout(resolve, 3000))
          const status = await channelsApi.getEmailStatus()
          verified = !!status.forwardingVerified
          if (verified) break
        }
      }

      if (verified) {
        setForwardingVerifyState("verified")
        setConnectedChannels((prev) => ({ ...prev, email: true }))
        setEmailSetupComplete(true)
        toast.success("Email forwarding verified!")
        // Auto-advance to step 3 for domain verification
        if (canVerifyDomain) {
          try {
            const domainResult = await channelsApi.verifyDomain({
              domain: sendingDomain,
              sendingEmail: emailFromAddress,
            })
            setDnsRecords(domainResult.dnsRecords)
            if (domainResult.domainVerified) {
              setDomainVerifyState("verified")
            }
          } catch {
            // DNS records will be fetched in step 3
          }
        } else {
          setDnsRecords([])
          setDomainVerifyState("idle")
        }
        setEmailStep(3)
      } else {
        setForwardingVerifyState("failed")
        toast.error(result.message || "Forwarding not detected yet. Please check your email provider settings and try again in 1-2 minutes.")
      }
    } catch {
      setForwardingVerifyState("failed")
      toast.error("Verification failed. Please try again.")
    }
  }

  // ─── Email handler: check domain verification ─────
  const handleCheckDomainVerification = async () => {
    setDomainVerifyState("loading")
    try {
      const result = await channelsApi.getDomainVerificationStatus()
      setDnsRecords(result.dnsRecords)
      if (result.domainVerified) {
        setDomainVerifyState("verified")
        toast.success("Domain verified successfully!")
      } else {
        setDomainVerifyState("failed")
        toast.error("Domain not yet verified. DNS changes can take up to 48 hours to propagate.")
      }
    } catch {
      setDomainVerifyState("failed")
      toast.error("Failed to check domain verification")
    }
  }

  // ─── Copy helper for DNS / forwarding fields ──────
  const handleCopyField = (value: string, fieldId: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedField(fieldId)
      toast.success("Copied to clipboard")
      setTimeout(() => setCopiedField(null), 2000)
    }).catch(() => {
      toast.error("Failed to copy to clipboard")
    })
  }

  const handleTest = async () => {
    setTestState("loading")
    try {
      const channelType = type.toUpperCase()
      const fieldPayload: Record<string, string> = {}
      channelDef.fields.forEach((f) => { fieldPayload[f.key] = fieldValues[f.key] || "" })
      await channelsApi.configure(channelType, fieldPayload)
      setTestState("success")
      toast.success("Connection verified!")
      setConnectedChannels((prev) => ({ ...prev, [type]: true }))
    } catch {
      setTestState("error")
      toast.error("Connection failed — check your credentials")
    }
    setTimeout(() => setTestState("idle"), 3000)
  }

  const handleSave = async () => {
    setSaveState("loading")
    try {
      const channelType = type.toUpperCase()
      await channelsApi.configure(channelType, fieldValues as Record<string, unknown>)
      setConnectedChannels((prev) => ({ ...prev, [type]: true }))
      setSaveState("saved")
      toast.success(`${channelDef.name} configuration saved`)
      setTimeout(() => setSaveState("idle"), 2000)
    } catch {
      setSaveState("idle")
      toast.error(`Failed to save ${channelDef.name} configuration`)
    }
  }

  const handleDisconnect = async () => {
    try {
      await channelsApi.delete(type)
      setConnectedChannels((prev) => ({ ...prev, [type]: false }))
      toast.success(`${channelDef.name} disconnected`)
    } catch {
      toast.error(`Failed to disconnect ${channelDef.name}`)
    }
  }

  const handleRemoveForwardingEmail = async () => {
    if (!canManageEmailChannel) {
      toast.error("Only workspace admins can remove forwarding email")
      return
    }
    try {
      setRemoveForwardingLoading(true)
      await channelsApi.removeForwardingEmail()
      toast.success("Forwarding email removed")
      await Promise.all([fetchEmailStatus(), fetchChannels()])
    } catch (error) {
      if (error instanceof ApiRequestError) {
        toast.error(error.message || "Failed to remove forwarding email")
      } else {
        toast.error("Failed to remove forwarding email")
      }
    } finally {
      setRemoveForwardingLoading(false)
    }
  }

  const handleCopyEmbed = () => {
    const embedCode = `<script src="https://replyma.com/widget.js?v=${WIDGET_SCRIPT_VERSION}" data-workspace-id="${workspaceId}" async></script>`
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopied(true)
      toast.success("Embed code copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      toast.error("Failed to copy to clipboard")
    })
  }

  const Icon = channelDef.icon

  if (loading) {
    return <ChannelsTypeSkeleton />
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8">

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-[20px] sm:text-[22px] font-semibold text-foreground tracking-tight">Channels</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Connect and manage your communication channels.
          </p>
        </div>

        {/* Mobile channel selector -- horizontal scrollable tabs, hidden on lg+ */}
        <div className="mb-4 lg:hidden overflow-x-auto -mx-4 px-4 sm:-mx-6 sm:px-6 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
          <nav className="flex gap-1.5 min-w-max pb-2" aria-label="Channel navigation">
            {CHANNEL_ORDER.map((chType) => {
              const def = CHANNEL_DEFINITIONS[chType]
              if (!def) return null
              const ChIcon = def.icon
              const isActive = type === chType
              const connected = connectedChannels[chType] ?? false
              return (
                <Link
                  key={chType}
                  href={`/channels/${chType}`}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 text-[12px] whitespace-nowrap transition-colors duration-150 cursor-pointer h-[44px]",
                    isActive
                      ? "bg-secondary text-foreground font-medium ring-1 ring-border/80"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  )}
                >
                  <ChIcon className="h-4 w-4 shrink-0" />
                  <span>{def.name}</span>
                  {connected ? (
                    <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" />
                  ) : (
                    <Circle className="h-3 w-3 shrink-0 text-border" />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex gap-0 lg:gap-5">
          {/* Sidebar nav -- hidden on mobile, visible on lg+ */}
          <div className="hidden lg:block lg:w-[210px] shrink-0">
            <nav className="flex flex-col gap-0.5" aria-label="Channel navigation">
              {CHANNEL_ORDER.map((chType) => {
                const def = CHANNEL_DEFINITIONS[chType]
                if (!def) return null
                const ChIcon = def.icon
                const isActive = type === chType
                const connected = connectedChannels[chType] ?? false
                return (
                  <Link
                    key={chType}
                    href={`/channels/${chType}`}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors duration-150 cursor-pointer",
                      isActive
                        ? "bg-secondary text-foreground font-medium"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                    )}
                  >
                    <ChIcon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">{def.name}</span>
                    {connected ? (
                      <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" />
                    ) : (
                      <Circle className="h-3 w-3 shrink-0 text-border" />
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Config panel -- full-width on mobile */}
          <div className="flex-1 min-w-0 w-full">
            <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-5">

              {/* Channel header -- stacks vertically on mobile */}
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background">
                    <Icon className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-foreground">{channelDef.name}</p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground leading-snug">
                      {channelDef.description}
                    </p>
                  </div>
                </div>

                {/* Status badge — hide for live_chat (always available) */}
                {type !== "live_chat" && (
                  isConnected ? (
                    <span className="inline-flex self-start shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Connected
                    </span>
                  ) : (
                    <span className="inline-flex self-start shrink-0 items-center gap-1.5 rounded-full border border-border/60 bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-border" />
                      Not connected
                    </span>
                  )
                )}
              </div>

              {/* Divider */}
              <div className="mb-5 border-t border-border/60" />

              {/* Setup instructions */}
              {channelDef.setupInstructions && (
                <div className="mb-5 flex items-start gap-2 rounded-lg border border-border/40 bg-secondary/30 px-3 py-2.5">
                  <AlertCircle className="h-4 w-4 text-muted-foreground/60 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-muted-foreground leading-relaxed">
                    {channelDef.setupInstructions}
                  </p>
                </div>
              )}

              {/* ── EMAIL: Gorgias-like setup flow ─────────── */}
              {type === "email" ? (
                <>
                {/* Connected email accounts list */}
                {totalConnectedEmails > 0 && (
                  <div className="mb-5 space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[12px] font-semibold text-muted-foreground">Connected emails ({totalConnectedEmails}/5)</p>
                    </div>
                    {forwardingConnected && (
                      <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-3 sm:flex-row sm:items-center sm:gap-3 transition-all">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                          <Mail className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <p className="truncate text-[13px] font-medium text-foreground">{emailFromAddress}</p>
                            <span className="shrink-0 rounded bg-emerald-500/10 px-1.5 py-px text-[9px] font-semibold text-emerald-700">Forwarding</span>
                          </div>
                          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                            Routed via Replyma inbound address
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-center">
                          <button
                            onClick={handleRemoveForwardingEmail}
                            disabled={removeForwardingLoading || !canManageEmailChannel}
                            title={canManageEmailChannel ? "Remove forwarding email" : "Only workspace admins can remove forwarding email"}
                            className="rounded-md border border-border/60 px-2 py-1 text-[11px] font-medium text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {removeForwardingLoading ? "Removing..." : "Remove"}
                          </button>
                        </div>
                      </div>
                    )}
                    {emailAccounts.map((acc) => (
                      <div key={acc.id} className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-3 sm:flex-row sm:items-center sm:gap-3 transition-all">
                        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", acc.provider === "gmail" ? "bg-red-500/10" : acc.provider === "microsoft" ? "bg-blue-500/10" : "bg-emerald-500/10")}>
                          {acc.provider === "gmail" ? (
                            <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                          ) : acc.provider === "microsoft" ? (
                            <svg className="h-4 w-4" viewBox="0 0 23 23"><path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/></svg>
                          ) : (
                            <Mail className="h-4 w-4 text-emerald-600" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <p className="truncate text-[13px] font-medium text-foreground">{acc.email}</p>
                            {acc.isDefault && <span className="shrink-0 rounded bg-accent/10 px-1.5 py-px text-[9px] font-semibold text-accent">Default</span>}
                          </div>
                          <p className="text-[11px] text-muted-foreground capitalize">{acc.provider === "microsoft" ? "Microsoft 365" : acc.provider}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-center">
                          {!acc.isDefault && (
                            <button
                              onClick={async () => {
                                try {
                                  await channelsApi.setDefaultEmailAccount(acc.id)
                                  toast.success("Set as default")
                                  fetchEmailStatus()
                                } catch { toast.error("Failed to set default") }
                              }}
                              className="rounded-md border border-border/60 px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary"
                            >
                              Set default
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              try {
                                await channelsApi.removeEmailAccount(acc.id)
                                toast.success("Email disconnected")
                                fetchEmailStatus()
                              } catch { toast.error("Failed to disconnect") }
                            }}
                            className="rounded-md border border-border/60 px-2 py-1 text-[11px] font-medium text-red-500 transition-colors hover:bg-red-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Gmail/Microsoft Quick Connect — show when under 5 accounts */}
                {emailAccounts.length < 5 && <>
                <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2 text-[11px] text-blue-700 leading-relaxed">
                  <strong>Tip:</strong> Use Gmail for @gmail.com addresses. Use Microsoft 365 for @outlook.com, @hotmail.com, or corporate Microsoft email.
                </div>
                <div className="mb-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={async () => {
                      try {
                        const data = await channelsApi.gmailAuth()
                        if (data.url) window.location.href = data.url
                      } catch { toast.error("Failed to start Gmail connection") }
                    }}
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-border hover:shadow-[0_4px_12px_-4px_rgb(0_0_0/0.06)] cursor-pointer text-left"
                    aria-label="Connect Gmail (Unverified)"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                      <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-foreground">Connect Gmail (Unverified)</p>
                      <p className="text-[11px] text-muted-foreground">Read and send via Gmail</p>
                    </div>
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const data = await channelsApi.microsoftAuth()
                        if (data.url) window.location.href = data.url
                      } catch { toast.error("Failed to start Microsoft connection") }
                    }}
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-border hover:shadow-[0_4px_12px_-4px_rgb(0_0_0/0.06)] cursor-pointer text-left"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                      <svg className="h-5 w-5" viewBox="0 0 23 23"><path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/></svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-foreground">Microsoft 365</p>
                      <p className="text-[11px] text-muted-foreground">Read and send via Outlook / Microsoft 365</p>
                    </div>
                  </button>
                </div>
                </>}

                {emailAccounts.length < 5 && <div className="mb-4 flex items-center gap-3">
                  <div className="flex-1 h-px bg-border/60" />
                  <span className="text-[11px] text-muted-foreground/50 select-none">or set up manually</span>
                  <div className="flex-1 h-px bg-border/60" />
                </div>}

                <Tabs
                  value={emailMode}
                  onValueChange={(v) => {
                    setEmailMode(v as "managed" | "forwarding")
                    setEmailStep(1)
                    setForwardingVerifyState("idle")
                    setDomainVerifyState("idle")
                  }}
                  className="w-full"
                >
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="managed" className="text-[12px] sm:text-[13px]">
                      <Mail className="h-3.5 w-3.5 mr-1.5" />
                      Replyma Email
                    </TabsTrigger>
                    <TabsTrigger value="forwarding" className="text-[12px] sm:text-[13px]">
                      <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                      Email Forwarding
                    </TabsTrigger>
                  </TabsList>

                  {/* ── Mode 1: Managed Replyma Email ───────── */}
                  <TabsContent value="managed" className="mt-4">
                    <div className="rounded-lg border border-border/40 bg-secondary/20 p-4 sm:p-5">
                      {managedAddress ? (
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                            <p className="text-[14px] font-semibold text-foreground">
                              Your Replyma email is active
                            </p>
                          </div>
                          <div>
                            <label className="mb-1.5 block text-[12px] font-medium text-muted-foreground">
                              Your email address
                            </label>
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="min-w-0 flex-1 truncate rounded-lg border border-border/60 bg-background px-3 py-2 text-[13px] text-foreground font-mono">
                                {managedAddress}
                              </div>
                              <button
                                onClick={() => handleCopyField(managedAddress, "managed-address")}
                                className="shrink-0 flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 text-foreground transition-colors hover:bg-secondary/60"
                              >
                                {copiedField === "managed-address" ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                          {managedDisplayName && (
                            <div>
                              <label className="mb-1.5 block text-[12px] font-medium text-muted-foreground">
                                Display name
                              </label>
                              <p className="text-[13px] text-foreground">{managedDisplayName}</p>
                            </div>
                          )}
                          <div className="rounded-lg border border-border/40 bg-background p-3 mt-1">
                            <p className="text-[12px] font-semibold text-foreground mb-1.5">What&apos;s next?</p>
                            <ul className="text-[12px] text-muted-foreground space-y-1 leading-relaxed">
                              <li>1. Copy the address above and share it with customers</li>
                              <li>2. Add it to your website contact page or help center</li>
                              <li>3. Emails sent to this address will appear in your Inbox automatically</li>
                              <li>4. The AI will process and respond to routine questions</li>
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          <div>
                            <p className="text-[14px] font-semibold text-foreground">
                              Get a free Replyma email address
                            </p>
                            <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed">
                              Instantly get an @email.replyma.com address to start receiving customer emails. No DNS changes required.
                            </p>
                          </div>
                          <div>
                            <label className="mb-1.5 block text-[12px] font-medium text-foreground">
                              Display Name (optional)
                            </label>
                            <input
                              type="text"
                              value={managedDisplayName}
                              onChange={(e) => setManagedDisplayName(e.target.value)}
                              placeholder="e.g. Your Company Support"
                              className={cn(inputClass, "w-full h-11 sm:h-9")}
                            />
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              This name appears as the sender when you reply to customers.
                            </p>
                          </div>
                          <div className="flex items-start gap-2 rounded-lg border border-border/40 bg-background px-3 py-2.5">
                            <Mail className="h-4 w-4 text-muted-foreground/60 shrink-0 mt-0.5" />
                            <p className="text-[12px] text-muted-foreground leading-relaxed">
                              You will receive a unique @email.replyma.com address after setup
                            </p>
                          </div>
                          <button
                            onClick={handleManagedSetup}
                            disabled={managedSetupLoading}
                            className={cn(
                              btnAccent,
                              "disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center h-[44px] sm:h-9"
                            )}
                          >
                            {managedSetupLoading ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Setting up...
                              </>
                            ) : (
                              <>
                                <Mail className="h-3.5 w-3.5" />
                                Set Up
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* ── Mode 2: Connect Your Email (Forwarding) ─ */}
                  <TabsContent value="forwarding" className="mt-4">
                    {emailFromAddress && (
                      forwardingVerifyState === "verified" ? (
                        <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-700">
                          <CheckCircle2 className="h-4 w-4 shrink-0" />
                          <span>
                            Forwarding email connected: <span className="font-semibold">{emailFromAddress}</span>
                          </span>
                        </div>
                      ) : (
                        <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-700">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>
                            Forwarding pending verification: <span className="font-semibold">{emailFromAddress}</span>
                          </span>
                        </div>
                      )
                    )}
                    {/* Step indicators */}
                    <div className="mb-5 flex items-center gap-2">
                      {[1, 2, 3].map((step) => (
                        <div key={step} className="flex items-center gap-2">
                          <div
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-medium transition-colors",
                              emailStep >= step
                                ? "bg-accent text-white"
                                : "bg-secondary text-muted-foreground border border-border/60"
                            )}
                          >
                            {emailStep > step ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              step
                            )}
                          </div>
                          {step < 3 && (
                            <div
                              className={cn(
                                "h-px w-8 sm:w-12 transition-colors",
                                emailStep > step ? "bg-accent" : "bg-border"
                              )}
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* ── Step 1: Enter email details ──────── */}
                    {emailStep === 1 && (
                      <div className="flex flex-col gap-4">
                        <div>
                          <p className="text-[14px] font-medium text-foreground">
                            Enter your email details
                          </p>
                          <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed">
                            Tell us which email address your customers write to.
                          </p>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-[12px] font-medium text-foreground">
                            Support email
                          </label>
                          <input
                            type="email"
                            value={emailFromAddress}
                            onChange={(e) => setEmailFromAddress(e.target.value)}
                            placeholder="support@yourcompany.com"
                            className={cn(inputClass, "w-full h-11 sm:h-9")}
                          />
                          <div className="mt-1.5 flex items-start gap-1.5">
                            <AlertCircle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-amber-600">
                              Please add a work email. We don&apos;t recommend using a personal email address.
                            </p>
                          </div>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-[12px] font-medium text-foreground">
                            Display name
                          </label>
                          <input
                            type="text"
                            value={emailDisplayName}
                            onChange={(e) => setEmailDisplayName(e.target.value)}
                            placeholder="Your Company Support"
                            className={cn(inputClass, "w-full h-11 sm:h-9")}
                          />
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            This name appears as the sender when you reply to customers.
                          </p>
                        </div>

                        {/* Email preview */}
                        {emailFromAddress && (
                          <div className="rounded-lg border border-border/40 bg-background p-3 sm:p-4">
                            <p className="mb-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                              Preview
                            </p>
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                                <Mail className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-medium text-foreground truncate">
                                  {emailDisplayName || "Your Company Support"}
                                </p>
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {emailFromAddress}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="mt-2">
                          <button
                            onClick={handleForwardingContinue}
                            disabled={!emailFromAddress || emailSetupLoading}
                            className={cn(
                              btnAccent,
                              "disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center h-[44px] sm:h-9"
                            )}
                          >
                            {emailSetupLoading ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Setting up...
                              </>
                            ) : (
                              <>
                                Continue
                                <ArrowRight className="h-3.5 w-3.5" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── Step 2: Set up email forwarding ──── */}
                    {emailStep === 2 && (
                      <div className="flex flex-col gap-4">
                        <div>
                          <p className="text-[14px] font-semibold text-foreground">
                            Set up email forwarding
                          </p>
                          <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed">
                            Forward emails from <span className="font-medium text-foreground">{emailFromAddress}</span> to your unique Replyma address.
                          </p>
                        </div>

                        {/* Forwarding address with copy */}
                        <div>
                          <label className="mb-1.5 block text-[12px] font-medium text-foreground">
                            Your Replyma forwarding address
                          </label>
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="min-w-0 flex-1 truncate rounded-lg border border-border/60 bg-background px-3 py-2 text-[13px] text-foreground font-mono">
                              {forwardingAddress || managedAddress || "Setting up..."}
                            </div>
                            <button
                              onClick={() => handleCopyField(forwardingAddress || managedAddress || "", "forwarding-address")}
                              disabled={!forwardingAddress && !managedAddress}
                              className="shrink-0 flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 text-foreground transition-colors hover:bg-secondary/60"
                            >
                              {copiedField === "forwarding-address" ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Instructions box */}
                        <div className="rounded-lg border border-border/40 bg-secondary/20 px-3 py-3 sm:px-4">
                          <p className="text-[12px] font-medium text-foreground mb-2">Set up forwarding in your email provider:</p>
                          <ol className="text-[12px] text-muted-foreground leading-relaxed list-decimal pl-4 space-y-1.5 mb-3">
                            <li>Copy your Replyma forwarding address above.</li>
                            <li>Follow the guide for your provider below.</li>
                            <li>Confirm the forwarding in your email provider if required.</li>
                          </ol>

                          {/* Provider-specific guides */}
                          <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="gmail" className="border-border/40">
                              <AccordionTrigger className="py-2.5 text-[12px] font-semibold text-foreground hover:no-underline">
                                Gmail
                              </AccordionTrigger>
                              <AccordionContent className="text-[12px] text-muted-foreground leading-relaxed">
                                <ol className="list-decimal pl-4 space-y-1.5">
                                  <li>Open Gmail Settings (gear icon in the top-right corner).</li>
                                  <li>Go to the <span className="font-medium text-foreground">&quot;Forwarding and POP/IMAP&quot;</span> tab.</li>
                                  <li>Click <span className="font-medium text-foreground">&quot;Add a forwarding address&quot;</span>.</li>
                                  <li>Enter your Replyma forwarding address and click <span className="font-medium text-foreground">&quot;Next&quot;</span>.</li>
                                  <li>Click <span className="font-medium text-foreground">&quot;Proceed&quot;</span> in the confirmation dialog.</li>
                                  <li>Replyma will automatically verify the address. Select <span className="font-medium text-foreground">&quot;Forward a copy of incoming mail to&quot;</span> and save changes.</li>
                                </ol>
                              </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="outlook" className="border-border/40">
                              <AccordionTrigger className="py-2.5 text-[12px] font-semibold text-foreground hover:no-underline">
                                Outlook / Microsoft 365
                              </AccordionTrigger>
                              <AccordionContent className="text-[12px] text-muted-foreground leading-relaxed">
                                <ol className="list-decimal pl-4 space-y-1.5">
                                  <li>Go to <span className="font-medium text-foreground">Settings &rarr; Mail &rarr; Forwarding</span>.</li>
                                  <li>Enable <span className="font-medium text-foreground">&quot;Enable forwarding&quot;</span>.</li>
                                  <li>Enter your Replyma forwarding address in the <span className="font-medium text-foreground">&quot;Forward my email to&quot;</span> field.</li>
                                  <li>Optionally check <span className="font-medium text-foreground">&quot;Keep a copy of forwarded messages&quot;</span> to keep emails in Outlook.</li>
                                  <li>Click <span className="font-medium text-foreground">&quot;Save&quot;</span>.</li>
                                </ol>
                              </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="other" className="border-border/40 border-b-0">
                              <AccordionTrigger className="py-2.5 text-[12px] font-semibold text-foreground hover:no-underline">
                                Other providers
                              </AccordionTrigger>
                              <AccordionContent className="text-[12px] text-muted-foreground leading-relaxed">
                                <p>
                                  Look for <span className="font-medium text-foreground">&quot;Email forwarding&quot;</span> or <span className="font-medium text-foreground">&quot;Mail routing&quot;</span> in your email provider&apos;s settings. Add your Replyma forwarding address as the destination and save the changes. Most providers will send a verification email to confirm the forwarding.
                                </p>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>

                          <a
                            href="https://replyma.com/help-center/email-forwarding-setup"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-[12px] text-accent hover:underline"
                          >
                            View detailed guide
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>

                        {/* Confirmation checkbox */}
                        <div className="flex items-start gap-2.5">
                          <Checkbox
                            id="forwarding-confirmed"
                            checked={forwardingConfirmed}
                            onCheckedChange={(checked) => setForwardingConfirmed(checked === true)}
                            className="mt-0.5"
                          />
                          <label htmlFor="forwarding-confirmed" className="text-[12px] text-foreground leading-relaxed cursor-pointer">
                            I confirm that I have set up email forwarding to the address above
                          </label>
                        </div>

                        {/* Verification status */}
                        {forwardingVerifyState === "verified" && (
                          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-[13px] text-emerald-600">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            <span>Forwarding verified!</span>
                          </div>
                        )}
                        {forwardingVerifyState === "failed" && (
                          <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-[13px] text-destructive">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>Not yet verified. Please check your forwarding settings and try again.</span>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                          <button
                            onClick={() => setEmailStep(1)}
                            className={cn(btnSecondary, "w-full sm:w-auto justify-center h-[44px] sm:h-9")}
                          >
                            Back
                          </button>
                          <button
                            onClick={handleVerifyForwarding}
                            disabled={!forwardingConfirmed || forwardingVerifyState === "loading"}
                            className={cn(
                              btnAccent,
                              "disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center h-[44px] sm:h-9"
                            )}
                          >
                            {forwardingVerifyState === "loading" ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Verify Forwarding
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── Step 3: Verify domain (optional) ── */}
                    {emailStep === 3 && (
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-[14px] font-semibold text-foreground">
                                Verify your domain
                              </p>
                              <Badge variant="secondary" className="text-[10px]">Optional</Badge>
                            </div>
                            <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed">
                              Verify your domain to improve email deliverability and prevent your replies from landing in spam.
                            </p>
                          </div>
                        </div>

                        {/* Domain verification status */}
                        {domainVerifyState === "verified" ? (
                          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-[13px] text-emerald-600">
                            <Shield className="h-4 w-4 shrink-0" />
                            <span>Domain verified! Your emails will be sent with full authentication.</span>
                          </div>
                        ) : (
                          <>
                            {/* Info box */}
                            <div className="flex items-start gap-2 rounded-lg border border-border/40 bg-secondary/20 px-3 py-2.5">
                              <Shield className="h-4 w-4 text-muted-foreground/60 shrink-0 mt-0.5" />
                              <p className="text-[12px] text-muted-foreground leading-relaxed">
                                {canVerifyDomain ? (
                                  <>Add the following DNS records to your domain&apos;s DNS settings. This authenticates Replyma to send emails on behalf of <span className="font-medium text-foreground">{sendingDomain || "yourdomain.com"}</span>.</>
                                ) : (
                                  <>Domain verification is not available for public mailbox providers like <span className="font-medium text-foreground">{sendingDomain || "gmail.com"}</span>. Your email channel still works; this step is optional.</>
                                )}
                              </p>
                            </div>

                            {/* DNS records table */}
                            {canVerifyDomain && (
                              <div className="rounded-lg border border-border/60 overflow-hidden">
                                <div className="overflow-x-auto">
                                  <table className="w-full text-[12px]">
                                    <thead>
                                      <tr className="border-b border-border/60 bg-secondary/30">
                                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Type</th>
                                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Name</th>
                                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Value</th>
                                        <th className="px-3 py-2 text-left font-medium text-muted-foreground w-[80px]">Status</th>
                                        <th className="px-3 py-2 w-[50px]"></th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(dnsRecords.length > 0 ? dnsRecords : [
                                        { type: "INFO", name: "—", value: "DNS records will appear after domain verification is initiated via AWS SES.", verified: false },
                                      ]).map((record, i) => (
                                        <tr key={i} className="border-b border-border/40 last:border-b-0">
                                          <td className="px-3 py-2.5">
                                            <Badge variant="outline" className="text-[10px] font-mono">
                                              {record.type}
                                            </Badge>
                                          </td>
                                          <td className="px-3 py-2.5 font-mono text-foreground max-w-[200px] truncate">
                                            {record.name}
                                          </td>
                                          <td className="px-3 py-2.5 font-mono text-foreground max-w-[200px] truncate">
                                            {record.value}
                                          </td>
                                          <td className="px-3 py-2.5">
                                            {record.verified ? (
                                              <span className="inline-flex items-center gap-1 text-emerald-600">
                                                <CheckCircle2 className="h-3 w-3" />
                                                <span className="text-[11px]">Verified</span>
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center gap-1 text-muted-foreground">
                                                <Circle className="h-3 w-3" />
                                                <span className="text-[11px]">Pending</span>
                                              </span>
                                            )}
                                          </td>
                                          <td className="px-3 py-2.5">
                                            <button
                                              onClick={() => handleCopyField(record.value, `dns-${i}`)}
                                              className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-secondary transition-colors"
                                              title="Copy value"
                                            >
                                              {copiedField === `dns-${i}` ? (
                                                <Check className="h-3 w-3 text-emerald-500" />
                                              ) : (
                                                <Copy className="h-3 w-3 text-muted-foreground" />
                                              )}
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Domain verification result */}
                            {domainVerifyState === "failed" && (
                              <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-[13px] text-amber-600">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>Domain not yet verified. DNS changes can take up to 48 hours to propagate.</span>
                              </div>
                            )}
                          </>
                        )}

                        {/* Actions */}
                        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <button
                            onClick={() => setEmailStep(2)}
                            className={cn(btnSecondary, "w-full sm:w-auto justify-center h-[44px] sm:h-9")}
                          >
                            Back
                          </button>
                          {domainVerifyState !== "verified" && canVerifyDomain && (
                            <button
                              onClick={handleCheckDomainVerification}
                              disabled={domainVerifyState === "loading"}
                              className={cn(
                                btnAccent,
                                "disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center h-[44px] sm:h-9"
                              )}
                            >
                              {domainVerifyState === "loading" ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  Checking...
                                </>
                              ) : (
                                <>
                                  <Shield className="h-3.5 w-3.5" />
                                  Check Verification
                                </>
                              )}
                            </button>
                          )}
                          {!canVerifyDomain && (
                            <button
                              onClick={() => {
                                setEmailSetupComplete(true)
                                setConnectedChannels((prev) => ({ ...prev, email: true }))
                                setEmailStep(1)
                                toast.success("Email forwarding setup is complete")
                              }}
                              className={cn(btnAccent, "w-full sm:w-auto justify-center h-[44px] sm:h-9")}
                            >
                              Skip optional step
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
                </>
              ) : type === "live_chat" ? (
                /* ── LIVE CHAT: settings + embed code ─────── */
                <LiveChatSettings workspaceId={workspaceId} copied={copied} onCopyEmbed={handleCopyEmbed} />
              ) : (
                /* ── ALL OTHER CHANNELS: generic fields ──── */
                <>
                  {/* Fields */}
                  <div className="flex flex-col gap-4">
                    {channelDef.fields.map((field) => (
                      <div key={field.key}>
                        <label className="mb-1.5 block text-[12px] font-medium text-foreground">
                          {field.label}
                        </label>
                        <input
                          type={field.type}
                          value={fieldValues[field.key] ?? ""}
                          onChange={(e) =>
                            setFieldValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                          }
                          placeholder={field.placeholder}
                          className={cn(
                            inputClass,
                            "w-full h-11 sm:h-9"
                          )}
                        />
                        {field.type === "password" && (
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            This value is encrypted and stored securely.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Status banners */}
                  {testState === "success" && (
                    <div className="mt-4 flex w-full items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-[13px] text-emerald-600">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>Connection test passed. {channelDef.name} is reachable.</span>
                    </div>
                  )}
                  {testState === "error" && (
                    <div className="mt-4 flex w-full items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-[13px] text-destructive">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>Connection test failed. Please check your credentials and try again.</span>
                    </div>
                  )}
                  {saveState === "saved" && (
                    <div className="mt-4 flex w-full items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-[13px] text-emerald-600">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>{channelDef.name} configuration saved successfully.</span>
                    </div>
                  )}

                  {/* Actions -- stack fully on mobile, row on sm+ */}
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      onClick={handleTest}
                      disabled={testState === "loading"}
                      className={cn(
                        btnSecondary,
                        "disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center h-[44px] sm:h-9"
                      )}
                    >
                      {testState === "loading" ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Testing...
                        </>
                      ) : testState === "success" ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          Connection OK
                        </>
                      ) : testState === "error" ? (
                        <>
                          <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                          Test Failed
                        </>
                      ) : (
                        "Test Connection"
                      )}
                    </button>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      {isConnected && (
                        <button
                          onClick={handleDisconnect}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/60 px-4 text-[13px] font-medium text-destructive transition-colors duration-150 hover:bg-destructive/10 cursor-pointer w-full sm:w-auto h-[44px] sm:h-9"
                        >
                          Disconnect
                        </button>
                      )}
                      <button
                        onClick={handleSave}
                        disabled={saveState === "loading"}
                        className={cn(
                          btnAccent,
                          "disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center h-[44px] sm:h-9"
                        )}
                      >
                        {saveState === "loading" ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Saving...
                          </>
                        ) : saveState === "saved" ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Saved
                          </>
                        ) : (
                          isConnected ? "Save Changes" : "Connect"
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
