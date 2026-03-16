import { SkeletonPage } from "@/components/dashboard/skeleton"

export default function FlowsLoading() {
  return (
    <div className="h-full overflow-y-auto">
      <SkeletonPage />
    </div>
  )
}
