import Pusher from "pusher-js"
import type { Channel } from "pusher-js"
import { getAuthBearerToken } from "./api"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"

let pusherInstance: Pusher | null = null

export function getPusher(): Pusher {
  if (!pusherInstance) {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER

    if (!key || !cluster) {
      console.warn("[Pusher] Missing NEXT_PUBLIC_PUSHER_KEY or NEXT_PUBLIC_PUSHER_CLUSTER")
      pusherInstance = new Pusher("dummy", { cluster: "us2" })
      return pusherInstance
    }

    const wsHost = process.env.NEXT_PUBLIC_PUSHER_HOST || undefined
    const wsPort = Number(process.env.NEXT_PUBLIC_PUSHER_PORT) || undefined

    pusherInstance = new Pusher(key, {
      cluster,
      forceTLS: process.env.NODE_ENV === "production",
      channelAuthorization: {
        endpoint: `${API_BASE}/pusher/auth`,
        transport: "ajax",
        customHandler: async ({ socketId, channelName }, callback) => {
          try {
            const token = await getAuthBearerToken()
            if (!token) {
              callback(new Error("No access token for Pusher auth"), { auth: "" })
              return
            }

            const res = await fetch(`${API_BASE}/pusher/auth`, {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Bearer ${token}`,
              },
              body: new URLSearchParams({
                socket_id: socketId,
                channel_name: channelName,
              }),
            })

            if (!res.ok) {
              callback(new Error(`Pusher auth failed: ${res.status}`), { auth: "" })
              return
            }

            const data = await res.json()
            callback(null, data)
          } catch (err) {
            callback(err as Error, { auth: "" })
          }
        },
      },
      ...(wsHost ? {
        wsHost,
        wsPort,
        wssPort: wsPort,
        enabledTransports: ["ws", "wss"],
      } : {}),
    })
  }
  return pusherInstance
}

/** Reset Pusher instance (call after token refresh to update auth headers) */
export function resetPusher() {
  if (pusherInstance) {
    pusherInstance.disconnect()
    pusherInstance = null
  }
}

export function subscribeToWorkspace(workspaceId: string): Channel {
  const pusher = getPusher()
  return pusher.subscribe(`private-workspace-${workspaceId}`)
}

export function unsubscribeFromWorkspace(workspaceId: string) {
  const pusher = getPusher()
  pusher.unsubscribe(`private-workspace-${workspaceId}`)
}

/** Subscribe to a public livechat channel (no auth needed, only receives livechat messages) */
export function subscribeToLivechat(workspaceId: string, sessionId: string): Channel {
  const pusher = getPusher()
  return pusher.subscribe(`livechat-${workspaceId}-${sessionId}`)
}

export function unsubscribeFromLivechat(workspaceId: string, sessionId: string) {
  const pusher = getPusher()
  pusher.unsubscribe(`livechat-${workspaceId}-${sessionId}`)
}

// Pre-defined event names (matches backend PusherEvents)
export const PusherEvents = {
  TICKET_CREATED: "ticket.created",
  TICKET_UPDATED: "ticket.updated",
  TICKET_ESCALATED: "ticket.escalated",
  MESSAGE_NEW: "message.new",
  AGENT_TYPING: "agent.typing",
  AGENT_VIEWING: "agent.viewing",
  AGENT_STATUS: "agent.status",
  ANALYTICS_LIVE: "analytics.live",
} as const
