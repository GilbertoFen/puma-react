'use client';

import React from 'react';
import styles from './AdminPage.module.css';
import { MacroMetric } from '../../types/admin.types';

interface AdminMetricDetailModalProps {
  metric: MacroMetric | null;
  onClose: () => void;
  onGenerateIndividualReport?: (metric: MacroMetric) => void;
}

export default function AdminMetricDetailModal({
  metric,
  onClose,
  onGenerateIndividualReport,
}: AdminMetricDetailModalProps) {
  if (!metric) return null;

  const handleGenerateReport = () => {
    if (onGenerateIndividualReport) {
      onGenerateIndividualReport(metric);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalCardLarge}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="metric-modal-title"
      >
        {/* Cabecera del Modal sin badges redundantes */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderTitleWrap}>
            <h2 id="metric-modal-title" className={styles.modalTitle}>
              {metric.label}
            </h2>
            <p className={styles.modalSubtitle}>{metric.description}</p>
          </div>

          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            aria-label="Cerrar desglose"
          >
            ✕
          </button>
        </div>

        {/* Resumen principal de la métrica (Probabilidad + Razón) */}
        <div className={styles.modalMetricSummaryBox}>
          <div className={styles.summaryValueItem}>
            <span className={styles.summaryLabel}>Valor Probabilístico / Tasa Global</span>
            <div className={styles.summaryValuePrimary}>{metric.mainValueProb}</div>
          </div>

          <div className={styles.summaryDivider} />

          <div className={styles.summaryValueItem}>
            <span className={styles.summaryLabel}>Expresión en Razón Demográfica</span>
            <div className={styles.summaryValueRatio}>{metric.mainValueRatio}</div>
          </div>

          {metric.change && (
            <>
              <div className={styles.summaryDivider} />
              <div className={styles.summaryValueItem}>
                <span className={styles.summaryLabel}>Evolución Semestral</span>
                <span
                  className={
                    metric.isPositive ? styles.changePosLarge : styles.changeNegLarge
                  }
                >
                  {metric.isPositive ? '▲ ' : '▼ '} {metric.change}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Contenido condicional según el tipo de desglose */}
        <div className={styles.modalBodyContent}>
          <div className={styles.drillDownHeaderRow}>
            <h3 className={styles.drillDownHeading}>
              {metric.breakdownType === 'cohort_generations' &&
                'Evolución Histórica por Cohortes Generacionales'}
              {metric.breakdownType === 'subjects_table' &&
                'Tabla Ponderada de Reprobación por Asignaturas (MAC)'}
              {metric.breakdownType === 'semester_retention' &&
                'Tasa de Retención Curricular por Semestres'}
              {metric.breakdownType === 'credits_distribution' &&
                'Distribución de Carga y Créditos por Área Formativa'}
              {metric.breakdownType === 'prereq_chain' &&
                'Red de Seriación Crítica y Bloqueo en Cadena'}
            </h3>
          </div>

          {/* TABLA O LISTA SEGMENTADA */}
          <div className={styles.drillDownList}>
            {metric.details.map((item, index) => (
              <div key={item.key} className={styles.drillDownItemCard}>
                <div className={styles.itemTopRow}>
                  <div className={styles.itemLabelCluster}>
                    <span className={styles.itemIndex}>#{index + 1}</span>
                    <span className={styles.itemTitle}>{item.label}</span>
                  </div>

                  <div className={styles.itemValueCluster}>
                    <span className={styles.itemValueBig}>{item.formattedValue}</span>
                    {item.subValue && (
                      <span className={styles.itemSubValue}>{item.subValue}</span>
                    )}
                  </div>
                </div>

                {/* Barra de progreso en tono dorado */}
                {typeof item.value === 'number' && (
                  <div className={styles.itemBarTrack}>
                    <div
                      className={styles.itemBarFillGold}
                      style={{
                        width: `${Math.min(
                          metric.breakdownType === 'subjects_table'
                            ? item.value * 100
                            : item.value,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                )}

                {item.notes && (
                  <div className={styles.itemNotes}>
                    <span className={styles.notesPrefix}>Diagnóstico:</span> {item.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pie del modal con botón de Reporte Individual y botón Cerrar */}
        <div className={styles.modalFooterActionsRow}>
          <button
            type="button"
            className={styles.btnGenerateIndicatorReport}
            onClick={handleGenerateReport}
          >
            <DocumentIcon />
            <span>Generar reporte de este indicador</span>
          </button>

          <button
            type="button"
            className={styles.modalCloseFooterBtn}
            onClick={onClose}
          >
            Cerrar Desglose
          </button>
        </div>
      </div>
    </div>
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
