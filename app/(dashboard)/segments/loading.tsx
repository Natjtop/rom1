import { SkeletonPage } from "@/components/dashboard/skeleton"

export default function SegmentsLoading() {
  return (
    <div className="h-full overflow-y-auto">
      <SkeletonPage />
    </div>
  )
}
