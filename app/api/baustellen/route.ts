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
  const [invoices, dailyReports, transportReports, timeSummary, sharePointResult] =
    await Promise.all([
      getIncomingInvoices({
        search: lvNumber,
        bauleiter: scopedBauleiter,
        passt: "all"
      }),
      getDailyReports({
        lvNumbers: [lvNumber],
        bauleiter: scopedBauleiter
      }),
      getTransportReports({
        lvNumbers: [lvNumber],
        bauleiter: scopedBauleiter
      }),
      getProjectTimeSummary(lvNumber),
      findSharePointProjectItems(lvNumber).catch(() => [])
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
    lvNumber,
    projectLabel: pickProjectLabel({ lvNumber, address, client }),
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
