import { type LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary mb-4">
        <Icon className="h-6 w-6 text-muted-foreground/40" />
      </div>
      <p className="text-[14px] font-medium text-foreground/60 mb-1">{title}</p>
      <p className="text-[12px] text-muted-foreground/40 text-center max-w-xs mb-4">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[13px] font-medium text-accent-foreground transition-colors hover:bg-accent/90"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
