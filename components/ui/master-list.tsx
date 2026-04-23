import { cn } from "@/lib/cn";

interface MasterListProps {
  title: string;
  count: number;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function MasterList({
  title,
  count,
  children,
  className,
  contentClassName
}: MasterListProps) {
  return (
    <section className={cn("surface-card flex flex-col p-4 md:p-5", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-strobl-700">
            Auswahl
          </p>
          <h2 className="mt-2 text-[1.55rem] leading-tight text-ink-900 md:mt-3 md:text-[2rem]">
            {title}
          </h2>
        </div>
        <div className="rounded-full border border-white/70 bg-white/78 px-3 py-1.5 text-xs font-semibold text-strobl-700 shadow-[0_16px_32px_-24px_rgba(17,49,87,0.45)] backdrop-blur-md md:px-4 md:py-2 md:text-sm">
          {count}
        </div>
      </div>
      <div className={cn("space-y-3 modern-scrollbar", contentClassName)}>{children}</div>
    </section>
  );
}
