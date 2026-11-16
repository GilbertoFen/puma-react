'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '../context/SessionContext';
import { canAccess, homeFor } from '../utils/roleRouting';

/**
 * Verifica al cargar que el usuario tenga el rol de esta ruta.
 * - Sin sesión: la ruta muestra su propia portada (allowed = false, status = 'anonymous').
 * - Con sesión sin el rol: lo manda a su ruta (o a la pantalla para elegir).
 * Es solo comodidad; la protección real son los guards del backend.
 */
export function usePortalGuard(path: '/' | '/profesores' | '/admin') {
  const session = useSession();
  const router = useRouter();
  const allowed = session.status === 'authenticated' && canAccess(path, session.roles);
  const mustLeave = session.status === 'authenticated' && !allowed;

  useEffect(() => {
    if (mustLeave) router.replace(homeFor(session.roles));
  }, [mustLeave, router, session.roles]);

  return { ...session, allowed, redirecting: mustLeave };
}
