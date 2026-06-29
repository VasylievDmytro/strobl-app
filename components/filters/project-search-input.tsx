"use client";

import { useMemo, useState } from "react";

interface ProjectSearchInputProps {
  label: string;
  hint: string;
  placeholder: string;
  value: string;
  suggestions: string[];
  onChange: (value: string) => void;
}

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

function getCurrentTerm(value: string) {
  const lastSeparator = Math.max(
    value.lastIndexOf(","),
    value.lastIndexOf(";"),
    value.lastIndexOf("\n")
  );

  return value.slice(lastSeparator + 1).trim();
}

function replaceCurrentTerm(value: string, suggestion: string) {
  const lastSeparator = Math.max(
    value.lastIndexOf(","),
    value.lastIndexOf(";"),
    value.lastIndexOf("\n")
  );

  if (lastSeparator === -1) {
    return suggestion;
  }

  return `${value.slice(0, lastSeparator + 1)} ${suggestion}`;
}

function suggestionMatches(value: string, term: string) {
  const normalizedTerm = normalizeSearchValue(term);
  const parts = value.split("|").map((part) => normalizeSearchValue(part));

  return (
    parts.some((part) => part.startsWith(normalizedTerm)) ||
    normalizeSearchValue(value).includes(normalizedTerm)
  );
}

export function ProjectSearchInput({
  label,
  hint,
  placeholder,
  value,
  suggestions,
  onChange
}: ProjectSearchInputProps) {
  const [focused, setFocused] = useState(false);
  const currentTerm = getCurrentTerm(value);
  const visibleSuggestions = useMemo(() => {
    if (!currentTerm) {
      return suggestions.slice(0, 8);
    }

    return suggestions
      .filter((suggestion) => suggestionMatches(suggestion, currentTerm))
      .slice(0, 8);
  }, [currentTerm, suggestions]);
  const showSuggestions = focused && visibleSuggestions.length > 0;

  return (
    <div className="relative space-y-2">
      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-400">
          {label}
        </span>
        <div className="space-y-2">
          <p className="text-xs leading-5 text-ink-400">{hint}</p>
          <input
            type="text"
            className="input-shell"
            placeholder={placeholder}
            value={value}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={(event) => onChange(event.target.value)}
          />
        </div>
      </label>

      {showSuggestions ? (
        <div className="absolute left-0 right-0 top-full z-[100] mt-2 overflow-hidden rounded-[1rem] border border-strobl-100 bg-white shadow-[0_20px_45px_-28px_rgba(8,88,163,0.45)]">
          {visibleSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="block w-full px-3 py-2.5 text-left text-sm leading-5 text-ink-700 transition hover:bg-strobl-50 focus:bg-strobl-50 focus:outline-none"
              onMouseDown={(event) => {
                event.preventDefault();
                onChange(replaceCurrentTerm(value, suggestion));
                setFocused(false);
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
