'use client';

import React, { useState } from 'react';
import styles from './AdminPage.module.css';
import { AcademicReport } from '../../types/admin.types';
import { FESA_LOGO, UNAM_LOGO } from '../../utils/img/assets';

interface AdminReportModalProps {
  report: AcademicReport | null;
  onClose: () => void;
  onDownload?: (format: 'PDF' | 'CSV', title: string) => void;
}

export default function AdminReportModal({
  report,
  onClose,
  onDownload,
}: AdminReportModalProps) {
  const [downloading, setDownloading] = useState(false);

  if (!report) return null;

  const handlePrintOrDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      if (onDownload) {
        onDownload('PDF', report.title);
      }
      window.print();
    }, 400);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalCardFormalReport}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-doc-title"
      >
        {/* Barra de herramientas superior del documento */}
        <div className={styles.reportDocToolbar}>
          <div className={styles.toolbarInfo}>
            <span className={styles.toolbarDocTag}>Documento Formal PDF</span>
            <span className={styles.toolbarDocTitle}>{report.title}</span>
          </div>

          <div className={styles.toolbarActions}>
            <button
              type="button"
              className={styles.btnFormalPrint}
              onClick={handlePrintOrDownload}
              disabled={downloading}
              title="Descargar o imprimir documento en formato oficial PDF"
            >
              <DownloadIcon />
              <span>{downloading ? 'Generando PDF...' : 'Descargar / Imprimir PDF'}</span>
            </button>

            <button
              type="button"
              className={styles.modalCloseBtn}
              onClick={onClose}
              aria-label="Cerrar documento"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── HOJA FORMAL INSTITUCIONAL (ESTILO MEMBRETE EJECUTIVO) ── */}
        <div className={styles.formalPdfSheet}>
          {/* Membrete Oficial UNAM - FES Acatlán - MAC */}
          <header className={styles.formalHeader}>
            <div className={styles.formalLogosRow}>
              {UNAM_LOGO && (
                <img
                  src={UNAM_LOGO as string}
                  alt="Escudo UNAM"
                  className={styles.formalLogoUnam}
                />
              )}
              <div className={styles.formalInstitutionText}>
                <h1 className={styles.formalUnivName}>
                  UNIVERSIDAD NACIONAL AUTÓNOMA DE MÉXICO
                </h1>
                <h2 className={styles.formalFacultyName}>
                  FACULTAD DE ESTUDIOS SUPERIORES ACATLÁN
                </h2>
                <h3 className={styles.formalCoordinationName}>
                  COORDINACIÓN DE MATEMÁTICAS APLICADAS Y COMPUTACIÓN (MAC)
                </h3>
                <div className={styles.formalDocCategory}>
                  INFORME INSTITUCIONAL DE INDICADORES MACROSCÓPICOS DE TRAYECTORIA
                </div>
              </div>
              {FESA_LOGO && (
                <img
                  src={FESA_LOGO as string}
                  alt="Escudo FES Acatlán"
                  className={styles.formalLogoFesa}
                />
              )}
            </div>
            <div className={styles.formalHeaderDivider} />
          </header>

          {/* 1. Datos del ciclo lectivo y fecha de emisión */}
          <section className={styles.formalMetaSection}>
            <div className={styles.formalMetaGrid}>
              <div className={styles.formalMetaItem}>
                <span className={styles.formalMetaLabel}>Ciclo Lectivo:</span>
                <span className={styles.formalMetaValue}>{report.cycle || 'Semestre 2026-1'}</span>
              </div>
              <div className={styles.formalMetaItem}>
                <span className={styles.formalMetaLabel}>Fecha de Emisión:</span>
                <span className={styles.formalMetaValue}>{report.generationDate}</span>
              </div>
              <div className={styles.formalMetaItem}>
                <span className={styles.formalMetaLabel}>Tipo de Dictamen:</span>
                <span className={styles.formalMetaValue}>Supervisión Curricular Agregada</span>
              </div>
              <div className={styles.formalMetaItem}>
                <span className={styles.formalMetaLabel}>Nivel de Privacidad:</span>
                <span className={styles.formalMetaValue}>Estricto · Cero PII Estudiantil</span>
              </div>
            </div>
          </section>

          {/* 2. Resumen ejecutivo de indicadores */}
          <section className={styles.formalExecutiveSection}>
            <h4 className={styles.formalSectionTitle}>1. RESUMEN EJECUTIVO DE INDICADORES</h4>
            <p className={styles.formalExecutiveText}>{report.executiveSummary}</p>

            <div className={styles.formalInsightsList}>
              {report.keyInsights.map((insight, idx) => (
                <div key={idx} className={styles.formalInsightRow}>
                  <span className={styles.formalBullet}>—</span>
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Tabla comparativa macroscópica */}
          <section className={styles.formalTableSection}>
            <h4 className={styles.formalSectionTitle}>2. TABLA COMPARATIVA MACROSCÓPICA</h4>
            <table className={styles.formalTable}>
              <thead>
                <tr>
                  {report.columns.map((col) => (
                    <th key={col.key} style={{ textAlign: col.align || 'left' }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {report.columns.map((col) => {
                      const val = row[col.key];
                      return (
                        <td key={col.key} style={{ textAlign: col.align || 'left' }}>
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className={styles.formalTableFootnote}>
              * Los datos expresados corresponden a valores consolidados y porcentajes macroscópicos del plan de estudios MAC.
              En cumplimiento con la normativa universitaria de confidencialidad, no se incluyen identificadores ni datos personales de alumnos.
            </p>
          </section>

          {/* 4. Sección de firmas de validación institucional de la coordinación */}
          <section className={styles.formalSignaturesSection}>
            <div className={styles.signaturesRow}>
              <div className={styles.signatureBox}>
                <div className={styles.signatureLine} />
                <strong className={styles.signatoryName}>Mtro. Carlos Benítez Morales</strong>
                <span className={styles.signatoryRole}>
                  Coordinador de Matemáticas Aplicadas y Computación
                </span>
                <span className={styles.signatoryInst}>FES Acatlán · UNAM</span>
              </div>

              <div className={styles.signatureBox}>
                <div className={styles.signatureLine} />
                <strong className={styles.signatoryName}>Dirección de la Facultad</strong>
                <span className={styles.signatoryRole}>
                  Facultad de Estudios Superiores Acatlán
                </span>
                <span className={styles.signatoryInst}>Universidad Nacional Autónoma de México</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
