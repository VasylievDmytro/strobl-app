"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/cn";

interface MultiSelectFilterProps {
  label: string;
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
}

export function MultiSelectFilter({
  label,
  options,
  values,
  onChange
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);

  const summary = useMemo(() => {
    if (!values.length) {
      return "Alle LV Nummern";
    }

    if (values.length <= 2) {
      return values.join(", ");
    }

    return `${values.length} ausgewaehlt`;
  }, [values]);

  function toggleValue(value: string) {
    if (values.includes(value)) {
      onChange(values.filter((item) => item !== value));
      return;
    }

    onChange([...values, value]);
  }

  return (
    <div className="relative">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-400">
        {label}
      </span>
      <button
        type="button"
        className="input-shell mt-2 flex items-center justify-between text-left"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="min-w-0 flex-1 break-words pr-3 leading-5">{summary}</span>
        <ChevronDown className={cn("ml-2 h-4 w-4 shrink-0 transition", open && "rotate-180")} />
      </button>

      {open ? (
        <div className="surface-card absolute left-0 right-0 z-20 mt-2 max-h-72 overflow-auto p-3">
          <div className="mb-3 flex flex-wrap gap-2">
            {values.map((value) => (
              <button
                key={value}
                type="button"
                className="inline-flex items-center gap-1 rounded-full bg-strobl-50 px-3 py-1 text-xs font-semibold text-strobl-700"
                onClick={() => toggleValue(value)}
              >
                {value}
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {options.map((option) => {
              const active = values.includes(option);

              return (
                <button
                  key={option}
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2 text-left text-sm transition",
                    active ? "bg-strobl-50 text-strobl-700" : "hover:bg-ink-50"
                  )}
                  onClick={() => toggleValue(option)}
                >
                  <span className="break-words leading-5">{option}</span>
                  {active ? <Check className="h-4 w-4 shrink-0" /> : null}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="mt-3 text-sm font-semibold text-strobl-700"
            onClick={() => {
              onChange([]);
              setOpen(false);
            }}
          >
            Auswahl leeren
          </button>
        </div>
      ) : null}
    </div>
  );
}
