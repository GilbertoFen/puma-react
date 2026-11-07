import { ENV } from '../config/env.config';
import { saveReturnUrl } from './auth-redirect';

export const API_URL = (ENV.API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');

/**
 * Obtiene el access token de autenticación desde el almacenamiento local.
 * Revisa prioritariamente la llave 'token' y como respaldo 'userData'.
 */
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  let token = localStorage.getItem('token');
  if (!token) {
    const rawData = localStorage.getItem('userData');
    if (rawData) {
      try {
        const userData = JSON.parse(rawData);
        token =
          userData.token ||
          userData.access_token ||
          userData.accessToken ||
          null;
      } catch {
        // Fallback silencioso si no es JSON válido
      }
    }
  }
  return token;
};

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
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Utilidad fetch con autenticación, cookies seguras (credentials: 'include')
 * y manejo de expiración de sesión (HTTP 401).
 */
export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {},
): Promise<Response> => {
  const isFormData = options.body instanceof FormData;
  const baseHeaders = getAuthHeaders(isFormData ? null : 'application/json');

  const headers = {
    ...baseHeaders,
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';

    const currentPath = window.location.pathname + window.location.search;
    if (currentPath && currentPath !== '/') {
      saveReturnUrl(currentPath);
      window.location.href = `/?returnUrl=${encodeURIComponent(currentPath)}`;
    } else {
      window.location.href = '/';
    }
    throw new Error('Sesión expirada');
  }

  return response;
};
