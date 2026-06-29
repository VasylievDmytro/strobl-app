import { NextRequest, NextResponse } from "next/server";
import { requireApiAccess } from "@/lib/api-auth";
import {
  getDailyReports,
  getIncomingInvoices,
  getProjectTimeSummary,
  getTransportReports
} from "@/lib/dataverse/service";
import type { ProjectSummary } from "@/lib/dataverse/models";
import { findSharePointProjectItems } from "@/lib/sharepoint";

function latestDate(values: Array<string | undefined>) {
  return values
    .filter(Boolean)
    .sort((left, right) => +new Date(right!) - +new Date(left!))[0];
}

function pickProjectLabel(summary: {
  lvNumber: string;
  address?: string;
  client?: string;
}) {
  return [summary.lvNumber, summary.address || summary.client].filter(Boolean).join(" · ");
}

function countSharePointItems(items: ProjectSummary["sharePointItems"]): number {
  return items.reduce(
    (sum, item) => sum + 1 + (item.children ? countSharePointItems(item.children) : 0),
    0
  );
}

function parseProjectSearchTerms(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\n,;|]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

function resolveProjectNumber(
  searchValue: string,
  reports: Array<{ lvNumber: string; address?: string }>
) {
  const searchTerms = parseProjectSearchTerms(searchValue);
  const normalizedTerms = searchTerms.map((item) => item.toLowerCase());
  const exactMatch = reports.find((report) =>
    normalizedTerms.some((term) => report.lvNumber.toLowerCase() === term)
  );

  return exactMatch?.lvNumber ?? reports.find((report) => report.lvNumber)?.lvNumber ?? searchValue;
}

export async function GET(request: NextRequest) {
  const accessResult = await requireApiAccess();
  if ("response" in accessResult) {
    return accessResult.response;
  }

  const { access } = accessResult;
  const lvNumber = request.nextUrl.searchParams.get("lv")?.trim() ?? "";

  if (!lvNumber) {
    return NextResponse.json({ message: "LV number is required." }, { status: 400 });
  }

  const scopedBauleiter = access.isAdmin ? undefined : access.bauleiter;
  const searchTerms = parseProjectSearchTerms(lvNumber);
  const [matchedDailyReports, matchedTransportReports] = await Promise.all([
    getDailyReports({
      lvNumbers: searchTerms,
      bauleiter: scopedBauleiter
    }),
    getTransportReports({
      lvNumbers: searchTerms,
      bauleiter: scopedBauleiter
    })
  ]);
  const resolvedLvNumber = resolveProjectNumber(lvNumber, [
    ...matchedDailyReports,
    ...matchedTransportReports
  ]);
  const [invoices, dailyReports, transportReports, timeSummary, sharePointResult] =
    await Promise.all([
      getIncomingInvoices({
        search: resolvedLvNumber,
        bauleiter: scopedBauleiter,
        passt: "all"
      }),
      Promise.resolve(matchedDailyReports),
      Promise.resolve(matchedTransportReports),
      getProjectTimeSummary(resolvedLvNumber),
      findSharePointProjectItems(resolvedLvNumber).catch(() => [])
    ]);

  const address =
    dailyReports.find((item) => item.address)?.address ??
    transportReports.find((item) => item.address)?.address;
  const client =
    dailyReports.find((item) => item.client)?.client ??
    transportReports.find((item) => item.client)?.client;
  const bauleiter =
    dailyReports.find((item) => item.bauleiter)?.bauleiter ??
    transportReports.find((item) => item.bauleiter)?.bauleiter ??
    invoices.find((item) => item.bauleiter)?.bauleiter;
  const lastActivityDate = latestDate([
    ...dailyReports.map((item) => item.date),
    ...transportReports.map((item) => item.date),
    ...invoices.map((item) => item.bookingDate),
    ...sharePointResult.map((item) => item.lastModifiedDateTime),
    timeSummary.smapOne.lastEntryDate,
    timeSummary.geoCapture.lastEntryDate
  ]);

  const summary: ProjectSummary = {
    lvNumber: resolvedLvNumber,
    projectLabel: pickProjectLabel({ lvNumber: resolvedLvNumber, address, client }),
    address,
    client,
    bauleiter,
    lastActivityDate,
    invoices,
    dailyReports,
    transportReports,
    sharePointItems: sharePointResult,
    smapOne: timeSummary.smapOne,
    geoCapture: timeSummary.geoCapture,
    totals: {
      invoiceAmount: invoices.reduce((sum, item) => sum + item.amount, 0),
      openInvoices: invoices.filter((item) => !item.passt).length,
      reports: dailyReports.length + transportReports.length,
      documents: countSharePointItems(sharePointResult),
      workHours: timeSummary.smapOne.hours + timeSummary.geoCapture.hours
    }
  };

  return NextResponse.json({ data: summary, access });
}
