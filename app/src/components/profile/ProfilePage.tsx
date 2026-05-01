'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../Navbar';
import HomeDrawer from '../home/HomeDrawer';
import { MOCK_USER, MOCK_REPORT, MOCK_ANSWERS } from '../../mock/mockData';
import styles from './ProfilePage.module.css';

export default function ProfilePage() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [phone, setPhone] = useState(MOCK_USER.telefono ?? '');

  return (
    <div className={styles.root}>
      <div className={styles.bgMesh} />

      <Navbar showAcatlan userInitial={MOCK_USER.initial} />
      <div className={styles.goldLine} />

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button className={styles.hamburgerBtn}
          onClick={() => setDrawerOpen(true)} aria-label="Abrir menú">
          <HamburgerIcon />
        </button>
        <span className={styles.toolbarTitle}>Mi perfil</span>
      </div>

      <HomeDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNavigate={(section) => {
          setDrawerOpen(false);
          if (section === 'pumaia')     router.push('/chat');
          if (section === 'actualizar') router.push('/update-info');
          if (section === 'ajustes')    router.push('/settings');
        }}
      />
      {drawerOpen && (
        <div className={styles.overlay} onClick={() => setDrawerOpen(false)} />
      )}

      <main className={styles.main}>

        {/* ── Hero de perfil ── */}
        <section className={styles.heroCard}>
          <div className={styles.avatarWrap}>
            {MOCK_USER.fotoPerfil ? (
              <img src={MOCK_USER.fotoPerfil} alt="Foto" className={styles.avatarImg} />
            ) : (
              <div className={styles.avatarInitial}>{MOCK_USER.initial}</div>
            )}
            {/* Botón para cambiar foto — conectar con Cloudinary */}
            <button className={styles.avatarEditBtn} title="Cambiar foto">
              <CameraIcon />
            </button>
          </div>
          <div className={styles.heroInfo}>
            <h1 className={styles.heroName}>{MOCK_USER.nombre} {MOCK_USER.apellidos}</h1>
            <p className={styles.heroCareer}>{MOCK_USER.carrera}</p>
            <div className={styles.heroBadges}>
              <span className={styles.badge}>{MOCK_USER.semestre}</span>
              <span className={styles.badge}>Cuenta: {MOCK_USER.cuenta}</span>
            </div>
          </div>
          <button
            className={styles.editInfoBtn}
            onClick={() => router.push('/update-info')}
          >
            <EditIcon /> Actualizar información
          </button>
        </section>

        <div className={styles.grid}>

          {/* ── Columna izquierda ── */}
          <div className={styles.colLeft}>

            {/* Información de contacto */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}><PersonIcon /> Información de contacto</h2>
                <button className={styles.cardEditBtn}
                  onClick={() => setEditingContact((v) => !v)}>
                  {editingContact ? 'Guardar' : <EditIcon />}
                </button>
              </div>
              <div className={styles.fieldList}>
                <Field label="Correo institucional" value={MOCK_USER.email ?? '—'} />
                <Field
                  label="Teléfono"
                  value={phone || '—'}
                  editing={editingContact}
                  onChange={setPhone}
                  placeholder="55 1234 5678"
                />
              </div>
            </div>

            {/* Información académica */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}><BookIcon /> Información académica</h2>
              </div>
              <div className={styles.fieldList}>
                <Field label="Carrera"   value={MOCK_USER.carrera} />
                <Field label="Semestre"  value={MOCK_USER.semestre} />
                <Field label="Número de cuenta" value={MOCK_USER.cuenta} />
                <Field label="Facultad"  value="FES Acatlán" />
                <Field label="Universidad" value="UNAM" />
              </div>
            </div>

          </div>

          {/* ── Columna derecha ── */}
          <div className={styles.colRight}>

            {/* Carrera más compatible */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}><StarIcon /> Ruta profesional sugerida</h2>
                <button className={styles.cardLinkBtn}
                  onClick={() => router.push('/update-info')}>
                  Ver análisis completo →
                </button>
              </div>
              <div className={styles.topCareer}>
                <div className={styles.topCareerHeader}>
                  <span className={styles.topCareerTitle}>
                    {MOCK_REPORT.topCareers[0].title}
                  </span>
                  <span className={styles.topCareerMatch}>
                    {MOCK_REPORT.topCareers[0].matchPercent}%
                  </span>
                </div>
                <div className={styles.matchBar}>
                  <div className={styles.matchFill}
                    style={{ width: `${MOCK_REPORT.topCareers[0].matchPercent}%` }} />
                </div>
                <p className={styles.topCareerDesc}>
                  {MOCK_REPORT.topCareers[0].description}
                </p>
              </div>
            </div>

            {/* Fortalezas detectadas */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}><BoltIcon /> Fortalezas detectadas</h2>
              </div>
              <ul className={styles.strengthList}>
                {MOCK_REPORT.strengths.map((s) => (
                  <li key={s} className={styles.strengthItem}>
                    <span className={styles.strengthDot} />{s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Actividad reciente */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}><ClockIcon /> Actividad reciente</h2>
              </div>
              <ul className={styles.activityList}>
                <ActivityItem icon="💬" text="Conversación con PumaIA" date="Hoy" />
                <ActivityItem icon="📄" text="Documento subido: CV_Emmanuel_2025.pdf" date="Hace 2 días" />
                <ActivityItem icon="🔄" text="Cuestionario respondido" date="Hace 3 semanas" />
                <ActivityItem icon="✅" text="Perfil completado" date="Hace 1 mes" />
              </ul>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

// ── Sub-componentes ────────────────────────────────────
type FieldProps = {
  label: string;
  value: string;
  editing?: boolean;
  onChange?: (v: string) => void;
  placeholder?: string;
};

function Field({ label, value, editing, onChange, placeholder }: FieldProps) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      {editing && onChange ? (
        <input
          className={styles.fieldInput}
          value={value === '—' ? '' : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <span className={styles.fieldValue}>{value}</span>
      )}
    </div>
  );
}

type ActivityItemProps = { icon: string; text: string; date: string };
function ActivityItem({ icon, text, date }: ActivityItemProps) {
  return (
    <li className={styles.activityItem}>
      <span className={styles.activityIcon}>{icon}</span>
      <span className={styles.activityText}>{text}</span>
      <span className={styles.activityDate}>{date}</span>
    </li>
  );
}

// ── Íconos ────────────────────────────────────────────
function HamburgerIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
}
function EditIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
function CameraIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>;
}
function PersonIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>;
}
function BookIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
}
function StarIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
}
function BoltIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
}
function ClockIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
