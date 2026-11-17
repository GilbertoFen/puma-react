'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../Navbar';
import AppFooter from '../AppFooter';
import '../../pages/LoginPage.css';
import { fullName, useSession } from '../../context/SessionContext';
import { portalsFor } from '../../utils/roleRouting';

/** Para usuarios con varios roles: elegir a dónde entrar. */
export default function PortalChooser() {
  const router = useRouter();
  const { status, user, roles, logout } = useSession();
  const portals = portalsFor(roles);

  useEffect(() => {
    if (status === 'anonymous') router.replace('/');
    else if (status === 'authenticated' && portals.length === 1) router.replace(portals[0].path);
  }, [status, portals, router]);

  return (
    <div className="page login-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="bg-mesh" />
      <Navbar />
      <div className="gold-line" />
      <main className="login-main">
        <div className="login-hero">
          <h1 className="login-title">
            ¿A dónde
            <br />
            quieres entrar?
          </h1>
          <p className="login-subtitle">
            {user ? `${fullName(user)} · ${user.email}` : 'Verificando tu cuenta…'}
          </p>
        </div>
        <div className="login-card">
          <div className="card-mode-header">
            <h2 className="card-title">Tu cuenta tiene varios accesos</h2>
            <p className="card-subtitle">Puedes cambiar después cerrando sesión o desde la dirección de cada portal.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {status === 'authenticated' &&
              portals.map((p) => (
                <button
                  key={p.path}
                  type="button"
                  className="login-btn"
                  style={{ width: '100%', marginTop: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}
                  onClick={() => router.push(p.path)}
                >
                  <span>{p.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.8 }}>{p.description}</span>
                </button>
              ))}
            {status === 'authenticated' && (
              <button
                type="button"
                className="register-toggle-btn"
                onClick={async () => {
                  await logout();
                  router.replace('/');
                }}
              >
                Cerrar sesión
              </button>
            )}
          </div>
        </div>
      </main>
      <div className="gold-line" style={{ marginTop: 'auto' }} />
      <AppFooter variant="dark" />
    </div>
  );
}
