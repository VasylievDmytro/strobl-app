"use client";

import {
  Building2,
  CalendarRange,
  CarFront,
  Crown,
  Gauge,
  RotateCcw,
  TrendingUp
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageTitle } from "@/components/page-title";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { InfoCard } from "@/components/ui/info-card";
import { SkeletonLoader } from "@/components/ui/skeleton-loader";
import { fetchJson } from "@/lib/api-client";
import type {
  GeoCaptureAnalytics,
  GeoCaptureMonthOption,
  GeoCaptureRankingItem,
  GeoCaptureTrendPoint,
  UserAccessScope
} from "@/lib/dataverse/models";
import { formatQuantity } from "@/lib/format";

interface GeoCaptureResponse {
  analytics: GeoCaptureAnalytics;
  access: UserAccessScope;
}

function formatMonthValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildMonthOptions(count = 6): GeoCaptureMonthOption[] {
  const current = new Date();

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(current.getFullYear(), current.getMonth() - index, 1);
    return {
      value: formatMonthValue(date),
      label: new Intl.DateTimeFormat("de-DE", {
        month: "long",
        year: "numeric"
      }).format(date)
    };
  });
}

function hoursLabel(value: number) {
  return `${formatQuantity(value)} h`;
}

export function GeoCaptureDashboard() {
  const monthOptions = useMemo(() => buildMonthOptions(6), []);
  const todayValue = useMemo(() => formatDateValue(new Date()), []);
  const [periodMode, setPeriodMode] = useState<"month" | "day">("month");
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]?.value ?? "");
  const [selectedDate, setSelectedDate] = useState(todayValue);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [projectInput, setProjectInput] = useState("");
  const [response, setResponse] = useState<GeoCaptureResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const analytics = response?.analytics ?? null;
  const access = response?.access;

  const projectNumbers = useMemo(
    () =>
      Array.from(
        new Set(
          projectInput
            .split(/[\n,;]+/)
            .map((item) => item.trim())
            .filter(Boolean)
        )
      ),
    [projectInput]
  );

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("periodMode", periodMode);
    if (selectedMonth) {
      params.set("month", selectedMonth);
    }
    if (selectedDate) {
      params.set("date", selectedDate);
    }
    if (selectedEmployee) {
      params.set("employee", selectedEmployee);
    }
    if (projectNumbers.length) {
      params.set("projects", projectNumbers.join(";"));
    }

    setLoading(true);
    setError(null);

    fetchJson<GeoCaptureResponse>(`/api/geocapture?${params.toString()}`)
      .then(setResponse)
      .catch(() => {
        setResponse(null);
        setError("Die GeoCapture-Auswertung konnte nicht geladen werden.");
      })
      .finally(() => setLoading(false));
  }, [periodMode, projectNumbers, selectedDate, selectedEmployee, selectedMonth]);

  useEffect(() => {
    if (!selectedEmployee) {
      return;
    }

    if (analytics && !analytics.availableEmployees.includes(selectedEmployee)) {
      setSelectedEmployee("");
    }
  }, [analytics, selectedEmployee]);

  const focusLabel = access?.isAdmin ? "Alle Mitarbeiter" : "Eigene Arbeitszeiten";

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Arbeitszeit"
        title="GeoCapture Analyse"
        description="Monatliche Auswertung von Mitarbeitern, Stunden, Projekten, Fahrzeugen und Auslastung auf Basis der GeoCapture-Zeiten."
      />

      <FilterBar className="xl:grid-cols-[0.42fr_0.5fr_0.75fr_1fr_auto_1.1fr]">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-400">
            Zeitraum
          </span>
          <select
            className="input-shell"
            value={periodMode}
            onChange={(event) => setPeriodMode(event.target.value as "month" | "day")}
          >
            <option value="month">Monat</option>
            <option value="day">Tag</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-400">
            {periodMode === "day" ? "Tag" : "Monat"}
          </span>
          {periodMode === "day" ? (
            <input
              type="date"
              lang="de-DE"
              className="input-shell"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          ) : (
            <select
              className="input-shell"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
            >
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-400">
            Mitarbeiter
          </span>
          <select
            className="input-shell"
            value={selectedEmployee}
            onChange={(event) => setSelectedEmployee(event.target.value)}
          >
            <option value="">Alle</option>
            {(analytics?.availableEmployees ?? []).map((employee) => (
              <option key={employee} value={employee}>
                {employee}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-400">
            Projektnummer
          </span>
          <div className="space-y-2">
            <p className="text-xs leading-5 text-ink-400">
              Beispiel: 260014-104, 250085-103
            </p>
            <input
              type="text"
              className="input-shell"
              placeholder="Mehrere Projektnummern mit Komma trennen"
              list="geocapture-projects"
              value={projectInput}
              onChange={(event) => setProjectInput(event.target.value)}
            />
            <datalist id="geocapture-projects">
              {(analytics?.availableProjects ?? []).map((project) => (
                <option key={project} value={project} />
              ))}
            </datalist>
          </div>
        </label>

        <div className="grid">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ink-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-strobl-700"
            onClick={() => {
              setPeriodMode("month");
              setSelectedMonth(monthOptions[0]?.value ?? "");
              setSelectedDate(todayValue);
              setSelectedEmployee("");
              setProjectInput("");
            }}
          >
            <RotateCcw className="h-4 w-4" />
            Filter zurücksetzen
          </button>
        </div>

        <div className="surface-muted flex min-h-[88px] items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-400">
              Datenfokus
            </p>
            <p className="mt-2 text-lg font-semibold text-ink-900">{focusLabel}</p>
            <p className="mt-1 text-sm text-ink-500">
              {access?.isAdmin
                ? `Die Kennzahlen beziehen sich auf alle verfügbaren GeoCapture-Einträge für ${analytics?.selectedLabel ?? "den ausgewählten Zeitraum"}.`
                : `Die Kennzahlen zeigen nur Arbeitszeiten, die zu deinem Profilnamen passen, für ${analytics?.selectedLabel ?? "den ausgewählten Zeitraum"}.`}
            </p>
          </div>
          <div className="hidden h-14 w-14 place-items-center rounded-[1.3rem] bg-strobl-50 text-strobl-700 md:grid">
            <Gauge className="h-6 w-6" />
          </div>
        </div>

      </FilterBar>

      {error ? <EmptyState title="Fehler beim Laden" description={error} /> : null}

      {loading ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }, (_, index) => (
              <SkeletonLoader key={index} className="h-36" />
            ))}
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <SkeletonLoader className="h-80" />
            <SkeletonLoader className="h-80" />
          </div>
          <div className="grid gap-4 xl:grid-cols-3">
            <SkeletonLoader className="h-72" />
            <SkeletonLoader className="h-72" />
            <SkeletonLoader className="h-72" />
          </div>
        </>
      ) : analytics ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <InfoCard
              label="Gesamtstunden"
              value={hoursLabel(analytics.totalHours)}
              hint={`${analytics.entryCount} Zeiteinträge in ${analytics.selectedLabel}.`}
              valueClassName="text-[clamp(1.4rem,4vw,2.3rem)]"
            />
            <InfoCard
              label="Aktive Mitarbeiter"
              value={analytics.activeEmployees}
              hint={`${analytics.workdays} Arbeitstage mit erfassten Stunden.`}
              valueClassName="text-[clamp(1.4rem,4vw,2.3rem)]"
            />
            <InfoCard
              label="Ø Stunden / Mitarbeiter"
              value={hoursLabel(analytics.averageHoursPerEmployee)}
              hint="Durchschnitt auf Basis aller aktiven Mitarbeiter im Monat."
              valueClassName="text-[clamp(1.4rem,4vw,2.3rem)]"
            />
            <InfoCard
              label="Top Mitarbeiter"
              value={analytics.topEmployee?.label ?? "Keine Daten"}
              hint={
                analytics.topEmployee
                  ? `${hoursLabel(analytics.topEmployee.value)} im ausgewählten ${periodMode === "day" ? "Tag" : "Monat"}.`
                  : "Im ausgewählten Monat wurden keine Stunden erfasst."
              }
              valueClassName="text-[clamp(1.2rem,3vw,1.8rem)] leading-tight"
            />
            <InfoCard
              label="Stärkster Tag"
              value={analytics.busiestDay?.label ?? "Keine Daten"}
              hint={
                analytics.busiestDay
                  ? `${hoursLabel(analytics.busiestDay.hours)} an diesem Tag.`
                  : `Im ausgewählten ${periodMode === "day" ? "Tag" : "Monat"} gibt es keinen Tageswert.`
              }
              valueClassName="text-[clamp(1.2rem,3vw,1.8rem)] leading-tight"
            />
          </div>

          {analytics.entryCount === 0 ? (
            <EmptyState
              title="Keine GeoCapture-Daten im ausgewählten Monat"
              description="Für diesen Monat wurden in der GeoCapture-Tabelle keine passenden Arbeitszeiten gefunden."
            />
          ) : (
            <>
              <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                <AnalyticsPanel
                  eyebrow="Trend"
                  title={periodMode === "day" ? "Tagesverlauf" : "Monatsverlauf"}
                  description={
                    periodMode === "day"
                      ? "Vergleich der letzten sieben Tage auf Basis der erfassten Arbeitsstunden."
                      : "Vergleich der letzten sechs Monate auf Basis der erfassten Arbeitsstunden."
                  }
                  icon={TrendingUp}
                >
                  <MonthlyTrendChart
                    items={analytics.monthlyTrend}
                    selectedValue={
                      periodMode === "day"
                        ? analytics.selectedDate ?? ""
                        : analytics.selectedMonth
                    }
                  />
                </AnalyticsPanel>

                <AnalyticsPanel
                  eyebrow="Ranking"
                  title="Mitarbeiter mit den meisten Stunden"
                  description={
                    periodMode === "day"
                      ? "Die stärksten Tageswerte im direkten Vergleich."
                      : "Die stärksten Monatswerte im direkten Vergleich."
                  }
                  icon={Crown}
                >
                  <RankingList items={analytics.employeeLeaderboard} accent="amber" />
                </AnalyticsPanel>
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                <AnalyticsPanel
                  eyebrow="Abteilungen"
                  title="Stunden nach Abteilung"
                  description={
                    periodMode === "day"
                      ? "Welche Bereiche am ausgewählten Tag die meisten Stunden gebucht haben."
                      : "Welche Bereiche im ausgewählten Monat die meisten Stunden gebucht haben."
                  }
                  icon={Building2}
                >
                  <RankingList items={analytics.departmentLeaderboard} accent="blue" />
                </AnalyticsPanel>

                <AnalyticsPanel
                  eyebrow="Projekte"
                  title="Stunden nach Projekt"
                  description="Top-Projekte und Kostenstellen nach gebuchten Stunden."
                  icon={CalendarRange}
                >
                  <RankingList items={analytics.projectLeaderboard} accent="slate" />
                </AnalyticsPanel>

                <AnalyticsPanel
                  eyebrow="Fahrzeuge"
                  title="Stunden nach Fahrzeug"
                  description={
                    periodMode === "day"
                      ? "Welche Fahrzeuge am ausgewählten Tag am häufigsten mit Arbeitszeit verbunden waren."
                      : "Welche Fahrzeuge im Monat am häufigsten mit Arbeitszeit verbunden waren."
                  }
                  icon={CarFront}
                >
                  <RankingList items={analytics.vehicleLeaderboard} accent="emerald" />
                </AnalyticsPanel>
              </div>
            </>
          )}
        </>
      ) : null}
    </div>
  );
}

function AnalyticsPanel({
  eyebrow,
  title,
  description,
  icon: Icon,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="surface-card overflow-hidden p-5 md:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-strobl-700">
            {eyebrow}
          </p>
          <h2 className="text-[1.45rem] leading-tight text-ink-900">{title}</h2>
          <p className="max-w-3xl text-sm leading-6 text-ink-500">{description}</p>
        </div>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[1.25rem] bg-strobl-50 text-strobl-700">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      {children}
    </section>
  );
}

function MonthlyTrendChart({
  items,
  selectedValue
}: {
  items: GeoCaptureTrendPoint[];
  selectedValue: string;
}) {
  const maxHours = Math.max(...items.map((item) => item.hours), 1);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
      {items.map((item) => {
        const active = item.value === selectedValue;
        const height = Math.max((item.hours / maxHours) * 160, item.hours > 0 ? 28 : 8);

        return (
          <div
            key={item.value}
            className={`surface-muted flex min-h-[220px] flex-col justify-end gap-4 p-4 ${
              active ? "border-strobl-200 bg-strobl-50/70" : ""
            }`}
          >
            <div className="flex flex-1 items-end">
              <div className="w-full">
                <div
                  className={`w-full rounded-[1rem] ${
                    active
                      ? "bg-[linear-gradient(180deg,#0f5fa8,#6bb8ff)]"
                      : "bg-[linear-gradient(180deg,#b6d8f9,#5b9ee4)]"
                  }`}
                  style={{ height }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                {item.label}
              </p>
              <p className="text-lg font-semibold text-ink-900">{hoursLabel(item.hours)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RankingList({
  items,
  accent
}: {
  items: GeoCaptureRankingItem[];
  accent: "amber" | "blue" | "slate" | "emerald";
}) {
  const accentClass =
    accent === "amber"
      ? "from-amber-500 to-orange-400"
      : accent === "emerald"
        ? "from-emerald-500 to-green-400"
        : accent === "slate"
          ? "from-slate-500 to-slate-400"
          : "from-strobl-700 to-sky-400";

  if (!items.length) {
    return (
      <EmptyState
        title="Keine Daten vorhanden"
        description="Für diese Auswertung wurden im ausgewählten Monat keine Werte gefunden."
        className="min-h-0 p-4"
      />
    );
  }

  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="surface-muted p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-ink-900">{item.label}</p>
              {item.secondary ? (
                <p className="mt-1 truncate text-sm text-ink-500">{item.secondary}</p>
              ) : null}
            </div>
            <span className="shrink-0 text-base font-semibold text-ink-900">
              {hoursLabel(item.value)}
            </span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#e9f0f6]">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${accentClass}`}
              style={{ width: `${Math.max((item.value / maxValue) * 100, 8)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
