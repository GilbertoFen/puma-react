'use client';

import React from 'react';
import Navbar from '../Navbar';
import styles from './AdminPage.module.css';
import { AdminUser } from '../../types/admin.types';

interface AdminHeaderProps {
  user: AdminUser;
  activeTab: 'dashboard' | 'calendar';
  onTabChange: (tab: 'dashboard' | 'calendar') => void;
  onLogout: () => void;
}

export default function AdminHeader({
  user,
  activeTab,
  onTabChange,
  onLogout,
}: AdminHeaderProps) {
  return (
    <header className={styles.headerContainer}>
      {/* Navbar Institucional UNAM / FES Acatlán */}
      <Navbar />
      <div className="gold-line" />

      {/* Subcabecera institucional de directivos */}
      <div className={styles.adminHeroSection}>
        <div className={styles.adminHeroContent}>
          {/* Avatar con Inicial Dorada */}
          <div
            className={styles.goldAvatarCircle}
            title={`Directivo: ${user.fullName}`}
          >
            <span>{user.avatarInitial || 'C'}</span>
          </div>

          {/* Información del Directivo */}
          <div className={styles.adminDetails}>
            <div className={styles.saluteRow}>
              <span className={styles.salutePrefix}>Portal de Supervisión Directiva</span>
            </div>

            <h1 className={styles.adminFullName}>
              {user.fullName} · <span>Coordinación MAC</span>
            </h1>
          </div>
        </div>

        {/* Acciones de la cabecera: Cerrar Sesión */}
        <div className={styles.headerRightActions}>
          <button
            type="button"
            className={styles.logoutBtn}
            onClick={onLogout}
            title="Cerrar sesión de coordinación y volver a la pantalla de acceso"
          >
            <ExitIcon />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Barra de navegación por pestañas del módulo */}
      <div className={styles.tabsBar}>
        <div className={styles.tabsList}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'dashboard' ? styles.tabBtnActive : ''}`}
            onClick={() => onTabChange('dashboard')}
          >
            <ChartBarIcon />
            <span>Dashboard Analítico y Reportes</span>
          </button>

          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'calendar' ? styles.tabBtnActive : ''}`}
            onClick={() => onTabChange('calendar')}
          >
            <CalendarGridIcon />
            <span>Supervisión en Tiempo Real (Horarios)</span>
          </button>
        </div>

        <div className={styles.tabsNotice}>
        </div>
      </div>
    </header>
  );
}

// ── Iconos SVG ──
function ChartBarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  );
}

function CalendarGridIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ExitIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function LockSmallIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
