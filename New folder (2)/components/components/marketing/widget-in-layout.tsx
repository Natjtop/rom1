"use client"

import { usePathname } from "next/navigation"
import { LiveChatWidget } from "@/components/live-chat-widget"

const TEST_PATH = "/test"

export function WidgetInLayout() {
  const pathname = usePathname()
  if (pathname === TEST_PATH) return null
  return (
    <LiveChatWidget
      workspaceId="cmmbvaqlu000gj550x9hhkcqu"
      assistantName="Replyma AI"
      greeting="Hi! 👋 I'm the Replyma AI assistant. Ask me anything about our platform — pricing, features, integrations, or how to get started."
      quickReplies={["How does AI auto-reply work?", "See pricing plans", "How to connect Shopify?"]}
      proactiveTitle="Curious how AI can handle your support?"
      proactiveSubtitle="Ask me anything about Replyma"
      proactiveTriggerDelay={20}
      accentColor="#0a0a0a"
      floatingOnly
      floatingPanelBottomOffset={72}
    />
  )
}
