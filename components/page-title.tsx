import { cn } from "@/lib/cn";

interface PageTitleProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageTitle({
  eyebrow,
  title,
  description,
  actions,
  className
}: PageTitleProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 md:flex-row md:items-end md:justify-between",
        className
      )}
    >
      <div className="min-w-0 flex-1 space-y-3">
        {eyebrow ? (
          <p className="glass-chip w-fit">
            {eyebrow}
          </p>
        ) : null}
        <div className="space-y-2">
          <h1 className="max-w-5xl text-balance text-[clamp(2rem,9vw,3.75rem)] leading-[0.96] text-ink-900">
            {title}
          </h1>
          {description ? (
            <p className="max-w-4xl text-[0.96rem] leading-7 md:text-base">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}
