import { cn } from "@/lib/cn";
import { BRAND } from "@/lib/brand";

export function StroblLogo({
  compact = false,
  withText = true
}: {
  compact?: boolean;
  withText?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "overflow-hidden rounded-[1.5rem] border border-white bg-white shadow-[0_20px_40px_-28px_rgba(8,88,163,0.32)]",
          compact ? "grid h-11 w-11 place-items-center" : "px-4 py-3"
        )}
      >
        {compact ? (
          <span className="font-[var(--font-space-grotesk)] text-lg font-semibold text-strobl-800">
            S
          </span>
        ) : (
          <img
            src={BRAND.logoUrl}
            alt={BRAND.companyName}
            className="h-12 w-auto object-contain xl:h-14"
          />
        )}
      </div>
      {!compact && withText ? (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-strobl-800">
            {BRAND.tagline}
          </p>
          <p className="text-sm text-ink-500">Online App</p>
        </div>
      ) : null}
    </div>
  );
}
