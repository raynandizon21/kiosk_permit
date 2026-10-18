import { Capacitor } from '@capacitor/core';

const TIMEOUT_MS = 10_000;

/** The APK bundles the UI, so its API calls go to the kiosk PC over the LAN instead of the page's own origin. */
const IS_NATIVE = Capacitor.isNativePlatform();
const SERVER_KEY = 'snc-kiosk-server';
const DEFAULT_SERVER = 'http://192.168.100.195:3200'; // APK's first-launch server; staff can change it from the System Online badge

export function isNativeApp(): boolean {
  return IS_NATIVE;
}

/** Base URL of the kiosk server, e.g. http://192.168.1.10:3200 */
export function serverUrl(): string {
  if (!IS_NATIVE) return window.location.origin;
  try {
    return localStorage.getItem(SERVER_KEY) || DEFAULT_SERVER;
  } catch {
    return DEFAULT_SERVER;
  }
}

export function setServerUrl(base: string) {
  try {
    localStorage.setItem(SERVER_KEY, base);
  } catch {
    // storage blocked — the default server stays in use
  }
}

/** '/api/...' → absolute URL on the kiosk server in the APK, unchanged in the browser */
export function apiUrl(path: string): string {
  return IS_NATIVE ? `${serverUrl()}${path}` : path;
}

/** Fetch JSON from the kiosk server; throws an Error with the server's message on failure. */
export async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(apiUrl(path), {
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
