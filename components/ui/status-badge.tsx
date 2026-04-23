import { cn } from "@/lib/cn";

interface StatusBadgeProps {
  value: boolean | string;
  trueLabel?: string;
  falseLabel?: string;
}

export function StatusBadge({
  value,
  trueLabel = "Bestätigt",
  falseLabel = "Unbestätigt"
}: StatusBadgeProps) {
  const isPositive = value === true || value === "Bestätigt" || value === "Bereit";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em]",
        isPositive
          ? "bg-emerald-50/90 text-emerald-700 ring-1 ring-emerald-200"
          : "bg-amber-50/90 text-amber-700 ring-1 ring-amber-200"
      )}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          isPositive ? "bg-emerald-500" : "bg-amber-500"
        )}
      />
      {typeof value === "boolean" ? (value ? trueLabel : falseLabel) : value}
    </span>
  );
}
