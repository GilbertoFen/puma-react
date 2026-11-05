'use client';

import React, { useState } from 'react';
import styles from './AdminPdfDashboard.module.css';
import {
  DASHBOARD_GENERAL_INDICATORS,
  TOP_CONCERNS_DATA,
  ADMIN_PROCEDURES_DATA,
  WHERE_THEY_GET_STUCK_DATA,
  SEMESTER_PROGRESS_DATA,
  USAGE_AND_SATISFACTION_DATA,
  WELLBEING_DATA,
} from './adminMockData';

export default function AdminPdfDashboard() {
  const [selectedCycle] = useState('2027-1');

  // Máximo para calcular porcentaje de ancho de barras en preocupaciones
  const maxConcernStudents = Math.max(
    ...TOP_CONCERNS_DATA.map((c) => (typeof c.studentsCount === 'number' ? c.studentsCount : 0)),
  );

  return (
    <div className={styles.dashboardContainer}>
      {/* 4.1. Encabezado y periodo */}
      <div className={styles.periodHeaderCard}>
        <div className={styles.periodTitleWrap}>
          <h1 className={styles.mainDashboardTitle}>
            Qué pasa con los alumnos este periodo
          </h1>
          <p className={styles.mainDashboardSubtitle}>
            Supervisión macroscópica de trayectoria escolar y acompañamiento institucional
          </p>
        </div>

        <div className={styles.periodSelectorWrap}>
          <span className={styles.periodLabel}>Periodo Académico:</span>
          <div className={styles.periodPill}>
            <span>{selectedCycle}</span>
          </div>
        </div>
      </div>

      {/* 4.2. Indicadores generales (3 tarjetas) */}
      <div className={styles.indicatorsGrid}>
        {/* Tarjeta 1: Alumnos registrados */}
        <div className={styles.indicatorCard}>
          <div className={styles.indicatorLabelRow}>
            <span className={styles.indicatorLabel}>Alumnos registrados</span>
          </div>
          <div className={styles.indicatorPrimaryValue}>
            {DASHBOARD_GENERAL_INDICATORS.registeredStudents.total.toLocaleString()}
          </div>
          <p className={styles.indicatorSubtext}>
            de ~{DASHBOARD_GENERAL_INDICATORS.registeredStudents.estimatedEnrollment.toLocaleString()} matrícula estimada de la carrera ({DASHBOARD_GENERAL_INDICATORS.registeredStudents.percentage}%)
          </p>
        </div>

        {/* Tarjeta 2: Con análisis activado */}
        <div className={styles.indicatorCard}>
          <div className={styles.indicatorLabelRow}>
            <span className={styles.indicatorLabel}>Con análisis activado</span>
          </div>
          <div className={`${styles.indicatorPrimaryValue} ${styles.indicatorPrimaryValueGold}`}>
            {DASHBOARD_GENERAL_INDICATORS.activatedAnalysis.percentage}%
          </div>
          <p className={styles.indicatorSubtext}>
            {DASHBOARD_GENERAL_INDICATORS.activatedAnalysis.count} alumnos · {DASHBOARD_GENERAL_INDICATORS.activatedAnalysis.note}
          </p>
        </div>

        {/* Tarjeta 3: Regla de privacidad */}
        <div className={styles.indicatorCard}>
          <div className={styles.indicatorLabelRow}>
            <span className={styles.indicatorLabel}>Regla de privacidad</span>
          </div>
          <div className={styles.indicatorPrimaryValue}>
            &lt;{DASHBOARD_GENERAL_INDICATORS.privacyRule.threshold}
          </div>
          <p className={styles.indicatorSubtext}>
            {DASHBOARD_GENERAL_INDICATORS.privacyRule.note}
          </p>
        </div>
      </div>

      {/* Fila 1: 4.3 Preocupaciones (Izq) y 4.4 Trámites (Der) */}
      <div className={styles.twoColumnsRow}>
        {/* 4.3. De qué se preocupan los alumnos */}
        <div className={styles.cardBox}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>De qué se preocupan los alumnos</h2>
              <p className={styles.cardSubtitle}>
                Se muestran los 5 temas principales de la semana y su variación frente a las 4 semanas previas.
              </p>
            </div>
            <span className={styles.badgeSampleN}>n = 947 alumnos</span>
          </div>

          <div className={styles.horizontalBarsList}>
            {TOP_CONCERNS_DATA.map((concern) => {
              const countNum =
                typeof concern.studentsCount === 'number'
                  ? concern.studentsCount
                  : 0;
              const barPercent = maxConcernStudents > 0
                ? Math.round((countNum / maxConcernStudents) * 100)
                : 0;

              return (
                <div key={concern.id} className={styles.barItem}>
                  <div className={styles.barMetaRow}>
                    <span className={styles.barCategoryName}>{concern.category}</span>
                    <div className={styles.barStatsRight}>
                      <span className={styles.barStudentsCount}>
                        {concern.studentsCount} alumnos
                      </span>
                      <span
                        className={`${styles.trendTag} ${
                          concern.trend === 'up'
                            ? styles.trendUp
                            : concern.trend === 'down'
                            ? styles.trendDown
                            : styles.trendSame
                        }`}
                        title={concern.trendText}
                      >
                        {concern.trend === 'up' && '▲'}
                        {concern.trend === 'down' && '▼'}
                        {concern.trend === 'same' && '—'}
                        {concern.variationPercentage !== 0
                          ? ` ${concern.variationPercentage > 0 ? '+' : ''}${concern.variationPercentage}%`
                          : ' 0%'}
                      </span>
                    </div>
                  </div>

                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{ width: `${barPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4.4. Trámites que más preguntan */}
        <div className={styles.cardBox}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Trámites que más preguntan</h2>
              <p className={styles.cardSubtitle}>
                Consultas sobre procesos administrativos y gestión escolar.
              </p>
            </div>
            <span className={styles.badgeSampleN}>n = 818 consultas</span>
          </div>

          <div className={styles.proceduresList}>
            {ADMIN_PROCEDURES_DATA.map((proc) => (
              <div key={proc.id} className={styles.procedureRow}>
                <span className={styles.procedureName}>{proc.procedureName}</span>
                <div className={styles.procedureCountWrap}>
                  {proc.isRestricted ? (
                    <span
                      className={styles.privacyRestrictedBadge}
                      title="Protegido por regla de privacidad (menos de 10 alumnos)"
                    >
                      &lt;10 alumnos
                    </span>
                  ) : (
                    <span className={styles.procedureCount}>
                      {proc.studentsCount} alumnos
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fila 2: 4.5 Dónde se atoran (Izq) y 4.6 Cómo van por semestre (Der) */}
      <div className={styles.twoColumnsRow}>
        {/* 4.5. Dónde se atoran */}
        <div className={styles.cardBox}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Dónde se atoran</h2>
              <p className={styles.cardSubtitle}>
                Materias con mayor índice de reprobación. Agrupado por materia. Solo considera alumnos con historial cargado.
              </p>
            </div>
            <span className={styles.badgeSampleN}>Historial activo</span>
          </div>

          <table className={styles.simpleTable}>
            <thead>
              <tr>
                <th>Materia</th>
                <th>Alumnos</th>
                <th>% Reprobación</th>
                <th>Tendencia</th>
              </tr>
            </thead>
            <tbody>
              {WHERE_THEY_GET_STUCK_DATA.map((item) => (
                <tr key={item.id}>
                  <td className={styles.subjectTextBold}>{item.subjectName}</td>
                  <td>
                    {typeof item.studentsCount === 'number'
                      ? `${item.studentsCount} cursaron`
                      : item.studentsCount}
                  </td>
                  <td>
                    <div className={styles.rateNumberWrap}>
                      <span className={styles.rateNumber}>{item.failureRate}%</span>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`${styles.trendTag} ${
                        item.trendDirection === 'up'
                          ? styles.trendUp
                          : styles.trendDirection === 'down'
                          ? styles.trendDown
                          : styles.trendSame
                      }`}
                    >
                      {item.trendDirection === 'up' && '▲'}
                      {item.trendDirection === 'down' && '▼'}
                      {item.trendDirection === 'same' && '—'}
                      {` ${item.trend}`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4.6. Cómo van por semestre */}
        <div className={styles.cardBox}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Cómo van por semestre</h2>
              <p className={styles.cardSubtitle}>
                Distribución de alumnos y avance respecto a créditos esperados (1° a 8° semestre).
              </p>
            </div>
            <span className={styles.badgeSampleN}>1° a 8° semestre</span>
          </div>

          <div className={styles.stackedLegend}>
            <div className={styles.legendItem}>
              <span className={styles.legendDotOnTrack} />
              <span>Al corriente</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendDotOneTwo} />
              <span>1 o 2 materias atrás</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendDotMoreBehind} />
              <span>Más atrás</span>
            </div>
          </div>

          <div className={styles.stackedSemestersWrap}>
            {SEMESTER_PROGRESS_DATA.map((row) => {
              const onTrackPct = (row.onTrack / row.totalStudents) * 100;
              const oneTwoPct = (row.oneOrTwoBehind / row.totalStudents) * 100;
              const moreBehindPct = (row.moreBehind / row.totalStudents) * 100;

              return (
                <div key={row.semester} className={styles.semesterStackedRow}>
                  <span className={styles.semesterLabel}>{row.semesterLabel}</span>

                  <div className={styles.stackedTrack} title={`Total: ${row.totalStudents} alumnos`}>
                    <div
                      className={styles.stackedOnTrack}
                      style={{ width: `${onTrackPct}%` }}
                      title={`Al corriente: ${row.onTrack} alumnos (${Math.round(onTrackPct)}%)`}
                    />
                    <div
                      className={styles.stackedOneTwo}
                      style={{ width: `${oneTwoPct}%` }}
                      title={`1-2 atrás: ${row.oneOrTwoBehind} alumnos (${Math.round(oneTwoPct)}%)`}
                    />
                    <div
                      className={styles.stackedMoreBehind}
                      style={{ width: `${moreBehindPct}%` }}
                      title={`Más atrás: ${row.moreBehind} alumnos (${Math.round(moreBehindPct)}%)`}
                    />
                  </div>

                  <span className={styles.semesterTotal}>{row.totalStudents}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Fila 3: 4.7 Uso de PUMAIA (Izq) y 4.8 Bienestar (Der) */}
      <div className={styles.twoColumnsRow}>
        {/* 4.7. Uso de PUMAIA */}
        <div className={styles.cardBox}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Uso de PUMAIA</h2>
              <p className={styles.cardSubtitle}>
                Alumnos activos durante el mes actual y evolución temporal del servicio.
              </p>
            </div>
            <span className={styles.badgeSampleN}>Actividad mensual</span>
          </div>

          <div className={styles.usageSatisfactionContainer}>
            <div className={styles.usageRow}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>Alumnos activos (este mes)</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, color: '#ecd083' }}>
                  {USAGE_AND_SATISFACTION_DATA.activeStudentsMonth}
                </span>
              </div>

              {/* Gráfica de evolución mensual */}
              <div className={styles.miniTrendChart} style={{ height: '90px', marginTop: '8px' }}>
                {USAGE_AND_SATISFACTION_DATA.monthlyEvolution.map((m) => {
                  const maxAct = 1000;
                  const hPct = Math.round((m.activeCount / maxAct) * 100);
                  return (
                    <div key={m.month} className={styles.miniChartColumn}>
                      <div
                        className={styles.miniBarFill}
                        style={{ height: `${hPct}%` }}
                        title={`${m.month}: ${m.activeCount} alumnos activos`}
                      />
                      <span className={styles.miniMonthLabel}>{m.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 4.8. Bienestar */}
        <div className={styles.cardBox}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Bienestar</h2>
              <p className={styles.cardSubtitle}>
                Monitoreo agregado de consultas de orientación emocional y bienestar universitario.
              </p>
            </div>
            <span className={styles.badgeSampleN}>Umbral &ge; 20 alumnos</span>
          </div>

          <div className={styles.wellbeingBox}>
            <div className={styles.wellbeingStatRow}>
              <div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
                  Consultas sobre bienestar este mes
                </div>
                <div className={styles.wellbeingNumber}>
                  {WELLBEING_DATA.isAboveThreshold
                    ? `${WELLBEING_DATA.studentsCount} alumnos`
                    : '<20 alumnos'}
                </div>
              </div>

              {WELLBEING_DATA.isAboveThreshold && (
                <span className={`${styles.trendTag} ${styles.trendUp}`} style={{ padding: '6px 10px', fontSize: '12px' }}>
                  ▲ +{WELLBEING_DATA.monthlyVariation}% vs mes anterior
                </span>
              )}
            </div>

            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
              Para garantizar la confidencialidad absoluta de los estudiantes, este módulo no desglosa temas ni información individual y solo opera cuando la cohorte es de al menos 20 alumnos.
            </div>

            <a
              href={WELLBEING_DATA.supportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.wellbeingLinkBtn}
            >
              <span>Servicios de Atención Psicológica · FES Acatlán</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* 4.9. Reglas de privacidad y filtros al pie */}
      <footer className={styles.privacyFooterNotice}>
        <div className={styles.privacyFooterIcon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>

        <ul className={styles.privacyFooterList}>
          <li>
            <span className={styles.bulletDot} />
            <span>Una sola dimensión de filtro a la vez</span>
          </li>
          <li>
            <span className={styles.bulletDot} />
            <span>Cada gráfica indica su cantidad de alumnos considerados (n)</span>
          </li>
          <li>
            <span className={styles.bulletDot} />
            <span>No se muestran listas de alumnos</span>
          </li>
          <li>
            <span className={styles.bulletDot} />
            <span>No se muestran puntajes individuales ni identificadores</span>
          </li>
        </ul>
      </footer>
    </div>
  );
}

