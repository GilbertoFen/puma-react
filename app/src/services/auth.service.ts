import { API_URL, getAuthToken } from '../utils/api';

export const INSTITUTIONAL_DOMAIN = '@pcpuma.acatlan.unam.mx';
export const ALLOWED_STAFF_DOMAINS = [
  '@pcpuma.acatlan.unam.mx',
  '@acatlan.unam.mx',
  '@comunidad.unam.mx',
  '@unam.mx',
];

export function normalizeInstitutionalEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}

export function isValidInstitutionalEmail(email: string): boolean {
  const normalized = normalizeInstitutionalEmail(email);
  const parts = normalized.split('@');
  if (parts.length !== 2) return false;
  const [localPart, domainPart] = parts;
  return (
    localPart.length > 0 &&
    ALLOWED_STAFF_DOMAINS.includes(`@${domainPart}`)
  );
}

export function isValidStudentInstitutionalEmail(email: string): boolean {
  const normalized = normalizeInstitutionalEmail(email);
  const parts = normalized.split('@');
  if (parts.length !== 2) return false;
  const [localPart, domainPart] = parts;
  if (`@${domainPart}` !== INSTITUTIONAL_DOMAIN) return false;
  if (!/^\d{1,9}$/.test(localPart)) return false;
  return parseInt(localPart, 10) > 0;
}

export const authService = {
  /**
   * Inicio de sesión y autorregistro oficial con Google OAuth (@pcpuma.acatlan.unam.mx).
   */
  loginWithGoogle: async (idToken: string, careerId?: string): Promise<any> => {
    const response = await fetch(`${API_URL}/autenticacion/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ idToken, ...(careerId ? { careerId } : {}) }),
    });

    const data = await response.json();
    if (!response.ok || (data && data.statusCode && data.statusCode >= 400)) {
      throw new Error(data.message || 'Error en la autenticación con Google.');
    }
    return data;
  },

  /**
   * Login auxiliar para entorno local de desarrollo (cuando ENABLE_DEV_LOGIN=true en el backend).
   */
  devLogin: async (email: string, name: string, careerId?: string): Promise<any> => {
    const normalizedEmail = normalizeInstitutionalEmail(email);
    if (!isValidInstitutionalEmail(normalizedEmail)) {
      throw new Error(
        `Solo se permiten correos institucionales con dominio exacto ${INSTITUTIONAL_DOMAIN}`,
      );
    }

    const response = await fetch(`${API_URL}/autenticacion/dev-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email: normalizedEmail,
        name: name.trim(),
        ...(careerId ? { careerId } : {}),
      }),
    });

    const data = await response.json();
    if (!response.ok || (data && data.statusCode && data.statusCode >= 400)) {
      throw new Error(data.message || 'No se pudo iniciar sesión de desarrollo.');
    }
    return data;
  },

  /**
   * Renueva el accessToken utilizando la cookie httpOnly de refresh token.
   */
  refresh: async (): Promise<{ accessToken: string }> => {
    const response = await fetch(`${API_URL}/autenticacion/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({}),
    });

    const data = await response.json();
    if (!response.ok || !data?.accessToken) {
      throw new Error(
        data?.message || 'La sesión ha expirado. Inicia sesión nuevamente.',
      );
    }
    localStorage.setItem('token', data.accessToken);
    document.cookie = `token=${data.accessToken}; path=/; max-age=900; SameSite=Lax`;
    return data;
  },

  /**
   * Obtiene el contexto real del usuario autenticado desde /api/autenticacion/me.
   */
  getMe: async (token?: string): Promise<any> => {
    const activeToken = token || getAuthToken();
    const response = await fetch(`${API_URL}/autenticacion/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
      },
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        data?.message || 'No se pudo verificar la sesión actual.',
      );
    }
    return data;
  },

  /**
   * Login con correo/cuenta y contraseña.
   */
  login: async (credentials: {
    accountNumber?: number;
    email?: string;
    password: string;
  }): Promise<any> => {
    const email = credentials.email
      ? normalizeInstitutionalEmail(credentials.email)
      : credentials.accountNumber
        ? `${credentials.accountNumber}${INSTITUTIONAL_DOMAIN}`
        : '';

    if (!isValidInstitutionalEmail(email)) {
      throw new Error(
        `Únicamente se permiten cuentas institucionales ${INSTITUTIONAL_DOMAIN}`,
      );
    }

    const response = await fetch(`${API_URL}/autenticacion/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...credentials, email }),
    });

    const data = await response.json();

    if (!response.ok || (data && data.statusCode && data.statusCode >= 400)) {
      throw new Error(data.message || 'Error en la autenticación');
    }

    return data;
  },

  /**
   * Registro tradicional con correo institucional y contraseña.
   */
  register: async (userData: any): Promise<any> => {
    const normalizedEmail = normalizeInstitutionalEmail(userData.email || '');
    if (!isValidInstitutionalEmail(normalizedEmail)) {
      throw new Error(
        `Únicamente se permiten correos institucionales ${INSTITUTIONAL_DOMAIN}`,
      );
    }

    const response = await fetch(`${API_URL}/autenticacion/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...userData, email: normalizedEmail }),
    });

    const data = await response.json();

    if (!response.ok || (data && data.statusCode && data.statusCode >= 400)) {
      throw new Error(data.message || 'Error al crear la cuenta');
    }

    return data;
  },

  /**
   * Verificación obligatoria de correo institucional mediante token.
   */
  verifyEmail: async (email: string, token: string): Promise<any> => {
    const normalizedEmail = normalizeInstitutionalEmail(email);
    const response = await fetch(`${API_URL}/autenticacion/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email: normalizedEmail, token: token.trim() }),
    });

    const data = await response.json();
    if (!response.ok || (data && data.statusCode && data.statusCode >= 400)) {
      throw new Error(data.message || 'No se pudo verificar el correo.');
    }
    return data;
  },

  /**
   * Reenvío de código/token de verificación de correo.
   */
  resendVerification: async (email: string): Promise<any> => {
    const normalizedEmail = normalizeInstitutionalEmail(email);
    const response = await fetch(
      `${API_URL}/autenticacion/resend-verification`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: normalizedEmail }),
      },
    );

    const data = await response.json();
    if (!response.ok || (data && data.statusCode && data.statusCode >= 400)) {
      throw new Error(
        data.message || 'No se pudo reenviar el código de verificación.',
      );
    }
    return data;
  },

  /**
   * Solicitud de recuperación de contraseña.
   */
  forgotPassword: async (email: string): Promise<any> => {
    const normalizedEmail = normalizeInstitutionalEmail(email);
    const response = await fetch(`${API_URL}/autenticacion/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email: normalizedEmail }),
    });

    const data = await response.json();
    if (!response.ok || (data && data.statusCode && data.statusCode >= 400)) {
      throw new Error(
        data.message || 'Error al solicitar recuperación de contraseña.',
      );
    }
    return data;
  },

  /**
   * Restablecimiento de contraseña mediante token seguro.
   */
  resetPassword: async (
    email: string,
    token: string,
    newPassword: string,
  ): Promise<any> => {
    const normalizedEmail = normalizeInstitutionalEmail(email);
    const response = await fetch(`${API_URL}/autenticacion/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email: normalizedEmail,
        token: token.trim(),
        newPassword,
      }),
    });

    const data = await response.json();
    if (!response.ok || (data && data.statusCode && data.statusCode >= 400)) {
      throw new Error(data.message || 'No se pudo restablecer la contraseña.');
    }
    return data;
  },

  /**
   * Cierre de sesión sincronizado con el backend (revoca la sesión actual y limpia cookie httpOnly).
   */
  logout: async () => {
    const token = getAuthToken();
    try {
      await fetch(`${API_URL}/autenticacion/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });
    } catch {
      // Continuar con limpieza local aunque falle la red
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        document.cookie =
          'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
      }
    }
  },
};
