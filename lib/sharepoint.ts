import type { SharePointProjectItem } from "@/lib/dataverse/models";

const graphBaseUrl = "https://graph.microsoft.com/v1.0";
const siteHost = "stroblstrassenbau.sharepoint.com";
const sitePath = "/sites/Baustelle";
const documentLibraryName = "Dokumente";
const rootFolderName = "General";
const maxTreeDepth = 5;
const maxChildrenPerFolder = 200;

let cachedGraphToken:
  | {
      accessToken: string;
      expiresAt: number;
    }
  | null = null;

type GraphDriveChild = {
  id: string;
  name: string;
  webUrl?: string;
  lastModifiedDateTime?: string;
  size?: number;
  folder?: unknown;
};

type GraphChildrenResponse = {
  value?: GraphDriveChild[];
  "@odata.nextLink"?: string;
};

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

async function getGraphAccessToken() {
  if (cachedGraphToken && Date.now() < cachedGraphToken.expiresAt - 60_000) {
    return cachedGraphToken.accessToken;
  }

  const tenantId = getRequiredEnv("MICROSOFT_TENANT_ID");
  const body = new URLSearchParams({
    client_id: getRequiredEnv("MICROSOFT_CLIENT_ID"),
    client_secret: getRequiredEnv("MICROSOFT_CLIENT_SECRET"),
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials"
  });

  const response = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body,
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to obtain Microsoft Graph token: ${response.status}`);
  }

  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number | string;
  };

  if (!payload.access_token) {
    throw new Error("Microsoft Graph token response did not include access_token.");
  }

  const expiresInSeconds =
    typeof payload.expires_in === "number"
      ? payload.expires_in
      : Number.parseInt(payload.expires_in ?? "", 10);

  cachedGraphToken = {
    accessToken: payload.access_token,
    expiresAt:
      Date.now() + (Number.isFinite(expiresInSeconds) ? expiresInSeconds : 3600) * 1000
  };

  return payload.access_token;
}

async function fetchGraph<T>(path: string): Promise<T> {
  const token = await getGraphAccessToken();
  const response = await fetch(`${graphBaseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Microsoft Graph request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function fetchGraphOptional<T>(path: string): Promise<T | null> {
  const token = await getGraphAccessToken();
  const response = await fetch(`${graphBaseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json"
    },
    cache: "no-store"
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Microsoft Graph request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function sortSharePointItems(left: SharePointProjectItem, right: SharePointProjectItem) {
  if (left.folder !== right.folder) {
    return left.folder ? -1 : 1;
  }

  return left.name.localeCompare(right.name, "de");
}

function mapDriveItem(item: GraphDriveChild, parentWebUrl?: string): SharePointProjectItem {
  return {
    id: item.id,
    name: item.name,
    webUrl: item.webUrl,
    parentWebUrl,
    lastModifiedDateTime: item.lastModifiedDateTime,
    folder: Boolean(item.folder),
    size: item.size
  };
}

async function getDriveChildren(
  driveId: string,
  itemId: string,
  parentWebUrl?: string,
  depth = 1
): Promise<SharePointProjectItem[]> {
  if (depth > maxTreeDepth) {
    return [];
  }

  const payload = await fetchGraph<GraphChildrenResponse>(
    `/drives/${driveId}/items/${itemId}/children?$top=${maxChildrenPerFolder}`
  );

  const mappedItems = (payload.value ?? [])
    .map((item) => mapDriveItem(item, parentWebUrl))
    .sort(sortSharePointItems);

  return Promise.all(
    mappedItems.map(async (item) => {
      if (!item.folder) {
        return item;
      }

      try {
        return {
          ...item,
          children: await getDriveChildren(driveId, item.id, item.webUrl, depth + 1)
        };
      } catch {
        return {
          ...item,
          children: []
        };
      }
    })
  );
}

async function getAllDriveChildrenByPath(
  driveId: string,
  folderPath: string
): Promise<SharePointProjectItem[]> {
  let path:
    | string
    | undefined = `/drives/${driveId}/root:/${folderPath}:/children?$top=${maxChildrenPerFolder}`;
  const items: SharePointProjectItem[] = [];

  while (path) {
    const payload: GraphChildrenResponse = await fetchGraph<GraphChildrenResponse>(path);

    items.push(...(payload.value ?? []).map((item) => mapDriveItem(item)));

    if (!payload["@odata.nextLink"]) {
      path = undefined;
    } else {
      const nextUrl = new URL(payload["@odata.nextLink"]);
      path = `${nextUrl.pathname.replace(/^\/v1\.0/, "")}${nextUrl.search}`;
    }
  }

  return items.sort(sortSharePointItems);
}

export async function findSharePointProjectItems(lvNumber: string) {
  const normalized = normalizeSearch(lvNumber);
  if (!normalized) {
    return [];
  }

  const site = await fetchGraph<{ id: string }>(`/sites/${siteHost}:${sitePath}`);
  const drives = await fetchGraph<{ value?: Array<{ id: string; name: string }> }>(
    `/sites/${site.id}/drives`
  );
  const drive =
    drives.value?.find((item) => item.name === documentLibraryName) ??
    drives.value?.find((item) => item.name.toLowerCase().includes("dokument"));

  if (!drive) {
    return [];
  }

  const directItem = await fetchGraphOptional<GraphDriveChild>(
    `/drives/${drive.id}/root:/${encodeURIComponent(rootFolderName)}/${encodeURIComponent(lvNumber.trim())}`
  );

  if (directItem) {
    const mappedItem = mapDriveItem(directItem);
    return [
      {
        ...mappedItem,
        children: mappedItem.folder
          ? await getDriveChildren(drive.id, mappedItem.id, mappedItem.webUrl)
          : undefined
      }
    ];
  }

  const children = await getAllDriveChildrenByPath(drive.id, encodeURIComponent(rootFolderName));
  const matchedItems = children
    .filter((item) => normalizeSearch(item.name).includes(normalized))
    .sort(sortSharePointItems);

  return Promise.all(
    matchedItems.map(async (item) => {
      if (!item.folder) {
        return item;
      }

      return {
        ...item,
        children: await getDriveChildren(drive.id, item.id, item.webUrl)
      };
    })
  );
}
