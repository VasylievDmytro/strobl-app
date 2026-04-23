"use client";

import { cn } from "@/lib/cn";

interface Tab<T extends string> {
  id: T;
  label: string;
}

interface TabGroupProps<T extends string> {
  tabs: Tab<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function TabGroup<T extends string>({
  tabs,
  value,
  onChange
}: TabGroupProps<T>) {
  return (
    <div className="inline-flex flex-wrap gap-2 rounded-3xl bg-white/75 p-2 shadow-soft">
      {tabs.map((tab) => {
        const active = tab.id === value;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "rounded-2xl px-4 py-2 text-sm font-semibold transition duration-300",
              active
                ? "bg-strobl-600 text-white shadow-soft"
                : "text-ink-500 hover:bg-strobl-50 hover:text-strobl-700"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
