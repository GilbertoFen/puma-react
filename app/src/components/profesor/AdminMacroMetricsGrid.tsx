'use client';

import React from 'react';
import styles from './AdminPage.module.css';
import { MacroMetric } from '../../types/admin.types';

interface AdminMacroMetricsGridProps {
    metrics: MacroMetric[];
    onSelectMetric: (metric: MacroMetric) => void;
}

export default function AdminMacroMetricsGrid({
    metrics,
    onSelectMetric,
}: AdminMacroMetricsGridProps) {
    return (
        <section className={styles.macroMetricsSection}>
            <div className={styles.sectionHeadingRow}>
                <div className={styles.sectionTitleBlock}>
                    <h2 className={styles.sectionHeadingTitle}>
                        Tablero de Métricas
                    </h2>
                </div>

                <div className={styles.legendIndicator}>
                    <span className={styles.dotGold} /> Datos validados corte 202-1
                </div>
            </div>

            <div className={styles.macroGrid}>
                {metrics.map((metric) => (
                    <div
                        key={metric.id}
                        className={styles.macroCard}
                        onClick={() => onSelectMetric(metric)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                onSelectMetric(metric);
                            }
                        }}
                        title={`Clic para inspeccionar desglose de: ${metric.label}`}
                    >
                        {/* Cabecera de la tarjeta: Icono alineado junto al título */}
                        <div className={styles.macroCardHeaderAligned}>
                            <div className={styles.macroIconWrapGold}>
                                {metric.id === 'desertion_rate' && <TrendingDownIcon />}
                                {metric.id === 'failure_rate' && <AlertTriangleIcon />}
                                {metric.id === 'retention_rate' && <UserCheckIcon />}
                                {metric.id === 'avg_credits' && <BookOpenIcon />}
                                {metric.id === 'prereq_delay' && <LockIcon />}
                            </div>
                            <h3 className={styles.macroLabel}>{metric.label}</h3>
                        </div>

                        {/* Valores macroscópicos principales */}
                        <div className={styles.macroValuesCluster}>
                            <div className={styles.macroProbWrap}>
                                <span className={styles.macroProbValue}>{metric.mainValueProb}</span>
                                <span className={styles.macroProbLabel}> </span>
                            </div>

                            <div className={styles.macroRatioDivider} />

                            <div className={styles.macroRatioWrap}>
                                <span className={styles.macroRatioValue}>{metric.mainValueRatio}</span>
                                <span className={styles.macroRatioLabel}>Razón Poblacional</span>
                            </div>
                        </div>

                        {metric.change && (
                            <div className={styles.macroChangeRow}>
                                <span
                                    className={
                                        metric.isPositive ? styles.changePosText : styles.changeNegText
                                    }
                                >
                                    {metric.isPositive ? '▲ ' : '▼ '} {metric.change}
                                </span>
                            </div>
                        )}

                        <p className={styles.macroDescription}>{metric.description}</p>

                        {/* Botón único de acción al pie de la tarjeta */}
                        <div className={styles.macroCardFooterAction}>
                            <button
                                type="button"
                                className={styles.btnDesgloseAction}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectMetric(metric);
                                }}
                            >
                                <span>Haz clic para ver el desglose</span>
                                <ChevronRightIcon />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ── Iconos SVG ──
function TrendingDownIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
            <polyline points="17 18 23 18 23 12" />
        </svg>
    );
}

function AlertTriangleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    );
}

function UserCheckIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <polyline points="16 11 18 13 22 9" />
        </svg>
    );
}

function BookOpenIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
    );
}

function LockIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    );
}

function ChevronRightIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
        </svg>
    );
}
