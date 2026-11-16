'use client';

import React from 'react';
import '../../pages/LoginPage.css';
import GoogleSignInButton from '../auth/GoogleSignInButton';

/**
 * Tarjeta de acceso de la portada de /admin. Usa el mismo login de Google que el resto de PumaIA;
 * sin contraseñas ni credenciales de ejemplo.
 */
export default function AdminLoginModal() {
  return (
    <div className="login-card">
      <div className="card-mode-header">
        <h2 className="card-title">Acceso al panel de administración</h2>
        <p className="card-subtitle">
          Entra con tu cuenta de Google usando exactamente el correo con el que fuiste invitado. No se usa contraseña.
        </p>
      </div>
      <GoogleSignInButton origin="/admin" />
    </div>
  );
}
