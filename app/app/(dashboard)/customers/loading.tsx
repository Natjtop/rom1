import { Skeleton, SkeletonTable } from "@/components/dashboard/skeleton"

export default function CustomersLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="mb-4">
        <Skeleton className="h-10 w-full max-w-sm rounded-lg" />
      </div>
      <SkeletonTable />
    </div>
  )
}
