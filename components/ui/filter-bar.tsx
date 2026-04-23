import { cn } from "@/lib/cn";

export function FilterBar({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "surface-card grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-5 xl:items-end xl:gap-5 xl:p-5",
        "relative overflow-hidden before:absolute before:inset-x-8 before:top-0 before:h-px before:bg-[linear-gradient(90deg,transparent,rgba(8,88,163,0.24),transparent)]",
        className
      )}
    >
      {children}
    </div>
  );
}
