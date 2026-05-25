'use client';
import React, { useState, FormEvent } from 'react';
import Navbar from '../components/Navbar';
import './LoginPage.css';
import { FESA_LOGO } from '../utils/img/assets';
import { UserData } from '../types';
import { authService } from '../services/auth.service';
import AppFooter from '../components/AppFooter';

interface LoginProps {
  onLogin: (user: UserData) => void;
}

// ── Formulario de login ───────────────────────────────
function LoginForm({ onLogin }: LoginProps) {
  const [cuenta, setCuenta] = useState<number | null>(null);
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!cuenta) { setError('Ingresa tu número de cuenta'); return; }
    setLoading(true);
    setError('');
    try {
      const data = await authService.login({ accountNumber: cuenta, password });
      const tokenValue = data.accessToken;
      localStorage.setItem('token', tokenValue);
      document.cookie = `token=${tokenValue}; path=/; max-age=3600; SameSite=Lax`;

      let hasCompletedQuizReal = false;
      try {
        const { questionnaireService } = await import('../services/questionnarie.service');
        const realAnswers = await questionnaireService.getAnswers();
        if (realAnswers && Object.keys(realAnswers).length > 0) hasCompletedQuizReal = true;
      } catch {
        hasCompletedQuizReal = data?.hasCompletedQuiz ?? data?.user?.hasCompletedQuiz ?? false;
      }

      const userToSave = {
        nombre: data.name,
        cuenta,
        carrera: 'Matemáticas Aplicadas y Computación',
        semestre: '6to semestre',
        hasCompletedQuiz: hasCompletedQuizReal,
        initial: data.name.charAt(0).toUpperCase(),
      };
      localStorage.setItem('userData', JSON.stringify(userToSave));
      onLogin(userToSave);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      {error && <div className="login-error">{error}</div>}

      <div className="field-group">
        <input
          className="login-input"
          type="number"
          value={cuenta === null ? '' : cuenta}
          onChange={(e) => { const v = e.target.value; setCuenta(v === '' ? null : Number(v)); }}
          placeholder="Ej: 321190239"
          autoComplete="username"
        />
      </div>

      <div className="field-group">
        <label className="field-label">
          Contraseña
          <button type="button" className="info-btn" title="Tu contraseña es la misma que usas en el SIIAU">ⓘ</button>
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
          <button type="button" className="toggle-pass" onClick={() => setShowPass(!showPass)} tabIndex={-1}>
            {showPass ? '!' : '👁'}
          </button>
        </div>
      </div>

      <a href="#" className="forgot-link">Si aún no tienes u olvidaste tu contraseña da click aquí.</a>

      <button type="submit" className={`login-btn ${loading ? 'loading' : ''}`} disabled={loading}>
        {loading ? 'Verificando...' : 'Continuar'}
      </button>
    </form>
  );
}

// ── Formulario de registro ────────────────────────────
function RegisterForm({ onLogin, onBack }: { onLogin: (u: UserData) => void; onBack: () => void }) {
  const [form, setForm] = useState({
    cuenta: '', nombres: '', apellidoP: '', apellidoM: '',
    password: '', email: '', semestre: '1',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.cuenta || !form.nombres || !form.apellidoP || !form.password || !form.email) {
      setError('Todos los campos son obligatorios');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // 1. Mapeamos las variables de tu estado al DTO exacto que espera NestJS
      const registerPayload = {
        accountNumber: Number(form.cuenta),
        name: form.nombres.toUpperCase(),
        lastNameP: form.apellidoP.toUpperCase(),
        lastNameM: form.apellidoM.toUpperCase(),
        email: form.email,
        password: form.password,
        currentSemester: Number(form.semestre)
      };

      // 2. Llamamos al backend real
      const data = await authService.register(registerPayload);

      // 3. Extraemos el token que NestJS nos devuelve al registrar exitosamente
      const tokenValue = data.accessToken;
      localStorage.setItem('token', tokenValue);
      document.cookie = `token=${tokenValue}; path=/; max-age=3600; SameSite=Lax`;

      // 4. Armamos el usuario para el contexto de React
      const userToSave: any = {
        nombre: `${form.nombres} ${form.apellidoP} ${form.apellidoM}`.trim(),
        cuenta: Number(form.cuenta),
        carrera: 'Matemáticas Aplicadas y Computación', // Como lo quemamos en el backend, es correcto
        semestre: `${form.semestre}to semestre`,
        hasCompletedQuiz: false, // Es nuevo, obvio no lo ha completado
        initial: form.nombres.charAt(0).toUpperCase(),
        email: form.email,
      };

      localStorage.setItem('userData', JSON.stringify(userToSave));
      onLogin(userToSave);

    } catch (err: any) {
      setError(err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="login-form">
      {error && <div className="login-error">{error}</div>}

      <div className="field-group ">
        <p className="field-label">Número de cuenta</p>

        <input className="login-input" type="number" value={form.cuenta}
          onChange={set('cuenta')} placeholder="Ej: 321190239" />
      </div>
      <div className="field-group">
        <p className="field-label">Nombre</p>

        <input className="login-input" type="text" value={form.nombres}
          onChange={set('nombres')} placeholder="Nombres" />
      </div>
      <div className="register-row">
        <div className="field-group">
          <p className="field-label">Apellido Paterno</p>
          <input className="login-input" type="text" value={form.apellidoP}
            onChange={set('apellidoP')} placeholder="Apellido Paterno" />
        </div>
        <div className="field-group">
          <p className="field-label">Apellido Materno</p>

          <input className="login-input" type="text" value={form.apellidoM}
            onChange={set('apellidoM')} placeholder="Apellido Materno" />
        </div>
      </div>
      <div className="field-group">
        <p className="field-label">Correo</p>
        <input className="login-input" type="email" value={form.email}
          onChange={set('email')} placeholder="Ej: 321190239@pcpuma.acatlan.unam.mx" />
      </div>
      <div className="field-group">
        <p className="field-label">Contraseña</p>
        <input className="login-input" type="password" value={form.password}
          onChange={set('password')} placeholder="Contraseña" />
      </div>

      <div className="field-group">
        <label className="field-label">Semestre actual</label>
        <select className="login-input login-select" value={form.semestre} onChange={set('semestre')}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
            <option key={n} value={String(n)}>{n}° semestre</option>
          ))}
        </select>
      </div>

      <div className="register-actions">
        <button type="button" className="login-btn login-btn-secondary" onClick={onBack}>
          ← Volver
        </button>
        <button type="submit" className={`login-btn ${loading ? 'loading' : ''}`} disabled={loading}>
          {loading ? 'Registrando...' : 'Crear cuenta'}
        </button>
      </div>
    </form>
  );
}

// ── Página principal ──────────────────────────────────
export default function LoginPage({ onLogin }: LoginProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <div className="page login-page">
      <div className="bg-mesh" />
      <Navbar />
      <div className="gold-line" />

      <main className="login-main">
        <div className="login-hero">
          <h1 className="login-title">Portal de<br />Orientación</h1>
          <p className="login-subtitle">
            Orientación para encontrar empleos<br />basado en tu Historial Profesional
          </p>
          <div className="login-badge">
            <img src={FESA_LOGO} alt="FES Acatlán" />
          </div>
        </div>

        <div className="login-card">
          {/* Header animado según modo */}
          <div className="card-mode-header">
            <h2 className="card-title">
              {mode === 'login' ? 'Ingresa al Portal' : 'Crear cuenta'}
            </h2>
            <p className="card-subtitle">
              {mode === 'login'
                ? 'Ingresa tu número de cuenta para continuar'
                : 'Completa tus datos para registrarte'}
            </p>
          </div>

          {/* Formulario según modo */}
          {mode === 'login'
            ? <LoginForm onLogin={onLogin} />
            : <RegisterForm onLogin={onLogin} onBack={() => setMode('login')} />
          }

          {/* Botón para cambiar modo — solo en login */}
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