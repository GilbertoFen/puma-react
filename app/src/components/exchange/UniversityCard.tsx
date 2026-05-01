'use client';
import React from 'react';
import type { University } from '../../types/exchange.types';
import SubjectValidator from './SubjectValidator';
import DocumentChecklist from './DocumentChecklist';
import styles from './UniversityCard.module.css';

type Props = {
  university: University;
  expanded: boolean;
  onToggleExpand: () => void;
  userName: string;
  currentSemester: string;
  targetSemester: string;
};

export default function UniversityCard({
  university,
  expanded,
  onToggleExpand,
  userName,
  currentSemester,
  targetSemester,
}: Props) {
  const flag = flagFromCode(university.countryCode);

  return (
    <div className={`${styles.card} ${expanded ? styles.cardExpanded : ''}`}>

      {/* ── Cabecera de la tarjeta ── */}
      <div className={styles.header}>
        {/* Columna izquierda: imagen + CTA */}
        <div className={styles.imageCol}>
          {university.imageUrl ? (
            <img
              src={university.imageUrl}
              alt={university.name}
              className={styles.image}
            />
          ) : (
            <div className={styles.imagePlaceholder}>
              <ImageIcon />
              <span>{university.name}</span>
            </div>
          )}
          <button className={styles.assessBtn} onClick={onToggleExpand}>
            {expanded
              ? 'Ocultar validación de materias'
              : 'Asesórate sobre la revalidación de materias y más documentación necesaria sobre este Intercambio Aquí'}
          </button>
        </div>

        {/* Columna derecha: info */}
        <div className={styles.infoCol}>
          {/* Título */}
          <div className={styles.titleRow}>
            <span className={styles.flag}>{flag}</span>
            <div>
              <h3 className={styles.uniName}>{university.name}</h3>
              <p className={styles.uniCity}>{university.city}</p>
              <p className={styles.uniLangs}>
                Idioma de instrucción: {university.languages.join(' y ')}.
              </p>
            </div>
            {/* Bookmark */}
            <button className={styles.bookmarkBtn} title="Guardar universidad">
              <BookmarkIcon />
            </button>
          </div>

          {/* Descripción */}
          <p className={styles.description}>{university.description}</p>

          {/* Requisitos */}
          <div className={styles.block}>
            <p className={styles.blockTitle}>Requisitos de Intercambio</p>
            <ul className={styles.reqList}>
              {university.requirements.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <button className={styles.moreBtn}>Más cosas</button>
          </div>

          {/* Becas */}
          <div className={styles.block}>
            <p className={styles.blockTitle}>Becas disponibles:</p>
            {university.scholarships.map((s) => (
              <p key={s.name} className={styles.scholarship}>
                <strong>{s.name}:</strong> {s.description}
              </p>
            ))}
          </div>

          {/* Footer de la tarjeta */}
          <div className={styles.cardFooter}>
            <a
              href={university.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.officialLink}
            >
              <GlobeIcon /> Sitio oficial de la universidad
            </a>
            <div className={styles.matchBadge}>
              <MatchIcon />
              <span>
                Esta opción encaja un <strong>{university.matchPercent}%</strong> con tu
                Situación Según PUMAIA
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Panel expandido: validador + documentos ── */}
      {expanded && (
        <div className={styles.expandPanel}>
          <div className={styles.expandGrid}>
            <SubjectValidator
              subjects={university.subjects}
              userName={userName}
              currentSemester={currentSemester}
              targetSemester={targetSemester}
              universityName={university.name}
            />
            <DocumentChecklist
              docs={university.requiredDocs}
              universityId={university.id}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Mapea código de país a emoji de bandera
function flagFromCode(code: string): string {
  const map: Record<string, string> = {
    US: '🇺🇸', ES: '🇪🇸', BE: '🇧🇪', FR: '🇫🇷', MX: '🇲🇽',
    DE: '🇩🇪', GB: '🇬🇧', NL: '🇳🇱', IT: '🇮🇹', CA: '🇨🇦',
  };
  return map[code] ?? '🌍';
}

function BookmarkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10A15 15 0 0 1 8 12a15 15 0 0 1 4-10z"/>
    </svg>
  );
}
function MatchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="rgba(201,168,76,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
      <path d="M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>
    </svg>
  );
}
function ImageIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
      stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  );
}
