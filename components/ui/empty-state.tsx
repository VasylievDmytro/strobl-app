import { cn } from "@/lib/cn";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "surface-muted flex min-h-56 flex-col items-start justify-center gap-4 p-6 md:p-8",
        className
      )}
    >
      <div className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-strobl-700">
        Noch leer
      </div>
      <div className="space-y-2">
        <h3 className="text-ink-900">{title}</h3>
        <p className="max-w-2xl">{description}</p>
      </div>
      {action}
    </div>
  );
}
