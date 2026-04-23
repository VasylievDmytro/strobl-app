import { NextRequest, NextResponse } from "next/server";
import { requireApiAccess } from "@/lib/api-auth";
import { getGeoCaptureAnalytics } from "@/lib/dataverse/service";
import type { UserAccessScope } from "@/lib/dataverse/models";

function parseProjectNumbers(value: string | null) {
  if (!value) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .split(/[\n,;]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

export async function GET(request: NextRequest) {
  const accessResult = await requireApiAccess();
  if ("response" in accessResult) {
    return accessResult.response;
  }

  const { access } = accessResult;
  const month = request.nextUrl.searchParams.get("month") || undefined;
  const date = request.nextUrl.searchParams.get("date") || undefined;
  const periodMode = request.nextUrl.searchParams.get("periodMode") === "day" ? "day" : "month";
  const employeeName = request.nextUrl.searchParams.get("employee") || undefined;
  const projectNumbers = parseProjectNumbers(request.nextUrl.searchParams.get("projects"));

  const analytics = await getGeoCaptureAnalytics({
    month,
    date,
    periodMode,
    employeeName,
    projectNumbers,
    isAdmin: access.isAdmin,
    userName: access.userName
  });

  const scope: UserAccessScope = {
    isAdmin: access.isAdmin,
    bauleiter: access.bauleiter,
    userName: access.userName
  };

  return NextResponse.json({
    analytics,
    access: scope
  });
}
