"use client"

import { cn } from "@/lib/utils"

// ─── Base skeleton primitive ────────────────────────────────────────────────

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-secondary", className)} />
}

// ─── Pre-built skeleton layouts ─────────────────────────────────────────────

/** Mimics the ticket list: 5 rows, each with an avatar circle + 3 text lines */
export function SkeletonTicketList() {
  return (
    <div className="flex flex-col gap-3 p-3 sm:p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          {/* Avatar circle */}
          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2 min-w-0">
            {/* Subject line */}
            <Skeleton className="h-3 w-3/4" />
            {/* Meta line */}
            <Skeleton className="h-2.5 w-1/2" />
            {/* Preview line */}
            <Skeleton className="h-2.5 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Mimics a single content card: title + 2 body lines */
export function SkeletonCard() {
  return (
    <div className="w-full rounded-xl border border-border/60 bg-card p-4 sm:p-5">
      {/* Title */}
      <Skeleton className="mb-3 h-4 w-2/5" />
      {/* Body lines */}
      <Skeleton className="mb-2 h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  )
}

/** Mimics the analytics stats grid: 4 stat card skeletons */
export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border/60 bg-card p-3 sm:p-5"
        >
          {/* Icon + badge row */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-10 sm:w-12 rounded-full" />
          </div>
          {/* Big value */}
          <Skeleton className="mt-2.5 sm:mt-3 h-6 sm:h-7 w-16 sm:w-24" />
          {/* Label */}
          <Skeleton className="mt-1.5 h-3 w-20 sm:w-32" />
        </div>
      ))}
    </div>
  )
}

/** Mimics a table: header row + 5 body rows */
export function SkeletonTable() {
  return (
    <div className="w-full rounded-xl border border-border/60 bg-card overflow-hidden">
      {/* Table header */}
      <div className="flex items-center gap-3 sm:gap-4 border-b border-border/60 px-3 sm:px-5 py-3">
        <Skeleton className="h-3 w-16 sm:w-20" />
        <Skeleton className="h-3 w-16 sm:w-20 hidden sm:block" />
        <Skeleton className="h-3 w-16 sm:w-20 flex-1 sm:flex-none" />
        <Skeleton className="h-3 w-12 sm:w-20" />
      </div>
      {/* Table rows */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 sm:gap-4 border-b border-border/40 last:border-0 px-3 sm:px-5 py-3 sm:py-4">
          <Skeleton className="h-3 w-12 sm:w-16 shrink-0" />
          <Skeleton className="h-3 flex-1 min-w-0" />
          <Skeleton className="h-3 w-10 sm:w-14 shrink-0 hidden sm:block" />
          <Skeleton className="h-3 w-8 sm:w-10 shrink-0" />
        </div>
      ))}
    </div>
  )
}

/** Full page skeleton with header + content area */
export function SkeletonPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8">
      {/* Page heading */}
      <div className="mb-6 sm:mb-8">
        <Skeleton className="h-5 sm:h-6 w-36 sm:w-48 mb-2" />
        <Skeleton className="h-3 w-56 sm:w-72" />
      </div>
      {/* Stats row */}
      <div className="mb-5 sm:mb-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "rounded-xl border border-border/60 bg-card p-3 sm:p-4",
              i === 2 && "col-span-2 sm:col-span-1"
            )}
          >
            <Skeleton className="h-3 w-16 sm:w-20 mb-2" />
            <Skeleton className="h-5 sm:h-6 w-10 sm:w-12" />
          </div>
        ))}
      </div>
      {/* Content card */}
      <SkeletonTable />
    </div>
  )
}

/** Inbox layout: filters strip (desktop) + list + thread. Use in inbox/loading.tsx and page initial load. */
export function InboxSkeleton() {
  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Filters — hidden on small, visible lg */}
      <div className="hidden h-full w-[200px] shrink-0 flex-col border-r border-border/60 p-3 lg:flex">
        <Skeleton className="mb-3 h-8 w-24" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="mb-2 h-9 w-full rounded-lg" />
        ))}
      </div>
      {/* List column */}
      <div className="flex h-full w-[260px] shrink-0 flex-col border-r border-border/60 lg:w-[280px] xl:w-[320px]">
        <div className="shrink-0 border-b border-border/60 px-2.5 py-2">
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <SkeletonTicketList />
        </div>
      </div>
      {/* Thread column */}
      <div className="flex min-w-0 flex-1 flex-col bg-background">
        <div className="shrink-0 border-b border-border/60 px-4 py-3">
          <Skeleton className="h-4 w-48 mb-1" />
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="flex-1 space-y-4 overflow-hidden p-4">
          <div className="flex justify-start">
            <Skeleton className="h-14 max-w-[85%] rounded-2xl rounded-bl-sm" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-12 max-w-[75%] rounded-2xl rounded-br-sm" />
          </div>
          <div className="flex justify-start">
            <Skeleton className="h-10 max-w-[70%] rounded-2xl rounded-bl-sm" />
          </div>
        </div>
      </div>
    </div>
  )
}

/** Channels [type] config layout: header, sidebar, config panel. Use in channels/[type]/loading.tsx. */
export function ChannelsTypeSkeleton() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="animate-pulse">
          <div className="mb-6 sm:mb-8">
            <Skeleton className="h-6 w-32 rounded-lg" />
            <Skeleton className="mt-2 h-4 w-64 rounded" />
          </div>
          <div className="mb-4 lg:hidden flex gap-1.5 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[44px] w-28 shrink-0 rounded-lg" />
            ))}
          </div>
          <div className="flex gap-0 lg:gap-5">
            <div className="hidden lg:block lg:w-[210px] shrink-0">
              <div className="flex flex-col gap-1">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2.5 rounded-lg px-3 py-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 flex-1 rounded" />
                    <Skeleton className="h-3 w-3 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 min-w-0 w-full">
              <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-5">
                <div className="mb-5 flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div>
                      <Skeleton className="h-4 w-32 rounded" />
                      <Skeleton className="mt-1.5 h-3 w-56 rounded" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <div className="mb-5 border-t border-border/60" />
                <div className="mb-5 rounded-lg bg-secondary/30 px-3 py-2.5">
                  <Skeleton className="h-3 w-full rounded" />
                  <Skeleton className="mt-1 h-3 w-3/4 rounded" />
                </div>
                <div className="flex flex-col gap-4">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i}>
                      <Skeleton className="mb-1.5 h-3 w-28 rounded" />
                      <Skeleton className="h-11 sm:h-9 w-full rounded-lg" />
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Skeleton className="h-[44px] sm:h-9 w-full sm:w-36 rounded-lg" />
                  <Skeleton className="h-[44px] sm:h-9 w-full sm:w-28 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Analytics layout: title + stats + charts. Use in analytics/loading.tsx. */
export function AnalyticsSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <Skeleton className="h-6 w-40 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="mb-6 sm:mb-8">
        <SkeletonStats />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-card p-3 sm:p-5 lg:col-span-2">
          <Skeleton className="mb-4 h-4 w-48" />
          <Skeleton className="h-[220px] sm:h-[260px] w-full rounded-lg" />
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-3 sm:p-5">
          <Skeleton className="mb-4 h-4 w-36" />
          <Skeleton className="mx-auto h-[160px] w-[160px] sm:h-[180px] sm:w-[180px] rounded-full" />
          <div className="mt-3 flex flex-col gap-2.5">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-3 sm:p-5 lg:col-span-3">
          <Skeleton className="mb-4 h-4 w-36" />
          <Skeleton className="h-[180px] sm:h-[220px] w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
