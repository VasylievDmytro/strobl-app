export async function fetchJson<T>(input: string): Promise<T> {
  return requestJson<T>(input);
}

export async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    method: init?.method,
    headers: init?.headers,
    body: init?.body,
    cache: "no-store"
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const payload = (await response.json()) as { message?: string };
      if (payload.message) {
        message = payload.message;
      }
    } catch {
      // Ignore non-JSON error bodies and keep the generic message.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}
