/**
 * Minimal API client. Facilitator token is supplied from in-memory auth context only.
 * Never writes tokens to localStorage/sessionStorage.
 */

export type ApiClientOptions = {
  token?: string | null;
  auth?: boolean;
};

let memoryToken: string | null = null;

export function setApiToken(token: string | null) {
  memoryToken = token;
}

export function getApiToken(): string | null {
  return memoryToken;
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (data?.error && typeof data.error === 'string') return data.error;
  } catch {
    // ignore
  }
  return `Request failed (${res.status})`;
}

export async function apiGet<T>(path: string, options: ApiClientOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const useAuth = options.auth !== false;
  const token = options.token ?? memoryToken;
  if (useAuth && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, { method: 'GET', headers });
  if (!res.ok) throw new Error(await parseError(res));
  if (res.headers.get('content-type')?.includes('text/markdown')) {
    return (await res.text()) as unknown as T;
  }
  return res.json() as Promise<T>;
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  options: ApiClientOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  const useAuth = options.auth !== false;
  const token = options.token ?? memoryToken;
  if (useAuth && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, {
    method: 'POST',
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<T>;
}

export async function apiPatch<T>(
  path: string,
  body?: unknown,
  options: ApiClientOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  const useAuth = options.auth !== false;
  const token = options.token ?? memoryToken;
  if (useAuth && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, {
    method: 'PATCH',
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<T>;
}
