import { ENV } from '../config/env.config';
import { saveReturnUrl } from './auth-redirect';

export const API_URL = (ENV.API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');

/**
 * Sesión en el cliente
 * --------------------
 * - El access token (15 min) vive SOLO en memoria. Nunca en localStorage ni en cookies escritas por JS.
 * - El refresh token lo maneja el backend en una cookie httpOnly (`puma_refresh_token`).
 *   Al recargar la página, la memoria se vacía y se pide un access token nuevo con
 *   POST /autenticacion/refresh (credentials: 'include').
 * - `pumaia_session=1` es solo una bandera (sin token ni datos) para que el middleware de Next
 *   sepa a qué rutas dejar pasar. La seguridad real la pone el backend.
 */

const SESSION_FLAG_COOKIE = 'pumaia_session';
const LEGACY_TOKEN_KEY = 'token';
/** Renovar un poco antes de que venza el access token de 15 min. */
const PROACTIVE_REFRESH_MS = 12 * 60 * 1000;

let accessToken: string | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let refreshInFlight: Promise<string | null> | null = null;

const isBrowser = () => typeof window !== 'undefined';

function setSessionFlag(on: boolean) {
  if (!isBrowser()) return;
  document.cookie = on
    ? `${SESSION_FLAG_COOKIE}=1; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
    : `${SESSION_FLAG_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

/** Borra restos del esquema anterior (token en localStorage y cookie `token` legible por JS). */
export function purgeLegacyTokenStorage() {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    const raw = localStorage.getItem('userData');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        let changed = false;
        for (const k of ['token', 'accessToken', 'access_token']) {
          if (k in parsed) {
            delete parsed[k];
            changed = true;
          }
        }
        if (changed) localStorage.setItem('userData', JSON.stringify(parsed));
      }
    }
  } catch {
    // almacenamiento no disponible: nada que limpiar
  }
  document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
}

export function hasSessionFlag(): boolean {
  if (!isBrowser()) return false;
  return document.cookie.split(';').some((c) => c.trim().startsWith(`${SESSION_FLAG_COOKIE}=1`));
}

/** Guarda el access token en memoria y programa su renovación. */
export function setAccessToken(token: string | null) {
  accessToken = token;
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
  if (!isBrowser()) return;
  purgeLegacyTokenStorage();
  if (token) {
    setSessionFlag(true);
    refreshTimer = setTimeout(() => {
      void refreshAccessToken();
    }, PROACTIVE_REFRESH_MS);
  }
}

/** Cierra la sesión del lado del cliente (memoria + bandera). */
export function clearAccessToken() {
  setAccessToken(null);
  setSessionFlag(false);
}

/** Access token actual (solo memoria). */
export const getAuthToken = (): string | null => accessToken;

/**
 * Pide un access token nuevo con la cookie httpOnly. Una sola petición a la vez:
 * el backend rota el refresh token y revoca la sesión si ve dos renovaciones simultáneas.
 */
export function refreshAccessToken(): Promise<string | null> {
  if (!isBrowser()) return Promise.resolve(null);
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_URL}/autenticacion/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.accessToken) {
        clearAccessToken();
        return null;
      }
      setAccessToken(data.accessToken);
      return data.accessToken as string;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

/** Token en memoria o, si no hay, uno nuevo vía refresh. */
export async function ensureAccessToken(): Promise<string | null> {
  return accessToken ?? (await refreshAccessToken());
}

/**
 * Genera los encabezados de autenticación Bearer estandarizados.
 */
export const getAuthHeaders = (
  contentType: string | null = 'application/json',
): Record<string, string> => {
  const headers: Record<string, string> = {};
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return headers;
};

function redirectToLogin() {
  if (!isBrowser()) return;
  const currentPath = window.location.pathname + window.location.search;
  if (currentPath && currentPath !== '/') {
    saveReturnUrl(currentPath);
    window.location.href = `/?returnUrl=${encodeURIComponent(currentPath)}`;
  } else {
    window.location.href = '/';
  }
}

export interface FetchWithAuthOptions extends RequestInit {
  /** Si es false, un 401 no redirige al login (la pantalla decide qué mostrar). */
  redirectOn401?: boolean;
}

/**
 * fetch con Bearer en memoria, cookies (credentials: 'include') y una renovación
 * automática si el backend responde 401. Si la renovación falla, la sesión terminó.
 */
export const fetchWithAuth = async (
  url: string,
  options: FetchWithAuthOptions = {},
): Promise<Response> => {
  const { redirectOn401 = true, ...init } = options;
  const isFormData = init.body instanceof FormData;

  const doFetch = () =>
    fetch(url, {
      ...init,
      headers: {
        ...getAuthHeaders(isFormData ? null : 'application/json'),
        ...((init.headers as Record<string, string>) || {}),
      },
      credentials: 'include',
    });

  await ensureAccessToken();
  let response = await doFetch();

  if (response.status === 401 && isBrowser()) {
    const renewed = await refreshAccessToken();
    if (renewed) response = await doFetch();
    if (response.status === 401) {
      clearAccessToken();
      if (redirectOn401) {
        redirectToLogin();
        throw new Error('Sesión expirada');
      }
    }
  }

  return response;
};
