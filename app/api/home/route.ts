import { NextResponse } from "next/server";
import { getHomeSummary } from "@/lib/dataverse/service";
import { requireApiAccess } from "@/lib/api-auth";

export async function GET() {
  const accessResult = await requireApiAccess();
  if ("response" in accessResult) {
    return accessResult.response;
  }
  const { access } = accessResult;

  const summary = await getHomeSummary({
    bauleiter: access.isAdmin ? undefined : access.bauleiter
  });
  return NextResponse.json(summary);
}
