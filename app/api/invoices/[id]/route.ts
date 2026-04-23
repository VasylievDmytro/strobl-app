import { NextRequest, NextResponse } from "next/server";
import { requireApiAccess } from "@/lib/api-auth";
import { hasInvoiceAccess, updateInvoiceReview } from "@/lib/dataverse/service";

function normalizeComment(value: unknown) {
  return typeof value === "string" ? value : "";
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const accessResult = await requireApiAccess();
  if ("response" in accessResult) {
    return accessResult.response;
  }

  const { access } = accessResult;
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ message: "Missing id" }, { status: 400 });
  }

  const hasAccess = await hasInvoiceAccess(id, {
    bauleiter: access.isAdmin ? undefined : access.bauleiter
  });

  if (!hasAccess) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const payload = (await request.json()) as {
    passt?: unknown;
    comment?: unknown;
  };

  if (typeof payload.passt !== "boolean") {
    return NextResponse.json({ message: "Invalid status value" }, { status: 400 });
  }

  const updatedInvoice = await updateInvoiceReview(id, {
    passt: payload.passt,
    comment: normalizeComment(payload.comment)
  });

  return NextResponse.json({ data: updatedInvoice });
}
