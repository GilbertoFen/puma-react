/**
 * Utilidades para manejo seguro de URL de redirección (Return URL / Redirect URL)
 * Previene vulnerabilidades de Open Redirect y preserva parámetros de consulta.
 */

export function getSafeReturnUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) return null;
  try {
    const decoded = decodeURIComponent(rawUrl.trim());
    // Debe ser una ruta interna relativa que comience con '/'
    // y no con '//', '/\\', ni contenga esquemas de protocolo (http:, https:, javascript:, data:, etc.)
    if (
      decoded.startsWith('/') &&
      !decoded.startsWith('//') &&
      !decoded.startsWith('/\\') &&
      !decoded.includes('://') &&
      !/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(decoded)
    ) {
      return decoded;
    }
  } catch {
    // Si falla la decodificación, se descarta
  }
  return null;
}

export function saveReturnUrl(url?: string): void {
  if (typeof window === 'undefined') return;
  const target = url || (window.location.pathname + window.location.search);
  const safe = getSafeReturnUrl(target);
  if (safe && safe !== '/') {
    sessionStorage.setItem('pumaia_return_url', safe);
  }
}

export function getSavedReturnUrl(): string | null {
  if (typeof window === 'undefined') return null;

  // 1. Revisar parámetro en la URL actual (?returnUrl=...)
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('returnUrl');
  if (fromQuery) {
    const safe = getSafeReturnUrl(fromQuery);
    if (safe) return safe;
  }

  // 2. Revisar almacenamiento temporal de sesión (sessionStorage)
  const fromStorage = sessionStorage.getItem('pumaia_return_url');
  if (fromStorage) {
    const safe = getSafeReturnUrl(fromStorage);
    if (safe) return safe;
  }

  return null;
}

export function clearSavedReturnUrl(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('pumaia_return_url');
}

