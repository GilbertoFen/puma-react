'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { API_URL, clearAccessToken, ensureAccessToken, fetchWithAuth, setAccessToken } from '../utils/api';
import { authService } from '../services/auth.service';
import type { AppRole } from '../utils/roleRouting';

/**
 * Estado de sesión único para las tres rutas (/, /profesores, /admin).
 * - El access token vive en memoria (utils/api.ts) y se renueva con la cookie httpOnly.
 * - Quién es el usuario y qué roles tiene sale siempre de GET /autenticacion/me.
 */

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  lastNameP: string;
  lastNameM: string | null;
  avatarUrl: string | null;
  status: string;
  roles: AppRole[];
  needsNameConfirmation?: boolean;
  student: {
    id: string;
    accountNumber: number | null;
    accountNumberFormatted: string | null;
    career: { id: string; name: string; code?: string | null } | null;
    currentSemester: number | null;
    average: number | string | null;
    isGraduated: boolean;
    hasCompletedQuiz: boolean;
  } | null;
  professor: { id: string } | null;
}

type SessionStatus = 'loading' | 'anonymous' | 'authenticated';

interface SessionValue {
  status: SessionStatus;
  user: SessionUser | null;
  roles: AppRole[];
  /** Login con el id_token de Google. Devuelve el usuario con todos sus roles. */
  loginWithGoogle: (credential: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
  reload: () => Promise<SessionUser | null>;
}

const SessionContext = createContext<SessionValue | null>(null);

/** Sesiones duplicadas que guardaban versiones anteriores del front. */
const LEGACY_SESSION_KEYS = [
  'puma_admin_session',
  'pumaia_admin_session',
  'puma_teacher_session',
  'pumaia_teacher_session_v1',
];

function purgeLegacySessionStorage() {
  try {
    LEGACY_SESSION_KEYS.forEach((k) => localStorage.removeItem(k));
  } catch {
    // almacenamiento no disponible
  }
}

export function fullName(u: Pick<SessionUser, 'name' | 'lastNameP' | 'lastNameM'>): string {
  return [u.name, u.lastNameP, u.lastNameM].filter(Boolean).join(' ');
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ status: SessionStatus; user: SessionUser | null }>({
    status: 'loading',
    user: null,
  });

  const reload = useCallback(async (): Promise<SessionUser | null> => {
    const token = await ensureAccessToken();
    if (!token) {
      setState({ status: 'anonymous', user: null });
      return null;
    }
    try {
      const res = await fetchWithAuth(`${API_URL}/autenticacion/me`, { redirectOn401: false });
      if (!res.ok) throw new Error(`me ${res.status}`);
      const me = (await res.json()) as SessionUser;
      setState({ status: 'authenticated', user: me });
      return me;
    } catch {
      clearAccessToken();
      setState({ status: 'anonymous', user: null });
      return null;
    }
  }, []);

  useEffect(() => {
    purgeLegacySessionStorage();
    void reload();
  }, [reload]);

  const loginWithGoogle = useCallback(
    async (credential: string) => {
      const data = await authService.loginWithGoogle(credential);
      if (!data?.accessToken) throw new Error('No se recibió una sesión válida.');
      setAccessToken(data.accessToken);
      const me = await reload();
      if (!me) throw new Error('No se pudo verificar la sesión después de iniciar con Google.');
      return me;
    },
    [reload],
  );

  const logout = useCallback(async () => {
    await authService.logout();
    purgeLegacySessionStorage();
    setState({ status: 'anonymous', user: null });
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      status: state.status,
      user: state.user,
      roles: state.user?.roles ?? [],
      loginWithGoogle,
      logout,
      reload,
    }),
    [state, loginWithGoogle, logout, reload],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession debe usarse dentro de <SessionProvider>.');
  return ctx;
}
