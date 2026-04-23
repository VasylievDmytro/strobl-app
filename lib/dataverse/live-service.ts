import { fetchDataverse, patchDataverse } from "@/lib/dataverse/live";
import type {
  DailyDetailBundle,
  DailyReport,
  DailyWeatherRecord,
  FilterOptions,
  GeoCaptureAnalytics,
  GeoCaptureAnalyticsFilters,
  GeoCaptureDailyPeak,
  GeoCaptureEntry,
  GeoCaptureRankingItem,
  GeoCaptureTrendPoint,
  HomeSummary,
  IncomingInvoice,
  InvoiceFilters,
  ReportFilters,
  TourRecord,
  TransportDetailBundle,
  TransportReport
} from "@/lib/dataverse/models";

type DataverseRow = Record<string, unknown>;
interface DataScope {
  bauleiter?: string;
}

const invoiceDocumentBaseUrl = process.env.INVOICE_DOCUMENT_BASE_URL?.replace(/\/$/, "");

function xmlEscape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function toText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNullableText(value: unknown) {
  const text = toText(value);
  return text || undefined;
}

function parseGermanNumber(value: unknown) {
  const text = toText(value);
  if (!text) {
    return 0;
  }

  const normalized = text.includes(",")
    ? text.replaceAll(".", "").replace(",", ".")
    : text;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseMinutes(value: unknown) {
  const text = toText(value);
  const match = text.match(/(\d+)/);
  return match ? Number.parseInt(match[1], 10) : 0;
}

function parseHours(value: unknown) {
  const text = toText(value);
  const parsed = Number.parseFloat(text.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function boolFromValue(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  const text = toText(value).toLowerCase();
  return (
    text === "true" ||
    text === "ja" ||
    text === "yes" ||
    text === "1" ||
    text === "bestätigt" ||
    text === "bestaetigt"
  );
}

function statusLabelFromPasst(passt: boolean) {
  return passt ? "Bestätigt" : "Unbestätigt";
}

function formatMonthValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
}

function parseMonthValue(value?: string) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month] = value.split("-").map((part) => Number.parseInt(part, 10));
  if (!year || !month || month < 1 || month > 12) {
    return null;
  }

  return new Date(year, month - 1, 1);
}

function getMonthRange(monthValue?: string) {
  const today = new Date();
  const parsed = parseMonthValue(monthValue) ?? new Date(today.getFullYear(), today.getMonth(), 1);
  const start = new Date(parsed.getFullYear(), parsed.getMonth(), 1);
  const end = new Date(parsed.getFullYear(), parsed.getMonth() + 1, 0);

  return {
    monthValue: formatMonthValue(start),
    start,
    end
  };
}

function getDayRange(dateValue?: string) {
  const parsed =
    dateValue && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
      ? new Date(`${dateValue}T00:00:00`)
      : new Date();

  const start = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  const end = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());

  return {
    dateValue: formatDateInputValue(start),
    start,
    end
  };
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const monthFormatter = new Intl.DateTimeFormat("de-DE", {
  month: "short",
  year: "numeric"
});

const monthLongFormatter = new Intl.DateTimeFormat("de-DE", {
  month: "long",
  year: "numeric"
});

const dayFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric"
});

function monthLabel(date: Date) {
  const formatted = monthFormatter.format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function monthLongLabel(date: Date) {
  const formatted = monthLongFormatter.format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function dayLabel(date: Date) {
  return dayFormatter.format(date);
}

function normalizeNameSignature(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .split(/[\s,.-]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .sort()
    .join("|");
}

function employeeMatchesUser(employeeName: string, userName?: string) {
  if (!userName) {
    return false;
  }

  return normalizeNameSignature(employeeName) === normalizeNameSignature(userName);
}

function rankMap(
  source: Map<string, { hours: number; secondary?: string }>,
  limit = 6
): GeoCaptureRankingItem[] {
  return Array.from(source.entries())
    .map(([label, meta]) => ({
      label,
      value: meta.hours,
      secondary: meta.secondary
    }))
    .sort((left, right) => right.value - left.value)
    .slice(0, limit);
}

function buildInvoiceDocumentUrl(row: DataverseRow) {
  const directCandidates = [
    row.cr5ce_link,
    row.cr5ce_url,
    row.cr5ce_sharepointlink,
    row.cr5ce_onedrivelink
  ];

  for (const candidate of directCandidates) {
    const value = toText(candidate);
    if (value.startsWith("http://") || value.startsWith("https://")) {
      return value;
    }
  }

  const relativePath = toText(row.cr5ce_dateiname).replaceAll("\\", "/");
  if (!relativePath || !invoiceDocumentBaseUrl) {
    return undefined;
  }

  const encodedPath = relativePath
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${invoiceDocumentBaseUrl}/${encodedPath}`;
}

function distinctSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((left, right) =>
    left.localeCompare(right, "de")
  );
}

function chunkValues(values: string[], size: number) {
  const chunks: string[][] = [];

  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }

  return chunks;
}

function lookupValue(row: DataverseRow, attributeName: string) {
  return toText(row[`_${attributeName}_value`]);
}

async function queryFetchXml(entitySetName: string, fetchXml: string) {
  let path = `/api/data/v9.2/${entitySetName}?fetchXml=${encodeURIComponent(fetchXml)}`;
  const rows: DataverseRow[] = [];

  while (path) {
    const payload = (await fetchDataverse(path)) as {
      value?: DataverseRow[];
      "@odata.nextLink"?: string;
    };

    rows.push(...(payload.value ?? []));

    if (!payload["@odata.nextLink"]) {
      break;
    }

    const nextUrl = new URL(payload["@odata.nextLink"]);
    path = `${nextUrl.pathname}${nextUrl.search}`;
  }

  return rows;
}

function buildInvoiceFetchXml(filters: InvoiceFilters) {
  const conditions: string[] = [];

  if (filters.dateFrom) {
    conditions.push(
      `<condition attribute="cr5ce_belegdata" operator="on-or-after" value="${xmlEscape(filters.dateFrom)}" />`
    );
  }

  if (filters.dateTo) {
    conditions.push(
      `<condition attribute="cr5ce_belegdata" operator="on-or-before" value="${xmlEscape(filters.dateTo)}" />`
    );
  }

  if (filters.supplier) {
    conditions.push(
      `<condition attribute="cr5ce_anzeigename" operator="like" value="${xmlEscape(filters.supplier)}%" />`
    );
  }

  if (filters.bauleiter) {
    conditions.push(
      `<condition attribute="cr5ce_bauleiter" operator="eq" value="${xmlEscape(filters.bauleiter)}" />`
    );
  }

  if (filters.search) {
    conditions.push(
      `<filter type="or"><condition attribute="cr5ce_lvnummer" operator="like" value="${xmlEscape(filters.search)}%" /><condition attribute="cr5ce_belegnummer" operator="like" value="${xmlEscape(filters.search)}%" /></filter>`
    );
  }

  if (filters.passt === "true") {
    conditions.push(`<condition attribute="cr5ce_appbestaetigt" operator="eq" value="1" />`);
  }

  if (filters.passt === "false") {
    conditions.push(`<condition attribute="cr5ce_appbestaetigt" operator="eq" value="0" />`);
  }

  return `
    <fetch version="1.0" mapping="logical">
      <entity name="cr5ce_lieferantrechungen">
        <all-attributes />
        <order attribute="cr5ce_belegdata" descending="true" />
        <filter type="and">
          ${conditions.join("")}
        </filter>
      </entity>
    </fetch>
  `;
}

function buildReportFetchXml(entityName: string, filters: ReportFilters) {
  const conditions: string[] = [];

  if (filters.bauleiter) {
    conditions.push(
      `<condition attribute="cr5ce_bauleiter" operator="eq" value="${xmlEscape(filters.bauleiter)}" />`
    );
  }

  if (filters.dateFrom) {
    conditions.push(
      `<condition attribute="cr5ce_datum" operator="on-or-after" value="${xmlEscape(filters.dateFrom)}" />`
    );
  }

  if (filters.dateTo) {
    conditions.push(
      `<condition attribute="cr5ce_datum" operator="on-or-before" value="${xmlEscape(filters.dateTo)}" />`
    );
  }

  if (filters.lvNumbers?.length) {
    conditions.push(
      `<filter type="or">${filters.lvNumbers
        .map(
          (value) =>
            `<condition attribute="cr5ce_lv_nummer" operator="like" value="%${xmlEscape(value)}%" />`
        )
        .join("")}</filter>`
    );
  }

  if (filters.reportType) {
    conditions.push(
      `<condition attribute="cr5ce_bericht_name" operator="eq" value="${xmlEscape(filters.reportType)}" />`
    );
  }

  return `
    <fetch version="1.0" mapping="logical">
      <entity name="${entityName}">
        <all-attributes />
        <order attribute="cr5ce_datum" descending="true" />
        <filter type="and">
          ${conditions.join("")}
        </filter>
      </entity>
    </fetch>
  `;
}

function mapInvoice(row: DataverseRow): IncomingInvoice {
  const passt = boolFromValue(row.cr5ce_appbestaetigt);
  const documentPath = toNullableText(row.cr5ce_dateiname);

  return {
    id: toText(row.cr5ce_lieferantrechungenid),
    supplierName: toText(row.cr5ce_anzeigename),
    invoiceNumber: toText(row.cr5ce_belegnummer),
    lvNumber: toText(row.cr5ce_lvnummer),
    bauleiter: toText(row.cr5ce_bauleiter),
    bookingDate: toText(row.cr5ce_belegdata),
    passt,
    comment: toNullableText(row.cr5ce_kommentar),
    amount: parseGermanNumber(row.cr5ce_bruttobetrag),
    statusLabel: statusLabelFromPasst(passt),
    documentUrl: buildInvoiceDocumentUrl(row),
    documentPath
  };
}

function mapTransportReport(row: DataverseRow): TransportReport {
  const address = toText(row.cr5ce_adresse);
  const client = toText(row.cr5ce_auftraggeber);
  const reportType = toText(row.cr5ce_bericht_name) || "Transportbericht";
  const lvNumber = toText(row.cr5ce_lv_nummer);

  return {
    id: toText(row.cr5ce_transportberichtid),
    transportberichtNumber: toText(row.cr5ce_autonumber),
    lvNumber,
    projectLabel: address || lvNumber || reportType,
    address,
    client,
    bauleiter: toText(row.cr5ce_bauleiter),
    date: toText(row.cr5ce_datum),
    reportType,
    hasDocument: Boolean(toText(row.cr5ce_link)),
    documentUrl: toNullableText(row.cr5ce_link),
    summary: [client, address].filter(Boolean).join(" • ")
  };
}

function mapDailyReport(row: DataverseRow): DailyReport {
  const reportName = toText(row.cr5ce_bericht_name) || "Tagesbericht";
  const client = toText(row.cr5ce_auftraggeber);
  const address = toText(row.cr5ce_adresse);

  return {
    id: toText(row.cr5ce_tagesberichtid),
    reportName,
    reportType: reportName,
    lvNumber: toText(row.cr5ce_lv_nummer),
    address,
    client,
    bauleiter: toText(row.cr5ce_bauleiter),
    date: toText(row.cr5ce_datum),
    summary: [client, address].filter(Boolean).join(" • "),
    documentUrl: toNullableText(row.cr5ce_link)
  };
}

function mapGeoCaptureEntry(row: DataverseRow): GeoCaptureEntry {
  return {
    id: toText(row.cr5ce_geocapturedbid),
    employeeName: toText(row.cr5ce_employeename),
    employeeNumber: toNullableText(row.cr5ce_employeenumber),
    entryDate: toText(row.cr5ce_entrydate),
    workHours:
      typeof row.cr5ce_workhours === "number"
        ? row.cr5ce_workhours
        : parseGermanNumber(row.cr5ce_workhours),
    department: toNullableText(row.cr5ce_department),
    projectNumber: toNullableText(row.cr5ce_projectnumber),
    costCenter: toNullableText(row.cr5ce_costcenter),
    address: toNullableText(row.cr5ce_address),
    vehicleLicensePlate: toNullableText(row.cr5ce_vehiclelicenseplate),
    vehicleDescription: toNullableText(row.cr5ce_vehicledescription)
  };
}

function mapWeatherRow(row: DataverseRow): DailyWeatherRecord {
  return {
    id: toText(row.cr5ce_wetter_tagesberichtid),
    parentId: toText(row._cr5ce_id_tagesbericht_value),
    sonne: Boolean(toText(row.cr5ce_sonne)),
    regenSchnee: Boolean(toText(row.cr5ce_regen_schnee)),
    temperatur: toText(row.cr5ce_temperatur),
    wind: toText(row.cr5ce_wind)
  };
}

async function getLiveInvoices(filters: InvoiceFilters) {
  const rows = await queryFetchXml("cr5ce_lieferantrechungens", buildInvoiceFetchXml(filters));
  return rows.map(mapInvoice);
}

async function getLiveInvoiceById(invoiceId: string) {
  const rows = await queryFetchXml(
    "cr5ce_lieferantrechungens",
    `
      <fetch version="1.0" mapping="logical" top="1">
        <entity name="cr5ce_lieferantrechungen">
          <all-attributes />
          <filter type="and">
            <condition attribute="cr5ce_lieferantrechungenid" operator="eq" value="${xmlEscape(invoiceId)}" />
          </filter>
        </entity>
      </fetch>
    `
  );

  return rows[0] ? mapInvoice(rows[0]) : null;
}

async function getLiveTransportParents(filters: ReportFilters) {
  const rows = await queryFetchXml(
    "cr5ce_transportberichts",
    buildReportFetchXml("cr5ce_transportbericht", filters)
  );
  return rows.map(mapTransportReport);
}

async function getLiveDailyParents(filters: ReportFilters) {
  const rows = await queryFetchXml(
    "cr5ce_tagesberichts",
    buildReportFetchXml("cr5ce_tagesbericht", filters)
  );
  return rows.map(mapDailyReport);
}

async function getRowsByParent(
  entitySetName: string,
  entityName: string,
  lookupAttribute: string,
  parentId: string
) {
  const fetchXml = `
    <fetch version="1.0" mapping="logical">
      <entity name="${entityName}">
        <all-attributes />
        <filter type="and">
          <condition attribute="${lookupAttribute}" operator="eq" value="${xmlEscape(parentId)}" />
        </filter>
      </entity>
    </fetch>
  `;

  return queryFetchXml(entitySetName, fetchXml);
}

async function getRowsByParents(
  entitySetName: string,
  entityName: string,
  lookupAttribute: string,
  parentIds: string[],
  attributes: string[]
) {
  const ids = Array.from(new Set(parentIds.filter(Boolean)));
  if (!ids.length) {
    return [];
  }

  const attributeXml = attributes
    .map((attribute) => `<attribute name="${attribute}" />`)
    .join("");

  const results = await Promise.all(
    chunkValues(ids, 80).map((chunk) =>
      queryFetchXml(
        entitySetName,
        `
          <fetch version="1.0" mapping="logical">
            <entity name="${entityName}">
              ${attributeXml}
              <filter type="and">
                <condition attribute="${lookupAttribute}" operator="in">
                  ${chunk.map((value) => `<value>${xmlEscape(value)}</value>`).join("")}
                </condition>
              </filter>
            </entity>
          </fetch>
        `
      )
    )
  );

  return results.flat();
}

async function attachTransportSummaries(reports: TransportReport[]) {
  if (!reports.length) {
    return reports;
  }

  const [timeRows, tourRows] = await Promise.all([
    getRowsByParents(
      "cr5ce_zeiterfassungs",
      "cr5ce_zeiterfassung",
      "cr5ce_id_transportberucht",
      reports.map((report) => report.id),
      ["cr5ce_vorname", "cr5ce_namen", "cr5ce_polier_mitarbeiter", "cr5ce_id_transportberucht"]
    ),
    getRowsByParents(
      "cr5ce_tours",
      "cr5ce_tour",
      "cr5ce_transportbericht_id",
      reports.map((report) => report.id),
      ["cr5ce_kennzeichen", "cr5ce_transportbericht_id", "cr5ce_tourid"]
    )
  ]);

  const timeRowsByParent = new Map<string, DataverseRow[]>();
  const tourRowsByParent = new Map<string, DataverseRow[]>();

  for (const row of timeRows) {
    const parentId = lookupValue(row, "cr5ce_id_transportberucht");
    if (!parentId) {
      continue;
    }

    const group = timeRowsByParent.get(parentId) ?? [];
    group.push(row);
    timeRowsByParent.set(parentId, group);
  }

  for (const row of tourRows) {
    const parentId = lookupValue(row, "cr5ce_transportbericht_id");
    if (!parentId) {
      continue;
    }

    const group = tourRowsByParent.get(parentId) ?? [];
    group.push(row);
    tourRowsByParent.set(parentId, group);
  }

  return reports.map((report) => {
    const transportTimeRows = timeRowsByParent.get(report.id) ?? [];
    const tourRowsForReport = tourRowsByParent.get(report.id) ?? [];

    const preferredTimeRow =
      transportTimeRows.find((row) =>
        toText(row.cr5ce_polier_mitarbeiter).toLowerCase().includes("fahrer")
      ) ?? transportTimeRows[0];

    const preferredTourRow =
      tourRowsForReport.find((row) => Boolean(toText(row.cr5ce_kennzeichen))) ?? tourRowsForReport[0];

    const mitarbeiterName = preferredTimeRow
      ? [toText(preferredTimeRow.cr5ce_vorname), toText(preferredTimeRow.cr5ce_namen)]
          .filter(Boolean)
          .join(" ")
      : undefined;

    const vehicleLabel = preferredTourRow ? toText(preferredTourRow.cr5ce_kennzeichen) : undefined;

    return {
      ...report,
      mitarbeiterName: mitarbeiterName || undefined,
      vehicleLabel: vehicleLabel || undefined
    };
  });
}

async function hasScopedRecordAccess(
  entitySetName: string,
  entityName: string,
  idAttribute: string,
  idValue: string,
  scope: DataScope = {}
) {
  const bauleiterCondition = scope.bauleiter
    ? `<condition attribute="cr5ce_bauleiter" operator="eq" value="${xmlEscape(scope.bauleiter)}" />`
    : "";

  const rows = await queryFetchXml(
    entitySetName,
    `
      <fetch version="1.0" mapping="logical" top="1">
        <entity name="${entityName}">
          <attribute name="${idAttribute}" />
          <filter type="and">
            <condition attribute="${idAttribute}" operator="eq" value="${xmlEscape(idValue)}" />
            ${bauleiterCondition}
          </filter>
        </entity>
      </fetch>
    `
  );

  return rows.length > 0;
}

function buildGeoCaptureFetchXml(dateFrom: string, dateTo: string) {
  return `
    <fetch version="1.0" mapping="logical">
      <entity name="cr5ce_geocapturedb">
        <attribute name="cr5ce_geocapturedbid" />
        <attribute name="cr5ce_employeename" />
        <attribute name="cr5ce_employeenumber" />
        <attribute name="cr5ce_entrydate" />
        <attribute name="cr5ce_workhours" />
        <attribute name="cr5ce_department" />
        <attribute name="cr5ce_projectnumber" />
        <attribute name="cr5ce_costcenter" />
        <attribute name="cr5ce_address" />
        <attribute name="cr5ce_vehiclelicenseplate" />
        <attribute name="cr5ce_vehicledescription" />
        <order attribute="cr5ce_entrydate" descending="true" />
        <filter type="and">
          <condition attribute="cr5ce_entrydate" operator="on-or-after" value="${xmlEscape(dateFrom)}" />
          <condition attribute="cr5ce_entrydate" operator="on-or-before" value="${xmlEscape(dateTo)}" />
        </filter>
      </entity>
    </fetch>
  `;
}

async function getGeoCaptureEntries(dateFrom: string, dateTo: string) {
  const rows = await queryFetchXml(
    "cr5ce_geocapturedbs",
    buildGeoCaptureFetchXml(dateFrom, dateTo)
  );

  return rows
    .map(mapGeoCaptureEntry)
    .filter((row) => Boolean(row.employeeName) && row.workHours > 0);
}

function matchesProjectFilter(entry: GeoCaptureEntry, projectNumbers: string[]) {
  if (!projectNumbers.length) {
    return true;
  }

  const projectValue = (entry.projectNumber || entry.costCenter || "").toLowerCase();
  if (!projectValue) {
    return false;
  }

  return projectNumbers.some((value) => projectValue.includes(value.toLowerCase()));
}

function buildMonthlyTrend(entries: GeoCaptureEntry[], months: Date[]): GeoCaptureTrendPoint[] {
  return months.map((monthDate) => {
    const value = formatMonthValue(monthDate);
    const hours = entries
      .filter((entry) => formatMonthValue(new Date(entry.entryDate)) === value)
      .reduce((sum, entry) => sum + entry.workHours, 0);

    return {
      label: monthLabel(monthDate),
      value,
      hours
    };
  });
}

function buildDailyTrend(entries: GeoCaptureEntry[], days: Date[]): GeoCaptureTrendPoint[] {
  return days.map((dayDate) => {
    const value = formatDateInputValue(dayDate);
    const hours = entries
      .filter((entry) => formatDateInputValue(new Date(entry.entryDate)) === value)
      .reduce((sum, entry) => sum + entry.workHours, 0);

    return {
      label: dayFormatter.format(dayDate),
      value,
      hours
    };
  });
}

function computeBusiestDay(entries: GeoCaptureEntry[]): GeoCaptureDailyPeak | undefined {
  const dayMap = new Map<string, number>();

  for (const entry of entries) {
    const key = formatDateInputValue(new Date(entry.entryDate));
    dayMap.set(key, (dayMap.get(key) ?? 0) + entry.workHours);
  }

  const topDay = Array.from(dayMap.entries()).sort((left, right) => right[1] - left[1])[0];

  if (!topDay) {
    return undefined;
  }

  return {
    date: topDay[0],
    label: dayFormatter.format(new Date(topDay[0])),
    hours: topDay[1]
  };
}

export async function getLiveHomeSummary(scope: DataScope = {}): Promise<HomeSummary> {
  const [incoming, transport, daily, openReviews] = await Promise.all([
    getLiveInvoices({ passt: "all", bauleiter: scope.bauleiter }),
    getLiveTransportParents({ bauleiter: scope.bauleiter }),
    getLiveDailyParents({ bauleiter: scope.bauleiter }),
    getLiveInvoices({ passt: "false", bauleiter: scope.bauleiter })
  ]);

  return {
    incomingInvoices: incoming.length,
    transportReports: transport.length,
    dailyReports: daily.length,
    openReviews: openReviews.length
  };
}

export async function getLiveGeoCaptureAnalytics(
  filters: GeoCaptureAnalyticsFilters = {}
): Promise<GeoCaptureAnalytics> {
  const periodMode = filters.periodMode === "day" ? "day" : "month";
  const selectedMonthRange = getMonthRange(filters.month);
  const selectedDayRange = getDayRange(filters.date);
  const rangeStart = periodMode === "day" ? selectedDayRange.start : selectedMonthRange.start;
  const rangeEnd = periodMode === "day" ? selectedDayRange.end : selectedMonthRange.end;
  const trendStart =
    periodMode === "day" ? addMonths(rangeStart, 0) : addMonths(selectedMonthRange.start, -5);
  const dataStart =
    periodMode === "day"
      ? new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate() - 6)
      : trendStart;

  const trendEntries = await getGeoCaptureEntries(
    formatDateInputValue(dataStart),
    formatDateInputValue(rangeEnd)
  );

  const scopedEntries =
    filters.isAdmin || !filters.userName
      ? trendEntries
      : trendEntries.filter((entry) => employeeMatchesUser(entry.employeeName, filters.userName));

  const periodEntries = scopedEntries.filter((entry) => {
    const entryDate = new Date(entry.entryDate);
    return periodMode === "day"
      ? formatDateInputValue(entryDate) === selectedDayRange.dateValue
      : formatMonthValue(entryDate) === selectedMonthRange.monthValue;
  });

  const availableEmployees = distinctSorted(periodEntries.map((entry) => entry.employeeName));
  const availableProjects = distinctSorted(
    periodEntries.map((entry) => entry.projectNumber || entry.costCenter || "")
  );

  const employeeName = filters.employeeName?.trim();
  const projectNumbers = Array.from(new Set((filters.projectNumbers ?? []).filter(Boolean)));

  const selectedEntries = periodEntries.filter((entry) => {
    if (employeeName && entry.employeeName !== employeeName) {
      return false;
    }

    return matchesProjectFilter(entry, projectNumbers);
  });

  const filteredScopedEntries = scopedEntries.filter((entry) => {
    if (employeeName && entry.employeeName !== employeeName) {
      return false;
    }

    return matchesProjectFilter(entry, projectNumbers);
  });

  const totalHours = selectedEntries.reduce((sum, entry) => sum + entry.workHours, 0);

  const employeeMap = new Map<string, { hours: number; secondary?: string }>();
  const departmentMap = new Map<string, { hours: number; secondary?: string }>();
  const projectMap = new Map<string, { hours: number; secondary?: string }>();
  const vehicleMap = new Map<string, { hours: number; secondary?: string }>();

  for (const entry of selectedEntries) {
    employeeMap.set(entry.employeeName, {
      hours: (employeeMap.get(entry.employeeName)?.hours ?? 0) + entry.workHours,
      secondary: entry.department
    });

    const departmentLabel = entry.department || "Ohne Abteilung";
    departmentMap.set(departmentLabel, {
      hours: (departmentMap.get(departmentLabel)?.hours ?? 0) + entry.workHours
    });

    const projectLabel = entry.projectNumber || entry.costCenter || "Ohne Projekt";
    projectMap.set(projectLabel, {
      hours: (projectMap.get(projectLabel)?.hours ?? 0) + entry.workHours,
      secondary: entry.address
    });

    const vehicleLabel =
      entry.vehicleLicensePlate || entry.vehicleDescription || "Ohne Fahrzeug";
    vehicleMap.set(vehicleLabel, {
      hours: (vehicleMap.get(vehicleLabel)?.hours ?? 0) + entry.workHours,
      secondary:
        entry.vehicleLicensePlate && entry.vehicleDescription
          ? entry.vehicleDescription
          : undefined
    });
  }

  const activeEmployees = employeeMap.size;
  const employeeLeaderboard = rankMap(employeeMap, 8);
  const departmentLeaderboard = rankMap(departmentMap, 6);
  const projectLeaderboard = rankMap(projectMap, 6);
  const vehicleLeaderboard = rankMap(vehicleMap, 6);
  const workdays = new Set(
    selectedEntries.map((entry) => formatDateInputValue(new Date(entry.entryDate)))
  ).size;

  const trendPoints =
    periodMode === "day"
      ? buildDailyTrend(
          filteredScopedEntries,
          Array.from({ length: 7 }, (_, index) => {
            const date = new Date(rangeStart);
            date.setDate(rangeStart.getDate() + index - 6);
            return date;
          })
        )
      : buildMonthlyTrend(
          filteredScopedEntries,
          Array.from({ length: 6 }, (_, index) => addMonths(selectedMonthRange.start, index - 5))
        );

  return {
    periodMode,
    selectedLabel:
      periodMode === "day" ? dayLabel(selectedDayRange.start) : monthLongLabel(selectedMonthRange.start),
    selectedMonth: selectedMonthRange.monthValue,
    selectedMonthLabel: monthLongLabel(selectedMonthRange.start),
    selectedDate: selectedDayRange.dateValue,
    availableEmployees,
    availableProjects,
    totalHours,
    activeEmployees,
    averageHoursPerEmployee: activeEmployees ? totalHours / activeEmployees : 0,
    workdays,
    entryCount: selectedEntries.length,
    topEmployee: employeeLeaderboard[0],
    topDepartment: departmentLeaderboard[0],
    busiestDay: computeBusiestDay(selectedEntries),
    employeeLeaderboard,
    departmentLeaderboard,
    projectLeaderboard,
    vehicleLeaderboard,
    monthlyTrend: trendPoints
  };
}

export async function getLiveInvoiceFilterOptions(scope: DataScope = {}): Promise<FilterOptions> {
  const rows = await getLiveInvoices({ passt: "all", bauleiter: scope.bauleiter });

  return {
    bauleiter: distinctSorted(rows.map((item) => item.bauleiter)),
    lvNumbers: distinctSorted(rows.map((item) => item.lvNumber))
  };
}

export async function getLiveIncomingInvoices(filters: InvoiceFilters) {
  const invoices = await getLiveInvoices(filters);

  return invoices.sort(
    (left, right) => +new Date(right.bookingDate) - +new Date(left.bookingDate)
  );
}

export async function getLiveInvoiceAccess(invoiceId: string, scope: DataScope = {}) {
  return hasScopedRecordAccess(
    "cr5ce_lieferantrechungens",
    "cr5ce_lieferantrechungen",
    "cr5ce_lieferantrechungenid",
    invoiceId,
    scope
  );
}

export async function updateLiveInvoiceReview(
  invoiceId: string,
  input: { passt: boolean; comment?: string }
) {
  await patchDataverse(`/api/data/v9.2/cr5ce_lieferantrechungens(${invoiceId})`, {
    cr5ce_appbestaetigt: input.passt,
    cr5ce_kommentar: input.comment?.trim() || null
  });

  const updatedInvoice = await getLiveInvoiceById(invoiceId);

  if (!updatedInvoice) {
    throw new Error("Updated invoice could not be loaded from Dataverse.");
  }

  return updatedInvoice;
}

export async function getLiveTransportFilterOptions(
  scope: DataScope = {}
): Promise<FilterOptions> {
  const rows = await getLiveTransportParents({ bauleiter: scope.bauleiter });

  return {
    bauleiter: distinctSorted(rows.map((item) => item.bauleiter)),
    lvNumbers: distinctSorted(rows.map((item) => item.lvNumber))
  };
}

export async function getLiveTransportReports(filters: ReportFilters) {
  const reports = await getLiveTransportParents(filters);
  return attachTransportSummaries(reports);
}

export async function getLiveTransportReportAccess(reportId: string, scope: DataScope = {}) {
  return hasScopedRecordAccess(
    "cr5ce_transportberichts",
    "cr5ce_transportbericht",
    "cr5ce_transportberichtid",
    reportId,
    scope
  );
}

export async function getLiveTransportReportDetails(
  reportId: string
): Promise<TransportDetailBundle> {
  const [lagerRows, timeRows, tourRows] = await Promise.all([
    getRowsByParent(
      "cr5ce_lager_transportberichts",
      "cr5ce_lager_transportbericht",
      "cr5ce_id_transportbericht",
      reportId
    ),
    getRowsByParent(
      "cr5ce_zeiterfassungs",
      "cr5ce_zeiterfassung",
      "cr5ce_id_transportberucht",
      reportId
    ),
    getRowsByParent("cr5ce_tours", "cr5ce_tour", "cr5ce_transportbericht_id", reportId)
  ]);

  return {
    lager: lagerRows.map((row) => ({
      id: toText(row.cr5ce_lager_transportberichtid),
      parentId: toText(row._cr5ce_id_transportbericht_value),
      title: toText(row.cr5ce_lagerbereitung) || "Lager / Werkstatt",
      preparedBy: "",
      completedBy: "",
      machineReference: undefined,
      notes: toText(row.cr5ce_gemacht)
    })),
    zeiterfassung: timeRows.map((row) => ({
      id: toText(row.cr5ce_zeiterfassungid),
      parentId: toText(row._cr5ce_id_transportberucht_value),
      firstName: toText(row.cr5ce_vorname),
      lastName: toText(row.cr5ce_namen),
      role: toText(row.cr5ce_polier_mitarbeiter),
      startTime: toText(row.cr5ce_begin1),
      endTime: toText(row.cr5ce_ende1),
      breakMinutes: parseMinutes(row.cr5ce_pause),
      totalHours: parseHours(row.cr5ce_gesamtzeit)
    })),
    tours: tourRows.map(
      (row): TourRecord => ({
        id: toText(row.cr5ce_tourid),
        parentId: toText(row._cr5ce_transportbericht_id_value),
        routeLabel: `Tour ${toText(row.cr5ce_fuhren) || toText(row.cr5ce_tour_id)}`,
        deliveryNoteNumber: toNullableText(row.cr5ce_lieferscheinnummer),
        loadingLocation: toText(row.cr5ce_beladestelle),
        unloadingLocation: toText(row.cr5ce_entladestelle),
        material: toText(row.cr5ce_material),
        tonnage: parseGermanNumber(row.cr5ce_tonnen) || undefined,
        cubicMeters: undefined,
        vehicle: toText(row.cr5ce_kennzeichen),
        notes: undefined
      })
    )
  };
}

export async function getLiveDailyFilterOptions(scope: DataScope = {}): Promise<FilterOptions> {
  const rows = await getLiveDailyParents({ bauleiter: scope.bauleiter });

  return {
    bauleiter: distinctSorted(rows.map((item) => item.bauleiter)),
    lvNumbers: distinctSorted(rows.map((item) => item.lvNumber)),
    reportTypes: distinctSorted(rows.map((item) => item.reportType ?? item.reportName))
  };
}

export async function getLiveDailyReports(filters: ReportFilters) {
  return getLiveDailyParents(filters);
}

export async function getLiveDailyReportAccess(reportId: string, scope: DataScope = {}) {
  return hasScopedRecordAccess(
    "cr5ce_tagesberichts",
    "cr5ce_tagesbericht",
    "cr5ce_tagesberichtid",
    reportId,
    scope
  );
}

export async function getLiveDailyReportDetails(reportId: string): Promise<DailyDetailBundle> {
  const [
    employeeRows,
    lkwRows,
    lkwDriverRows,
    pkwRows,
    bauleistungRows,
    erschwernisRows,
    lagerRows,
    wetterRows,
    zusatzRows
  ] = await Promise.all([
    getRowsByParent(
      "cr5ce_zeiterfassung_tagesberichts",
      "cr5ce_zeiterfassung_tagesbericht",
      "cr5ce_id_tagesbericht",
      reportId
    ),
    getRowsByParent(
      "cr5ce_lkw_tagesberichts",
      "cr5ce_lkw_tagesbericht",
      "cr5ce_id_tagesbericht",
      reportId
    ),
    getRowsByParent(
      "cr5ce_lkwfahrer_tagesberichts",
      "cr5ce_lkwfahrer_tagesbericht",
      "cr5ce_id_tagesbericht",
      reportId
    ),
    getRowsByParent(
      "cr5ce_pkw_tagesberichts",
      "cr5ce_pkw_tagesbericht",
      "cr5ce_id_tagesbericht",
      reportId
    ),
    getRowsByParent(
      "cr5ce_bauleistung_tagesberichts",
      "cr5ce_bauleistung_tagesbericht",
      "cr5ce_id_tagesbericht",
      reportId
    ),
    getRowsByParent(
      "cr5ce_erschwernisses",
      "cr5ce_erschwernisse",
      "cr5ce_id_tagesbericht",
      reportId
    ),
    getRowsByParent(
      "cr5ce_lager_tagesberichts",
      "cr5ce_lager_tagesbericht",
      "cr5ce_id_tagesbericht",
      reportId
    ),
    getRowsByParent(
      "cr5ce_wetter_tagesberichts",
      "cr5ce_wetter_tagesbericht",
      "cr5ce_id_tagesbericht",
      reportId
    ),
    getRowsByParent(
      "cr5ce_zusatzgeraet_tagesberichts",
      "cr5ce_zusatzgeraet_tagesbericht",
      "cr5ce_id_tagesbericht",
      reportId
    )
  ]);

  return {
    mitarbeiter: employeeRows.map((row) => ({
      id: toText(row.cr5ce_zeiterfassung_tagesberichtid),
      parentId: toText(row._cr5ce_id_tagesbericht_value),
      personnelNumber: String(row.cr5ce_personalnummer ?? ""),
      firstName: toText(row.cr5ce_vorname),
      lastName: toText(row.cr5ce_name),
      role: toText(row.cr5ce_polier_mitarbeiter),
      startTime: toText(row.cr5ce_begin1),
      endTime: toText(row.cr5ce_ende1),
      breakMinutes: parseMinutes(row.cr5ce_pause),
      totalHours: parseHours(row.cr5ce_gesamtzeit)
    })),
    lkw: lkwRows.map((row) => ({
      id: toText(row.cr5ce_lkw_tagesberichtid),
      parentId: toText(row._cr5ce_id_tagesbericht_value),
      plate: toText(row.cr5ce_kennzeichen),
      vehicleType: "LKW",
      usage: "Baustellenfahrzeug",
      zusatzgeraet: undefined
    })),
    lkwFahrer: lkwDriverRows.map((row) => ({
      id: toText(row.cr5ce_lkwfahrer_tagesberichtid),
      parentId: toText(row._cr5ce_id_tagesbericht_value),
      truckPlate: "",
      driverName: [toText(row.cr5ce_vorname), toText(row.cr5ce_nachname)]
        .filter(Boolean)
        .join(" ")
    })),
    pkw: [
      ...pkwRows.map((row) => ({
        id: toText(row.cr5ce_pkw_tagesberichtid),
        parentId: toText(row._cr5ce_id_tagesbericht_value),
        plate: toText(row.cr5ce_pkw_kennzeichen),
        usage: toText(row.cr5ce_baumaschinen) || "PKW / Maschine",
        zusatzgeraet: undefined
      })),
      ...zusatzRows.map((row) => ({
        id: toText(row.cr5ce_zusatzgeraet_tagesberichtid),
        parentId: toText(row._cr5ce_id_tagesbericht_value),
        plate: "",
        usage: "Zusatzgeraet",
        zusatzgeraet: toText(row.cr5ce_zusatzgeraet)
      }))
    ],
    bauleistung: bauleistungRows.map((row) => ({
      id: toText(row.cr5ce_bauleistung_tagesberichtid),
      parentId: toText(row._cr5ce_id_tagesbericht_value),
      bauleistung: toText(row.cr5ce_bauleistung) || "Bauleistung",
      sonstige: toNullableText(row.cr5ce_sonstige),
      einweisung: toNullableText(row.cr5ce_einweisung),
      vrao: toNullableText(row.cr5ce_vrao)
    })),
    erschwernisse: erschwernisRows.map((row) => ({
      id: toText(row.cr5ce_erschwernisseid),
      parentId: toText(row._cr5ce_id_tagesbericht_value),
      erschwernisse: toText(row.cr5ce_erschwernisse) || "Keine Details hinterlegt"
    })),
    lager: lagerRows.map((row) => ({
      id: toText(row.cr5ce_lager_tagesberichtid),
      parentId: toText(row._cr5ce_id_tagesbericht_value),
      lagerbereitung: toText(row.cr5ce_lagerbereitung),
      gemacht: toText(row.cr5ce_gemacht)
    })),
    wetter: wetterRows.map(mapWeatherRow),
    dokumente: []
  };
}
