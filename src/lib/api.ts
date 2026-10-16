const TIMEOUT_MS = 10_000;

/** Fetch JSON from the kiosk server; throws an Error with the server's message on failure. */
export async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(path, {
      method: init?.method ?? 'GET',
      headers: init?.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new Error('Cannot reach the server. Please ask the Accounting Office for assistance.');
  } finally {
    window.clearTimeout(timeout);
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((data && (data.error || data.message)) || `Request failed (${res.status})`);
  }
  return data as T;
}

export async function fetchHealth(): Promise<boolean> {
  try {
    const data = await api<{ ok?: boolean }>('/api/health');
    return data.ok === true;
  } catch {
    return false;
  }
}

export function errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  return err instanceof Error ? err.message : fallback;
}
