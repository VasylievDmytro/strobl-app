import { NextResponse } from "next/server";
import { requireApiAccess } from "@/lib/api-auth";
import { getDailyFilterOptions, getTransportFilterOptions } from "@/lib/dataverse/service";

export async function GET() {
  const accessResult = await requireApiAccess();
  if ("response" in accessResult) {
    return accessResult.response;
  }

  const { access } = accessResult;
  const scope = { bauleiter: access.isAdmin ? undefined : access.bauleiter };
  const [dailyOptions, transportOptions] = await Promise.all([
    getDailyFilterOptions(scope),
    getTransportFilterOptions(scope)
  ]);

  const lvNumbers = Array.from(
    new Set([...dailyOptions.lvNumbers, ...transportOptions.lvNumbers].filter(Boolean))
  ).sort((left, right) => left.localeCompare(right, "de"));
  const projectSearchOptions = [
    ...(dailyOptions.projectSearchOptions ?? []),
    ...(transportOptions.projectSearchOptions ?? [])
  ];

  return NextResponse.json({
    lvNumbers,
    projectSearchOptions
  });
}
