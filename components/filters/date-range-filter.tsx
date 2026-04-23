"use client";

import { CalendarDays } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface DateRangeFilterProps {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  className?: string;
  inputClassName?: string;
}

function isoToDisplay(value: string) {
  if (!value) {
    return "";
  }

  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return "";
  }

  return `${day}.${month}.${year}`;
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "").slice(0, 8);
}

function formatDisplayInput(value: string) {
  const digits = digitsOnly(value);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
}

function displayToIso(value: string) {
  const digits = digitsOnly(value);
  if (digits.length !== 8) {
    return null;
  }

  const day = Number.parseInt(digits.slice(0, 2), 10);
  const month = Number.parseInt(digits.slice(2, 4), 10);
  const year = Number.parseInt(digits.slice(4, 8), 10);

  if (!day || !month || !year || month > 12) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return `${year.toString().padStart(4, "0")}-${month
    .toString()
    .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

function DateInput({
  label,
  value,
  onChange,
  inputClassName
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputClassName?: string;
}) {
  const [displayValue, setDisplayValue] = useState(() => isoToDisplay(value));
  const pickerRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDisplayValue(isoToDisplay(value));
  }, [value]);

  function openPicker() {
    const picker = pickerRef.current;
    if (!picker) {
      return;
    }

    if (typeof picker.showPicker === "function") {
      picker.showPicker();
      return;
    }

    picker.click();
  }

  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-400">
        {label}
      </span>
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          placeholder="TT.MM.JJJJ"
          maxLength={10}
          className={`input-shell pr-12 ${inputClassName ?? ""}`}
          value={displayValue}
          onChange={(event) => {
            const nextDisplay = formatDisplayInput(event.target.value);
            setDisplayValue(nextDisplay);

            if (!nextDisplay) {
              onChange("");
              return;
            }

            const isoValue = displayToIso(nextDisplay);
            if (isoValue) {
              onChange(isoValue);
            }
          }}
          onBlur={() => {
            if (!displayValue) {
              onChange("");
              return;
            }

            const isoValue = displayToIso(displayValue);
            if (isoValue) {
              setDisplayValue(isoToDisplay(isoValue));
              onChange(isoValue);
              return;
            }

            setDisplayValue(isoToDisplay(value));
          }}
        />
        <input
          ref={pickerRef}
          type="date"
          lang="de-DE"
          value={value}
          tabIndex={-1}
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-0 h-0 w-0 opacity-0"
          onChange={(event) => {
            const isoValue = event.target.value;
            onChange(isoValue);
            setDisplayValue(isoToDisplay(isoValue));
          }}
        />
        <button
          type="button"
          aria-label={`${label} auswählen`}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-300 transition hover:bg-strobl-50 hover:text-strobl-700"
          onClick={openPicker}
        >
          <CalendarDays className="h-4 w-4" />
        </button>
      </div>
    </label>
  );
}

export function DateRangeFilter({
  from,
  to,
  onFromChange,
  onToChange,
  className,
  inputClassName
}: DateRangeFilterProps) {
  return (
    <div className={className ?? "grid gap-3 sm:grid-cols-2"}>
      <DateInput
        label="Datum von"
        value={from}
        onChange={onFromChange}
        inputClassName={inputClassName}
      />
      <DateInput
        label="Datum bis"
        value={to}
        onChange={onToChange}
        inputClassName={inputClassName}
      />
    </div>
  );
}
