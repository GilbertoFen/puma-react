'use client';
import React from 'react';
import styles from './HomeDrawer.module.css';
import { AI_LOGO, EXCHANGE_ICON, UPDATE_INFO_ICON } from '../../utils/img/assets';

// Secciones del menu
type NavItem = {
  id: string;
  label: string;
  Icon: React.FC;
  enabled: boolean; 
};

const NAV_ITEMS: NavItem[] = [
  { id: 'perfil',      label: 'Mi perfil',            Icon: ProfileIcon,     enabled: false },
  { id: 'pumaia',      label: 'PumaIA',               Icon: PumaIAIcon,      enabled: true  },
  { id: 'actualizar',  label: 'Actualizar información',Icon: UpdateIcon,      enabled: false },
  { id: 'intercambio', label: 'Intercambio',           Icon: ExchangeIcon,    enabled: false },
  { id: 'ajustes',     label: 'Ajustes',               Icon: SettingsIcon,    enabled: true },
];

type Props = {
  open: boolean;
  onClose: () => void;
  onNavigate: (section: string) => void;
};

export default function HomeDrawer({ open, onClose, onNavigate }: Props) {
  return (
    <aside className={`${styles.drawer} ${open ? styles.open : ''}`}>

      <div className={styles.header}>
        <span className={styles.headerTitle}>Menú</span>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar menú">
          <CloseIcon />
        </button>
      </div>

      <div className={styles.goldLine} />

      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ id, label, Icon, enabled }) => (
          <button
            key={id}
            className={`${styles.navItem} ${!enabled ? styles.disabled : ''}`}
            onClick={() => enabled && onNavigate(id)}
            aria-disabled={!enabled}
            title={!enabled ? 'Próximamente' : label}
          >
            <span className={styles.navIcon}>
              <Icon />
            </span>
            <span className={styles.navLabel}>{label}</span>
            {!enabled && <span className={styles.comingSoon}>Pronto</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
}

function ProfileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function PumaIAIcon() {
  return (
    <img
        src={AI_LOGO}
        alt="PUMA IA"
        />
  );
}

function UpdateIcon() {
  return (
    <img
        src={UPDATE_INFO_ICON}
        alt="Actualizar informacion"
        />
  );
}

function ExchangeIcon() {
  return (
    <img
        src={EXCHANGE_ICON}
        alt="Intercambio"
        />
  );
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
