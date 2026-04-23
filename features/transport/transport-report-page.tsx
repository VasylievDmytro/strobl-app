"use client";

import { Download, FileText, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DateRangeFilter } from "@/components/filters/date-range-filter";
import { PageTitle } from "@/components/page-title";
import { DetailPanel } from "@/components/ui/detail-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { InfoCard } from "@/components/ui/info-card";
import { ListCard } from "@/components/ui/list-card";
import { MasterList } from "@/components/ui/master-list";
import { SkeletonLoader } from "@/components/ui/skeleton-loader";
import { fetchJson, requestJson } from "@/lib/api-client";
import type {
  FilterOptions,
  ReportFilters,
  TourRecord,
  TransportDetailBundle,
  TransportReport,
  TransportTimeRecord,
  UserAccessScope
} from "@/lib/dataverse/models";
import { formatDate, formatQuantity, hoursLabel } from "@/lib/format";

interface TransportResponse {
  data: TransportReport[];
  options: FilterOptions;
  access: UserAccessScope;
}

interface TransportExportResponse {
  url: string;
}

const initialFilters: ReportFilters = {
  dateFrom: "",
  dateTo: "",
  bauleiter: "",
  lvNumbers: []
};

export function TransportReportPage() {
  const [filters, setFilters] = useState<ReportFilters>(initialFilters);
  const [lvNumberInput, setLvNumberInput] = useState("");
  const [response, setResponse] = useState<TransportResponse | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [details, setDetails] = useState<TransportDetailBundle | null>(null);
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
    filters.lvNumbers?.forEach((lv) => params.append("lv", lv));

    setLoadingList(true);
    setListError(null);

    fetchJson<TransportResponse>(`/api/transport?${params.toString()}`)
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
        setListError("Die Transportberichte konnten nicht geladen werden.");
      })
      .finally(() => setLoadingList(false));
  }, [filters.bauleiter, filters.dateFrom, filters.dateTo, filters.lvNumbers, reloadKey]);

  useEffect(() => {
    if (!selectedId) {
      setDetails(null);
      return;
    }

    setLoadingDetails(true);
    setDetailsError(null);

    fetchJson<TransportDetailBundle>(`/api/transport/${selectedId}`)
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

  function handleOpenTransportDocument(url?: string) {
    if (!url) {
      window.alert("Link nicht verfügbar");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }

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

  async function handleExportExcel() {
    setExportState("exporting");
    setExportError(null);
    setExportUrl("");

    try {
      const result = await requestJson<TransportExportResponse>("/api/transport/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          lvNumbers: filters.lvNumbers ?? [],
          bauleiter: isAdmin ? filters.bauleiter ?? "" : lockedBauleiter,
          dateFrom: filters.dateFrom ?? "",
          dateTo: filters.dateTo ?? ""
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
        eyebrow="Logistik"
        title="Transportbericht"
        description="Master-Detail Ansicht für Transportberichte mit schnellem Filterzugriff auf Bauleiter, Datumsbereich und mehrere LV Nummern."
      />

      <FilterBar className="xl:grid-cols-[1.25fr_0.9fr_1fr_auto]">
        <DateRangeFilter
          from={filters.dateFrom ?? ""}
          to={filters.dateTo ?? ""}
          onFromChange={(value) => setFilters((current) => ({ ...current, dateFrom: value }))}
          onToChange={(value) => setFilters((current) => ({ ...current, dateTo: value }))}
        />
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
          className="xl:max-h-[calc(100vh-2rem)] xl:min-h-0"
          contentClassName="xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto xl:pr-2"
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
                className="min-h-[320px]"
                title={report.projectLabel}
                subtitle={report.lvNumber}
                onClick={() => setSelectedId(report.id)}
                titleClassName="text-[1.2rem] leading-8 md:text-[1.45rem] md:leading-9"
                subtitleClassName="text-[1rem] leading-7 md:text-[1.05rem]"
                footerClassName="mt-5"
                footer={
                  <div className="space-y-3 text-[0.98rem] leading-7 text-ink-500 md:text-[1.02rem]">
                    <p className="leading-7">
                      {report.client} • {report.bauleiter}
                    </p>
                    {report.mitarbeiterName || report.vehicleLabel ? (
                      <p className="leading-7">
                        {report.mitarbeiterName ?? ""}
                        {report.mitarbeiterName && report.vehicleLabel ? " • " : ""}
                        {report.vehicleLabel ?? ""}
                      </p>
                    ) : null}
                    <p className="leading-7">
                      {formatDate(report.date)} • {report.reportType}
                    </p>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-full border border-strobl-200 bg-white/90 px-3 py-1.5 text-sm font-semibold text-strobl-700 transition hover:border-strobl-300 hover:bg-strobl-50"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleOpenTransportDocument(report.documentUrl);
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
              title="Keine Transportberichte"
              description="Mit den aktuellen Filtern wurde kein passender Bericht gefunden."
            />
          )}
        </MasterList>

        {selectedReport ? (
          <div className="space-y-6">
            <DetailPanel
              title={selectedReport.projectLabel}
              description={selectedReport.client}
              titleClassName="max-w-[14ch] text-[clamp(1.5rem,4vw,2.5rem)] leading-[0.98] md:text-[clamp(1.9rem,3.2vw,3rem)]"
              descriptionClassName="text-[0.95rem] md:text-[1rem]"
              actions={
                false ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-2xl bg-strobl-600 px-4 py-3 text-sm font-semibold text-white"
                    onClick={() => handleOpenTransportDocument(selectedReport?.documentUrl)}
                  >
                    <FileText className="h-4 w-4" />
                    Dokument öffnen
                  </button>
                ) : null
              }
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
                  value={selectedReport.bauleiter}
                  className="p-3.5 md:p-4"
                  valueClassName="mt-2.5 text-[clamp(1rem,3.4vw,1.5rem)] md:text-[clamp(1.2rem,1.8vw,1.7rem)]"
                  labelClassName="text-[9px] tracking-[0.2em] md:text-[10px]"
                />
                <InfoCard
                  label="Typ"
                  value={selectedReport.reportType}
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
                <SkeletonLoader className="h-52" />
                <SkeletonLoader className="h-44" />
              </>
            ) : details ? (
              <>
                <DetailPanel title="Fahrer / Arbeitszeit">
                  {details.zeiterfassung.length ? (
                    <div className="grid gap-3">
                      {details.zeiterfassung.map((row) => (
                        <TimeEntryCard key={row.id} row={row} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="Keine Zeitdaten vorhanden"
                      description="Für diesen Bericht wurden noch keine Arbeitszeiten gefunden."
                    />
                  )}
                </DetailPanel>

                <DetailPanel title="Touren">
                  {details.tours.length ? (
                    <div className="grid gap-4">
                      {details.tours.map((tour) => (
                        <TourCard key={tour.id} tour={tour} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="Keine Touren erfasst"
                      description="Für diesen Bericht wurden noch keine Tourdaten gefunden."
                    />
                  )}
                </DetailPanel>

                <DetailPanel title="Lager / Werkstatt">
                  {details.lager.length ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {details.lager.map((item) => (
                        <div key={item.id} className="surface-muted p-4 md:p-5">
                          <div className="space-y-3">
                            <h3 className="text-base font-semibold text-ink-900">{item.title}</h3>
                            <div className="grid gap-3 text-sm md:grid-cols-2">
                              <Metric label="Vorbereitet" value={item.preparedBy || "—"} />
                              <Metric label="Abgeschlossen" value={item.completedBy || "—"} />
                              {item.machineReference ? (
                                <Metric label="Maschine" value={item.machineReference} />
                              ) : null}
                            </div>
                            {item.notes ? (
                              <div className="rounded-2xl border border-strobl-100 bg-white/80 px-3 py-3 text-sm leading-6 text-ink-600">
                                {item.notes}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="Keine Lagerdaten"
                      description="Für den ausgewählten Bericht sind derzeit keine Werkstatt- oder Lagerdaten vorhanden."
                    />
                  )}
                </DetailPanel>
              </>
            ) : null}
          </div>
        ) : (
          <EmptyState
            title="Noch kein Bericht ausgewählt"
            description="Sobald links ein Transportbericht markiert ist, erscheinen hier die zusammengehörigen Detailbereiche."
          />
        )}
      </div>
    </div>
  );
}

function TimeEntryCard({ row }: { row: TransportTimeRecord }) {
  return (
    <div className="surface-muted p-4 md:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          {row.role ? <p className="text-sm text-ink-500">{row.role}</p> : null}
          <h3 className="text-lg font-semibold leading-tight text-ink-900 md:text-xl">
            {[row.firstName, row.lastName].filter(Boolean).join(" ")}
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4">
          <Metric
            label="Start"
            value={row.startTime || "—"}
            valueClassName="text-base md:text-lg"
          />
          <Metric
            label="Ende"
            value={row.endTime || "—"}
            valueClassName="text-base md:text-lg"
          />
          <Metric
            label="Pause"
            value={`${row.breakMinutes} min`}
            valueClassName="text-base md:text-lg"
          />
          <Metric
            label="Stunden"
            value={hoursLabel(row.totalHours)}
            valueClassName="text-base md:text-lg"
          />
        </div>
      </div>
    </div>
  );
}

function TourCard({ tour }: { tour: TourRecord }) {
  return (
    <div className="surface-muted p-4 md:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-400">
            Lieferscheinnummer
          </p>
          <h3 className="text-xl font-semibold leading-tight text-ink-900 md:text-2xl">
            {tour.deliveryNoteNumber || tour.routeLabel}
          </h3>
        </div>
        {tour.vehicle ? (
          <div className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-strobl-700">
            {tour.vehicle}
          </div>
        ) : null}
      </div>

      {tour.material || tour.tonnage ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {tour.material ? (
            <span className="text-lg font-semibold leading-6 text-ink-800 md:text-xl">
              {tour.material}
            </span>
          ) : null}
          {tour.tonnage ? (
            <span className="rounded-full bg-white px-3.5 py-1.5 text-lg font-semibold text-ink-700 md:text-xl">
              {formatQuantity(tour.tonnage)} t
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <Metric
          label="Beladung"
          value={tour.loadingLocation || "—"}
          valueClassName="text-base leading-6 md:text-lg"
        />
        <Metric
          label="Entladung"
          value={tour.unloadingLocation || "—"}
          valueClassName="text-base leading-6 md:text-lg"
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2.5">
        {tour.cubicMeters ? (
          <span className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-ink-700">
            {tour.cubicMeters} m³
          </span>
        ) : null}
      </div>

      {tour.notes ? (
        <div className="mt-4 rounded-2xl border border-strobl-100 bg-white/80 px-3 py-3 text-sm leading-6 text-ink-600">
          {tour.notes}
        </div>
      ) : null}
    </div>
  );
}

function Metric({
  label,
  value,
  valueClassName
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-400">{label}</p>
      <p className={`font-medium leading-5 text-ink-800 ${valueClassName ?? "text-sm"}`}>{value}</p>
    </div>
  );
}
