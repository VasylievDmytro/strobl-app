"use client";

import { ArrowLeft, ChevronRight, Menu, Sparkles } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { StroblLogo } from "@/components/strobl-logo";
import { getRouteTitle } from "@/lib/routes";

export function TopHeader({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const title = getRouteTitle(pathname);
  const showBack = pathname !== "/";
  const section = pathname === "/" ? "Dashboard" : "Arbeitsbereich";

  return (
    <header className="surface-card mb-6 overflow-hidden px-4 py-4 md:px-6">
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(8,88,163,0.4),transparent)]" />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <button
              type="button"
              className="inline-flex rounded-[1.2rem] border border-white/80 bg-white/82 p-3 text-strobl-700 shadow-[0_12px_24px_-18px_rgba(17,49,87,0.55)] backdrop-blur-md transition hover:bg-strobl-50 lg:hidden"
              onClick={onOpenSidebar}
            >
              <Menu className="h-5 w-5" />
            </button>
            {showBack ? (
              <button
                type="button"
                className="inline-flex rounded-[1.2rem] border border-white/80 bg-white/82 p-3 text-ink-500 shadow-[0_12px_24px_-18px_rgba(17,49,87,0.55)] backdrop-blur-md transition hover:bg-strobl-50 hover:text-strobl-700"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : null}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-strobl-800">
                <span>{section}</span>
                <ChevronRight className="h-3.5 w-3.5 text-ink-300" />
                <span className="text-ink-400">Strobl Online App</span>
              </div>
              <p className="mt-3 text-balance text-2xl font-semibold leading-tight text-ink-900 md:text-[2.15rem]">
                {title}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="glass-chip">
                  <Sparkles className="h-3.5 w-3.5" />
                  Live workspace
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden shrink-0 lg:flex lg:flex-col lg:items-end lg:justify-end">
          <div className="rounded-[2rem] border border-white/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(247,251,255,0.86))] px-5 py-4 shadow-[0_24px_54px_-30px_rgba(17,49,87,0.38)] backdrop-blur-xl">
            <StroblLogo withText={false} />
          </div>
        </div>
      </div>
    </header>
  );
}
