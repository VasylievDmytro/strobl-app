import { NextRequest, NextResponse } from "next/server";
import { requireApiAccess } from "@/lib/api-auth";

function tokenEndpoint() {
  return `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/oauth2/v2.0/token`;
}

async function getFlowAccessToken() {
  const tenantId = process.env.MICROSOFT_TENANT_ID;
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error("Microsoft credentials for flow export are missing.");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://service.flow.microsoft.com/.default",
    grant_type: "client_credentials"
  });

  const response = await fetch(tokenEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body,
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Failed to obtain flow token: ${response.status}`);
  }

  const payload = (await response.json()) as {
    access_token?: string;
  };

  if (!payload.access_token) {
    throw new Error("Flow token response did not include access_token.");
  }

  return payload.access_token;
}

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

function buildFileName() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now
    .toTimeString()
    .slice(0, 8)
    .replaceAll(":", "-");

  return `Tagesbericht_${date}_${time}.xlsx`;
}

function normalizeExcelUrl(value: string) {
  const trimmed = value.trim().replaceAll(" ", "%20");
  if (!trimmed) {
    return "";
  }

  if (trimmed.toLowerCase().includes("web=1")) {
    return trimmed;
  }

  return `${trimmed}${trimmed.includes("?") ? "&" : "?"}web=1`;
}

async function readFlowResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { url2: text };
  }
}

async function readFlowError(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function hasSharedAccessSignature(url: string) {
  const lower = url.toLowerCase();
  return lower.includes("sig=") || lower.includes("&sp=") || lower.includes("&sv=");
}

function extractUrl(payload: unknown): string | undefined {
  if (!payload) {
    return undefined;
  }

  if (typeof payload === "string") {
    return payload;
  }

  if (typeof payload !== "object") {
    return undefined;
  }

  const record = payload as Record<string, unknown>;
  const directCandidates = [
    record.url2,
    record.url,
    record.URL,
    record.link,
    record.fileUrl,
    record.openUrl
  ];

  for (const candidate of directCandidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }

  const nestedCandidates = [record.data, record.result, record.body];
  for (const candidate of nestedCandidates) {
    const nestedUrl = extractUrl(candidate);
    if (nestedUrl) {
      return nestedUrl;
    }
  }

  return undefined;
}

export async function POST(request: NextRequest) {
  const accessResult = await requireApiAccess();
  if ("response" in accessResult) {
    return accessResult.response;
  }

  const flowUrl = process.env.POWER_AUTOMATE_DAILY_EXPORT_URL?.trim();
  if (!flowUrl) {
    return NextResponse.json(
      { message: "POWER_AUTOMATE_DAILY_EXPORT_URL ist nicht konfiguriert." },
      { status: 501 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    lvNumbers?: string[];
    bauleiter?: string;
    dateFrom?: string;
    dateTo?: string;
    fileName?: string;
    reportType?: string;
  };

  const defaultRange = getLastThreeMonthsRange();
  const hasExplicitDateFilter = Boolean(body.dateFrom || body.dateTo);
  const hasSearchFilter = Boolean((body.lvNumbers ?? []).length || body.reportType?.trim());

  const effectiveBauleiter = accessResult.access.isAdmin
    ? body.bauleiter?.trim() || ""
    : accessResult.access.bauleiter || "";

  const payload = {
    lvList: (body.lvNumbers ?? []).filter(Boolean).join(";"),
    bauleiter: effectiveBauleiter,
    dateFrom: body.dateFrom || (!hasExplicitDateFilter && !hasSearchFilter ? defaultRange.dateFrom : ""),
    dateTo: body.dateTo || (!hasExplicitDateFilter && !hasSearchFilter ? defaultRange.dateTo : ""),
    fileName: body.fileName?.trim() || buildFileName(),
    reportType: body.reportType?.trim() || ""
  };

  const requestWithoutAuth = () =>
    fetch(flowUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      cache: "no-store"
    });

  const requestWithOAuth = async () => {
    const accessToken = await getFlowAccessToken();

    return fetch(flowUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify(payload),
      cache: "no-store"
    });
  };

  let response = hasSharedAccessSignature(flowUrl)
    ? await requestWithoutAuth()
    : await requestWithOAuth();

  if (!response.ok) {
    const errorPayload = (await readFlowError(response)) as {
      error?: { code?: string; message?: string };
      message?: string;
    };
    const errorCode = errorPayload.error?.code ?? "";

    if (
      response.status === 401 &&
      (errorCode === "OAuthAccessPolicyNotFound" ||
        errorPayload.error?.message?.includes("Shared Access scheme"))
    ) {
      response = await requestWithoutAuth();
    } else if (response.status === 403 && errorCode === "MisMatchingOAuthClaims") {
      return NextResponse.json(
        {
          message:
            "Der HTTP-Trigger blockiert die App-Berechtigung. Bitte im Flow die OAuth-Zugriffsregel für diese Anwendung prüfen."
        },
        { status: 403 }
      );
    } else {
      return NextResponse.json(
        {
          message:
            errorPayload.error?.message ||
            errorPayload.message ||
            `Export-Flow Fehler: ${response.status}`
        },
        { status: response.status }
      );
    }
  }

  if (!response.ok) {
    const errorPayload = (await readFlowError(response)) as {
      error?: { code?: string; message?: string };
      message?: string;
    };
    const errorCode = errorPayload.error?.code ?? "";

    if (response.status === 401 && errorCode === "DirectApiAuthorizationRequired") {
      return NextResponse.json(
        {
          message:
            "Der HTTP POST URL des Flows ist unvollständig. Bitte den URL mit der Copy-Schaltfläche im Trigger neu kopieren und dabei die Parameter sp, sv und sig mit übernehmen."
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        message:
          errorPayload.error?.message ||
          errorPayload.message ||
          `Export-Flow Fehler: ${response.status}`
      },
      { status: response.status }
    );
  }

  const result = await readFlowResponse(response);
  const url = extractUrl(result);

  if (!url) {
    return NextResponse.json(
      { message: "Der Export-Flow hat keine Excel-URL zurückgegeben." },
      { status: 502 }
    );
  }

  return NextResponse.json({ url: normalizeExcelUrl(url) });
}
