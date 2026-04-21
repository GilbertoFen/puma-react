'use client';
import React, { useState,FormEvent,ChangeEvent } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './LoginPage.css';
import { FESA_LOGO } from '../utils/img/assets';
import { UserData } from '../types';

interface LoginProps{
  onLogin: (user: UserData) => void;
}

export default function LoginPage({ onLogin }: LoginProps) {
  const [cuenta, setCuenta] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!cuenta.trim()) {
      setError('Ingresa tu número de cuenta');
      return;
    }
    setLoading(true);
    setError('');
    // Conectarse al login real 
    setTimeout(() => {
      setLoading(false);
      // Datos simulados del usuario
      onLogin({
        nombre: 'Emmanuel Milislas Romero',
        cuenta: cuenta,
        carrera: 'Matemáticas Aplicadas y Computación',
        semestre: '6to semestre',
        initial: 'E',
      });
    }, 1000);
  };

  return (
    <div className="page login-page">
      <div className="bg-mesh" />
      <Navbar />
      <div className="gold-line" />

      <main className="login-main">
        <div className="login-hero">
          <h1 className="login-title">Portal de<br />Orientación</h1>
          <p className="login-subtitle">
            Orientación para encontrar empleos<br />
            basado en tu Historial Profesional
          </p>
          <div className="login-badge">
            <img
              src={FESA_LOGO}
            />
          </div>
        </div>

        <div className="login-card">
          <h2 className="card-title">Ingresa al Portal</h2>
          <p className="card-subtitle">Ingresa tu número de cuenta para continuar</p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="field-group">
              <input
                className="login-input"
                type="text"
                value={cuenta}
                onChange={(e) => setCuenta(e.target.value)}
                placeholder="Ej: 321190239"
                autoComplete="username"
              />
            </div>

            <div className="field-group">
              <label className="field-label">
                Contraseña
                <button
                  type="button"
                  className="info-btn"
                  title="Tu contraseña es la misma que usas en el SIIAU"
                >ⓘ</button>
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
                  {showPass ? '!' : '👁'}
                </button>
              </div>
            </div>

            <a href="#" className="forgot-link">
              Si aún no tienes u olvidaste tu contraseña da click aquí.
            </a>

            <button
              type="submit"
              className={`login-btn ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Verificando...' : 'Continuar'}
            </button>
          </form>
        </div>
      </main>

      <div className="gold-line" />
      <Footer />
    </div>
  );
}
