"use client";

import { Check, CheckCircle2, Circle, ExternalLink, LoaderCircle, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DateRangeFilter } from "@/components/filters/date-range-filter";
import { SearchInput } from "@/components/filters/search-input";
import { PageTitle } from "@/components/page-title";
import { DetailPanel } from "@/components/ui/detail-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { InfoCard } from "@/components/ui/info-card";
import { ListCard } from "@/components/ui/list-card";
import { MasterList } from "@/components/ui/master-list";
import { SkeletonLoader } from "@/components/ui/skeleton-loader";
import { StatusBadge } from "@/components/ui/status-badge";
import { fetchJson, requestJson } from "@/lib/api-client";
import type {
  FilterOptions,
  IncomingInvoice,
  StatusMode,
  UserAccessScope
} from "@/lib/dataverse/models";
import { formatCurrency, formatDate } from "@/lib/format";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";

interface InvoiceResponse {
  data: IncomingInvoice[];
  options: FilterOptions;
  access: UserAccessScope;
}

interface InvoiceUpdateResponse {
  data: IncomingInvoice;
}

function getDefaultFilters() {
  return {
    dateFrom: "",
    dateTo: "",
    supplier: "",
    bauleiter: "",
    search: "",
    passt: "all" as StatusMode
  };
}

export function IncomingInvoicesPage() {
  const [filters, setFilters] = useState(getDefaultFilters);
  const [response, setResponse] = useState<InvoiceResponse | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [statusDraft, setStatusDraft] = useState<boolean>(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const debouncedSupplier = useDebouncedValue(filters.supplier);
  const debouncedSearch = useDebouncedValue(filters.search);

  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (debouncedSupplier) params.set("supplier", debouncedSupplier);
    if (filters.bauleiter) params.set("bauleiter", filters.bauleiter);
    if (debouncedSearch) params.set("search", debouncedSearch);
    params.set("passt", filters.passt);

    setLoading(true);
    setError(null);

    fetchJson<InvoiceResponse>(`/api/invoices?${params.toString()}`)
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
      .catch(() => setError("Die Rechnungen konnten nicht geladen werden."))
      .finally(() => setLoading(false));
  }, [
    filters.bauleiter,
    filters.dateFrom,
    filters.dateTo,
    filters.passt,
    debouncedSearch,
    debouncedSupplier,
    reloadKey
  ]);

  const selectedInvoice = useMemo(
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

  useEffect(() => {
    if (!selectedInvoice) {
      setStatusDraft(false);
      setCommentDraft("");
      setSaveError(null);
      setSaveState("idle");
      return;
    }

    setStatusDraft(selectedInvoice.passt);
    setCommentDraft(selectedInvoice.comment ?? "");
    setSaveError(null);
    setSaveState("idle");
  }, [selectedInvoice?.comment, selectedInvoice?.id, selectedInvoice?.passt]);

  const hasPendingChanges = selectedInvoice
    ? statusDraft !== selectedInvoice.passt ||
      commentDraft.trim() !== (selectedInvoice.comment ?? "").trim()
    : false;

  async function handleSaveInvoice() {
    if (!selectedInvoice || !hasPendingChanges) {
      return;
    }

    setSaveState("saving");
    setSaveError(null);

    try {
      const result = await requestJson<InvoiceUpdateResponse>(`/api/invoices/${selectedInvoice.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          passt: statusDraft,
          comment: commentDraft
        })
      });

      setResponse((current) =>
        current
          ? {
              ...current,
              data: current.data.map((invoice) =>
                invoice.id === result.data.id ? result.data : invoice
              )
            }
          : current
      );
      setSaveState("saved");
    } catch {
      setSaveState("idle");
      setSaveError("Die Aenderungen konnten nicht gespeichert werden.");
    }
  }

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Rechnungen"
        title="Eingangsrechnungen"
        description="Lieferantenrechnungen werden nach Datum, Namen, Bauleiter, LV oder Belegnummer gefiltert und standardmaessig absteigend nach Belegdatum sortiert."
      />

      <section className="surface-card overflow-hidden p-3.5 md:p-4">
        <div className="grid gap-2.5 xl:grid-cols-[1.35fr_1.1fr_180px]">
          <div className="surface-muted p-3">
            <DateRangeFilter
              from={filters.dateFrom}
              to={filters.dateTo}
              onFromChange={(value) => setFilters((current) => ({ ...current, dateFrom: value }))}
              onToChange={(value) => setFilters((current) => ({ ...current, dateTo: value }))}
              className="grid gap-3 sm:grid-cols-2"
              inputClassName="py-2"
            />
          </div>

          <div className="surface-muted p-3">
            <div className="space-y-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
                Bestätigung
              </span>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  className={`inline-flex items-center justify-center gap-2 rounded-[1.1rem] border px-3 py-2 text-sm font-semibold transition ${
                    filters.passt === "false"
                      ? "border-amber-300 bg-amber-50 text-amber-800"
                      : "border-white/80 bg-white/80 text-ink-600 hover:border-amber-200 hover:bg-amber-50/50"
                  }`}
                  onClick={() =>
                    setFilters((current) => ({
                      ...current,
                      passt: current.passt === "false" ? "all" : ("false" as StatusMode)
                    }))
                  }
                >
                  <Circle className="h-4 w-4 fill-amber-500 text-amber-500" />
                  Unbestätigte
                </button>
                <button
                  type="button"
                  className={`inline-flex items-center justify-center gap-2 rounded-[1.1rem] border px-3 py-2 text-sm font-semibold transition ${
                    filters.passt === "true"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                      : "border-white/80 bg-white/80 text-ink-600 hover:border-emerald-200 hover:bg-emerald-50/50"
                  }`}
                  onClick={() =>
                    setFilters((current) => ({
                      ...current,
                      passt: current.passt === "true" ? "all" : ("true" as StatusMode)
                    }))
                  }
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Bestätigte
                </button>
              </div>
            </div>
          </div>

          <div className="surface-muted flex items-center p-3">
            <button
              type="button"
              className="inline-flex w-full items-center justify-center gap-2 rounded-[1.1rem] bg-ink-900 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-strobl-700"
              onClick={() => setFilters(getDefaultFilters())}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Filter zurücksetzen
            </button>
          </div>
        </div>

        <div className="mt-3 grid gap-2.5 xl:grid-cols-[0.95fr_0.8fr_1.25fr]">
          <div className="surface-muted p-3">
            <SearchInput
              label="Lieferant"
              placeholder="Anzeigename beginnt mit..."
              value={filters.supplier}
              onChange={(value) => setFilters((current) => ({ ...current, supplier: value }))}
              inputClassName="py-2"
            />
          </div>

          <div className="surface-muted p-3">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-400">
                Bauleiter
              </span>
              <select
                className="input-shell py-2"
                value={isAdmin ? filters.bauleiter : lockedBauleiter}
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
          </div>

          <div className="surface-muted p-3">
            <SearchInput
              label="LV / Belegnummer"
              placeholder="LVNummer oder Belegnummer..."
              value={filters.search}
              onChange={(value) => setFilters((current) => ({ ...current, search: value }))}
              inputClassName="py-2"
            />
          </div>
        </div>
      </section>

      {error ? (
        <EmptyState
          title="Fehler beim Laden"
          description={error}
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

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr] xl:items-start">
        <MasterList
          title="Rechnungsliste"
          count={response?.data.length ?? 0}
          className="xl:min-h-0 xl:max-h-[calc(100vh-11rem)]"
          contentClassName="xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pr-2"
        >
          {loading ? (
            <>
              <SkeletonLoader className="h-28" />
              <SkeletonLoader className="h-28" />
              <SkeletonLoader className="h-28" />
            </>
          ) : response?.data.length ? (
            response.data.map((invoice) => (
              <ListCard
                key={invoice.id}
                active={invoice.id === selectedId}
                className="min-h-[250px]"
                title={invoice.supplierName}
                subtitle={`${invoice.invoiceNumber} | ${invoice.lvNumber}`}
                meta={<StatusBadge value={invoice.passt} />}
                onClick={() => setSelectedId(invoice.id)}
                footer={
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-ink-500">
                      <span>{invoice.bauleiter}</span>
                      <span>|</span>
                      <span>{formatDate(invoice.bookingDate)}</span>
                      <span>|</span>
                      <span>{formatCurrency(invoice.amount)}</span>
                    </div>
                    <div className="rounded-[1rem] border border-[#dbe7f1] bg-white/80 px-3 py-2.5 md:rounded-[1.15rem]">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                        Kommentar
                      </p>
                      <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-ink-600 md:leading-6">
                        {invoice.comment || "Kein Kommentar vorhanden."}
                      </p>
                    </div>
                    {invoice.documentUrl ? (
                      <a
                        href={invoice.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex items-center gap-1.5 rounded-2xl border border-strobl-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-strobl-700 transition hover:border-strobl-400 hover:bg-strobl-50"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        PDF
                      </a>
                    ) : null}
                  </div>
                }
              />
            ))
          ) : (
            <EmptyState
              title="Keine Rechnungen gefunden"
              description="Mit den aktuellen Filtern gibt es keine passenden Eingangsrechnungen."
            />
          )}
        </MasterList>

        {loading ? (
          <div className="space-y-4">
            <SkeletonLoader className="h-40" />
            <SkeletonLoader className="h-28" />
            <SkeletonLoader className="h-56" />
          </div>
        ) : selectedInvoice ? (
          <DetailPanel
            className="xl:min-h-0 xl:max-h-[calc(100vh-11rem)] xl:overflow-y-auto xl:pr-4"
            titleClassName="max-w-[30ch] text-[1.08rem] leading-[1.06] tracking-[-0.02em] md:text-[1.3rem] xl:text-[1.55rem]"
            descriptionClassName="max-w-[52ch] text-[0.8rem] leading-5 md:text-[0.88rem]"
            title={selectedInvoice.supplierName}
            description="Ausgewaehlte Rechnung mit den wichtigsten Pruef- und Referenzinformationen."
            actions={<StatusBadge value={statusDraft} />}
          >
            <div className="grid gap-2 md:grid-cols-2">
              <InfoCard
                label="Rechnungsnummer"
                value={selectedInvoice.invoiceNumber}
                className="min-h-[72px] p-2"
                labelClassName="text-[8px] tracking-[0.18em]"
                valueClassName="mt-1 text-[clamp(0.78rem,0.82vw,0.98rem)] leading-[1.08]"
              />
              <InfoCard
                label="LV Nummer"
                value={selectedInvoice.lvNumber}
                className="min-h-[72px] p-2"
                labelClassName="text-[8px] tracking-[0.18em]"
                valueClassName="mt-1 text-[clamp(0.78rem,0.82vw,0.98rem)] leading-[1.08]"
              />
              <InfoCard
                label="Bauleiter"
                value={selectedInvoice.bauleiter}
                className="min-h-[72px] p-2"
                labelClassName="text-[8px] tracking-[0.18em]"
                valueClassName="mt-1 text-[clamp(0.78rem,0.82vw,0.98rem)] leading-[1.08]"
              />
              <InfoCard
                label="Belegdatum"
                value={formatDate(selectedInvoice.bookingDate)}
                className="min-h-[72px] p-2"
                labelClassName="text-[8px] tracking-[0.18em]"
                valueClassName="mt-1 text-[clamp(0.78rem,0.82vw,0.98rem)] leading-[1.08]"
              />
              <InfoCard
                label="Betrag"
                value={formatCurrency(selectedInvoice.amount)}
                className="min-h-[72px] p-2"
                labelClassName="text-[8px] tracking-[0.18em]"
                valueClassName="mt-1 text-[clamp(0.78rem,0.82vw,0.98rem)] leading-[1.08]"
              />
              <InfoCard
                label="Status"
                value={
                  <div className="space-y-1.5">
                    <div className="grid gap-1.5 sm:grid-cols-2">
                      <button
                        type="button"
                        className={`inline-flex items-center justify-center gap-1.5 rounded-[0.85rem] border px-2 py-1.5 text-[10px] font-semibold transition ${
                          !statusDraft
                            ? "border-amber-300 bg-amber-50 text-amber-800"
                            : "border-[#dbe7f1] bg-white text-ink-500 hover:border-amber-200 hover:bg-amber-50/50"
                        }`}
                        onClick={() => setStatusDraft(false)}
                      >
                        <Circle className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                        Unbestätigt
                      </button>
                      <button
                        type="button"
                        className={`inline-flex items-center justify-center gap-1.5 rounded-[0.85rem] border px-2 py-1.5 text-[10px] font-semibold transition ${
                          statusDraft
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                            : "border-[#dbe7f1] bg-white text-ink-500 hover:border-emerald-200 hover:bg-emerald-50/50"
                        }`}
                        onClick={() => setStatusDraft(true)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Bestätigt
                      </button>
                    </div>
                  </div>
                }
                className="min-h-[72px] p-2"
                labelClassName="text-[8px] tracking-[0.18em]"
                valueClassName="mt-1"
              />
            </div>

            <div className="mt-3">
              <div className="surface-muted p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-400">
                    Kommentar
                  </p>
                  <button
                    type="button"
                    disabled={!hasPendingChanges || saveState === "saving"}
                    onClick={handleSaveInvoice}
                    className={`inline-flex items-center gap-1.5 rounded-[0.85rem] px-2.5 py-1.5 text-[11px] font-semibold transition ${
                      !hasPendingChanges || saveState === "saving"
                        ? "cursor-not-allowed border border-[#dbe7f1] bg-white text-ink-400"
                        : "bg-strobl-700 text-white hover:bg-strobl-800"
                    }`}
                  >
                    {saveState === "saving" ? (
                      <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                    ) : saveState === "saved" && !hasPendingChanges ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : null}
                    {saveState === "saving"
                      ? "Speichern..."
                      : saveState === "saved" && !hasPendingChanges
                        ? "Gespeichert"
                        : "Speichern"}
                  </button>
                </div>
                <textarea
                  value={commentDraft}
                  onChange={(event) => {
                    setCommentDraft(event.target.value);
                    if (saveState === "saved") {
                      setSaveState("idle");
                    }
                  }}
                  placeholder="Kommentar eingeben..."
                  className="mt-2.5 min-h-[88px] w-full rounded-[0.95rem] border border-[#dbe7f1] bg-white px-3 py-2.5 text-sm leading-5 text-ink-700 outline-none transition placeholder:text-ink-300 focus:border-strobl-300 focus:ring-2 focus:ring-strobl-100"
                />
                {saveError ? <p className="mt-3 text-sm text-rose-700">{saveError}</p> : null}
                {!selectedInvoice.documentUrl ? (
                  <p className="mt-4 text-sm text-amber-700">
                    Fuer diese Rechnung ist noch kein PDF-Link verfuegbar.
                  </p>
                ) : null}
              </div>
            </div>
          </DetailPanel>
        ) : (
          <EmptyState
            title="Noch keine Rechnung ausgewaehlt"
            description="Sobald links ein Datensatz markiert ist, erscheint hier die Detailansicht."
          />
        )}
      </div>
    </div>
  );
}
