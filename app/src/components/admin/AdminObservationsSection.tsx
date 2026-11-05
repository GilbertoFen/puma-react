'use client';

import React from 'react';
import styles from './AdminPage.module.css';
import { AnomalyObservation } from '../../types/admin.types';

interface AdminObservationsSectionProps {
  observations: AnomalyObservation[];
}

export default function AdminObservationsSection({
  observations,
}: AdminObservationsSectionProps) {
  return (
    <section className={styles.observationsContainer}>
      <div className={styles.observationsHeaderSimple}>
        <h2 className={styles.observationsTitle}>
          Últimas Observaciones y Comportamientos Anómalos
        </h2>
        <p className={styles.observationsSubtitle}>
          Hallazgos identificados a partir de correlaciones de inscripción,
          evaluaciones ordinarias y flujo de seriación en el plan de estudios MAC.
        </p>
      </div>

      {/* Grid de Tarjetas de Observaciones Simplificadas */}
      <div className={styles.observationsGrid}>
        {observations.map((obs) => (
          <div key={obs.id} className={styles.obsCardClean}>
            <div className={styles.obsCardHeader}>
              <span className={styles.obsGoldPill}>
                <AlertCircleIcon /> Observación Curricular
              </span>
              <span className={styles.obsDetectedTime}>{obs.detectedAt}</span>
            </div>

            <h3 className={styles.obsTitle}>{obs.title}</h3>
            <p className={styles.obsDescription}>{obs.description}</p>

            {obs.impactMetrics && (
              <div className={styles.obsImpactBoxClean}>
                <span className={styles.impactLabel}>Impacto Estimado:</span>
                <span className={styles.impactValue}>{obs.impactMetrics}</span>
              </div>
            )}
          </div>
        ))}

        {observations.length === 0 && (
          <div className={styles.emptyObsBox}>
            <p>No hay observaciones activas registradas en este ciclo.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function AlertCircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
