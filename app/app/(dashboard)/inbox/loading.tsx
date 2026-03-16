import { InboxSkeleton } from "@/components/dashboard/skeleton"

export default function InboxLoading() {
  return (
    <div className="flex h-full w-full">
      <InboxSkeleton />
    </div>
  )
}
