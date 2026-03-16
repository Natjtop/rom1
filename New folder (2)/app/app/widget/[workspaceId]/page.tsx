import { getWidgetApiBaseServer } from "@/lib/api"
import { WidgetClient } from "./widget-client"

export const dynamic = "force-dynamic"
export const revalidate = 60

export default async function WidgetPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string }>
  searchParams: Promise<{ desktop?: string }>
}) {
  const { workspaceId } = await params
  const qp = await searchParams
  const hostDesktopHint = qp?.desktop === "1"
  const apiBase = getWidgetApiBaseServer()
  let initialSettings: Awaited<ReturnType<typeof fetchWidgetSettings>> = null
  try {
    initialSettings = await fetchWidgetSettings(apiBase, workspaceId)
  } catch {
    // use null; client will refetch
  }

  return <WidgetClient workspaceId={workspaceId} initialSettings={initialSettings} hostDesktopHint={hostDesktopHint} />
}

async function fetchWidgetSettings(
  apiBase: string,
  workspaceId: string
): Promise<{
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
} | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000)
  try {
    const res = await fetch(`${apiBase}/widget/settings/${workspaceId}`, {
      next: { revalidate: 60 },
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
      signal: controller.signal,
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}
