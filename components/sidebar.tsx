"use client";

import Link from "next/link";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Command,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { appRoutes } from "@/lib/routes";

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapsed: () => void;
}

export function Sidebar({
  collapsed,
  mobileOpen,
  onCloseMobile,
  onToggleCollapsed
}: SidebarProps) {
  const pathname = usePathname();

  const content = (
    <div className="flex h-full flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className={cn("flex items-center gap-3", collapsed && "w-full justify-center")}>
          <div className="grid h-12 w-12 place-items-center rounded-[1.4rem] bg-[linear-gradient(135deg,#11375d,#2a6fb1)] text-white shadow-soft">
            <Command className="h-5 w-5" />
          </div>
          {!collapsed ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-strobl-700">
                Navigation
              </p>
              <p className="text-sm text-ink-500">Workspace</p>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          className="hidden rounded-2xl border border-white/80 bg-white/80 p-2 text-ink-500 shadow-[0_10px_24px_-18px_rgba(17,49,87,0.5)] backdrop-blur-md transition hover:border-strobl-200 hover:bg-strobl-50 hover:text-strobl-700 lg:inline-flex"
          onClick={onToggleCollapsed}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>
      </div>

      <div
        className={cn(
          "surface-card border border-[#dbe5ee] bg-[linear-gradient(180deg,#ffffff,#f6f9fb)] p-5",
          collapsed && "flex items-center justify-center px-3 py-4"
        )}
      >
        {!collapsed ? (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-strobl-700">
              Strobl Workspace
            </p>
            <h2 className="mt-3 text-[1.45rem] leading-tight text-ink-900">
              Bau- und Projektdaten
            </h2>
            <p className="mt-3 max-w-[18rem] text-sm leading-6 text-ink-500">
              Klare Oberflaeche fuer Rechnungen, Transport- und Tagesberichte mit direkter
              Dataverse-Anbindung.
            </p>
          </>
        ) : (
          <Command className="h-5 w-5 text-strobl-700" />
        )}
      </div>

      <nav className="space-y-2">
        {appRoutes.map((route) => {
          const active =
            pathname === route.href ||
            route.children?.some((child) => pathname === child.href) ||
            false;
          const Icon = route.icon;

          return (
            <div key={route.href} className="space-y-2">
              <Link
                href={route.href}
                onClick={onCloseMobile}
                className={cn(
                  "group flex min-h-14 items-center rounded-[1.55rem] border px-3 py-3 text-sm font-semibold transition duration-300",
                  active
                    ? "border-white/90 bg-white/92 text-strobl-900 shadow-[0_18px_42px_-30px_rgba(8,88,163,0.45)]"
                    : "border-transparent text-ink-600 hover:border-white/80 hover:bg-white/72 hover:text-strobl-800"
                )}
              >
                <span
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-[1rem] transition",
                    active
                      ? "bg-strobl-50 text-strobl-700"
                      : "bg-[#f2f6fa] text-ink-500 group-hover:bg-strobl-50 group-hover:text-strobl-700"
                  )}
                >
                  <Icon className="h-4.5 w-4.5" />
                </span>
                {!collapsed ? (
                  <>
                    <span className="ml-3 flex-1 leading-5">{route.title}</span>
                    {route.children ? (
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 transition",
                          active && "rotate-90 text-strobl-600"
                        )}
                      />
                    ) : null}
                  </>
                ) : null}
              </Link>

              {!collapsed && route.children && active ? (
                <div className="ml-6 space-y-2 border-l border-white/90 pl-5">
                  {route.children.map((child) => {
                    const childActive = pathname === child.href;

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onCloseMobile}
                        className={cn(
                          "flex items-start justify-between gap-3 rounded-[1.1rem] px-3 py-2.5 text-sm transition",
                          childActive
                            ? "bg-strobl-50 text-strobl-900"
                            : "text-ink-500 hover:bg-white/70 hover:text-strobl-800"
                        )}
                      >
                        <span className="leading-5">{child.title}</span>
                        {childActive ? <ChevronLeft className="h-4 w-4 rotate-180" /> : null}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className="mt-auto rounded-[1.8rem] border border-white/70 bg-white/72 p-4 shadow-[0_16px_36px_-28px_rgba(17,49,87,0.34)] backdrop-blur-md">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <span className="grid h-10 w-10 place-items-center rounded-[1rem] bg-emerald-50 text-emerald-600">
            <Activity className="h-4.5 w-4.5" />
          </span>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-400">
                Dataverse
              </p>
              <p className="mt-1 text-sm font-semibold text-ink-800">Live verbunden</p>
              <p className="mt-1 text-sm text-ink-500">
                Daten werden direkt aus den Fachtabellen geladen.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-ink-900/35 backdrop-blur-sm transition lg:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onCloseMobile}
      />

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen overflow-y-auto border-r border-white/70 bg-[linear-gradient(180deg,rgba(249,252,253,0.94),rgba(241,246,249,0.9))] p-4 text-ink-900 backdrop-blur-xl transition-all duration-300 lg:rounded-r-[2.2rem]",
          collapsed ? "w-[104px]" : "w-[344px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {content}
      </aside>
    </>
  );
}
