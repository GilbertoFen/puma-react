'use client';

import React from 'react';
import pdf from '../AdminPdfDashboard.module.css';
import s from './AdminPanel.module.css';

/** Paleta del panel. */
export const COLORS = {
  gold: '#C9A84C',
  goldLight: '#ECD083',
  green: '#51CF66',
  amber: '#FCC419',
  red: '#FF6B6B',
  slate: '#8A94A6',
  blue: '#74C0FC',
};

// ---------------------------------------------------------------------------
// Formato
// ---------------------------------------------------------------------------

export const fmtInt = (n: number) => n.toLocaleString('es-MX');
export const fmtPct = (n: number) =>
  `${n.toLocaleString('es-MX', { maximumFractionDigits: 1 })} %`;
export const fmtDec = (n: number, d = 2) =>
  n.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** "2026-11-02" → "02 nov" (lunes de la semana). */
export function fmtWeek(key: string): string {
  const d = new Date(`${key}T12:00:00Z`);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', timeZone: 'UTC' });
}

// ---------------------------------------------------------------------------
// Celda protegida
// ---------------------------------------------------------------------------

/** Etiqueta ámbar para un valor null por umbral. Nunca se muestra un 0 en su lugar. */
export function Protected({ k, short = false }: { k: number; short?: boolean }) {
  const full = `Protegido · menos de ${k} alumnos`;
  return (
    <span className={s.protected} title={full}>
      {short ? 'Protegido' : full}
    </span>
  );
}

/** Muestra el valor formateado o la etiqueta de protegido si llega en null. */
export function Val({
  v,
  k,
  fmt = fmtInt,
  short,
}: {
  v: number | null | undefined;
  k: number;
  fmt?: (n: number) => string;
  short?: boolean;
}) {
  if (v === null || v === undefined) return <Protected k={k} short={short} />;
  return <>{fmt(v)}</>;
}

export function NBadge({ children }: { children: React.ReactNode }) {
  return <span className={pdf.badgeSampleN}>n = {children}</span>;
}

// ---------------------------------------------------------------------------
// Leyenda
// ---------------------------------------------------------------------------

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className={pdf.stackedLegend}>
      {items.map((it) => (
        <div key={it.label} className={pdf.legendItem}>
          <span className={s.legendDot} style={{ background: it.color }} />
          <span>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Barras horizontales (valor + %)
// ---------------------------------------------------------------------------

export interface HBarRow {
  key: string;
  label: string;
  value: number | null;
  /** Texto a la derecha (si no, el valor formateado). */
  valueText?: string;
  /** Porcentaje opcional que se muestra junto al valor. */
  pct?: number | null;
  /** Nota pequeña bajo la etiqueta (p. ej. "n = 34"). */
  hint?: string;
  color?: string;
}

export function HBarChart({
  rows,
  k,
  max,
  fmt = fmtInt,
}: {
  rows: HBarRow[];
  k: number;
  /** Escala fija (p. ej. 100 para porcentajes). Si no, el mayor valor. */
  max?: number;
  fmt?: (n: number) => string;
}) {
  const top = max ?? Math.max(1, ...rows.map((r) => r.value ?? 0));
  return (
    <div className={pdf.horizontalBarsList}>
      {rows.map((r) => (
        <div key={r.key} className={pdf.barItem}>
          <div className={pdf.barMetaRow}>
            <span className={pdf.barCategoryName}>
              {r.label}
              {r.hint && <span className={s.hint}> · {r.hint}</span>}
            </span>
            <div className={pdf.barStatsRight}>
              {r.value === null ? (
                <Protected k={k} />
              ) : (
                <>
                  <span className={pdf.barStudentsCount}>{r.valueText ?? fmt(r.value)}</span>
                  {r.pct !== undefined && r.pct !== null && (
                    <span className={s.pctText}>{fmtPct(r.pct)}</span>
                  )}
                </>
              )}
            </div>
          </div>
          <div className={pdf.barTrack}>
            {r.value !== null && (
              <div
                className={pdf.barFill}
                style={{
                  width: `${Math.min(100, (r.value / top) * 100)}%`,
                  ...(r.color ? { background: r.color } : {}),
                }}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Columnas
// ---------------------------------------------------------------------------

export function ColumnChart({
  data,
  k,
  height = 150,
  fmt = fmtInt,
}: {
  data: { key: string; label: string; value: number | null }[];
  k: number;
  height?: number;
  fmt?: (n: number) => string;
}) {
  const top = Math.max(1, ...data.map((d) => d.value ?? 0));
  const anyProtected = data.some((d) => d.value === null);
  return (
    <div>
      <div className={s.columns} style={{ height }}>
        {data.map((d) => (
          <div key={d.key} className={s.column}>
            <span className={s.columnValue}>{d.value === null ? '' : fmt(d.value)}</span>
            {d.value === null ? (
              <div
                className={s.columnProtected}
                title={`Protegido · menos de ${k} alumnos`}
                aria-label={`Protegido · menos de ${k} alumnos`}
              />
            ) : (
              <div
                className={s.columnBar}
                style={{ height: `${Math.max(d.value > 0 ? 2 : 0, (d.value / top) * 100)}%` }}
              />
            )}
            <span className={s.columnLabel}>{d.label}</span>
          </div>
        ))}
      </div>
      {anyProtected && (
        <p className={s.chartFootnote}>
          Columnas punteadas: <Protected k={k} />
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Barra apilada
// ---------------------------------------------------------------------------

export interface StackSegment {
  label: string;
  value: number | null;
  color: string;
}

/** Una barra apilada (al 100 % del total de sus segmentos). Si algún segmento es null, se protege. */
export function StackedBar({
  segments,
  k,
  showValues = true,
  isPercent = false,
}: {
  segments: StackSegment[];
  k: number;
  showValues?: boolean;
  /** Los valores ya son porcentajes (no se recalculan). */
  isPercent?: boolean;
}) {
  if (segments.some((sg) => sg.value === null)) return <Protected k={k} />;
  const total = segments.reduce((a, sg) => a + (sg.value ?? 0), 0);
  if (total === 0) return <span className={s.muted}>Sin registros</span>;
  return (
    <div className={s.stackWrap}>
      <div className={pdf.stackedTrack} role="img" aria-label={segments.map((sg) => `${sg.label}: ${sg.value}`).join(', ')}>
        {segments.map((sg) => {
          const w = ((sg.value ?? 0) / total) * 100;
          return w > 0 ? (
            <div
              key={sg.label}
              style={{ width: `${w}%`, background: sg.color, height: '100%' }}
              title={`${sg.label}: ${isPercent ? fmtPct(sg.value!) : `${fmtInt(sg.value!)} (${fmtPct(w)})`}`}
            />
          ) : null;
        })}
      </div>
      {showValues && (
        <div className={s.stackValues}>
          {segments.map((sg) => (
            <span key={sg.label} style={{ color: sg.color }}>
              {isPercent ? fmtPct(sg.value!) : fmtInt(sg.value!)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Línea (SVG)
// ---------------------------------------------------------------------------

export function LineChart({
  data,
  k,
  fmt = fmtInt,
  yMax,
  color = COLORS.goldLight,
}: {
  /** `noData: true` = no hubo registros (hueco sin marca); null sin noData = protegido. */
  data: { key: string; label: string; value: number | null; noData?: boolean }[];
  k: number;
  fmt?: (n: number) => string;
  /** Escala fija (p. ej. 100 para %). */
  yMax?: number;
  color?: string;
}) {
  const W = 640;
  const H = 200;
  const pad = { l: 40, r: 12, t: 16, b: 30 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const top = yMax ?? Math.max(1, ...data.map((d) => d.value ?? 0));
  const x = (i: number) => pad.l + (data.length <= 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const y = (v: number) => pad.t + ih - (v / top) * ih;

  // Segmentos continuos (los null cortan la línea).
  const segments: { i: number; v: number }[][] = [];
  let cur: { i: number; v: number }[] = [];
  data.forEach((d, i) => {
    if (d.value === null) {
      if (cur.length) segments.push(cur);
      cur = [];
    } else cur.push({ i, v: d.value });
  });
  if (cur.length) segments.push(cur);

  const labelEvery = Math.max(1, Math.ceil(data.length / 8));
  const anyProtected = data.some((d) => d.value === null && !d.noData);
  const anyNoData = data.some((d) => d.noData);
  const ticks = [0, top / 2, top];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.lineSvg} role="img" aria-label="Gráfica de línea">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className={s.gridLine} />
            <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" className={s.axisText}>
              {fmt(Math.round(t * 10) / 10)}
            </text>
          </g>
        ))}
        {segments.map((seg, si) => (
          <polyline
            key={si}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinejoin="round"
            points={seg.map((p) => `${x(p.i)},${y(p.v)}`).join(' ')}
          />
        ))}
        {data.map((d, i) =>
          d.value === null && d.noData ? (
            <g key={d.key}>
              <title>{`${d.label}: sin registros`}</title>
              <circle cx={x(i)} cy={pad.t + ih} r={3} className={s.noDataMark} />
            </g>
          ) : d.value === null ? (
            <g key={d.key}>
              <title>{`${d.label}: Protegido · menos de ${k} alumnos`}</title>
              <rect x={x(i) - 5} y={pad.t + ih - 10} width={10} height={10} className={s.protectedMark} />
            </g>
          ) : (
            <g key={d.key}>
              <title>{`${d.label}: ${fmt(d.value)}`}</title>
              <circle cx={x(i)} cy={y(d.value)} r={3.5} fill={color} />
            </g>
          ),
        )}
        {data.map((d, i) =>
          i % labelEvery === 0 || i === data.length - 1 ? (
            <text key={`l-${d.key}`} x={x(i)} y={H - 8} textAnchor="middle" className={s.axisText}>
              {d.label}
            </text>
          ) : null,
        )}
      </svg>
      {anyProtected && (
        <p className={s.chartFootnote}>
          Cuadros ámbar: <Protected k={k} />
        </p>
      )}
      {anyNoData && <p className={s.chartFootnote}>Puntos huecos en la base: semanas sin registros.</p>}
    </div>
  );
}
