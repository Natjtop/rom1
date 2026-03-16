/**
 * Intentionally empty: parent loading would show first during client nav and mask
 * segment loadings (inbox, analytics, etc.). So we show nothing here; each segment
 * uses its own loading.tsx for the correct skeleton.
 */
export default function DashboardLoading() {
  return null
}
