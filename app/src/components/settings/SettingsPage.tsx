'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../Navbar';
import styles from './SettingsPage.module.css';
import HomeDrawer from '../home/HomeDrawer';

type ToggleSetting = {
  kind: 'toggle';
  id: string;
  label: string;
  description: string;
  defaultValue: boolean;
};

type LinkSetting = {
  kind: 'link';
  id: string;
  label: string;
  description: string;
  href: string;
  external?: boolean;
};

type ActionSetting = {
  kind: 'action';
  id: string;
  label: string;
  description: string;
  actionLabel: string;
  variant?: 'default' | 'danger';
  onClick: () => void;
};

type Setting = ToggleSetting | LinkSetting | ActionSetting;

type SettingsSection = {
  id: string;
  title: string;
  icon: React.FC;
  settings: Setting[];
};

// ─────────────────────────────────────────────────────
// SECCIONES Y CONFIGURACIONES
// Para agregar una nueva opción: añade un objeto al array `settings` de la sección correspondiente
// Para agregar una nueva sección: añade un objeto a SECTIONS
// ─────────────────────────────────────────────────────
function buildSections(router: ReturnType<typeof useRouter>): SettingsSection[] {
  return [
    {
      id: 'cuenta',
      title: 'Cuenta',
      icon: AccountIcon,
      settings: [
        {
          kind: 'action',
          id: 'update-info',
          label: 'Actualizar información',
          description: 'Modifica tus datos personales y responde nuevamente el cuestionario de intereses',
          actionLabel: 'Actualizar',
          onClick: () => router.push('/home'),
        },
        {
          kind: 'action',
          id: 'change-password',
          label: 'Cambiar contraseña',
          description: 'Redirige al portal de servicios escolares UNAM para cambiar tu contraseña',
          actionLabel: 'Ir al portal',
          onClick: () => window.open('https://www.dgae-siae.unam.mx', '_blank'),
        },
        {
          kind: 'action',
          id: 'logout',
          label: 'Cerrar sesión',
          description: 'Salir de tu cuenta en este dispositivo',
          actionLabel: 'Cerrar sesión',
          variant: 'danger',
          onClick: () => router.push('/'),
        },
      ],
    },
    {
      id: 'notificaciones',
      title: 'Notificaciones',
      icon: BellIcon,
      settings: [
        {
          kind: 'toggle',
          id: 'notif-email',
          label: 'Notificaciones por correo',
          description: 'Recibe actualizaciones importantes en tu correo institucional',
          defaultValue: true,
        },
        {
          kind: 'toggle',
          id: 'notif-tips',
          label: 'Consejos de orientación',
          description: 'PumaIA te enviará sugerencias semanales basadas en tu perfil',
          defaultValue: false,
        },
      ],
    },
    {
      id: 'privacidad',
      title: 'Privacidad y datos',
      icon: ShieldIcon,
      settings: [
        {
          kind: 'toggle',
          id: 'analytics',
          label: 'Mejorar PumaIA con mis datos',
          description: 'Permite que tus interacciones anónimas ayuden a entrenar y mejorar el sistema',
          defaultValue: true,
        },
        {
          kind: 'action',
          id: 'export-data',
          label: 'Exportar mis datos',
          description: 'Descarga un archivo con toda la información que tenemos sobre ti',
          actionLabel: 'Exportar',
          onClick: () => alert('Función próximamente disponible'),
        },
      ],
    },
    {
      id: 'enlaces',
      title: 'Enlaces importantes',
      icon: LinkIcon,
      settings: [
        {
          kind: 'link',
          id: 'link-unam',
          label: 'Portal UNAM',
          description: 'Sitio oficial de la Universidad Nacional Autónoma de México',
          href: 'https://www.unam.mx',
          external: true,
        },
        {
          kind: 'link',
          id: 'link-fes',
          label: 'FES Acatlán',
          description: 'Sitio oficial de la Facultad de Estudios Superiores Acatlán',
          href: 'https://www.acatlan.unam.mx',
          external: true,
        },
        {
          kind: 'link',
          id: 'link-siae',
          label: 'Servicios escolares (SIAE)',
          description: 'Consulta tu historial académico, calificaciones e inscripciones',
          href: 'https://www.dgae-siae.unam.mx',
          external: true,
        },
        {
          kind: 'link',
          id: 'link-faqs',
          label: 'Preguntas frecuentes',
          description: 'Respuestas a las dudas más comunes sobre el uso de la plataforma',
          href: '/faqs',
          external: false,
        },
        {
          kind: 'link',
          id: 'link-legal',
          label: 'Aviso de privacidad',
          description: 'Información legal sobre el manejo de tus datos personales',
          href: '#',
          external: false,
        },
      ],
    },
    {
      id: 'acerca',
      title: 'Acerca de',
      icon: InfoIcon,
      settings: [
        {
          kind: 'action',
          id: 'version',
          label: 'Versión de la plataforma',
          description: 'PumaIA v1.0.0 — FES Acatlán © 2025',
          actionLabel: 'Ver novedades',
          onClick: () => router.push('/faqs'),
        },
      ],
    },
  ];
}


export default function SettingsPage() {
  const router = useRouter();
  const SECTIONS = buildSections(router);

  const initialToggles = SECTIONS.flatMap((s) =>
    s.settings
      .filter((item): item is ToggleSetting => item.kind === 'toggle')
      .map((item) => [item.id, item.defaultValue] as [string, boolean])
  );
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(initialToggles)
  );

  const flipToggle = (id: string) => {
    setToggles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className={styles.root}>
      <div className={styles.bgMesh} />
      <Navbar showAcatlan userInitial="E" />
      <div className={styles.goldLine} />

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <button className={styles.backBtn} onClick={() => router.back()}>
            <BackArrowIcon /> Volver
          </button>
          <h1 className={styles.pageTitle}>Ajustes</h1>
          <p className={styles.pageSubtitle}>Personaliza tu experiencia en PumaIA</p>
        </div>

        <div className={styles.sections}>
          {SECTIONS.map((section) => (
            <div key={section.id} className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}><section.icon /></span>
                <h2 className={styles.sectionTitle}>{section.title}</h2>
              </div>

              <div className={styles.sectionItems}>
                {section.settings.map((item) => (
                  <SettingRow
                    key={item.id}
                    item={item}
                    toggleValue={item.kind === 'toggle' ? toggles[item.id] : undefined}
                    onToggle={item.kind === 'toggle' ? () => flipToggle(item.id) : undefined}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

type SettingRowProps = {
  item: Setting;
  toggleValue?: boolean;
  onToggle?: () => void;
};

function SettingRow({ item, toggleValue, onToggle }: SettingRowProps) {
  return (
    <div className={`${styles.row} ${item.kind === 'action' && (item as ActionSetting).variant === 'danger' ? styles.rowDanger : ''}`}>
      <div className={styles.rowText}>
        <span className={styles.rowLabel}>{item.label}</span>
        <span className={styles.rowDesc}>{item.description}</span>
      </div>

      <div className={styles.rowControl}>
        {item.kind === 'toggle' && (
          <button
            className={`${styles.toggle} ${toggleValue ? styles.toggleOn : ''}`}
            onClick={onToggle}
            role="switch"
            aria-checked={toggleValue}
          >
            <span className={styles.toggleThumb} />
          </button>
        )}

        {item.kind === 'link' && (
          <a
            href={item.href}
            target={item.external ? '_blank' : undefined}
            rel={item.external ? 'noopener noreferrer' : undefined}
            className={styles.linkBtn}
          >
            {item.external ? <ExternalLinkIcon /> : <ChevronRightIcon />}
          </a>
        )}

        {item.kind === 'action' && (
          <button
            className={`${styles.actionBtn} ${(item as ActionSetting).variant === 'danger' ? styles.actionDanger : ''}`}
            onClick={(item as ActionSetting).onClick}
          >
            {(item as ActionSetting).actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function AccountIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  );
}
function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  );
}
function BackArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
}
function ExternalLinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  );
}
function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}
