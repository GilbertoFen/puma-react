'use client';
import React, { useState, useEffect, useRef, FormEvent } from 'react';
import Navbar from '../components/Navbar';
import './LoginPage.css';
import { FESA_LOGO } from '../utils/img/assets';
import { UserData } from '../types';
import {
  authService,
  INSTITUTIONAL_DOMAIN,
  isValidInstitutionalEmail,
  isValidStudentInstitutionalEmail,
  normalizeInstitutionalEmail,
} from '../services/auth.service';
import { consentsService } from '../services/consents.service';
import AppFooter from '../components/AppFooter';
import PrivacyModal from './PrivacyModal';

interface LoginProps {
  onLogin: (user: UserData) => void;
}

type AuthMode = 'login' | 'register' | 'verify' | 'forgot' | 'reset';

declare global {
  interface Window {
    google?: any;
  }
}

async function completeClientSession(
  data: any,
  fallbackCuenta?: number,
  fallbackEmail?: string,
): Promise<UserData> {
  const tokenValue = data?.accessToken;
  if (!tokenValue) {
    throw new Error(
      data?.message || 'No se recibió un token de sesión válido.',
    );
  }

  localStorage.setItem('token', tokenValue);
  document.cookie = `token=${tokenValue}; path=/; max-age=900; SameSite=Lax`;

  // Sincronizar consentimientos con el backend (/api/consents) para habilitar el chat y respetar privacidad
  await consentsService.ensureConsentsSynced(tokenValue);

  const userPayload = data?.user || data || {};
  let hasCompletedQuizReal = false;

  try {
    const { questionnaireService } = await import(
      '../services/questionnarie.service'
    );
    const realAnswers = await questionnaireService.getAnswers();
    if (realAnswers && Object.keys(realAnswers).length > 0) {
      hasCompletedQuizReal = true;
    }
  } catch {
    hasCompletedQuizReal = Boolean(
      data?.hasCompletedQuiz ?? userPayload?.hasCompletedQuiz,
    );
  }

  const displayName = String(
    userPayload.name || data.name || 'Estudiante PumaIA',
  ).trim();
  const resolvedCuenta = Number(
    userPayload.accountNumber ||
    fallbackCuenta ||
    (userPayload.email ? String(userPayload.email).split('@')[0] : 0),
  );

  const userRoles: string[] = Array.isArray(userPayload.roles)
    ? userPayload.roles
    : [];

  const userToSave: any = {
    nombre: displayName,
    cuenta: resolvedCuenta || 0,
    carrera: 'Matemáticas Aplicadas y Computación',
    semestre: userPayload.currentSemester ? `${userPayload.currentSemester}° semestre` : (userPayload.semestre || '1° semestre'),
    hasCompletedQuiz: hasCompletedQuizReal,
    initial: (displayName.charAt(0) || 'P').toUpperCase(),
    email:
      userPayload.email ||
      fallbackEmail ||
      `${resolvedCuenta}${INSTITUTIONAL_DOMAIN}`,
    avatarUrl: userPayload.avatarUrl || null,
    roles: userRoles,
    professorId: userPayload.professorId || null,
  };

  localStorage.setItem('userData', JSON.stringify(userToSave));

  if (userRoles.includes('PROFESSOR')) {
    localStorage.setItem(
      'puma_teacher_session',
      JSON.stringify({
        id: userPayload.professorId || userPayload.id || 'prof-1',
        name: displayName,
        accountNumber: String(resolvedCuenta || 'DOCENTE'),
        email: userToSave.email,
        department: 'Matemáticas Aplicadas y Computación',
        faculty: 'FES Acatlán · UNAM',
      }),
    );
  }

  if (userRoles.includes('INSTITUTION_ADMIN') || userRoles.includes('ANALYST')) {
    localStorage.setItem(
      'puma_admin_session',
      JSON.stringify({
        id: userPayload.id || 'admin-1',
        fullName: displayName,
        accountNumber: String(resolvedCuenta || 'DIRECTIVO'),
        email: userToSave.email,
        roleTitle: 'Coordinación Institucional MAC',
        department: 'División de Matemáticas e Ingeniería · FES Acatlán',
      }),
    );
  }

  return userToSave;
}

// ── Botón de Google OAuth Institucional ──────────────
function GoogleInstitutionalButton({
  onLogin,
  setError,
}: {
  onLogin: (u: UserData) => void;
  setError: (msg: string) => void;
}) {
  const btnContainerRef = useRef<HTMLDivElement>(null);
  const [gsiReady, setGsiReady] = useState(false);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  useEffect(() => {
    if (!googleClientId || typeof window === 'undefined') return;

    const initGoogle = () => {
      if (!window.google?.accounts?.id || !btnContainerRef.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        hd: 'pcpuma.acatlan.unam.mx',
        callback: async (response: { credential?: string }) => {
          if (!response?.credential) {
            setError('No se recibió credencial de Google.');
            return;
          }
          try {
            setError('');
            const data = await authService.loginWithGoogle(response.credential);
            const savedUser = await completeClientSession(data);
            onLogin(savedUser);
          } catch (err: any) {
            setError(err.message || 'Error al autenticar con Google.');
          }
        },
      });
      window.google.accounts.id.renderButton(btnContainerRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'continue_with',
        shape: 'pill',
      });
      setGsiReady(true);
    };

    if (window.google?.accounts?.id) {
      initGoogle();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.head.appendChild(script);
  }, [googleClientId, onLogin, setError]);

  return (
    <div
      style={{
        marginBottom: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      {googleClientId ? (
        <div
          ref={btnContainerRef}
          style={{ minHeight: gsiReady ? 'auto' : '40px' }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: '10px',
            border: '1px solid rgba(201, 168, 76, 0.35)',
            background: 'rgba(201, 168, 76, 0.08)',
            color: 'rgba(255, 255, 255, 0.85)',
            fontSize: '12px',
            textAlign: 'center',
          }}
        >
          Inicio de sesión institucional exclusivo para cuentas{' '}
          <strong>{INSTITUTIONAL_DOMAIN}</strong>
        </div>
      )}
    </div>
  );
}

// ── Formulario de login ───────────────────────────────
function LoginForm({
  onLogin,
  onGoToVerify,
  onGoToForgot,
}: {
  onLogin: (u: UserData) => void;
  onGoToVerify: (email: string) => void;
  onGoToForgot: (email: string) => void;
}) {
  const [emailOrAccount, setEmailOrAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);
  const googleClientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    '20191593425-enqgc95a8cpltaeimpolhb2fmb4hutde.apps.googleusercontent.com';

  useEffect(() => {
    if (!googleClientId || typeof window === 'undefined') return;

    const setupGoogle = () => {
      if (!window.google?.accounts?.id || !googleBtnContainerRef.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        hd: 'pcpuma.acatlan.unam.mx',
        callback: async (response: { credential?: string }) => {
          if (!response?.credential) {
            setError('No se recibió credencial de Google.');
            setGoogleLoading(false);
            return;
          }
          try {
            setError('');
            setGoogleLoading(true);
            const data = await authService.loginWithGoogle(response.credential);
            const savedUser = await completeClientSession(data);
            onLogin(savedUser);
          } catch (err: any) {
            setError(err.message || 'Error al autenticar con Google.');
          } finally {
            setGoogleLoading(false);
          }
        },
      });

      window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
        theme: 'outline',
        size: 'large',
        width: 220,
        text: 'continue_with',
        shape: 'pill',
      });
    };

    if (window.google?.accounts?.id) {
      setupGoogle();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = setupGoogle;
    document.head.appendChild(script);
  }, [googleClientId, onLogin]);

  const handleGoogleDirect = () => {
    if (typeof window === 'undefined') return;
    setError('');
    if (window.google?.accounts?.id) {
      setGoogleLoading(true);
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setGoogleLoading(false);
        }
      });
    } else {
      setError('Cargando servicios de Google, por favor reintenta en un momento.');
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const raw = emailOrAccount.trim().toLowerCase();
    if (!raw) {
      setError(
        'Ingresa tu correo institucional (@pcpuma.acatlan.unam.mx) o número de cuenta',
      );
      return;
    }

    const normalizedEmail = raw.includes('@')
      ? normalizeInstitutionalEmail(raw)
      : `${raw}${INSTITUTIONAL_DOMAIN}`;

    if (!isValidInstitutionalEmail(normalizedEmail)) {
      setError(
        `Solo se permiten cuentas con dominio exacto ${INSTITUTIONAL_DOMAIN}`,
      );
      return;
    }

    const localPart = normalizedEmail.split('@')[0];
    const parsedAccount = /^\d{1,9}$/.test(localPart)
      ? parseInt(localPart, 10)
      : undefined;

    setLoading(true);
    setError('');
    try {
      const data = await authService.login({
        ...(parsedAccount ? { accountNumber: parsedAccount } : {}),
        email: normalizedEmail,
        password,
      });
      const userToSave = await completeClientSession(
        data,
        parsedAccount,
        normalizedEmail,
      );
      onLogin(userToSave);
    } catch (err: any) {
      const msg = err.message || 'Error al iniciar sesión.';
      setError(msg);
      if (msg.toLowerCase().includes('verificar tu correo')) {
        onGoToVerify(normalizedEmail);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      {error && <div className="login-error">{error}</div>}

      <div className="field-group">
        <label className="field-label">
          Correo institucional o número de cuenta
        </label>
        <input
          className="login-input"
          type="text"
          value={emailOrAccount}
          onChange={(e) => setEmailOrAccount(e.target.value)}
          placeholder={`Ej: 321190239${INSTITUTIONAL_DOMAIN}`}
          autoComplete="username"
        />
      </div>

      <div className="field-group">
        <label className="field-label">
          Contraseña
          <button
            type="button"
            className="info-btn"
            title="Contraseña de tu cuenta PumaIA"
          >
            ⓘ
          </button>
        </label>
        <div className="input-wrap">
          <input
            className="login-input"
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ej: ••••••••"
            autoComplete="current-password"
          />
          <button
            type="button"
            className="toggle-pass"
            onClick={() => setShowPass(!showPass)}
            tabIndex={-1}
          >
            {showPass ? 'ⓘ' : 'ⓘ'}
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '12px',
          fontSize: '12px',
        }}
      >
        <button
          type="button"
          className="privacy-link"
          onClick={() => onGoToForgot(emailOrAccount)}
        >
          ¿Olvidaste tu contraseña?
        </button>
        <button
          type="button"
          className="privacy-link"
          onClick={() => onGoToVerify(emailOrAccount)}
        >
          Verificar mi correo
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginTop: '8px',
        }}
      >
        <button
          type="submit"
          className={`login-btn ${loading ? 'loading' : ''}`}
          disabled={loading || googleLoading}
          style={{ marginTop: 0 }}
        >
          {loading ? 'Verificando...' : 'Continuar'}
        </button>

        <button
          type="button"
          onClick={handleGoogleDirect}
          className="login-btn login-btn-secondary"
          disabled={loading || googleLoading}
          style={{
            marginTop: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            position: 'relative',
            overflow: 'hidden',
          }}
          title="Iniciar sesión directamente con Google (@pcpuma.acatlan.unam.mx)"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            style={{ flexShrink: 0 }}
          >
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
            />
            <path
              fill="#FBBC05"
              d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.347 2.825.957 4.039l3.007-2.332z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"
            />
          </svg>
          <span>{googleLoading ? 'Conectando...' : 'Iniciar con Google'}</span>
          <div
            ref={googleBtnContainerRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0.001,
              overflow: 'hidden',
              cursor: 'pointer',
              zIndex: 2,
            }}
          />
        </button>
      </div>
    </form>
  );
}

// ── Formulario de Verificación de Correo ──────────────
function VerifyEmailForm({
  initialEmail,
  initialToken,
  onVerified,
  onBack,
}: {
  initialEmail: string;
  initialToken?: string;
  onVerified: () => void;
  onBack: () => void;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState(initialToken || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState(
    initialToken
      ? 'Hemos generado tu código de verificación institucional. Confírmalo para activar tu cuenta.'
      : 'Ingresa el código de verificación enviado a tu correo institucional.',
  );

  const handleVerify = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const normalized = email.includes('@')
      ? normalizeInstitutionalEmail(email)
      : `${email.trim()}${INSTITUTIONAL_DOMAIN}`;

    if (!isValidInstitutionalEmail(normalized)) {
      setError(`Ingresa un correo válido ${INSTITUTIONAL_DOMAIN}`);
      return;
    }
    if (!token.trim()) {
      setError('Ingresa el código de verificación.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authService.verifyEmail(normalized, token.trim());
      onVerified();
    } catch (err: any) {
      setError(err.message || 'No se pudo verificar el correo.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const normalized = email.includes('@')
      ? normalizeInstitutionalEmail(email)
      : `${email.trim()}${INSTITUTIONAL_DOMAIN}`;

    if (!isValidInstitutionalEmail(normalized)) {
      setError(`Ingresa tu correo institucional ${INSTITUTIONAL_DOMAIN}`);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await authService.resendVerification(normalized);
      setInfoMessage(
        res?.message || 'Se ha reenviado un nuevo código de verificación.',
      );
    } catch (err: any) {
      setError(err.message || 'Error al reenviar código.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleVerify} className="login-form">
      {error && <div className="login-error">{error}</div>}
      {infoMessage && (
        <div
          style={{
            padding: '10px 12px',
            borderRadius: '8px',
            background: 'rgba(74, 222, 128, 0.12)',
            border: '1px solid rgba(74, 222, 128, 0.35)',
            color: '#bbf7d0',
            fontSize: '12px',
            marginBottom: '12px',
          }}
        >
          {infoMessage}
        </div>
      )}

      <div className="field-group">
        <label className="field-label">Correo institucional</label>
        <input
          className="login-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={`321190239${INSTITUTIONAL_DOMAIN}`}
        />
      </div>

      <div className="field-group">
        <label className="field-label">Código de verificación</label>
        <input
          className="login-input"
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Pega aquí tu token de verificación"
        />
      </div>

      <div style={{ marginBottom: '12px', textAlign: 'right' }}>
        <button
          type="button"
          className="privacy-link"
          onClick={handleResend}
          disabled={loading}
        >
          Reenviar código de verificación
        </button>
      </div>

      <div className="register-actions">
        <button
          type="button"
          className="login-btn login-btn-secondary"
          onClick={onBack}
        >
          ← Volver
        </button>
        <button
          type="submit"
          className={`login-btn ${loading ? 'loading' : ''}`}
          disabled={loading}
        >
          {loading ? 'Verificando...' : 'Confirmar correo'}
        </button>
      </div>
    </form>
  );
}

// ── Formulario de Recuperación y Restablecimiento de Contraseña ──
function ForgotAndResetPasswordForm({
  initialEmail,
  initialToken,
  initialMode,
  onSuccess,
  onBack,
}: {
  initialEmail: string;
  initialToken?: string;
  initialMode: 'forgot' | 'reset';
  onSuccess: () => void;
  onBack: () => void;
}) {
  const [step, setStep] = useState<'forgot' | 'reset'>(initialMode);
  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState(initialToken || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const handleRequestToken = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const normalized = email.includes('@')
      ? normalizeInstitutionalEmail(email)
      : `${email.trim()}${INSTITUTIONAL_DOMAIN}`;

    if (!isValidInstitutionalEmail(normalized)) {
      setError(`Ingresa un correo institucional válido ${INSTITUTIONAL_DOMAIN}`);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await authService.forgotPassword(normalized);
      setEmail(normalized);
      setInfoMessage(
        res?.message ||
        'Si el correo corresponde a una cuenta registrada, recibirás un token de recuperación.',
      );
      setStep('reset');
    } catch (err: any) {
      setError(err.message || 'Error al solicitar recuperación.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('Ingresa el token de recuperación.');
      return;
    }
    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('La confirmación de contraseña no coincide.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authService.resetPassword(email, token.trim(), newPassword);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'No se pudo restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'forgot') {
    return (
      <form onSubmit={handleRequestToken} className="login-form">
        {error && <div className="login-error">{error}</div>}
        <div className="field-group">
          <label className="field-label">
            Correo institucional ({INSTITUTIONAL_DOMAIN})
          </label>
          <input
            className="login-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={`321190239${INSTITUTIONAL_DOMAIN}`}
          />
        </div>

        <div className="register-actions">
          <button
            type="button"
            className="login-btn login-btn-secondary"
            onClick={onBack}
          >
            ← Volver
          </button>
          <button
            type="submit"
            className={`login-btn ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Solicitar código'}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleResetPassword} className="login-form">
      {error && <div className="login-error">{error}</div>}
      {infoMessage && (
        <div
          style={{
            padding: '10px 12px',
            borderRadius: '8px',
            background: 'rgba(201, 168, 76, 0.14)',
            border: '1px solid rgba(201, 168, 76, 0.35)',
            color: '#fde68a',
            fontSize: '12px',
            marginBottom: '12px',
          }}
        >
          {infoMessage}
        </div>
      )}

      <div className="field-group">
        <label className="field-label">Correo institucional</label>
        <input
          className="login-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="field-group">
        <label className="field-label">Token de recuperación</label>
        <input
          className="login-input"
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Token recibido en tu correo"
        />
      </div>

      <div className="field-group">
        <label className="field-label">Nueva contraseña (mín. 8 caracteres)</label>
        <input
          className="login-input"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Nueva contraseña"
        />
      </div>

      <div className="field-group">
        <label className="field-label">Confirmar nueva contraseña</label>
        <input
          className="login-input"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repite la nueva contraseña"
        />
      </div>

      <div className="register-actions">
        <button
          type="button"
          className="login-btn login-btn-secondary"
          onClick={onBack}
        >
          ← Volver
        </button>
        <button
          type="submit"
          className={`login-btn ${loading ? 'loading' : ''}`}
          disabled={loading}
        >
          {loading ? 'Actualizando...' : 'Restablecer contraseña'}
        </button>
      </div>
    </form>
  );
}

// ── Formulario de registro ────────────────────────────
function RegisterForm({
  onLogin,
  onRegisteredNeedsVerification,
  onBack,
}: {
  onLogin: (u: UserData) => void;
  onRegisteredNeedsVerification: (email: string, devToken?: string) => void;
  onBack: () => void;
}) {
  const [form, setForm] = useState({
    cuenta: '',
    nombres: '',
    apellidoP: '',
    apellidoM: '',
    password: '',
    confirmPassword: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Consentimientos: TERMS_AND_NOTICE (obligatorio), ANALYTICS e IMPROVEMENT (opcionales) ──
  const [showPrivacy, setShowPrivacy] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState(true);
  const [improvementConsent, setImprovementConsent] = useState(true);

  const set =
    (k: string) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleAcceptPrivacy = () => {
    setAccepted(true);
    setShowPrivacy(false);
    setError('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (
      !form.cuenta ||
      !form.nombres ||
      !form.apellidoP ||
      !form.password ||
      !form.confirmPassword ||
      !form.email
    ) {
      setError('Todos los campos obligatorios deben completarse.');
      return;
    }

    const normalizedEmail = normalizeInstitutionalEmail(form.email);
    if (!isValidStudentInstitutionalEmail(normalizedEmail)) {
      setError(
        `El correo de estudiante debe tener el formato <numero_de_cuenta>${INSTITUTIONAL_DOMAIN} (1 a 9 dígitos numéricos).`,
      );
      return;
    }

    const emailAccountPart = parseInt(normalizedEmail.split('@')[0], 10);
    if (emailAccountPart !== Number(form.cuenta)) {
      setError(
        'El número de cuenta ingresado debe coincidir exactamente con el prefijo de tu correo institucional.',
      );
      return;
    }

    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('La confirmación de contraseña no coincide.');
      return;
    }

    if (!accepted) {
      setError('Debes leer y aceptar el Aviso de Privacidad para registrarte');
      setShowPrivacy(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
      consentsService.savePendingPreferences({
        termsAccepted: true,
        analyticsAccepted: analyticsConsent,
        improvementAccepted: improvementConsent,
      });

      const registerPayload = {
        accountNumber: Number(form.cuenta),
        name: form.nombres.trim().toUpperCase(),
        lastNameP: form.apellidoP.trim().toUpperCase(),
        lastNameM: form.apellidoM.trim().toUpperCase(),
        email: normalizedEmail,
        password: form.password,
      };

      const regResponse = await authService.register(registerPayload);
      if (regResponse?.accessToken) {
        const savedUser = await completeClientSession(regResponse, Number(form.cuenta), normalizedEmail);
        onLogin(savedUser);
      } else {
        onRegisteredNeedsVerification(normalizedEmail, regResponse?.devVerificationToken);
      }
    } catch (err: any) {
      setError(err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="login-form">
        {error && <div className="login-error">{error}</div>}

        <div className="field-group ">
          <p className="field-label">Número de cuenta (máx. 9 dígitos)</p>
          <input
            className="login-input"
            type="number"
            value={form.cuenta}
            onChange={set('cuenta')}
            placeholder="Ej: 321190239"
          />
        </div>
        <div className="field-group">
          <p className="field-label">Nombre</p>
          <input
            className="login-input"
            type="text"
            value={form.nombres}
            onChange={set('nombres')}
            placeholder="Nombres"
          />
        </div>
        <div className="register-row">
          <div className="field-group">
            <p className="field-label">Apellido Paterno</p>
            <input
              className="login-input"
              type="text"
              value={form.apellidoP}
              onChange={set('apellidoP')}
              placeholder="Apellido Paterno"
            />
          </div>
          <div className="field-group">
            <p className="field-label">Apellido Materno</p>
            <input
              className="login-input"
              type="text"
              value={form.apellidoM}
              onChange={set('apellidoM')}
              placeholder="Apellido Materno"
            />
          </div>
        </div>
        <div className="field-group">
          <p className="field-label">
            Correo institucional ({INSTITUTIONAL_DOMAIN})
          </p>
          <input
            className="login-input"
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder={`Ej: 321190239${INSTITUTIONAL_DOMAIN}`}
          />
        </div>
        <div className="field-group">
          <p className="field-label">Contraseña (mínimo 8 caracteres)</p>
          <input
            className="login-input"
            type="password"
            value={form.password}
            onChange={set('password')}
            placeholder="Contraseña"
          />
        </div>
        <div className="field-group">
          <p className="field-label">Confirmar contraseña</p>
          <input
            className="login-input"
            type="password"
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
            placeholder="Repite tu contraseña"
          />
        </div>

        {/* Consentimiento obligatorio TERMS_AND_NOTICE */}
        <label className="privacy-check">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => {
              if (e.target.checked) setShowPrivacy(true);
              else setAccepted(false);
            }}
          />
          <span>
            He leído y acepto los{' '}
            <button
              type="button"
              className="privacy-link"
              onClick={() => setShowPrivacy(true)}
            >
              Términos y Aviso de Privacidad
            </button>{' '}
            de PumaIA (Obligatorio).
          </span>
        </label>

        {/* Consentimientos opcionales ANALYTICS e IMPROVEMENT */}
        <label className="privacy-check" style={{ marginTop: '6px' }}>
          <input
            type="checkbox"
            checked={analyticsConsent}
            onChange={(e) => setAnalyticsConsent(e.target.checked)}
          />
          <span>
            Autorizo el uso anónimo y agregado de mis datos (k-anonimato ≥ 10)
            para estadísticas académicas institucionales (Opcional).
          </span>
        </label>

        <label className="privacy-check" style={{ marginTop: '6px' }}>
          <input
            type="checkbox"
            checked={improvementConsent}
            onChange={(e) => setImprovementConsent(e.target.checked)}
          />
          <span>
            Autorizo el uso de mis interacciones no sensibles para mejorar las
            respuestas del asistente PumaIA (Opcional).
          </span>
        </label>

        <div className="register-actions">
          <button
            type="button"
            className="login-btn login-btn-secondary"
            onClick={onBack}
          >
            ← Volver
          </button>
          <button
            type="submit"
            className={`login-btn ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Crear cuenta'}
          </button>
        </div>
      </form>

      <PrivacyModal
        open={showPrivacy}
        onClose={() => setShowPrivacy(false)}
        onAccept={handleAcceptPrivacy}
      />
    </>
  );
}

// ── Página principal ──────────────────────────────────
export default function LoginPage({ onLogin }: LoginProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingToken, setPendingToken] = useState<string | undefined>(
    undefined,
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const urlMode = params.get('mode');
    const urlEmail = params.get('email') || '';
    const urlToken = params.get('token') || undefined;

    if (urlMode === 'verify' || urlMode === 'reset' || urlMode === 'forgot' || urlMode === 'register') {
      setMode(urlMode);
      if (urlEmail) setPendingEmail(urlEmail);
      if (urlToken) setPendingToken(urlToken);
    }
  }, []);

  const getHeaderTitle = () => {
    switch (mode) {
      case 'register':
        return 'Crear cuenta';
      case 'verify':
        return 'Verificar Correo';
      case 'forgot':
      case 'reset':
        return 'Recuperar Contraseña';
      default:
        return 'Ingresa al Portal';
    }
  };

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
            <h2 className="card-title">{getHeaderTitle()}</h2>
            <p className="card-subtitle">
              {mode === 'login'
                ? `Accede con tu cuenta institucional ${INSTITUTIONAL_DOMAIN}`
                : `Comunidad institucional ${INSTITUTIONAL_DOMAIN}`}
            </p>
          </div>

          {mode === 'login' && (
            <LoginForm
              onLogin={onLogin}
              onGoToVerify={(email) => {
                setPendingEmail(email);
                setPendingToken(undefined);
                setMode('verify');
              }}
              onGoToForgot={(email) => {
                setPendingEmail(email);
                setMode('forgot');
              }}
            />
          )}

          {mode === 'register' && (
            <RegisterForm
              onLogin={onLogin}
              onRegisteredNeedsVerification={(email, devToken) => {
                setPendingEmail(email);
                setPendingToken(devToken);
                setMode('verify');
              }}
              onBack={() => setMode('login')}
            />
          )}

          {mode === 'verify' && (
            <VerifyEmailForm
              initialEmail={pendingEmail}
              initialToken={pendingToken}
              onVerified={() => {
                setMode('login');
              }}
              onBack={() => setMode('login')}
            />
          )}

          {(mode === 'forgot' || mode === 'reset') && (
            <ForgotAndResetPasswordForm
              initialEmail={pendingEmail}
              initialToken={pendingToken}
              initialMode={mode}
              onSuccess={() => setMode('login')}
              onBack={() => setMode('login')}
            />
          )}

          {mode === 'login' && (
            <button
              type="button"
              className="register-toggle-btn"
              onClick={() => setMode('register')}
            >
              ¿Primera vez? Darse de alta con correo PCPuma
            </button>
          )}
        </div>
      </main>

      <div className="gold-line" />
      <AppFooter variant="dark" />
    </div>
  );
}
