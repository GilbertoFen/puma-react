'use client';

import { useEffect, useState } from 'react';
import {
  getAuthToken,
  hasSessionFlag,
  purgeLegacyTokenStorage,
  refreshAccessToken,
} from '../utils/api';

/**
 * Al cargar cualquier página, recupera el access token en memoria a partir de la cookie
 * httpOnly de refresh (si hay sesión). Así los servicios que leen el token de forma síncrona
 * ya lo tienen al montar. Sin sesión no hace ninguna petición.
 */
export default function SessionBootstrap({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    purgeLegacyTokenStorage();
    let alive = true;
    const needsRefresh = !getAuthToken() && hasSessionFlag();
    (needsRefresh ? refreshAccessToken() : Promise.resolve(null)).finally(() => {
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
