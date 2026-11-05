'use client';

import React, { useState, FormEvent } from 'react';
import '../../pages/LoginPage.css';
import { TeacherProfile } from './teacherTypes';
import { DEFAULT_TEACHER_PROFILE, TEACHER_SESSION_STORAGE_KEY } from './teacherMockData';
import { authService } from '../../services/auth.service';

interface TeacherLoginModalProps {
  onLoginSuccess: (profile: TeacherProfile) => void;
}

export default function TeacherLoginModal({ onLoginSuccess }: TeacherLoginModalProps) {
  const [email, setEmail] = useState(DEFAULT_TEACHER_PROFILE.email);
  const [password, setPassword] = useState('Profesor2026*');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Por favor ingresa un correo electrónico institucional válido.');
      return;
    }
    if (!password || password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const authData = await authService.login({
        email: email.trim(),
        password,
      });

      const roles: string[] = Array.isArray(authData?.user?.roles)
        ? authData.user.roles
        : [];
      if (
        !roles.includes('PROFESSOR') &&
        !roles.includes('INSTITUTION_ADMIN')
      ) {
        throw new Error(
          'Esta cuenta no cuenta con permisos de Profesor en el Portal Docente.',
        );
      }

      if (authData?.accessToken) {
        localStorage.setItem('token', authData.accessToken);
        document.cookie = `token=${authData.accessToken}; path=/; max-age=900; SameSite=Lax`;
      }

      const profileToSave: TeacherProfile = {
        ...DEFAULT_TEACHER_PROFILE,
        id: authData?.user?.professorId || DEFAULT_TEACHER_PROFILE.id,
        name: authData?.user?.name || DEFAULT_TEACHER_PROFILE.name,
        accountNumber: 'DOCENTE',
        email: authData?.user?.email || email.trim(),
        courses: [],
      };

      localStorage.setItem(TEACHER_SESSION_STORAGE_KEY, JSON.stringify(profileToSave));
      onLoginSuccess(profileToSave);
    } catch (err: any) {
      setError(
        err?.message ||
          'No se pudo iniciar sesión en el Portal Docente. Verifica tus credenciales.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUseDemo = () => {
    setEmail(DEFAULT_TEACHER_PROFILE.email);
    setPassword('Profesor2026*');
    setError(null);
  };

  return (
    <div className="login-card">
      <div className="card-mode-header">
        <h2 className="card-title">Acceso a Profesores</h2>
        <p className="card-subtitle">
          Ingresa con tu correo institucional y contraseña docente
        </p>
      </div>

      <form onSubmit={handleSubmit} className="login-form">
        {error && <div className="login-error">{error}</div>}

        <div className="field-group">
          <label className="field-label">
            Correo institucional
          </label>
          <input
            className="login-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ejemplo@acatlan.unam.mx"
            autoComplete="email"
            required
          />
        </div>

        <div className="field-group">
          <label className="field-label">
            Contraseña
          </label>
          <div className="input-wrap">
            <input
              className="login-input"
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="toggle-pass"
              onClick={() => setShowPass(!showPass)}
              tabIndex={-1}
              style={{ color: 'rgba(255, 255, 255, 0.6)' }}
            >
              {showPass ? '👁' : '👁‍🗨'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className={`login-btn ${loading ? 'loading' : ''}`}
          disabled={loading}
          style={{ width: '100%', marginTop: '10px' }}
        >
          {loading ? 'Verificando...' : 'Iniciar Sesión'}
        </button>

        <button
          type="button"
          onClick={handleUseDemo}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(201, 168, 76, 0.9)',
            fontSize: '13px',
            cursor: 'pointer',
            textAlign: 'center',
            marginTop: '8px',
            textDecoration: 'underline',
            fontFamily: 'inherit',
          }}
        >
          Rellenar credenciales de profesor
        </button>
      </form>
    </div>
  );
}
