function normalizeBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }

  return value.toLowerCase() === "true";
}

export const dataverseConfig = {
  useMock: normalizeBoolean(process.env.DATAVERSE_USE_MOCK, true),
  orgUrl: process.env.DATAVERSE_ORG_URL?.replace(/\/$/, "") ?? "",
  tenantId: process.env.MICROSOFT_TENANT_ID ?? "",
  clientId: process.env.MICROSOFT_CLIENT_ID ?? "",
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET ?? ""
};

export function isLiveDataverseEnabled() {
  return !dataverseConfig.useMock;
}

export function assertLiveDataverseConfig() {
  const missing = [
    ["DATAVERSE_ORG_URL", dataverseConfig.orgUrl],
    ["MICROSOFT_TENANT_ID", dataverseConfig.tenantId],
    ["MICROSOFT_CLIENT_ID", dataverseConfig.clientId],
    ["MICROSOFT_CLIENT_SECRET", dataverseConfig.clientSecret]
  ]
    .filter((entry) => !entry[1])
    .map((entry) => entry[0]);

  if (missing.length) {
    throw new Error(
      `Dataverse live mode is enabled, but required env vars are missing: ${missing.join(", ")}`
    );
  }
}
