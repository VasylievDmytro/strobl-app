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
