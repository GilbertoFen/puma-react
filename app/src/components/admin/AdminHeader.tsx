'use client';

import React from 'react';
import Navbar from '../Navbar';
import styles from './AdminPage.module.css';

export type AdminTab =
  | 'summary'
  | 'academic'
  | 'attendance'
  | 'chat'
  | 'suggestions'
  | 'staff'
  | 'calendar'
  | 'labeling';

export interface AdminHeaderUser {
  fullName: string;
  avatarInitial?: string;
  roles: string[];
}

interface AdminHeaderProps {
  user: AdminHeaderUser;
  tabs: { id: AdminTab; label: string }[];
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onLogout: () => void;
}

const ICONS: Record<AdminTab, React.ReactNode> = {
  summary: <ChartBarIcon />,
  academic: <BookIcon />,
  attendance: <CheckIcon />,
  chat: <ChatIcon />,
  suggestions: <BulbIcon />,
  staff: <UsersIcon />,
  calendar: <CalendarGridIcon />,
  labeling: <TagIcon />,
};

function roleTitle(roles: string[]): string {
  const parts: string[] = [];
  if (roles.includes('INSTITUTION_ADMIN')) parts.push('Administración institucional');
  if (roles.includes('ANALYST')) parts.push('Análisis institucional');
  return parts.join(' · ') || 'Panel de administración';
}

export default function AdminHeader({ user, tabs, activeTab, onTabChange, onLogout }: AdminHeaderProps) {
  return (
    <header className={styles.headerContainer}>
      <Navbar />
      <div className="gold-line" />

      <div className={styles.adminHeroSection}>
        <div className={styles.adminHeroContent}>
          <div className={styles.goldAvatarCircle} title={user.fullName}>
            <span>{user.avatarInitial || user.fullName.charAt(0).toUpperCase() || 'P'}</span>
          </div>

          <div className={styles.adminDetails}>
            <div className={styles.saluteRow}>
              <span className={styles.salutePrefix}>Panel de administración PumaIA</span>
            </div>
            <h1 className={styles.adminFullName}>
              {user.fullName} · <span>{roleTitle(user.roles)}</span>
            </h1>
          </div>
        </div>

        <div className={styles.headerRightActions}>
          <button type="button" className={styles.logoutBtn} onClick={onLogout} title="Cerrar sesión">
            <ExitIcon />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>

      <div className={styles.tabsBar}>
        <div className={styles.tabsList} role="tablist" aria-label="Secciones del panel">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              className={`${styles.tabBtn} ${activeTab === t.id ? styles.tabBtnActive : ''}`}
              onClick={() => onTabChange(t.id)}
            >
              {ICONS[t.id]}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

// ── Iconos SVG ──
const svgProps = {
  width: 15,
  height: 15,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

function ChartBarIcon() {
  return (
    <svg {...svgProps}>
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg {...svgProps}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg {...svgProps}>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg {...svgProps}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function BulbIcon() {
  return (
    <svg {...svgProps}>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg {...svgProps}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg {...svgProps}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function CalendarGridIcon() {
  return (
    <svg {...svgProps}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ExitIcon() {
  return (
    <svg {...svgProps}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
