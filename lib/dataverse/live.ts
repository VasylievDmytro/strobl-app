import { assertLiveDataverseConfig, dataverseConfig } from "@/lib/dataverse/config";

function tokenEndpoint() {
  return `https://login.microsoftonline.com/${dataverseConfig.tenantId}/oauth2/v2.0/token`;
}

let cachedToken:
  | {
      accessToken: string;
      expiresAt: number;
    }
  | null = null;

async function getAppAccessToken() {
  assertLiveDataverseConfig();

  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.accessToken;
  }

  const body = new URLSearchParams({
    client_id: dataverseConfig.clientId,
    client_secret: dataverseConfig.clientSecret,
    scope: `${dataverseConfig.orgUrl}/.default`,
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
    throw new Error(`Failed to obtain Dataverse token: ${response.status}`);
  }

  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number | string;
  };

  if (!payload.access_token) {
    throw new Error("Dataverse token response did not include access_token.");
  }

  const expiresInSeconds =
    typeof payload.expires_in === "number"
      ? payload.expires_in
      : Number.parseInt(payload.expires_in ?? "", 10);

  cachedToken = {
    accessToken: payload.access_token,
    expiresAt:
      Date.now() + (Number.isFinite(expiresInSeconds) ? expiresInSeconds : 3600) * 1000
  };

  return payload.access_token;
}

export async function fetchDataverse(path: string) {
  return dataverseRequest(path);
}

async function dataverseRequest(path: string, init?: RequestInit) {
  const token = await getAppAccessToken();
  const response = await fetch(`${dataverseConfig.orgUrl}${path}`, {
    method: init?.method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "OData-MaxVersion": "4.0",
      "OData-Version": "4.0",
      ...(init?.body ? { "Content-Type": "application/json; charset=utf-8" } : {}),
      ...(init?.headers ?? {})
    },
    body: init?.body,
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Dataverse request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function patchDataverse(path: string, body: Record<string, unknown>) {
  return dataverseRequest(path, {
    method: "PATCH",
    headers: {
      Prefer: "return=minimal"
    },
    body: JSON.stringify(body)
  });
}

export function liveModeNotMapped(name: string): never {
  throw new Error(
    `Dataverse live mode is enabled, but ${name} is not mapped yet. Add field mapping for the real table schema.`
  );
}
