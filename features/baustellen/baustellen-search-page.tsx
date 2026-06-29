"use client";

import {
  Banknote,
  BriefcaseBusiness,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  Clock3,
  ExternalLink,
  File,
  FileText,
  FolderOpen,
  LoaderCircle,
  MapPin,
  RotateCcw,
  Search
} from "lucide-react";
import type { ReactNode } from "react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ProjectSearchInput } from "@/components/filters/project-search-input";
import { PageTitle } from "@/components/page-title";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonLoader } from "@/components/ui/skeleton-loader";
import { StatusBadge } from "@/components/ui/status-badge";
import { fetchJson } from "@/lib/api-client";
import type {
  ProjectSearchOption,
  ProjectSummary,
  SharePointProjectItem
} from "@/lib/dataverse/models";
import { formatCurrency, formatDate, formatQuantity } from "@/lib/format";

interface ProjectSummaryResponse {
  data: ProjectSummary;
}

interface BaustellenOptionsResponse {
  lvNumbers: string[];
  projectSearchOptions: ProjectSearchOption[];
}

function buildProjectSuggestions(lvNumbers: string[], options: ProjectSearchOption[]) {
  const addresses = options.map((option) => option.address).filter(Boolean);
  const labels = options.map((option) => option.label);

  return Array.from(new Set([...lvNumbers, ...addresses, ...labels])).sort((left, right) =>
    left.localeCompare(right, "de")
  );
}

function StatTile({
  icon,
  label,
  value,
  detail
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-white/80 bg-white/85 p-4 shadow-[0_18px_42px_-34px_rgba(17,49,87,0.45)]">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[1rem] bg-strobl-50 text-strobl-700">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">{label}</p>
          <p className="mt-1 truncate text-xl font-semibold text-ink-900">{value}</p>
          <p className="mt-1 text-sm text-ink-500">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  count
}: {
  icon: ReactNode;
  title: string;
  count?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-[1rem] bg-[#edf4f8] text-strobl-700">
          {icon}
        </span>
        <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
      </div>
      {typeof count === "number" ? (
        <span className="rounded-full border border-white/80 bg-white/80 px-3 py-1 text-sm font-semibold text-ink-500">
          {count}
        </span>
      ) : null}
    </div>
  );
}

function EmptyBlock({ text }: { text: string }) {
  return (
    <div className="rounded-[1.2rem] border border-dashed border-[#d4e1ea] bg-white/55 px-4 py-6 text-sm text-ink-500">
      {text}
    </div>
  );
}

function formatMaybeDate(value?: string) {
  if (!value) {
    return "Keine Angabe";
  }

  return formatDate(value);
}

function formatFileSize(value?: number) {
  if (!value) {
    return "";
  }

  if (value < 1024 * 1024) {
    return `${formatQuantity(value / 1024)} KB`;
  }

  return `${formatQuantity(value / 1024 / 1024)} MB`;
}

function SharePointTreeItem({ item, depth = 0 }: { item: SharePointProjectItem; depth?: number }) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = Boolean(item.children?.length);
  const quickOpenUrl = item.folder ? item.webUrl : item.parentWebUrl ?? item.webUrl;

  function handleItemClick() {
    if (item.folder) {
      setExpanded((current) => !current);
      return;
    }

    if (item.webUrl) {
      window.open(item.webUrl, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div>
      <div
        className="grid min-h-14 cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[1.05rem] border border-white/70 bg-white/72 px-3 py-2.5 text-sm transition hover:border-strobl-200 hover:bg-strobl-50/65"
        style={{ marginLeft: depth ? `${Math.min(depth * 18, 72)}px` : undefined }}
        onClick={handleItemClick}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleItemClick();
          }
        }}
      >
        <button
          type="button"
          className="grid h-8 w-8 place-items-center rounded-[0.8rem] text-ink-500 transition hover:bg-white hover:text-strobl-700 disabled:opacity-35"
          onClick={(event) => {
            event.stopPropagation();
            setExpanded((current) => !current);
          }}
          disabled={!item.folder}
          aria-label={expanded ? "Ordner einklappen" : "Ordner aufklappen"}
        >
          {item.folder ? (
            expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            <span className="h-4 w-4" />
          )}
        </button>

        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[0.9rem] bg-[#edf4f8] text-strobl-700">
            {item.folder ? <FolderOpen className="h-4.5 w-4.5" /> : <File className="h-4.5 w-4.5" />}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink-900">{item.name}</p>
            <p className="mt-0.5 truncate text-xs text-ink-500">
              {item.folder ? "Ordner" : "Datei"}
              {item.folder && hasChildren ? ` · ${item.children!.length} Elemente` : ""}
              {!item.folder && item.size ? ` · ${formatFileSize(item.size)}` : ""}
              {item.lastModifiedDateTime ? ` · ${formatMaybeDate(item.lastModifiedDateTime)}` : ""}
            </p>
          </div>
        </div>

        {quickOpenUrl ? (
          <a
            href={quickOpenUrl}
            target="_blank"
            rel="noreferrer"
            className="grid h-9 w-9 place-items-center rounded-[0.9rem] text-strobl-700 transition hover:bg-white"
            aria-label={item.folder ? "In SharePoint öffnen" : "Ordner in SharePoint öffnen"}
            onClick={(event) => event.stopPropagation()}
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : (
          <span className="h-9 w-9" />
        )}
      </div>

      {item.folder && expanded && hasChildren ? (
        <div className="mt-2 space-y-2">
          {item.children!.map((child) => (
            <SharePointTreeItem key={child.id} item={child} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function BaustellenSearchPage() {
  const [input, setInput] = useState("");
  const [searchedLv, setSearchedLv] = useState("");
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [options, setOptions] = useState<BaustellenOptionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJson<BaustellenOptionsResponse>("/api/baustellen/options")
      .then(setOptions)
      .catch(() => setOptions(null));
  }, []);

  const projectSearchOptions = useMemo(
    () =>
      buildProjectSuggestions(
        options?.lvNumbers ?? [],
        options?.projectSearchOptions ?? []
      ),
    [options?.lvNumbers, options?.projectSearchOptions]
  );

  const timeCards = useMemo(
    () =>
      summary
        ? [
            {
              label: "SmapOne",
              value: summary.smapOne.hours,
              entries: summary.smapOne.entries,
              employees: summary.smapOne.employees,
              lastEntryDate: summary.smapOne.lastEntryDate
            },
            {
              label: "GeoCapture",
              value: summary.geoCapture.hours,
              entries: summary.geoCapture.entries,
              employees: summary.geoCapture.employees,
              lastEntryDate: summary.geoCapture.lastEntryDate
            }
          ]
        : [],
    [summary]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const lv = input.trim();
    if (!lv) {
      setError("Bitte eine LV-Nummer oder Baustellenadresse eingeben.");
      setSummary(null);
      return;
    }

    setSearchedLv(lv);
    setLoading(true);
    setError(null);

    try {
      const response = await fetchJson<ProjectSummaryResponse>(
        `/api/baustellen?lv=${encodeURIComponent(lv)}`
      );
      setSummary(response.data);
    } catch {
      setSummary(null);
      setError("Die Baustellenuebersicht konnte nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenReportDocument(url?: string) {
    if (!url) {
      window.alert("Link nicht verfuegbar");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleOpenInvoiceDocument(url?: string) {
    if (!url) {
      window.alert("Link nicht verfuegbar");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Baustellen"
        title="LV Suche"
        description="Zentrale Sicht auf Rechnungen, SharePoint-Ordner, Tagesberichte, Transportberichte sowie Arbeitszeiten aus SmapOne und GeoCapture."
      />

      <section className="surface-card relative z-[80] overflow-visible p-4">
        <form className="grid gap-3 lg:grid-cols-[1fr_auto]" onSubmit={handleSubmit}>
          <ProjectSearchInput
            label="LV / Baustellenadresse"
            hint="Beispiel: 260014-104, Starnberg oder Adresse aus der Liste"
            placeholder="LV oder Adresse eingeben"
            value={input}
            suggestions={projectSearchOptions}
            onChange={setInput}
          />
          <button
            type="submit"
            className="inline-flex h-14 items-center justify-center gap-2 self-end rounded-[1.15rem] bg-strobl-700 px-6 text-sm font-semibold text-white shadow-[0_18px_34px_-24px_rgba(8,88,163,0.55)] transition hover:bg-strobl-800"
            disabled={loading}
          >
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Suchen
          </button>
        </form>
      </section>

      {loading ? (
        <div className="grid gap-4">
          <SkeletonLoader className="h-44" />
          <div className="grid gap-4 xl:grid-cols-2">
            <SkeletonLoader className="h-80" />
            <SkeletonLoader className="h-80" />
          </div>
        </div>
      ) : error ? (
        <EmptyState
          title="Suche fehlgeschlagen"
          description={error}
          action={
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-[1rem] border border-white/80 bg-white px-4 py-2 text-sm font-semibold text-strobl-700"
              onClick={() => setInput(searchedLv)}
            >
              <RotateCcw className="h-4 w-4" />
              Eingabe pruefen
            </button>
          }
        />
      ) : !summary ? (
        <EmptyState
          title="Bereit fuer die LV Suche"
          description="Gib eine LV-Nummer oder Baustellenadresse ein, um die zusammengefuehrten Daten der Baustelle zu laden."
        />
      ) : (
        <div className="space-y-6">
          <section className="surface-card p-5">
            <div className="grid gap-5 xl:grid-cols-[1.1fr_1.4fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-strobl-700">
                  {summary.lvNumber}
                </p>
                <h1 className="mt-2 text-2xl font-semibold leading-tight text-ink-950">
                  {summary.projectLabel}
                </h1>
                <div className="mt-4 grid gap-3 text-sm text-ink-600 sm:grid-cols-2">
                  <p className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-strobl-600" />
                    {summary.address || "Keine Adresse"}
                  </p>
                  <p className="inline-flex items-center gap-2">
                    <BriefcaseBusiness className="h-4 w-4 text-strobl-600" />
                    {summary.client || "Kein Auftraggeber"}
                  </p>
                  <p className="inline-flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-strobl-600" />
                    Letzte Aktivitaet: {formatMaybeDate(summary.lastActivityDate)}
                  </p>
                  <p className="inline-flex items-center gap-2">
                    <FileText className="h-4 w-4 text-strobl-600" />
                    Bauleiter: {summary.bauleiter || "Keine Angabe"}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <StatTile
                  icon={<Banknote className="h-5 w-5" />}
                  label="Rechnungen"
                  value={formatCurrency(summary.totals.invoiceAmount)}
                  detail={`${summary.invoices.length} Belege, ${summary.totals.openInvoices} offen`}
                />
                <StatTile
                  icon={<Clock3 className="h-5 w-5" />}
                  label="GeoCapture"
                  value={`${formatQuantity(summary.geoCapture.hours)} h`}
                  detail={`${summary.geoCapture.entries} Eintraege`}
                />
                <StatTile
                  icon={<FileText className="h-5 w-5" />}
                  label="Berichte"
                  value={`${summary.totals.reports}`}
                  detail="Tages- und Transportberichte"
                />
                <StatTile
                  icon={<FolderOpen className="h-5 w-5" />}
                  label="SmapOne"
                  value={`${formatQuantity(summary.smapOne.hours)} h`}
                  detail={`${summary.smapOne.entries} Eintraege`}
                />
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
            <section className="surface-card space-y-4 p-5">
              <SectionHeader
                icon={<FolderOpen className="h-5 w-5" />}
                title="SharePoint"
                count={summary.sharePointItems.length}
              />
              {summary.sharePointItems.length ? (
                <div className="space-y-2">
                  {summary.sharePointItems.map((item) => (
                    <SharePointTreeItem key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <EmptyBlock text="Keine passenden SharePoint-Elemente gefunden." />
              )}
            </section>

            <section className="surface-card space-y-4 p-5">
              <SectionHeader icon={<Clock3 className="h-5 w-5" />} title="Arbeitszeit" />
              <div className="grid gap-3">
                {timeCards.map((card) => (
                  <div
                    key={card.label}
                    className="rounded-[1.15rem] border border-white/80 bg-white/78 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-400">
                          {card.label}
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-ink-950">
                          {formatQuantity(card.value)} h
                        </p>
                      </div>
                      <span className="rounded-full bg-strobl-50 px-3 py-1 text-sm font-semibold text-strobl-800">
                        {card.entries} Eintraege
                      </span>
                    </div>
                    <div className="mt-4 grid gap-2 text-sm text-ink-500 sm:grid-cols-2">
                      <span>{card.employees} Mitarbeiter</span>
                      <span>Letzter Eintrag: {formatMaybeDate(card.lastEntryDate)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="surface-card space-y-4 p-5">
              <SectionHeader
                icon={<Banknote className="h-5 w-5" />}
                title="Eingangsrechnungen"
                count={summary.invoices.length}
              />
              {summary.invoices.length ? (
                <div className="space-y-3">
                  {summary.invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="rounded-[1.15rem] border border-white/80 bg-white/78 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ink-900">
                            {invoice.supplierName || "Ohne Lieferant"}
                          </p>
                          <p className="mt-1 text-sm text-ink-500">
                            {invoice.invoiceNumber || "Ohne Belegnummer"} ·{" "}
                            {formatMaybeDate(invoice.bookingDate)}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-start justify-end gap-3">
                          <StatusBadge value={invoice.passt} trueLabel="OK" falseLabel="Offen" />
                          <p className="pt-1 text-sm font-semibold text-ink-900">
                            {formatCurrency(invoice.amount)}
                          </p>
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-full border border-strobl-200 bg-white/90 px-3 py-1.5 text-sm font-semibold text-strobl-700 transition hover:border-strobl-300 hover:bg-strobl-50"
                            onClick={() => handleOpenInvoiceDocument(invoice.documentUrl)}
                          >
                            <FileText className="h-4 w-4" />
                            PDF
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyBlock text="Keine Rechnungen zu dieser LV gefunden." />
              )}
            </section>

            <section className="surface-card space-y-4 p-5">
              <SectionHeader
                icon={<FileText className="h-5 w-5" />}
                title="Berichte"
                count={summary.totals.reports}
              />
              {summary.dailyReports.length || summary.transportReports.length ? (
                <div className="space-y-3">
                  {[...summary.dailyReports, ...summary.transportReports].slice(0, 10).map((report) => (
                    <div
                      key={report.id}
                      className="rounded-[1.15rem] border border-white/80 bg-white/78 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 font-semibold text-ink-900">
                          {"reportName" in report ? report.reportName : report.reportType}
                        </p>
                        <button
                          type="button"
                          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-strobl-200 bg-white/90 px-3 py-1.5 text-sm font-semibold text-strobl-700 transition hover:border-strobl-300 hover:bg-strobl-50"
                          onClick={() => handleOpenReportDocument(report.documentUrl)}
                        >
                          <FileText className="h-4 w-4" />
                          PDF
                        </button>
                      </div>
                      <p className="mt-1 text-sm text-ink-500">
                        {formatMaybeDate(report.date)} · {report.bauleiter || "Ohne Bauleiter"}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm text-ink-600">
                        {report.summary || report.address || "Keine Zusammenfassung"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyBlock text="Keine Tages- oder Transportberichte gefunden." />
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
