'use client';
import React from 'react';
import type { ProfessionalReport } from '../../types/shared.types';
import styles from './Sections.module.css';

type Props = {
  report: ProfessionalReport;
};

export default function ReportSection({ report }: Props) {
  const date = new Date(report.generatedAt).toLocaleDateString('es-MX', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Análisis profesional</h2>
        <p className={styles.sectionDesc}>
          Generado por PumaIA el {date} con base en tus respuestas y perfil académico.
        </p>
      </div>

      {/* Resumen */}
      <div className={styles.reportSummary}>
        <SparkleIcon />
        <p>{report.summary}</p>
      </div>

      {/* Carreras recomendadas */}
      <div className={styles.subsection}>
        <h3 className={styles.subsectionTitle}>Rutas profesionales recomendadas</h3>
        <div className={styles.careerList}>
          {report.topCareers.map((career) => (
            <div key={career.title} className={styles.careerCard}>
              <div className={styles.careerHeader}>
                <span className={styles.careerTitle}>{career.title}</span>
                <div className={styles.matchBadge}>
                  <span className={styles.matchNumber}>{career.matchPercent}%</span>
                  <span className={styles.matchLabel}>compatibilidad</span>
                </div>
              </div>
              <div className={styles.matchBar}>
                <div
                  className={styles.matchFill}
                  style={{ width: `${career.matchPercent}%` }}
                />
              </div>
              <p className={styles.careerDesc}>{career.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Fortalezas */}
      <div className={styles.subsection}>
        <h3 className={styles.subsectionTitle}>Fortalezas identificadas</h3>
        <ul className={styles.tagList}>
          {report.strengths.map((s) => (
            <li key={s} className={styles.strengthTag}><CheckIcon />{s}</li>
          ))}
        </ul>
      </div>

      {/* Áreas de oportunidad */}
      <div className={styles.subsection}>
        <h3 className={styles.subsectionTitle}>Áreas de oportunidad</h3>
        <ul className={styles.tagList}>
          {report.areasToGrow.map((a) => (
            <li key={a} className={styles.growTag}><ArrowIcon />{a}</li>
          ))}
        </ul>
      </div>

      <button className={styles.redoBtn}>
        <RefreshIcon /> Regenerar análisis con mis datos actuales
      </button>
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="rgba(201,168,76,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, marginTop: 2 }}>
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="rgba(201,168,76,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  );
}
function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  );
}
