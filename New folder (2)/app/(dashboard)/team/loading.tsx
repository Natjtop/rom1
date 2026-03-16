import { SkeletonPage } from "@/components/dashboard/skeleton"

export default function TeamLoading() {
  return (
    <div className="h-full overflow-y-auto">
      <SkeletonPage />
    </div>
  )
}
