"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { TopHeader } from "@/components/top-header";
import { UserBar } from "@/components/user-bar";
import { cn } from "@/lib/cn";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-transparent">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onToggleCollapsed={() => setCollapsed((current) => !current)}
      />

      <div
        className={cn(
          "min-h-screen px-4 py-4 transition-all duration-300 md:px-5 lg:px-6 lg:py-4 2xl:py-5",
          collapsed ? "lg:ml-[104px] 2xl:ml-[120px]" : "lg:ml-[304px] 2xl:ml-[360px]"
        )}
      >
        <div className="mx-auto max-w-[1640px] 2xl:max-w-[1720px]">
          <UserBar />
          <TopHeader onOpenSidebar={() => setMobileOpen(true)} />
          <main className="space-y-5 2xl:space-y-6">{children}</main>
          <footer className="mt-7 pb-7 2xl:mt-8 2xl:pb-8">
            <div className="surface-muted flex items-center justify-between gap-4 px-4 py-3 text-sm text-ink-500 md:px-5">
              <p>Projekt entwickelt von Dmytro Vasyliev.</p>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                Strobl Online App
              </p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
