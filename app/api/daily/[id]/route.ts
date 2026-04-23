import { NextRequest, NextResponse } from "next/server";
import { requireApiAccess } from "@/lib/api-auth";
import { getDailyReportDetails, hasDailyReportAccess } from "@/lib/dataverse/service";

export async function GET(request: NextRequest) {
  const accessResult = await requireApiAccess();
  if ("response" in accessResult) {
    return accessResult.response;
  }
  const { access } = accessResult;

  const id = request.nextUrl.pathname.split("/").pop();

  if (!id) {
    return NextResponse.json({ message: "Missing id" }, { status: 400 });
  }

  const hasAccess = await hasDailyReportAccess(id, {
    bauleiter: access.isAdmin ? undefined : access.bauleiter
  });

  if (!hasAccess) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const data = await getDailyReportDetails(id);
  return NextResponse.json(data);
}
