'use client';

import React, { useState, FormEvent } from 'react';
import '../../pages/LoginPage.css';
import { AdminUser } from '../../types/admin.types';
import { DEFAULT_ADMIN_PROFILE, ADMIN_SESSION_STORAGE_KEY } from './adminMockData';
import { authService } from '../../services/auth.service';

interface AdminLoginModalProps {
  onLoginSuccess: (user: AdminUser) => void;
}

export default function AdminLoginModal({ onLoginSuccess }: AdminLoginModalProps) {
  const [accountNumber, setAccountNumber] = useState(DEFAULT_ADMIN_PROFILE.accountNumber);
  const [email, setEmail] = useState(DEFAULT_ADMIN_PROFILE.email);
  const [password, setPassword] = useState('Directivo2026*');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!accountNumber.trim()) {
      setError('Por favor ingresa tu número de cuenta o identificador directivo.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Por favor ingresa un correo institucional válido (@pcpuma.acatlan.unam.mx).');
      return;
    }

    if (!password || password.length < 6) {
      setError('La contraseña directiva debe tener al menos 6 caracteres.');
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
        !roles.includes('INSTITUTION_ADMIN') &&
        !roles.includes('ANALYST')
      ) {
        throw new Error(
          'Esta cuenta no cuenta con permisos de Supervisión Directiva o Analítica Institucional.',
        );
      }

      if (authData?.accessToken) {
        localStorage.setItem('token', authData.accessToken);
        document.cookie = `token=${authData.accessToken}; path=/; max-age=900; SameSite=Lax`;
      }

      const userToSave: AdminUser = {
        ...DEFAULT_ADMIN_PROFILE,
        fullName: authData?.user?.name || DEFAULT_ADMIN_PROFILE.fullName,
        accountNumber: accountNumber.trim(),
        email: authData?.user?.email || email.trim(),
      };

      localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(userToSave));
      onLoginSuccess(userToSave);
    } catch (err: any) {
      setError(
        err?.message ||
          'No se pudo autenticar en el Panel Directivo. Verifica tus credenciales.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUseDemo = () => {
    setAccountNumber(DEFAULT_ADMIN_PROFILE.accountNumber);
    setEmail('christian.delgado@acatlan.unam.mx');
    setPassword('AdminPuma2026*');
    setError(null);
  };

  return (
    <div className="login-card">
      <div className="card-mode-header">
        <h2 className="card-title">Acceso de Supervisión Directiva</h2>
      </div>

      <form onSubmit={handleSubmit} className="login-form">
        {error && <div className="login-error">{error}</div>}

        <div className="field-group">
          <label className="field-label">
            Número de cuenta o identificador directivo
          </label>
          <input
            className="login-input"
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="Ej: DIR-4182903"
            autoComplete="username"
            required
          />
        </div>

        <div className="field-group">
          <label className="field-label">
            Correo institucional
          </label>
          <input
            className="login-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ejemplo@pcpuma.acatlan.unam.mx"
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
          {loading ? 'Verificando...' : 'Continuar'}
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
          Rellenar credenciales demo
        </button>
      </form>
    </div>
  );
}
