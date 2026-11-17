'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import pdf from '../AdminPdfDashboard.module.css';
import s from './AdminPanel.module.css';
import type { PanelFilters } from '../../../services/admin.service';
import type { PeriodItem, QuestionnaireKind, ReportSection } from '../../../types/adminMetrics.types';
import { fmtDateTime } from './charts';

// ---------------------------------------------------------------------------
// Contexto del panel
// ---------------------------------------------------------------------------

export interface PanelContextValue {
  filters: PanelFilters;
  setFilters: (f: PanelFilters) => void;
  periods: PeriodItem[];
  periodsError: string | null;
  /** true dentro de la copia que se imprime: sin botones ni selectores. */
  printing: boolean;
  /** Registra el reporte en el backend (AuditLog) y abre la impresión. */
  printReport: (section: ReportSection, extra?: { kind?: QuestionnaireKind }) => void;
  reportBusy: boolean;
}

export const PanelContext = createContext<PanelContextValue | null>(null);

export function usePanel(): PanelContextValue {
  const ctx = useContext(PanelContext);
  if (!ctx) throw new Error('usePanel fuera de PanelContext');
  return ctx;
}

/** Nombre legible del periodo seleccionado. */
export function periodLabel(filters: PanelFilters, periods: PeriodItem[]): string {
  if (!filters.periodId) {
    const cur = periods.find((p) => p.current);
    return cur ? `${cur.code} (en curso)` : 'Periodo en curso (o todos si no hay uno en curso)';
  }
  return periods.find((p) => p.id === filters.periodId)?.code ?? filters.periodId;
}

// ---------------------------------------------------------------------------
// Carga de datos
// ---------------------------------------------------------------------------

export interface AsyncState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

/** Ejecuta `fn` cuando cambian `deps`; descarta respuestas viejas si el filtro cambió a medio camino. */
export function useAsync<T>(fn: () => Promise<T>, deps: React.DependencyList): AsyncState<T> {
  const [state, setState] = useState<{ data: T | null; error: string | null; loading: boolean }>({
    data: null,
    error: null,
    loading: true,
  });
  const [tick, setTick] = useState(0);
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });

  useEffect(() => {
    let alive = true;
    // Mantener los datos previos mientras recarga evita parpadeos al cambiar de periodo.
    Promise.resolve()
      .then(() => {
        if (alive) setState((prev) => ({ ...prev, loading: true, error: null }));
        return fnRef.current();
      })
      .then((data) => {
        if (alive) setState({ data, error: null, loading: false });
      })
      .catch((e: unknown) => {
        if (alive)
          setState({
            data: null,
            error: e instanceof Error ? e.message : 'No se pudo cargar la información.',
            loading: false,
          });
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}

// ---------------------------------------------------------------------------
// Tarjeta con estados de carga, vacío y error
// ---------------------------------------------------------------------------

export function Card({
  title,
  subtitle,
  n,
  loading,
  error,
  empty,
  emptyText = 'Todavía no hay datos para esta gráfica.',
  onRetry,
  children,
  wide = false,
}: {
  title: string;
  subtitle?: React.ReactNode;
  n?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyText?: string;
  onRetry?: () => void;
  children?: React.ReactNode;
  wide?: boolean;
}) {
  const { printing } = usePanel();
  let body: React.ReactNode = children;
  if (loading && !children) {
    body = (
      <div className={s.stateBox}>
        <span className={s.spinner} aria-hidden /> Cargando…
      </div>
    );
  } else if (error) {
    body = (
      <div className={`${s.stateBox} ${s.stateError}`} role="alert">
        <span>{error}</span>
        {onRetry && !printing && (
          <button type="button" className={s.btnGhost} onClick={onRetry}>
            Reintentar
          </button>
        )}
      </div>
    );
  } else if (empty) {
    body = <div className={s.stateBox}>{emptyText}</div>;
  }
  return (
    <section
      className={`${pdf.cardBox} ${s.card} ${wide ? s.cardWide : ''}`}
      data-loading={loading ? 'true' : undefined}
      aria-busy={loading || undefined}
    >
      <div className={pdf.cardHeader}>
        <div>
          <h3 className={pdf.cardTitle}>{title}</h3>
          {subtitle && <p className={pdf.cardSubtitle}>{subtitle}</p>}
        </div>
        {n !== undefined && n !== null && !error && <span className={pdf.badgeSampleN}>n = {n}</span>}
      </div>
      {body}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Barra superior de cada pantalla: periodo, semanas, fecha y reporte
// ---------------------------------------------------------------------------

export function SectionToolbar({
  title,
  subtitle,
  usesPeriod = true,
  usesWeeks = false,
  generatedAt,
  minGroupSize,
  reportSection,
  reportLabel = 'Reporte de esta sección',
  reportExtra,
  extraActions,
}: {
  title: string;
  subtitle?: string;
  usesPeriod?: boolean;
  usesWeeks?: boolean;
  generatedAt?: string | null;
  minGroupSize?: number | null;
  reportSection?: ReportSection;
  reportLabel?: string;
  reportExtra?: { kind?: QuestionnaireKind };
  extraActions?: React.ReactNode;
}) {
  const { filters, setFilters, periods, periodsError, printing, printReport, reportBusy } = usePanel();
  if (printing) return null;
  return (
    <div className={pdf.periodHeaderCard}>
      <div className={pdf.periodTitleWrap}>
        <h2 className={pdf.mainDashboardTitle}>{title}</h2>
        {subtitle && <p className={pdf.mainDashboardSubtitle}>{subtitle}</p>}
        <p className={s.generatedAt}>
          Datos generados: {fmtDateTime(generatedAt)}
          {minGroupSize ? ` · Umbral de privacidad: ${minGroupSize} alumnos` : ''}
        </p>
      </div>
      <div className={s.toolbarControls}>
        <label className={pdf.periodSelectorWrap}>
          <span className={pdf.periodLabel}>Periodo</span>
          <select
            className={s.select}
            value={filters.periodId}
            onChange={(e) => setFilters({ ...filters, periodId: e.target.value })}
            disabled={!usesPeriod}
            title={usesPeriod ? undefined : 'Esta pantalla no se filtra por periodo'}
          >
            <option value="">
              {periods.find((p) => p.current)
                ? `${periods.find((p) => p.current)!.code} (en curso)`
                : 'Periodo en curso'}
            </option>
            {periods
              .filter((p) => !p.current)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code}
                </option>
              ))}
          </select>
        </label>
        {usesWeeks && (
          <label className={pdf.periodSelectorWrap}>
            <span className={pdf.periodLabel}>Semanas</span>
            <select
              className={s.select}
              value={filters.weeks}
              onChange={(e) => setFilters({ ...filters, weeks: Number(e.target.value) })}
            >
              {[4, 8, 12, 16, 24].map((w) => (
                <option key={w} value={w}>
                  Últimas {w}
                </option>
              ))}
            </select>
          </label>
        )}
        {extraActions}
        {reportSection && (
          <button
            type="button"
            className={s.btnGold}
            disabled={reportBusy}
            onClick={() => printReport(reportSection, reportExtra)}
          >
            {reportBusy ? 'Preparando…' : reportLabel}
          </button>
        )}
      </div>
      {periodsError && <p className={s.inlineError}>No se pudo cargar la lista de periodos: {periodsError}</p>}
    </div>
  );
}

/** Notas que manda el backend con cada respuesta. */
export function Notes({ notes, title = 'Notas del cálculo' }: { notes?: string[]; title?: string }) {
  if (!notes || notes.length === 0) return null;
  return (
    <div className={s.notesBox}>
      <span className={s.notesTitle}>{title}</span>
      <ul className={s.notesList}>
        {notes.map((n, i) => (
          <li key={i}>{n}</li>
        ))}
      </ul>
    </div>
  );
}

/** Aviso fijo (ámbar) o informativo (morado). */
export function Banner({
  tone,
  children,
}: {
  tone: 'amber' | 'purple' | 'info';
  children: React.ReactNode;
}) {
  const cls = tone === 'amber' ? s.bannerAmber : tone === 'purple' ? s.bannerPurple : s.bannerInfo;
  return (
    <div className={`${s.banner} ${cls}`} role="note">
      {children}
    </div>
  );
}

/** Fecha más reciente entre varias respuestas. */
export function latest(...isos: (string | null | undefined)[]): string | null {
  const vals = isos.filter((x): x is string => Boolean(x)).sort();
  return vals.length ? vals[vals.length - 1] : null;
}
