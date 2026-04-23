import { NextRequest, NextResponse } from "next/server";
import { getIncomingInvoices, getInvoiceFilterOptions } from "@/lib/dataverse/service";
import { requireApiAccess } from "@/lib/api-auth";
import type { UserAccessScope } from "@/lib/dataverse/models";

function formatDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getLastThreeMonthsRange() {
  const today = new Date();
  const dateFrom = new Date(today);
  dateFrom.setMonth(dateFrom.getMonth() - 3);

  return {
    dateFrom: formatDateInputValue(dateFrom),
    dateTo: formatDateInputValue(today)
  };
}

export async function GET(request: NextRequest) {
  const accessResult = await requireApiAccess();
  if ("response" in accessResult) {
    return accessResult.response;
  }
  const { access } = accessResult;

  const params = request.nextUrl.searchParams;
  const defaultRange = getLastThreeMonthsRange();

  const filters = {
    dateFrom: params.get("dateFrom") || defaultRange.dateFrom,
    dateTo: params.get("dateTo") || defaultRange.dateTo,
    supplier: params.get("supplier") || undefined,
    bauleiter: access.isAdmin
      ? params.get("bauleiter") || undefined
      : access.bauleiter || undefined,
    search: params.get("search") || undefined,
    passt: (params.get("passt") as "all" | "true" | "false" | null) || "all"
  };
  const scope: UserAccessScope = {
    isAdmin: access.isAdmin,
    bauleiter: access.bauleiter,
    userName: access.userName
  };

  const [data, options] = await Promise.all([
    getIncomingInvoices(filters),
    getInvoiceFilterOptions({ bauleiter: access.isAdmin ? undefined : access.bauleiter })
  ]);

  return NextResponse.json({ data, options, access: scope });
}
