"use client"

import { useState, useEffect } from "react"
import { LiveChatWidget } from "@/components/live-chat-widget"
import { getWidgetApiBase } from "@/lib/api"

const MSG_INIT = "replyma:init"

export interface WidgetSettingsPayload {
  accentColor: string
  accentGradientPreset: string
  textIconColor: string
  headerTextColor: string
  headerSubtextColor: string
  panelBackgroundColor: string
  assistantBubbleColor: string
  assistantTextColor: string
  userBubbleColor: string
  userTextColor: string
  inputBackgroundColor: string
  inputTextColor: string
  quickReplyBackgroundColor: string
  quickReplyTextColor: string
  quickReplyBorderColor: string
  launcherIconColor: string
  proactiveBackgroundColor: string
  proactiveTextColor: string
  proactiveSubtextColor: string
  greeting: string
  quickReplies: string[]
  assistantName: string
  proactiveTitle: string
  proactiveSubtitle: string
}

const WIDGET_EMBED_CLASS = "replyma-widget-embed"

export function WidgetClient({
  workspaceId,
  initialSettings,
  hostDesktopHint,
}: {
  workspaceId: string
  initialSettings: WidgetSettingsPayload | null
  hostDesktopHint?: boolean
}) {
  const [settings, setSettings] = useState<WidgetSettingsPayload | null>(initialSettings)
  const [desktopLayout, setDesktopLayout] = useState(Boolean(hostDesktopHint))

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.source !== window.parent || typeof e.data !== "object" || e.data?.type !== MSG_INIT) return
      const desktop = (e.data as { desktop?: boolean }).desktop
      if (typeof desktop === "boolean") setDesktopLayout(desktop)
    }
    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [])

  useEffect(() => {
    if (settings != null) return
    fetch(`${getWidgetApiBase()}/widget/settings/${workspaceId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setSettings(data))
      .catch(() => {})
  }, [workspaceId, settings])

  useEffect(() => {
    document.documentElement.classList.add(WIDGET_EMBED_CLASS)
    document.body.classList.add(WIDGET_EMBED_CLASS)
    document.body.style.background = "transparent"
    document.documentElement.style.background = "transparent"
    return () => {
      document.documentElement.classList.remove(WIDGET_EMBED_CLASS)
      document.body.classList.remove(WIDGET_EMBED_CLASS)
      document.body.style.background = ""
      document.documentElement.style.background = ""
    }
  }, [])

  return (
    <div style={{ position: "fixed", inset: 0, background: "transparent", backgroundColor: "transparent", pointerEvents: "none" }} aria-hidden="true">
      <LiveChatWidget
        workspaceId={workspaceId}
        accentColor={settings?.accentColor}
        accentGradientPreset={settings?.accentGradientPreset}
        textIconColor={settings?.textIconColor}
        headerTextColor={settings?.headerTextColor}
        headerSubtextColor={settings?.headerSubtextColor}
        panelBackgroundColor={settings?.panelBackgroundColor}
        assistantBubbleColor={settings?.assistantBubbleColor}
        assistantTextColor={settings?.assistantTextColor}
        userBubbleColor={settings?.userBubbleColor}
        userTextColor={settings?.userTextColor}
        inputBackgroundColor={settings?.inputBackgroundColor}
        inputTextColor={settings?.inputTextColor}
        quickReplyBackgroundColor={settings?.quickReplyBackgroundColor}
        quickReplyTextColor={settings?.quickReplyTextColor}
        quickReplyBorderColor={settings?.quickReplyBorderColor}
        launcherIconColor={settings?.launcherIconColor}
        proactiveBackgroundColor={settings?.proactiveBackgroundColor}
        proactiveTextColor={settings?.proactiveTextColor}
        proactiveSubtextColor={settings?.proactiveSubtextColor}
        greeting={settings?.greeting}
        quickReplies={settings?.quickReplies}
        assistantName={settings?.assistantName}
        proactiveTitle={settings?.proactiveTitle}
        proactiveSubtitle={settings?.proactiveSubtitle}
        floatingOnly
        floatingPanelBottomOffset={72}
        embedMode
        forceDesktopLayout={desktopLayout}
      />
    </div>
  )
}
