// ─── Enums (matching Prisma schema) ─────────────────

export type Role = "ADMIN" | "AGENT" | "VIEWER"
export type UserStatus = "ONLINE" | "AWAY" | "OFFLINE"
export type Platform = "SHOPIFY" | "WOOCOMMERCE" | "BIGCOMMERCE" | "MAGENTO"
// Only EMAIL and LIVE_CHAT are active channels
export type ChannelType = "EMAIL" | "LIVE_CHAT"
export type TicketStatus = "OPEN" | "PENDING" | "AI_REPLIED" | "ESCALATED" | "SNOOZED" | "CLOSED" | "MERGED"
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT"
export type Sentiment = "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "ANGRY"
export type MessageRole = "CUSTOMER" | "AI" | "HUMAN" | "SYSTEM"
export type RuleType = "AUTOMATION" | "ROUTING"
export type IntegrationType = "KLAVIYO" | "RECHARGE" | "LOOP_RETURNS" | "YOTPO" | "OKENDO" | "ATTENTIVE" | "ZAPIER"

// ─── Models ─────────────────────────────────────────

export interface Workspace {
  id: string
  slug: string
  name: string
  logoUrl: string | null
  aiTone: string
  returnPolicy: string | null
  autoReplyEnabled: boolean
  escalateKeywords: string[]
  businessHoursJson: Record<string, unknown> | null
  plan: string
  trialEndsAt: string | null
  inboundEmailAddress?: string | null
  customSendingDomain?: string | null
  customSendingEmail?: string | null
  emailDisplayName?: string | null
  emailMode?: string | null
  domainVerifiedAt?: string | null
  emailForwardingVerifiedAt?: string | null
  createdAt: string
}

export interface User {
  id: string
  workspaceId: string
  email: string
  name: string
  avatarUrl: string | null
  role: Role
  status: UserStatus
  createdAt: string
}

export interface Ticket {
  id: string
  workspaceId: string
  externalId: string | null
  customerEmail: string
  customerName: string | null
  channel: ChannelType
  status: TicketStatus
  priority: Priority
  sentiment: Sentiment | null
  intent: string | null
  orderId: string | null
  assignedAgentId: string | null
  teamId: string | null
  tags: string[]
  snoozeUntil: string | null
  mergedIntoId: string | null
  createdAt: string
  updatedAt: string
  closedAt: string | null
  /** When listing, backend may send last message timestamp for "X ago" in inbox. */
  lastMessageAt?: string
  // Relations (optionally included)
  messages?: Message[]
  assignedAgent?: User | null
  csatSurvey?: CsatSurvey | null
}

export interface Message {
  id: string
  ticketId: string
  userId: string | null
  role: MessageRole
  content: string
  htmlContent: string | null
  attachments: unknown | null
  metadata: unknown | null
  isInternal: boolean
  scheduledAt: string | null
  sentAt: string | null
  createdAt: string
  user?: User | null
}

export interface ChannelConfig {
  id: string
  workspaceId: string
  type: ChannelType
  isEnabled: boolean
  credentials: Record<string, unknown>
}

export interface HelpArticle {
  id: string
  workspaceId: string
  title: string
  content: string
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export interface Macro {
  id: string
  workspaceId: string
  name: string
  body: string
  subject: string | null
  tags: string[]
  actions: unknown | null
  createdAt: string
}

export interface Rule {
  id: string
  workspaceId: string
  name: string
  type: RuleType
  isEnabled: boolean
  conditions: Record<string, unknown>
  actions: Record<string, unknown>
  priority: number
  createdAt: string
}

export interface Flow {
  id: string
  workspaceId: string
  name: string
  trigger: string
  nodes: unknown
  edges: unknown
  isEnabled: boolean
  stats: unknown | null
  createdAt: string
}

export interface Integration {
  id: string
  workspaceId: string
  type: IntegrationType
  isEnabled: boolean
  config: Record<string, unknown>
  createdAt: string
}

export interface Team {
  id: string
  workspaceId: string
  name: string
  memberIds: string[]
  createdAt: string
}

export interface CsatSurvey {
  id: string
  ticketId: string
  token: string
  rating: number | null
  feedback: string | null
  sentAt: string
  respondedAt: string | null
}

export interface StoreConnection {
  id: string
  workspaceId: string
  platform: Platform
  storeUrl: string
  shopId: string | null
  installedAt: string
}

export interface SlaPolicy {
  id: string
  workspaceId: string
  name: string
  priority: Priority
  firstResponseMins: number
  resolutionMins: number
  isEnabled: boolean
  businessHoursOnly: boolean
  createdAt: string
}

export interface AuditLog {
  id: string
  workspaceId: string
  userId: string | null
  action: string
  entityType: string
  entityId: string | null
  metadata: Record<string, unknown> | null
  ipAddress: string | null
  createdAt: string
}

export interface Customer {
  id: string
  workspaceId: string
  email: string
  name: string | null
  phone: string | null
  avatarUrl: string | null
  tags: string[]
  notes: string | null
  ltv: number
  orderCount: number
  firstSeenAt: string
  lastSeenAt: string
  metadata: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export interface Tag {
  id: string
  workspaceId: string
  name: string
  color: string
  usageCount: number
  createdAt: string
}

export interface SavedView {
  id: string
  workspaceId: string
  userId: string
  name: string
  filters: Record<string, unknown>
  isShared: boolean
  createdAt: string
}

export interface RevenueEvent {
  id: string
  workspaceId: string
  ticketId: string | null
  agentId: string | null
  customerEmail: string
  orderId: string
  amount: number
  currency: string
  channel: ChannelType | null
  attributedAt: string
}

// ─── API Response types ─────────────────────────────

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: Pick<User, "id" | "email" | "name" | "role" | "avatarUrl">
  workspace: Pick<Workspace, "id" | "slug" | "name">
  onboardingComplete?: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  nextCursor: string | null
  hasMore: boolean
  total?: number
}

export interface ApiError {
  status: "error"
  code: string
  message: string
  details?: Record<string, string[]>
}

// ─── Analytics types ────────────────────────────────

export interface AnalyticsOverview {
  openTickets: number
  avgResponseTime: number
  aiResolutionRate: number
  csatAverage: number
  ticketVolume: { date: string; count: number }[]
  channelBreakdown: { channel: ChannelType; count: number }[]
  agentPerformance: {
    agentId: string
    agentName: string
    resolved: number
    avgTime: number
  }[]
}

// ─── UI-level types (used by dashboard components) ──

export type UITicketStatus = "open" | "pending" | "ai_replied" | "escalated" | "snoozed" | "closed"
export type UITicketChannel = "email" | "livechat"
export type UIMessageRole = "customer" | "ai" | "human" | "system"

export interface UIMessage {
  id: string
  role: UIMessageRole
  content: string
  timestamp: string
  isInternal?: boolean
  source?: string
}

export interface UITicket {
  id: string
  customerName: string
  customerEmail: string
  channel: UITicketChannel
  status: UITicketStatus
  subject: string
  priority: "low" | "medium" | "high"
  orderId?: string
  messages: UIMessage[]
  createdAt: string
  ltv: number
  totalOrders: number
  tags?: string[]
  sla?: { deadline: string; breached: boolean }
  snooze?: { until: string; label: string }
  assignedTo?: string
  orderDetails?: {
    id: string
    status: string
    items: string[]
    total: string
    trackingNumber?: string
  }
}

// ─── New Model Types ─────────────────────────────────

export interface Segment {
  id: string
  workspaceId: string
  name: string
  description: string | null
  filters: Record<string, unknown>
  customerCount: number
  createdAt: string
  updatedAt: string
}

export interface NotificationPreference {
  id: string
  userId: string
  email: boolean
  push: boolean
  ticketAssigned: boolean
  ticketEscalated: boolean
  newTicket: boolean
  csatResponse: boolean
  weeklyDigest: boolean
}

export interface WebhookEndpoint {
  id: string
  workspaceId: string
  url: string
  events: string[]
  secret: string
  isEnabled: boolean
  createdAt: string
  updatedAt: string
}

export interface ApiKey {
  id: string
  workspaceId: string
  name: string
  key?: string
  prefix: string
  lastUsedAt: string | null
  expiresAt: string | null
  createdAt: string
}

export interface EmailTemplate {
  id: string
  workspaceId: string
  name: string
  subject: string
  body: string
  type: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}
