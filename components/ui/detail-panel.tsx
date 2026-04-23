import { cn } from "@/lib/cn";

interface DetailPanelProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export function DetailPanel({
  title,
  description,
  actions,
  children,
  className,
  titleClassName,
  descriptionClassName
}: DetailPanelProps) {
  return (
    <section
      className={cn(
        "surface-card modern-scrollbar detail-panel-shell relative overflow-hidden p-4 md:p-6",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(8,88,163,0.26),transparent)]" />
      <div className="detail-orb absolute -right-8 top-4 h-28 w-28 rounded-full bg-strobl-100/70 blur-3xl" />
      <div className="detail-orb absolute bottom-10 left-8 h-20 w-20 rounded-full bg-[#dbeeff] blur-3xl" />
      <div className="mb-4 flex flex-col gap-3 md:mb-6 md:gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <h2
            className={cn(
              "max-w-[18ch] break-words text-[clamp(1.3rem,8vw,3.2rem)] leading-[1] tracking-[-0.03em] text-ink-900 [overflow-wrap:anywhere] md:leading-[0.98] md:tracking-[-0.035em]",
              titleClassName
            )}
          >
            {title}
          </h2>
          {description ? (
            <p
              className={cn(
                "max-w-4xl break-words text-[0.92rem] leading-6 text-ink-500 md:text-[clamp(1rem,1.45vw,1.2rem)] md:leading-[1.5]",
                descriptionClassName
              )}
            >
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
