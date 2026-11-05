'use client';

import React, { useState } from 'react';
import styles from './AdminPage.module.css';

interface AdminReportsBarProps {
  onGenerateGeneralReport: () => void;
}

export default function AdminReportsBar({ onGenerateGeneralReport }: AdminReportsBarProps) {
  const [isCompiling, setIsCompiling] = useState(false);

  const handleAction = () => {
    setIsCompiling(true);
    setTimeout(() => {
      setIsCompiling(false);
      onGenerateGeneralReport();
    }, 450);
  };

  return (
    <div className={styles.reportsBarCard}>
      <div className={styles.reportsBarLeft}>
        <div className={styles.reportsIconWrap}>
          <FileChartIcon />
        </div>
        <div className={styles.reportsTextGroup}>
          <h3 className={styles.reportsBarTitle}>Generador de Reportes Focalizados</h3>
          <p className={styles.reportsBarSubtitle}>
            Generación y compilación del informe macroscópico institucional de trayectoria,
            retención y asignaturas filtro para cuerpos colegiados y acreditación.
          </p>
        </div>
      </div>

      <div className={styles.reportsBarRight}>
        <button
          type="button"
          className={styles.generateReportBtn}
          onClick={handleAction}
          disabled={isCompiling}
        >
          {isCompiling ? (
            <span className={styles.loadingSpinnerWrapSmall}>
              <span className={styles.spinnerSmall} /> Compilando...
            </span>
          ) : (
            <>
              <DocumentIcon />
              <span>Generar reporte general</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function FileChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <line x1="9" y1="18" x2="9" y2="15" />
      <line x1="15" y1="18" x2="15" y2="9" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}
