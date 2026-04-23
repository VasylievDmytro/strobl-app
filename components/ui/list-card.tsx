import { cn } from "@/lib/cn";

interface ListCardProps {
  active?: boolean;
  title: string;
  subtitle?: string;
  meta?: React.ReactNode;
  footer?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  footerClassName?: string;
}

export function ListCard({
  active,
  title,
  subtitle,
  meta,
  footer,
  onClick,
  className,
  titleClassName,
  subtitleClassName,
  footerClassName
}: ListCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick) {
          return;
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "group relative w-full overflow-hidden rounded-[1.5rem] border p-4 text-left transition duration-300 md:rounded-[1.9rem] md:p-5",
        active
          ? "border-strobl-200 bg-[linear-gradient(180deg,rgba(244,249,255,0.96),rgba(238,245,252,0.9))] shadow-[0_24px_50px_-32px_rgba(8,88,163,0.4)]"
          : "border-white/80 bg-white/80 hover:-translate-y-0.5 hover:border-strobl-100 hover:shadow-soft",
        className
      )}
    >
      <div
        className={cn(
          "absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(8,88,163,0.22),transparent)] opacity-0 transition",
          active && "opacity-100"
        )}
      />
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <h3
            className={cn(
              "break-words text-[1.02rem] font-semibold leading-7 text-ink-900 md:text-[1.1rem]",
              titleClassName
            )}
          >
            {title}
          </h3>
          {subtitle ? (
            <p
              className={cn(
                "break-words text-sm leading-6 text-ink-500 md:text-[15px]",
                subtitleClassName
              )}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
        {meta ? <div className="max-w-full shrink-0 self-start sm:max-w-none">{meta}</div> : null}
      </div>
      {footer ? <div className={cn("mt-4 break-words md:mt-5", footerClassName)}>{footer}</div> : null}
    </div>
  );
}
