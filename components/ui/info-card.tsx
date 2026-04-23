import { cn } from "@/lib/cn";

interface InfoCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  className?: string;
  valueClassName?: string;
  labelClassName?: string;
}

export function InfoCard({
  label,
  value,
  hint,
  className,
  valueClassName,
  labelClassName
}: InfoCardProps) {
  return (
    <div
      className={cn(
        "surface-card relative overflow-hidden p-4 md:p-[1.125rem] 2xl:p-5 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-[linear-gradient(180deg,#1a4f84,#5aa8ff)]",
        className
      )}
    >
      <div className="detail-orb absolute right-3 top-3 h-11 w-11 rounded-full bg-strobl-50/80 blur-2xl md:right-4 md:top-4 md:h-12 md:w-12 2xl:h-14 2xl:w-14" />
      <p
        className={cn(
          "relative text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-400 md:text-[11px] md:tracking-[0.24em]",
          labelClassName
        )}
      >
        {label}
      </p>
      <div
        className={cn(
          "relative mt-2.5 break-words text-[clamp(1.02rem,5vw,1.45rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-ink-900 [overflow-wrap:anywhere] md:mt-3 md:text-[clamp(1.2rem,2.1vw,1.75rem)] md:leading-[1.12] 2xl:mt-4 2xl:text-[clamp(1.35rem,2.4vw,2rem)]",
          valueClassName
        )}
      >
        {value}
      </div>
      {hint ? <p className="mt-2 text-sm leading-5 md:text-[0.96rem] md:leading-6">{hint}</p> : null}
    </div>
  );
}
