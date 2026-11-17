'use client';

import React from 'react';
import '../../pages/LoginPage.css';
import GoogleSignInButton from '../auth/GoogleSignInButton';

/**
 * Tarjeta de acceso de la portada de /profesores. Mismo login de Google que el resto de PumaIA;
 * sin contraseñas.
 */
export default function TeacherLoginModal() {
  return (
    <div className="login-card">
      <div className="card-mode-header">
        <h2 className="card-title">Acceso para profesores</h2>
        <p className="card-subtitle">
          Entra con tu cuenta de Google usando exactamente el correo con el que te invitó la coordinación. No se usa
          contraseña.
        </p>
      </div>
      <GoogleSignInButton origin="/profesores" />
    </div>
  );
}
