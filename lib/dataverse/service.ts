import {
  dailyCarRecords,
  dailyConstructionPerformanceRecords,
  dailyDifficultyRecords,
  dailyDocumentRecords,
  dailyEmployeeRecords,
  dailyReports,
  dailyTruckDriverRecords,
  dailyTruckRecords,
  dailyWarehouseRecords,
  dailyWeatherRecords
} from "@/lib/dataverse/mock-daily";
import { incomingInvoices } from "@/lib/dataverse/mock-invoices";
import {
  tourRecords,
  transportReports,
  transportTimeRecords,
  transportWarehouseRecords
} from "@/lib/dataverse/mock-transport";
import { isLiveDataverseEnabled } from "@/lib/dataverse/config";
import {
  getLiveGeoCaptureAnalytics,
  getLiveSmapOneAnalytics,
  getLiveDailyFilterOptions,
  getLiveDailyReportAccess,
  getLiveDailyReportDetails,
  getLiveDailyReports,
  getLiveHomeSummary,
  getLiveInvoiceAccess,
  getLiveIncomingInvoices,
  getLiveInvoiceFilterOptions,
  getLiveTransportReportAccess,
  getLiveTransportFilterOptions,
  getLiveTransportReportDetails,
  getLiveTransportReports,
  updateLiveInvoiceReview
} from "@/lib/dataverse/live-service";
import type {
  DailyDetailBundle,
  FilterOptions,
  GeoCaptureAnalytics,
  GeoCaptureAnalyticsFilters,
  HomeSummary,
  InvoiceFilters,
  ReportFilters,
  SmapOneAnalytics,
  TransportDetailBundle
} from "@/lib/dataverse/models";

interface DataScope {
  bauleiter?: string;
}

function wait(ms = 450) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isWithinDateRange(value: string, start?: string, end?: string) {
  const current = new Date(value).getTime();
  const from = start ? new Date(start).getTime() : undefined;
  const to = end ? new Date(end).getTime() : undefined;

  if (from && current < from) {
    return false;
  }

  if (to && current > to) {
    return false;
  }

  return true;
}

function startsWithIgnoreCase(value: string, search?: string) {
  if (!search) {
    return true;
  }

  return value.toLowerCase().startsWith(search.trim().toLowerCase());
}

function includesIgnoreCase(value: string, search?: string) {
  if (!search) {
    return true;
  }

  return value.toLowerCase().includes(search.trim().toLowerCase());
}

export async function getHomeSummary(scope: DataScope = {}): Promise<HomeSummary> {
  if (isLiveDataverseEnabled()) {
    return getLiveHomeSummary(scope);
  }

  await wait(250);

  const scopedInvoices = scope.bauleiter
    ? incomingInvoices.filter((item) => item.bauleiter === scope.bauleiter)
    : incomingInvoices;
  const scopedTransport = scope.bauleiter
    ? transportReports.filter((item) => item.bauleiter === scope.bauleiter)
    : transportReports;
  const scopedDaily = scope.bauleiter
    ? dailyReports.filter((item) => item.bauleiter === scope.bauleiter)
    : dailyReports;

  return {
    incomingInvoices: scopedInvoices.length,
    transportReports: scopedTransport.length,
    dailyReports: scopedDaily.length,
    openReviews: scopedInvoices.filter((invoice) => !invoice.passt).length
  };
}

function formatMonthValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
}

function getCurrentMonthValue() {
  return formatMonthValue(new Date());
}

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
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

type RankedMetric = {
  hours: number;
  secondary?: string;
};

interface SmapOneTimeEntry {
  id: string;
  source: "Tagesbericht" | "Transportbericht";
  employeeName: string;
  entryDate: string;
  workHours: number;
  projectNumber?: string;
  bauleiter?: string;
  address?: string;
}

function rankMap(source: Map<string, RankedMetric>, limit = 6) {
  return Array.from(source.entries())
    .map(([label, meta]) => ({
      label,
      value: meta.hours,
      secondary: meta.secondary
    }))
    .sort((left, right) => right.value - left.value)
    .slice(0, limit);
}

function buildSmapOneMonthlyTrend(entries: SmapOneTimeEntry[], months: Date[]) {
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

function buildSmapOneDailyTrend(entries: SmapOneTimeEntry[], days: Date[]) {
  return days.map((dayDate) => {
    const value = formatDateInputValue(dayDate);
    const hours = entries
      .filter((entry) => formatDateInputValue(new Date(entry.entryDate)) === value)
      .reduce((sum, entry) => sum + entry.workHours, 0);

    return {
      label: dayLabel(dayDate),
      value,
      hours
    };
  });
}

function computeSmapOneBusiestDay(entries: SmapOneTimeEntry[]) {
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

function matchesProjectNumber(value: string | undefined, projectNumbers: string[]) {
  if (!projectNumbers.length) {
    return true;
  }

  const normalized = (value ?? "").toLowerCase();
  if (!normalized) {
    return false;
  }

  return projectNumbers.some((project) => normalized.includes(project.toLowerCase()));
}

function formatSmapOneEmployeeName(lastName?: string, firstName?: string) {
  return [lastName, firstName].filter(Boolean).join(" ");
}

function getMockSmapOneEntries() {
  const dailyReportsById = new Map(dailyReports.map((report) => [report.id, report]));
  const transportReportsById = new Map(transportReports.map((report) => [report.id, report]));

  const dailyEntries = dailyEmployeeRecords.flatMap((record) => {
      const report = dailyReportsById.get(record.parentId);
      if (!report) {
        return [];
      }

      const entry: SmapOneTimeEntry = {
        id: `daily-${record.id}`,
        source: "Tagesbericht",
        employeeName: formatSmapOneEmployeeName(record.lastName, record.firstName),
        entryDate: report.date,
        workHours: record.totalHours,
        projectNumber: report.lvNumber,
        bauleiter: report.bauleiter,
        address: report.address
      };

      return entry.workHours > 0 ? [entry] : [];
    });

  const transportEntries = transportTimeRecords.flatMap((record) => {
      const report = transportReportsById.get(record.parentId);
      if (!report) {
        return [];
      }

      const entry: SmapOneTimeEntry = {
        id: `transport-${record.id}`,
        source: "Transportbericht",
        employeeName: formatSmapOneEmployeeName(record.lastName, record.firstName),
        entryDate: report.date,
        workHours: record.totalHours,
        projectNumber: report.lvNumber,
        bauleiter: report.bauleiter,
        address: report.address
      };

      return entry.workHours > 0 ? [entry] : [];
    });

  return [...dailyEntries, ...transportEntries];
}

export async function getGeoCaptureAnalytics(filters: GeoCaptureAnalyticsFilters = {}) {
  if (isLiveDataverseEnabled()) {
    return getLiveGeoCaptureAnalytics(filters);
  }

  await wait(220);

  const selectedMonth = filters.month || getCurrentMonthValue();

  const fallback: GeoCaptureAnalytics = {
    periodMode: filters.periodMode ?? "month",
    selectedLabel: selectedMonth,
    selectedMonth,
    selectedMonthLabel: selectedMonth,
    selectedDate: filters.date,
    availableEmployees: [
      "Andreas Wecker",
      "Thomas Kuchorz",
      "Michael Strobl"
    ],
    availableProjects: ["250899-101", "250878-101", "0-Hof"],
    totalHours: 128.4,
    activeEmployees: 6,
    averageHoursPerEmployee: 21.4,
    workdays: 14,
    entryCount: 32,
    topEmployee: {
      label: "Andreas Wecker",
      value: 31.5,
      secondary: "Top-Wert im ausgewählten Monat"
    },
    topDepartment: {
      label: "Asphaltierung",
      value: 62.7,
      secondary: "Abteilung mit den meisten Stunden"
    },
    busiestDay: {
      label: "12.04.2026",
      date: "2026-04-12",
      hours: 19.25
    },
    employeeLeaderboard: [
      { label: "Andreas Wecker", value: 31.5 },
      { label: "Thomas Kuchorz", value: 27.8 },
      { label: "Michael Strobl", value: 21.2 }
    ],
    departmentLeaderboard: [
      { label: "Asphaltierung", value: 62.7 },
      { label: "Fuhrpark", value: 39.4 },
      { label: "Werkstatt", value: 26.3 }
    ],
    projectLeaderboard: [
      { label: "250899-101", value: 22.2, secondary: "Kosthofstraße 10+10a in Gilching" },
      { label: "250878-101", value: 18.4, secondary: "Martinsholzer Straße - Pumpwerk 22" },
      { label: "0-Hof", value: 9.6, secondary: "Lager Firma Strobl" }
    ],
    vehicleLeaderboard: [
      { label: "STA-S 1822", value: 17.5, secondary: "Mercedes Vario 616D" },
      { label: "STA-S 1919", value: 11.2, secondary: "3 Achser" },
      { label: "STA-S 1947", value: 8.6, secondary: "MAN DOKA Pritsche" }
    ],
    monthlyTrend: [
      { label: "Nov 2025", value: "2025-11", hours: 108.2 },
      { label: "Dez 2025", value: "2025-12", hours: 124.4 },
      { label: "Jan 2026", value: "2026-01", hours: 118.7 },
      { label: "Feb 2026", value: "2026-02", hours: 132.1 },
      { label: "Mär 2026", value: "2026-03", hours: 141.6 },
      { label: "Apr 2026", value: "2026-04", hours: 128.4 }
    ]
  };

  return fallback;
}

export async function getSmapOneAnalytics(
  filters: GeoCaptureAnalyticsFilters = {}
): Promise<SmapOneAnalytics> {
  if (isLiveDataverseEnabled()) {
    return getLiveSmapOneAnalytics(filters);
  }

  await wait(220);

  const periodMode = filters.periodMode === "day" ? "day" : "month";
  const selectedMonthRange = getMonthRange(filters.month);
  const selectedDayRange = getDayRange(filters.date);
  const rangeStart = periodMode === "day" ? selectedDayRange.start : selectedMonthRange.start;
  const rangeEnd = periodMode === "day" ? selectedDayRange.end : selectedMonthRange.end;

  const allEntries = getMockSmapOneEntries();
  const scopedEntries =
    filters.isAdmin || !filters.userName
      ? allEntries
      : allEntries.filter((entry) => employeeMatchesUser(entry.employeeName, filters.userName));

  const periodEntries = scopedEntries.filter((entry) => {
    const entryDate = new Date(entry.entryDate);
    return periodMode === "day"
      ? formatDateInputValue(entryDate) === selectedDayRange.dateValue
      : formatMonthValue(entryDate) === selectedMonthRange.monthValue;
  });

  const availableEmployees = Array.from(
    new Set(periodEntries.map((entry) => entry.employeeName).filter(Boolean))
  ).sort((left, right) => left.localeCompare(right, "de"));
  const availableBauleiter = Array.from(
    new Set(periodEntries.map((entry) => entry.bauleiter).filter(Boolean))
  ).sort((left, right) => left!.localeCompare(right!, "de")) as string[];
  const availableProjects = Array.from(
    new Set(periodEntries.map((entry) => entry.projectNumber).filter(Boolean))
  ).sort((left, right) => left!.localeCompare(right!, "de")) as string[];

  const employeeName = filters.employeeName?.trim();
  const bauleiter = filters.bauleiter?.trim();
  const projectNumbers = Array.from(new Set((filters.projectNumbers ?? []).filter(Boolean)));

  const selectedEntries = periodEntries.filter((entry) => {
    if (employeeName && entry.employeeName !== employeeName) {
      return false;
    }

    if (bauleiter && entry.bauleiter !== bauleiter) {
      return false;
    }

    return matchesProjectNumber(entry.projectNumber, projectNumbers);
  });

  const filteredScopedEntries = scopedEntries.filter((entry) => {
    if (employeeName && entry.employeeName !== employeeName) {
      return false;
    }

    if (bauleiter && entry.bauleiter !== bauleiter) {
      return false;
    }

    return matchesProjectNumber(entry.projectNumber, projectNumbers);
  });

  const employeeMap = new Map<string, RankedMetric>();
  const bauleiterMap = new Map<string, RankedMetric>();
  const projectMap = new Map<string, RankedMetric>();
  const sourceMap = new Map<string, RankedMetric>();

  for (const entry of selectedEntries) {
    employeeMap.set(entry.employeeName, {
      hours: (employeeMap.get(entry.employeeName)?.hours ?? 0) + entry.workHours,
      secondary: entry.bauleiter
    });

    const bauleiterLabel = entry.bauleiter || "Ohne Bauleiter";
    bauleiterMap.set(bauleiterLabel, {
      hours: (bauleiterMap.get(bauleiterLabel)?.hours ?? 0) + entry.workHours
    });

    const projectLabel = entry.projectNumber || "Ohne Projekt";
    projectMap.set(projectLabel, {
      hours: (projectMap.get(projectLabel)?.hours ?? 0) + entry.workHours,
      secondary: entry.address
    });

    sourceMap.set(entry.source, {
      hours: (sourceMap.get(entry.source)?.hours ?? 0) + entry.workHours
    });
  }

  const totalHours = selectedEntries.reduce((sum, entry) => sum + entry.workHours, 0);
  const activeEmployees = employeeMap.size;

  return {
    periodMode,
    selectedLabel:
      periodMode === "day" ? dayLabel(selectedDayRange.start) : monthLongLabel(selectedMonthRange.start),
    selectedMonth: selectedMonthRange.monthValue,
    selectedMonthLabel: monthLongLabel(selectedMonthRange.start),
    selectedDate: selectedDayRange.dateValue,
    availableEmployees,
    availableBauleiter,
    availableProjects,
    totalHours,
    activeEmployees,
    averageHoursPerEmployee: activeEmployees ? totalHours / activeEmployees : 0,
    workdays: new Set(selectedEntries.map((entry) => entry.entryDate)).size,
    entryCount: selectedEntries.length,
    topEmployee: rankMap(employeeMap, 8)[0],
    busiestDay: computeSmapOneBusiestDay(selectedEntries),
    employeeLeaderboard: rankMap(employeeMap, 8),
    bauleiterLeaderboard: rankMap(bauleiterMap, 6),
    projectLeaderboard: rankMap(projectMap, 6),
    sourceLeaderboard: rankMap(sourceMap, 6),
    monthlyTrend:
      periodMode === "day"
        ? buildSmapOneDailyTrend(
            filteredScopedEntries,
            Array.from({ length: 7 }, (_, index) => {
              const date = new Date(rangeStart);
              date.setDate(rangeStart.getDate() + index - 6);
              return date;
            })
          )
        : buildSmapOneMonthlyTrend(
            filteredScopedEntries,
            Array.from({ length: 6 }, (_, index) => addMonths(selectedMonthRange.start, index - 5))
          )
  };
}

export async function getInvoiceFilterOptions(scope: DataScope = {}): Promise<FilterOptions> {
  if (isLiveDataverseEnabled()) {
    return getLiveInvoiceFilterOptions(scope);
  }

  await wait(180);

  const scopedInvoices = scope.bauleiter
    ? incomingInvoices.filter((item) => item.bauleiter === scope.bauleiter)
    : incomingInvoices;

  return {
    bauleiter: Array.from(new Set(scopedInvoices.map((item) => item.bauleiter))).sort(),
    lvNumbers: Array.from(new Set(scopedInvoices.map((item) => item.lvNumber))).sort()
  };
}

export async function getIncomingInvoices(filters: InvoiceFilters) {
  if (isLiveDataverseEnabled()) {
    return getLiveIncomingInvoices(filters);
  }

  await wait();

  return incomingInvoices
    .filter((invoice) => isWithinDateRange(invoice.bookingDate, filters.dateFrom, filters.dateTo))
    .filter((invoice) => startsWithIgnoreCase(invoice.supplierName, filters.supplier))
    .filter(
      (invoice) =>
        !filters.bauleiter ||
        invoice.bauleiter.toLowerCase() === filters.bauleiter.trim().toLowerCase()
    )
    .filter(
      (invoice) =>
        includesIgnoreCase(invoice.lvNumber, filters.search) ||
        includesIgnoreCase(invoice.invoiceNumber, filters.search)
    )
    .filter((invoice) => {
      if (!filters.passt || filters.passt === "all") {
        return true;
      }

      return filters.passt === "true" ? invoice.passt : !invoice.passt;
    })
    .sort((left, right) => +new Date(right.bookingDate) - +new Date(left.bookingDate));
}

export async function getTransportFilterOptions(scope: DataScope = {}): Promise<FilterOptions> {
  if (isLiveDataverseEnabled()) {
    return getLiveTransportFilterOptions(scope);
  }

  await wait(180);

  const scopedReports = scope.bauleiter
    ? transportReports.filter((item) => item.bauleiter === scope.bauleiter)
    : transportReports;

  return {
    bauleiter: Array.from(new Set(scopedReports.map((item) => item.bauleiter))).sort(),
    lvNumbers: Array.from(new Set(scopedReports.map((item) => item.lvNumber))).sort()
  };
}

export async function getTransportReports(filters: ReportFilters) {
  if (isLiveDataverseEnabled()) {
    return getLiveTransportReports(filters);
  }

  await wait();

  return transportReports
    .filter((report) => isWithinDateRange(report.date, filters.dateFrom, filters.dateTo))
    .filter((report) => !filters.bauleiter || report.bauleiter === filters.bauleiter)
    .filter(
      (report) =>
        !filters.lvNumbers?.length ||
        filters.lvNumbers.some((value) => includesIgnoreCase(report.lvNumber, value))
    )
    .sort((left, right) => +new Date(right.date) - +new Date(left.date));
}

export async function getTransportReportDetails(
  reportId: string
): Promise<TransportDetailBundle> {
  if (isLiveDataverseEnabled()) {
    return getLiveTransportReportDetails(reportId);
  }

  await wait(220);

  return {
    lager: transportWarehouseRecords.filter((record) => record.parentId === reportId),
    zeiterfassung: transportTimeRecords.filter((record) => record.parentId === reportId),
    tours: tourRecords.filter((record) => record.parentId === reportId)
  };
}

export async function hasTransportReportAccess(reportId: string, scope: DataScope = {}) {
  if (isLiveDataverseEnabled()) {
    return getLiveTransportReportAccess(reportId, scope);
  }

  await wait(120);

  return transportReports.some(
    (report) => report.id === reportId && (!scope.bauleiter || report.bauleiter === scope.bauleiter)
  );
}

export async function hasInvoiceAccess(invoiceId: string, scope: DataScope = {}) {
  if (isLiveDataverseEnabled()) {
    return getLiveInvoiceAccess(invoiceId, scope);
  }

  await wait(120);

  return incomingInvoices.some(
    (invoice) =>
      invoice.id === invoiceId && (!scope.bauleiter || invoice.bauleiter === scope.bauleiter)
  );
}

export async function getDailyFilterOptions(scope: DataScope = {}): Promise<FilterOptions> {
  if (isLiveDataverseEnabled()) {
    return getLiveDailyFilterOptions(scope);
  }

  await wait(180);

  const scopedReports = scope.bauleiter
    ? dailyReports.filter((item) => item.bauleiter === scope.bauleiter)
    : dailyReports;

  return {
    bauleiter: Array.from(new Set(scopedReports.map((item) => item.bauleiter))).sort(),
    lvNumbers: Array.from(new Set(scopedReports.map((item) => item.lvNumber))).sort(),
    reportTypes: Array.from(
      new Set(scopedReports.map((item) => item.reportType ?? item.reportName))
    ).sort()
  };
}

export async function getDailyReports(filters: ReportFilters) {
  if (isLiveDataverseEnabled()) {
    return getLiveDailyReports(filters);
  }

  await wait();

  return dailyReports
    .filter((report) => isWithinDateRange(report.date, filters.dateFrom, filters.dateTo))
    .filter((report) => !filters.bauleiter || report.bauleiter === filters.bauleiter)
    .filter(
      (report) => !filters.reportType || (report.reportType ?? report.reportName) === filters.reportType
    )
    .filter(
      (report) =>
        !filters.lvNumbers?.length ||
        filters.lvNumbers.some((value) => includesIgnoreCase(report.lvNumber, value))
    )
    .sort((left, right) => +new Date(right.date) - +new Date(left.date));
}

export async function getDailyReportDetails(reportId: string): Promise<DailyDetailBundle> {
  if (isLiveDataverseEnabled()) {
    return getLiveDailyReportDetails(reportId);
  }

  await wait(220);

  return {
    mitarbeiter: dailyEmployeeRecords.filter((record) => record.parentId === reportId),
    lkw: dailyTruckRecords.filter((record) => record.parentId === reportId),
    lkwFahrer: dailyTruckDriverRecords.filter((record) => record.parentId === reportId),
    pkw: dailyCarRecords.filter((record) => record.parentId === reportId),
    bauleistung: dailyConstructionPerformanceRecords.filter(
      (record) => record.parentId === reportId
    ),
    erschwernisse: dailyDifficultyRecords.filter((record) => record.parentId === reportId),
    lager: dailyWarehouseRecords.filter((record) => record.parentId === reportId),
    wetter: dailyWeatherRecords.filter((record) => record.parentId === reportId),
    dokumente: dailyDocumentRecords.filter((record) => record.parentId === reportId)
  };
}

export async function updateInvoiceReview(
  invoiceId: string,
  input: { passt: boolean; comment?: string }
) {
  if (isLiveDataverseEnabled()) {
    return updateLiveInvoiceReview(invoiceId, input);
  }

  await wait(220);

  const invoice = incomingInvoices.find((item) => item.id === invoiceId);

  if (!invoice) {
    throw new Error("Invoice not found.");
  }

  invoice.passt = input.passt;
  invoice.comment = input.comment?.trim() || undefined;
  invoice.statusLabel = input.passt ? "Bestätigt" : "Unbestätigt";

  return invoice;
}

export async function hasDailyReportAccess(reportId: string, scope: DataScope = {}) {
  if (isLiveDataverseEnabled()) {
    return getLiveDailyReportAccess(reportId, scope);
  }

  await wait(120);

  return dailyReports.some(
    (report) => report.id === reportId && (!scope.bauleiter || report.bauleiter === scope.bauleiter)
  );
}
