'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ENV } from '../../config/env.config';
import { useSession, type SessionUser } from '../../context/SessionContext';
import { destinationAfterLogin, normalizePortalPath } from '../../utils/roleRouting';

interface GoogleAccountsId {
  initialize: (cfg: { client_id: string; callback: (r: { credential?: string }) => void }) => void;
  renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
}

function googleId(): GoogleAccountsId | undefined {
  return (window as unknown as { google?: { accounts?: { id?: GoogleAccountsId } } }).google?.accounts?.id;
}

let gsiScript: Promise<void> | null = null;
function loadGsi(): Promise<void> {
  if (googleId()) return Promise.resolve();
  if (!gsiScript) {
    gsiScript = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => {
        gsiScript = null;
        reject(new Error('No se pudo cargar Google.'));
      };
      document.head.appendChild(s);
    });
  }
  return gsiScript;
}

export interface GoogleSignInButtonProps {
  /** Ruta donde empezó el login (/, /profesores o /admin). */
  origin: string;
  /**
   * Pasos propios de la ruta antes de redirigir (p. ej. preparar el perfil del alumno).
   * Recibe el usuario y el destino calculado.
   */
  onAuthenticated?: (user: SessionUser, destination: string) => Promise<void> | void;
  width?: number;
}

/**
 * Único login de PumaIA: mismo botón, mismo GOOGLE_CLIENT_ID y mismo endpoint
 * (POST /autenticacion/google) para alumnos, profesores, administradores y analistas.
 * Después redirige según los roles (ver utils/roleRouting.ts).
 */
export default function GoogleSignInButton({ origin, onAuthenticated, width = 300 }: GoogleSignInButtonProps) {
  const router = useRouter();
  const { loginWithGoogle } = useSession();
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const clientId = ENV.GOOGLE_CLIENT_ID;

  // El callback de Google se registra una vez; se leen siempre las props más recientes.
  const latest = useRef({ origin, onAuthenticated, loginWithGoogle, router });
  useEffect(() => {
    latest.current = { origin, onAuthenticated, loginWithGoogle, router };
  });

  useEffect(() => {
    if (!clientId) return;
    let alive = true;
    loadGsi()
      .then(() => {
        const gid = googleId();
        if (!alive || !gid || !ref.current) return;
        gid.initialize({
          client_id: clientId,
          callback: async ({ credential }) => {
            if (!credential) {
              setError('Google no devolvió una credencial.');
              return;
            }
            setBusy(true);
            setError(null);
            try {
              const { origin: o, onAuthenticated: after, loginWithGoogle: login, router: r } = latest.current;
              const user = await login(credential);
              const dest = destinationAfterLogin(user.roles, o);
              await after?.(user, dest);
              if (normalizePortalPath(dest) !== normalizePortalPath(window.location.pathname)) {
                r.replace(dest);
              }
            } catch (e) {
              setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión con Google.');
            } finally {
              setBusy(false);
            }
          },
        });
        gid.renderButton(ref.current, {
          theme: 'outline',
          size: 'large',
          width,
          text: 'continue_with',
          shape: 'pill',
          locale: 'es',
        });
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : 'No se pudo cargar Google.');
      });
    return () => {
      alive = false;
    };
  }, [clientId, width]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%' }}>
      {clientId ? (
        <div ref={ref} style={{ minHeight: 44, display: 'flex', justifyContent: 'center' }} />
      ) : (
        <div className="login-error">Falta configurar NEXT_PUBLIC_GOOGLE_CLIENT_ID.</div>
      )}
      {busy && (
        <p style={{ fontSize: 13, color: '#ecd083', margin: 0 }} role="status">
          Verificando tu cuenta…
        </p>
      )}
      {error && (
        <div className="login-error" role="alert" style={{ width: '100%' }}>
          {error}
        </div>
      )}
    </div>
  );
}
