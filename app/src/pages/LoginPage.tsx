'use client';
import React from 'react';
import Navbar from '../components/Navbar';
import './LoginPage.css';
import { FESA_LOGO } from '../utils/img/assets';
import { UserData } from '../types';
import { INSTITUTIONAL_DOMAIN } from '../services/auth.service';
import { consentsService } from '../services/consents.service';
import { getAuthToken } from '../utils/api';
import AppFooter from '../components/AppFooter';
import GoogleSignInButton from '../components/auth/GoogleSignInButton';
import type { SessionUser } from '../context/SessionContext';

interface LoginProps {
  onLogin: (user: UserData) => void;
}

/** Datos del alumno que usan las pantallas del portal (Navbar, perfil, onboarding). */
export interface StudentCache extends UserData {
  hasCompletedQuiz: boolean;
  email: string;
  avatarUrl: string | null;
  roles: string[];
  currentSemester?: number | null;
}

/**
 * Prepara el portal del alumno después del login con Google (o al volver con sesión):
 * sincroniza consentimientos pendientes y arma el perfil local a partir de /autenticacion/me.
 * No guarda tokens: el access token vive en memoria.
 */
export async function prepareStudentSession(user: SessionUser): Promise<StudentCache> {
  await consentsService.ensureConsentsSynced(getAuthToken() ?? undefined);

  let hasCompletedQuiz = Boolean(user.student?.hasCompletedQuiz);
  try {
    const { questionnaireService } = await import('../services/questionnarie.service');
    const answers = await questionnaireService.getAnswers();
    if (answers && Object.keys(answers).length > 0) hasCompletedQuiz = true;
  } catch {
    // se queda con el dato de /me
  }

  const displayName = `${user.name} ${user.lastNameP}`.trim() || 'Estudiante PumaIA';
  const cuenta = Number(user.student?.accountNumber ?? String(user.email).split('@')[0]) || 0;
  const semester = user.student?.currentSemester ?? null;

  const cache: StudentCache = {
    nombre: displayName,
    cuenta,
    carrera: user.student?.career?.name || 'Matemáticas Aplicadas y Computación',
    semestre: semester ? `${semester}° semestre` : '1° semestre',
    currentSemester: semester,
    hasCompletedQuiz,
    initial: (displayName.charAt(0) || 'P').toUpperCase(),
    email: user.email || `${cuenta}${INSTITUTIONAL_DOMAIN}`,
    avatarUrl: user.avatarUrl ?? null,
    roles: user.roles,
  };
  localStorage.setItem('userData', JSON.stringify(cache));
  return cache;
}

/** Portada general de PumaIA. Mismo login de Google para todos; después se redirige según los roles. */
export default function LoginPage({ onLogin }: LoginProps) {
  return (
    <div className="page login-page">
      <div className="bg-mesh" />
      <Navbar />
      <div className="gold-line" />

      <main className="login-main">
        <div className="login-hero">
          <h1 className="login-title">
            Portal de
            <br />
            Orientación
          </h1>
          <div className="login-badge">
            <img src={FESA_LOGO} alt="FES Acatlán" />
          </div>
        </div>

        <div className="login-card">
          <div className="card-mode-header">
            <h2 className="card-title">Ingresa al Portal</h2>
            <p className="card-subtitle">
              Alumnos: tu cuenta {INSTITUTIONAL_DOMAIN}. Profesores y personal: el correo con el que te invitaron.
            </p>
          </div>
          <GoogleSignInButton
            origin="/"
            onAuthenticated={async (user, destination) => {
              // Solo si se queda en el portal del alumno; con varios roles primero se elige.
              if (destination === '/' && user.roles.includes('STUDENT')) {
                onLogin(await prepareStudentSession(user));
              }
            }}
          />
        </div>
      </main>

      <div className="gold-line" />
      <AppFooter variant="dark" />
    </div>
  );
}
