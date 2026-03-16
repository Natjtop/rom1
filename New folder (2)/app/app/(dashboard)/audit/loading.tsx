import { SkeletonPage } from "@/components/dashboard/skeleton"

export default function AuditLoading() {
  return (
    <div className="h-full overflow-y-auto">
      <SkeletonPage />
    </div>
  )
}
