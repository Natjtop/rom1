import { SkeletonPage } from "@/components/dashboard/skeleton"

export default function BillingLoading() {
  return (
    <div className="h-full overflow-y-auto">
      <SkeletonPage />
    </div>
  )
}
