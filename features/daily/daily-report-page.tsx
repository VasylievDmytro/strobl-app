"use client";

import { CloudRain, Download, FileText, RotateCcw, Sun, Wind } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DateRangeFilter } from "@/components/filters/date-range-filter";
import { PageTitle } from "@/components/page-title";
import { DataTable } from "@/components/ui/data-table";
import { DetailPanel } from "@/components/ui/detail-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { InfoCard } from "@/components/ui/info-card";
import { ListCard } from "@/components/ui/list-card";
import { MasterList } from "@/components/ui/master-list";
import { SkeletonLoader } from "@/components/ui/skeleton-loader";
import { fetchJson, requestJson } from "@/lib/api-client";
import type {
  DailyDetailBundle,
  DailyEmployeeRecord,
  DailyReport,
  FilterOptions,
  ReportFilters,
  UserAccessScope
} from "@/lib/dataverse/models";
import { formatDate, hoursLabel } from "@/lib/format";

interface DailyResponse {
  data: DailyReport[];
  options: FilterOptions;
  access: UserAccessScope;
}

interface DailyExportResponse {
  url: string;
}

const initialFilters: ReportFilters = {
  dateFrom: "",
  dateTo: "",
  bauleiter: "",
  lvNumbers: [],
  reportType: ""
};

function parseLvNumbers(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\n,;]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

export function DailyReportPage() {
  const [filters, setFilters] = useState<ReportFilters>(initialFilters);
  const [lvNumberInput, setLvNumberInput] = useState("");
  const [response, setResponse] = useState<DailyResponse | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [details, setDetails] = useState<DailyDetailBundle | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [exportState, setExportState] = useState<"idle" | "exporting" | "ready">("idle");
  const [exportUrl, setExportUrl] = useState("");
  const [exportError, setExportError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [detailReloadKey, setDetailReloadKey] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (filters.bauleiter) params.set("bauleiter", filters.bauleiter);
    if (filters.reportType) params.set("reportType", filters.reportType);
    filters.lvNumbers?.forEach((lv) => params.append("lv", lv));

    setLoadingList(true);
    setListError(null);

    fetchJson<DailyResponse>(`/api/daily?${params.toString()}`)
      .then((data) => {
        setResponse(data);
        if (!data.access.isAdmin && data.access.bauleiter) {
          setFilters((current) =>
            current.bauleiter === data.access.bauleiter
              ? current
              : { ...current, bauleiter: data.access.bauleiter ?? "" }
          );
        }
        setSelectedId((current) =>
          data.data.some((item) => item.id === current) ? current : (data.data[0]?.id ?? null)
        );
      })
      .catch(() => {
        setResponse(null);
        setSelectedId(null);
        setListError("Die Tagesberichte konnten nicht geladen werden.");
      })
      .finally(() => setLoadingList(false));
  }, [
    filters.bauleiter,
    filters.dateFrom,
    filters.dateTo,
    filters.lvNumbers,
    filters.reportType,
    reloadKey
  ]);

  useEffect(() => {
    if (!selectedId) {
      setDetails(null);
      return;
    }

    setLoadingDetails(true);
    setDetailsError(null);

    fetchJson<DailyDetailBundle>(`/api/daily/${selectedId}`)
      .then(setDetails)
      .catch(() => {
        setDetails(null);
        setDetailsError("Die Detaildaten konnten nicht geladen werden.");
      })
      .finally(() => setLoadingDetails(false));
  }, [detailReloadKey, selectedId]);

  const selectedReport = useMemo(
    () => response?.data.find((item) => item.id === selectedId) ?? null,
    [response?.data, selectedId]
  );

  const isAdmin = response?.access.isAdmin ?? true;
  const lockedBauleiter = response?.access.bauleiter ?? "";
  const bauleiterOptions = useMemo(() => {
    const options = response?.options.bauleiter ?? [];
    if (!isAdmin && lockedBauleiter && !options.includes(lockedBauleiter)) {
      return [lockedBauleiter, ...options];
    }

    return options;
  }, [isAdmin, lockedBauleiter, response?.options.bauleiter]);

  const typeOptions = response?.options.reportTypes ?? [];

  function handleOpenDocument(url?: string) {
    if (!url) {
      window.alert("Link nicht verfügbar");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function handleExportExcel() {
    setExportState("exporting");
    setExportError(null);
    setExportUrl("");

    try {
      const result = await requestJson<DailyExportResponse>("/api/daily/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          lvNumbers: filters.lvNumbers ?? [],
          bauleiter: isAdmin ? filters.bauleiter ?? "" : lockedBauleiter,
          dateFrom: filters.dateFrom ?? "",
          dateTo: filters.dateTo ?? "",
          reportType: filters.reportType ?? ""
        })
      });

      setExportUrl(result.url);
      setExportState("ready");
    } catch (error) {
      setExportState("idle");
      setExportError(
        error instanceof Error
          ? error.message
          : "Der Excel-Export konnte nicht gestartet werden."
      );
    }
  }

  function handleOpenExcel() {
    if (!exportUrl) {
      return;
    }

    window.open(exportUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Baustelle"
        title="Tagesbericht"
        description="Master-Detail Ansicht für Tagesberichte mit Fokus auf Typ, Mitarbeiter, Fahrzeuge, Bauleistung, Lager und Wetter."
      />

      <FilterBar className="xl:grid-cols-[1.15fr_0.75fr_0.85fr_1fr_auto]">
        <DateRangeFilter
          from={filters.dateFrom ?? ""}
          to={filters.dateTo ?? ""}
          onFromChange={(value) => setFilters((current) => ({ ...current, dateFrom: value }))}
          onToChange={(value) => setFilters((current) => ({ ...current, dateTo: value }))}
        />

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-400">
            Typ
          </span>
          <select
            className="input-shell"
            value={filters.reportType ?? ""}
            onChange={(event) =>
              setFilters((current) => ({ ...current, reportType: event.target.value }))
            }
          >
            <option value="">Alle Typen</option>
            {typeOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-400">
            LV Nummern
          </span>
          <div className="space-y-2">
            <p className="text-xs leading-5 text-ink-400">Beispiel: 260014-104, 250085-103</p>
            <input
              type="text"
              className="input-shell"
              placeholder="Mehrere Nummern mit Komma trennen"
              value={lvNumberInput}
              onChange={(event) => {
                const value = event.target.value;
                setLvNumberInput(value);
                setFilters((current) => ({ ...current, lvNumbers: parseLvNumbers(value) }));
              }}
            />
          </div>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-400">
            Bauleiter
          </span>
          <select
            className="input-shell"
            value={isAdmin ? filters.bauleiter ?? "" : lockedBauleiter}
            disabled={!isAdmin}
            onChange={(event) =>
              setFilters((current) => ({ ...current, bauleiter: event.target.value }))
            }
          >
            {isAdmin ? <option value="">Alle</option> : null}
            {bauleiterOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ink-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-strobl-700"
            onClick={() => {
              setFilters(initialFilters);
              setLvNumberInput("");
            }}
          >
            <RotateCcw className="h-4 w-4" />
            Filter leeren
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-strobl-200 bg-strobl-50 px-4 py-3 text-sm font-semibold text-strobl-700 transition hover:bg-strobl-100"
            onClick={handleExportExcel}
            disabled={exportState === "exporting"}
          >
            <Download className="h-4 w-4" />
            {exportState === "exporting" ? "Export läuft..." : "Export Excel"}
          </button>
          {exportState === "ready" && exportUrl ? (
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              onClick={handleOpenExcel}
            >
              <FileText className="h-4 w-4" />
              Open Excel
            </button>
          ) : null}
        </div>
      </FilterBar>

      {exportError ? (
        <EmptyState
          title="Export nicht möglich"
          description={exportError}
          className="min-h-0 p-4 md:p-5"
        />
      ) : null}

      {listError ? (
        <EmptyState
          title="Fehler beim Laden"
          description={listError}
          action={
            <button
              type="button"
              className="rounded-2xl bg-strobl-600 px-4 py-2 text-sm font-semibold text-white"
              onClick={() => setReloadKey((current) => current + 1)}
            >
              Erneut laden
            </button>
          }
        />
      ) : null}

      <div className="grid gap-6 xl:min-h-0 xl:grid-cols-[0.88fr_1.12fr]">
        <MasterList
          title="Berichte"
          count={response?.data.length ?? 0}
          className="xl:h-[calc(100vh+34rem)] xl:min-h-0"
          contentClassName="xl:h-[calc(100vh+28rem)] xl:overflow-y-auto xl:pr-2"
        >
          {loadingList ? (
            <>
              <SkeletonLoader className="h-32" />
              <SkeletonLoader className="h-32" />
              <SkeletonLoader className="h-32" />
            </>
          ) : response?.data.length ? (
            response.data.map((report) => (
              <ListCard
                key={report.id}
                active={report.id === selectedId}
                title={report.address || report.reportName}
                subtitle={report.lvNumber}
                onClick={() => setSelectedId(report.id)}
                titleClassName="text-[1.2rem] leading-8 md:text-[1.45rem] md:leading-9"
                subtitleClassName="text-[1rem] leading-7 md:text-[1.05rem]"
                footerClassName="mt-5"
                footer={
                  <div className="space-y-3 text-[0.98rem] leading-7 text-ink-500 md:text-[1.02rem]">
                    <p className="leading-7">
                      {report.client} • {report.bauleiter || "Ohne Bauleiter"}
                    </p>
                    <p className="leading-7">
                      {formatDate(report.date)} • {report.reportType ?? report.reportName}
                    </p>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-full border border-strobl-200 bg-white/90 px-3 py-1.5 text-sm font-semibold text-strobl-700 transition hover:border-strobl-300 hover:bg-strobl-50"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleOpenDocument(report.documentUrl);
                      }}
                    >
                      <FileText className="h-4 w-4" />
                      PDF
                    </button>
                  </div>
                }
              />
            ))
          ) : (
            <EmptyState
              title="Keine Tagesberichte"
              description="Die aktuelle Kombination aus Filtern liefert keine Treffer."
            />
          )}
        </MasterList>

        {selectedReport ? (
          <div className="space-y-6">
            <DetailPanel
              title={selectedReport.address || selectedReport.reportName}
              description={selectedReport.client}
              titleClassName="max-w-[14ch] text-[clamp(1.5rem,4vw,2.5rem)] leading-[0.98] md:text-[clamp(1.9rem,3.2vw,3rem)]"
              descriptionClassName="text-[0.95rem] md:text-[1rem]"
            >
              <div className="grid gap-3 md:grid-cols-2">
                <InfoCard
                  label="LV Nummer"
                  value={selectedReport.lvNumber}
                  className="p-3.5 md:p-4"
                  valueClassName="mt-2.5 text-[clamp(1rem,3.4vw,1.5rem)] md:text-[clamp(1.2rem,1.8vw,1.7rem)]"
                  labelClassName="text-[9px] tracking-[0.2em] md:text-[10px]"
                />
                <InfoCard
                  label="Datum"
                  value={formatDate(selectedReport.date)}
                  className="p-3.5 md:p-4"
                  valueClassName="mt-2.5 text-[clamp(1rem,3.4vw,1.5rem)] md:text-[clamp(1.2rem,1.8vw,1.7rem)]"
                  labelClassName="text-[9px] tracking-[0.2em] md:text-[10px]"
                />
                <InfoCard
                  label="Bauleiter"
                  value={selectedReport.bauleiter || "—"}
                  className="p-3.5 md:p-4"
                  valueClassName="mt-2.5 text-[clamp(1rem,3.4vw,1.5rem)] md:text-[clamp(1.2rem,1.8vw,1.7rem)]"
                  labelClassName="text-[9px] tracking-[0.2em] md:text-[10px]"
                />
                <InfoCard
                  label="Typ"
                  value={selectedReport.reportType ?? selectedReport.reportName}
                  className="p-3.5 md:p-4"
                  valueClassName="mt-2.5 text-[clamp(1rem,3.4vw,1.5rem)] md:text-[clamp(1.2rem,1.8vw,1.7rem)]"
                  labelClassName="text-[9px] tracking-[0.2em] md:text-[10px]"
                />
              </div>
            </DetailPanel>

            {detailsError ? (
              <EmptyState
                title="Detailbereich nicht verfügbar"
                description={detailsError}
                action={
                  <button
                    type="button"
                    className="rounded-2xl bg-strobl-600 px-4 py-2 text-sm font-semibold text-white"
                    onClick={() => setDetailReloadKey((current) => current + 1)}
                  >
                    Erneut laden
                  </button>
                }
              />
            ) : loadingDetails ? (
              <>
                <SkeletonLoader className="h-48" />
                <SkeletonLoader className="h-56" />
                <SkeletonLoader className="h-52" />
              </>
            ) : details ? (
              <>
                <DetailPanel title="Mitarbeiter">
                  <DataTable<DailyEmployeeRecord>
                    emptyLabel="Keine Mitarbeiterdaten vorhanden."
                    rows={details.mitarbeiter}
                    columns={[
                      {
                        key: "name",
                        header: "Mitarbeiter",
                        render: (row) => `${row.lastName}, ${row.firstName}`
                      },
                      {
                        key: "number",
                        header: "Pers.-Nr.",
                        render: (row) => row.personnelNumber
                      },
                      {
                        key: "role",
                        header: "Rolle",
                        render: (row) => row.role
                      },
                      {
                        key: "start",
                        header: "Start",
                        render: (row) => row.startTime
                      },
                      {
                        key: "end",
                        header: "Ende",
                        render: (row) => row.endTime
                      },
                      {
                        key: "break",
                        header: "Pause",
                        render: (row) => `${row.breakMinutes} min`
                      },
                      {
                        key: "hours",
                        header: "Stunden",
                        render: (row) => hoursLabel(row.totalHours)
                      }
                    ]}
                  />
                </DetailPanel>

                <DetailPanel title="Fahrzeuge">
                  {details.lkw.length || details.lkwFahrer.length || details.pkw.length ? (
                    <div className="grid gap-4 lg:grid-cols-3">
                      <div className="surface-muted p-5">
                        <h3 className="text-base font-semibold text-ink-900">LKW</h3>
                        <div className="mt-4 space-y-3">
                          {details.lkw.length ? (
                            details.lkw.map((item) => (
                              <div key={item.id} className="rounded-2xl bg-white/90 p-4">
                                <p className="font-semibold text-ink-900">{item.plate}</p>
                                <p className="mt-1 text-sm text-ink-700">{item.usage}</p>
                                {item.zusatzgeraet ? (
                                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-strobl-700">
                                    {item.zusatzgeraet}
                                  </p>
                                ) : null}
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-ink-500">Keine LKW-Daten vorhanden.</p>
                          )}
                        </div>
                      </div>

                      <div className="surface-muted p-5">
                        <h3 className="text-base font-semibold text-ink-900">LKW Fahrer</h3>
                        <div className="mt-4 space-y-3">
                          {details.lkwFahrer.length ? (
                            details.lkwFahrer.map((item) => (
                              <div key={item.id} className="rounded-2xl bg-white/90 p-4">
                                <p className="font-semibold text-ink-900">{item.driverName}</p>
                                <p className="mt-1 text-sm text-ink-700">{item.truckPlate || "—"}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-ink-500">Keine Fahrerdaten vorhanden.</p>
                          )}
                        </div>
                      </div>

                      <div className="surface-muted p-5">
                        <h3 className="text-base font-semibold text-ink-900">PKW / Zusatzgerät</h3>
                        <div className="mt-4 space-y-3">
                          {details.pkw.length ? (
                            details.pkw.map((item) => (
                              <div key={item.id} className="rounded-2xl bg-white/90 p-4">
                                <p className="font-semibold text-ink-900">{item.plate || "Ohne Kennzeichen"}</p>
                                <p className="mt-1 text-sm text-ink-700">{item.usage}</p>
                                {item.zusatzgeraet ? (
                                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-strobl-700">
                                    {item.zusatzgeraet}
                                  </p>
                                ) : null}
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-ink-500">Keine PKW- oder Gerätedaten vorhanden.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      title="Keine Fahrzeugdaten"
                      description="Für den aktuellen Tagesbericht sind noch keine LKW-, Fahrer- oder PKW-Daten hinterlegt."
                    />
                  )}
                </DetailPanel>

                <DetailPanel title="Bauleistung">
                  {details.bauleistung.length || details.erschwernisse.length ? (
                    <div className="grid gap-4 lg:grid-cols-2">
                      {details.bauleistung.map((item) => (
                        <div key={item.id} className="surface-muted p-5">
                          <h3 className="text-base font-semibold text-ink-900">Bauleistung</h3>
                          <div className="mt-4 space-y-3 text-sm leading-6 text-ink-700">
                            <p>{item.bauleistung}</p>
                            {item.sonstige ? <p>Sonstige: {item.sonstige}</p> : null}
                            {item.einweisung ? <p>Einweisung: {item.einweisung}</p> : null}
                            {item.vrao ? <p>VRAO: {item.vrao}</p> : null}
                          </div>
                        </div>
                      ))}
                      {details.erschwernisse.map((item) => (
                        <div key={item.id} className="surface-muted p-5">
                          <h3 className="text-base font-semibold text-ink-900">Erschwernisse</h3>
                          <p className="mt-4 text-sm leading-6 text-ink-700">
                            {item.erschwernisse}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="Keine Leistungsdaten"
                      description="Für diesen Bericht wurden noch keine Bauleistungs- oder Erschwernisdaten gefunden."
                    />
                  )}
                </DetailPanel>

                <DetailPanel title="Lager / Werkstatt">
                  {details.lager.length ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {details.lager.map((item) => (
                        <div key={item.id} className="surface-muted p-5">
                          <h3 className="text-base font-semibold text-ink-900">Lager / Werkstatt</h3>
                          <p className="mt-4 text-sm leading-6 text-ink-700">
                            {item.lagerbereitung}
                          </p>
                          <div className="mt-4 rounded-2xl bg-white/90 p-4 text-sm leading-6 text-ink-700">
                            {item.gemacht}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="Keine Lagerdaten"
                      description="Für den ausgewählten Tagesbericht sind derzeit keine Werkstatt- oder Lagerdaten vorhanden."
                    />
                  )}
                </DetailPanel>

                <DetailPanel title="Wetter">
                  {details.wetter.length ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {details.wetter.map((item) => (
                        <div key={item.id} className="surface-muted p-5">
                          <h3 className="text-base font-semibold text-ink-900">Wetterlage</h3>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <WeatherChip
                              icon={<Sun className="h-4 w-4" />}
                              label={item.sonne ? "Sonne" : "Keine Sonne"}
                              active={item.sonne}
                            />
                            <WeatherChip
                              icon={<CloudRain className="h-4 w-4" />}
                              label={item.regenSchnee ? "Regen / Schnee" : "Trocken"}
                              active={item.regenSchnee}
                            />
                            <WeatherChip
                              icon={<Wind className="h-4 w-4" />}
                              label={item.wind}
                              active
                            />
                            <WeatherChip label={item.temperatur} active />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="Keine Wetterdaten"
                      description="Für diesen Tagesbericht sind derzeit keine Wetterinformationen vorhanden."
                    />
                  )}
                </DetailPanel>
              </>
            ) : null}
          </div>
        ) : (
          <EmptyState
            title="Noch kein Bericht ausgewählt"
            description="Sobald links ein Tagesbericht markiert ist, erscheinen hier die zusammengehörigen Detailbereiche."
          />
        )}
      </div>
    </div>
  );
}

function WeatherChip({
  label,
  icon,
  active
}: {
  label: string;
  icon?: React.ReactNode;
  active: boolean;
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold ${
        active ? "bg-white text-strobl-700" : "bg-white/60 text-ink-500"
      }`}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}
