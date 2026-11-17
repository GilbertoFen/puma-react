'use client';

import React from 'react';
import pdf from '../AdminPdfDashboard.module.css';
import s from './AdminPanel.module.css';
import { adminService } from '../../../services/admin.service';
import type { ConsentKind } from '../../../types/adminMetrics.types';
import { Card, Notes, SectionToolbar, latest, useAsync, usePanel } from './common';
import {
  COLORS,
  HBarChart,
  Legend,
  LineChart,
  Protected,
  StackedBar,
  fmtInt,
  fmtPct,
  fmtWeek,
} from './charts';

const CONSENT_LABEL: Record<ConsentKind, string> = {
  TERMS_AND_NOTICE: 'Términos y aviso de privacidad',
  ANALYTICS: 'Análisis agregado (ANALYTICS)',
  IMPROVEMENT: 'Mejora del asistente',
};

/** Resumen = dashboard/summary + adoption + operations. */
export default function SummaryTab() {
  const { filters, printing } = usePanel();
  const summary = useAsync(() => adminService.summary(filters), [filters.periodId]);
  const adoption = useAsync(() => adminService.adoption(filters), [filters.weeks]);
  const operations = useAsync(() => adminService.operations(filters), [filters.periodId]);

  const k = summary.data?.minGroupSize ?? adoption.data?.minGroupSize ?? operations.data?.minGroupSize ?? 1;
  const sm = summary.data?.items;
  const registered = sm?.registeredStudents ?? 0;

  /** Tasa del resumen: null con alumnos por debajo del umbral = protegida; sin alumnos = sin base. */
  const rate = (v: number | null | undefined) => {
    if (v !== null && v !== undefined) return fmtPct(v);
    if (registered > 0) return <Protected k={k} />;
    return '—';
  };

  const funnel = adoption.data?.items.funnel ?? [];
  const weekly = adoption.data?.items.activeStudentsByWeek ?? [];
  const op = operations.data?.items;
  const consentBase = op?.consents[0]
    ? op.consents[0].granted + op.consents[0].revoked + op.consents[0].outdatedVersion + op.consents[0].noResponse
    : 0;

  return (
    <div className={pdf.dashboardContainer}>
      <SectionToolbar
        title="Resumen"
        subtitle="Uso de la plataforma, embudo de adopción y operación de grupos."
        usesPeriod
        usesWeeks
        generatedAt={latest(summary.data?.generatedAt, adoption.data?.generatedAt, operations.data?.generatedAt)}
        minGroupSize={k}
        reportSection="summary"
        extraActions={<FullReportButton />}
      />

      {/* Indicadores */}
      <Card
        title="Indicadores generales"
        subtitle="Cuentan a todos los alumnos registrados (cuenta activa)."
        n={sm ? `${fmtInt(registered)} registrados` : undefined}
        loading={summary.loading}
        error={summary.error}
        onRetry={summary.reload}
        wide
      >
        {sm && (
          <div className={s.kpiGrid}>
            <Kpi label="Alumnos registrados" value={fmtInt(registered)} />
            <Kpi label="Con análisis activado (ANALYTICS)" value={rate(sm.analyticsConsentRate)} gold />
            <Kpi label="Con tira de materias cargada" value={rate(sm.transcriptUploadedRate)} />
            <Kpi
              label="Grupos con profesor asignado"
              value={sm.sections.rate === null ? '—' : fmtPct(sm.sections.rate)}
              sub={`${fmtInt(sm.sections.withProfessor)} de ${fmtInt(sm.sections.total)} grupos`}
            />
            <Kpi
              label="Conversaciones esta semana"
              value={fmtInt(sm.conversationsThisWeek)}
              sub="Lunes a domingo, hora CDMX"
            />
          </div>
        )}
      </Card>

      <div className={pdf.twoColumnsRow}>
        <Card
          title="Embudo de adopción"
          subtitle="Cada paso se cuenta por separado sobre los alumnos registrados."
          n={funnel[0]?.count !== null && funnel[0] ? `${fmtInt(funnel[0].count!)} registrados` : undefined}
          loading={adoption.loading}
          error={adoption.error}
          onRetry={adoption.reload}
          empty={!!adoption.data && funnel.length === 0}
        >
          {adoption.data && funnel.length > 0 && (
            <HBarChart
              k={k}
              max={funnel[0]?.count ?? undefined}
              rows={funnel.map((f, i) => ({
                key: f.step,
                label: `${i + 1}. ${f.label}`,
                value: f.count,
                pct: f.rateOfRegistered,
              }))}
            />
          )}
        </Card>

        <Card
          title="Alumnos activos por semana"
          subtitle={`Iniciaron sesión o escribieron en el chat. Últimas ${filters.weeks} semanas.`}
          n={registered ? `${fmtInt(registered)} registrados` : undefined}
          loading={adoption.loading}
          error={adoption.error}
          onRetry={adoption.reload}
          empty={!!adoption.data && weekly.length === 0}
        >
          {adoption.data && weekly.length > 0 && (
            <LineChart
              k={k}
              data={weekly.map((w) => ({ key: w.week, label: fmtWeek(w.week), value: w.activeStudents }))}
            />
          )}
        </Card>
      </div>

      {/* Operación */}
      <div className={pdf.twoColumnsRow}>
        <Card
          title="Estado de las listas de grupo"
          subtitle="Lista confirmada = todos los alumnos no rechazados están confirmados."
          n={op ? `${fmtInt(op.sections.total)} grupos` : undefined}
          loading={operations.loading}
          error={operations.error}
          onRetry={operations.reload}
          empty={!!op && op.sections.total === 0}
          emptyText="No hay grupos registrados en este periodo."
        >
          {op && op.sections.total > 0 && (
            <>
              <Legend
                items={[
                  { label: 'Confirmada', color: COLORS.green },
                  { label: 'Pendiente de confirmar', color: COLORS.amber },
                  { label: 'Sin lista', color: COLORS.slate },
                ]}
              />
              <StackedBar
                k={k}
                segments={[
                  { label: 'Confirmada', value: op.sections.confirmed, color: COLORS.green },
                  { label: 'Pendiente de confirmar', value: op.sections.pendingConfirmation, color: COLORS.amber },
                  { label: 'Sin lista', value: op.sections.noList, color: COLORS.slate },
                ]}
              />
            </>
          )}
        </Card>

        <Card
          title="Profesores con cuenta"
          subtitle="Profesores activos del catálogo que ya pueden entrar a PumaIA."
          n={op ? `${fmtInt(op.professors.active)} profesores activos` : undefined}
          loading={operations.loading}
          error={operations.error}
          onRetry={operations.reload}
          empty={!!op && op.professors.active === 0}
          emptyText="No hay profesores activos en el catálogo."
        >
          {op && op.professors.active > 0 && (
            <div className={s.bigStat}>
              <div className={pdf.indicatorPrimaryValue}>
                {fmtInt(op.professors.withAccount)}
                <span className={s.bigStatOf}> de {fmtInt(op.professors.active)}</span>
              </div>
              <div className={pdf.barTrack}>
                <div className={pdf.barFill} style={{ width: `${op.professors.withAccountRate ?? 0}%` }} />
              </div>
              <p className={pdf.indicatorSubtext}>
                {op.professors.withAccountRate !== null && `${fmtPct(op.professors.withAccountRate)} con cuenta · `}
                {fmtInt(op.professors.withoutAccount)} sin cuenta
              </p>
            </div>
          )}
        </Card>
      </div>

      <Card
        title="Consentimientos por tipo"
        subtitle="Última decisión de cada alumno registrado frente a la versión vigente del aviso."
        n={op ? `${fmtInt(consentBase)} alumnos` : undefined}
        loading={operations.loading}
        error={operations.error}
        onRetry={operations.reload}
        empty={!!op && op.consents.length === 0}
        wide
      >
        {op && op.consents.length > 0 && (
          <>
            <Legend
              items={[
                { label: 'Otorgado', color: COLORS.green },
                { label: 'Retirado', color: COLORS.red },
                { label: 'Aceptó una versión anterior', color: COLORS.amber },
                { label: 'Sin decidir', color: COLORS.slate },
              ]}
            />
            <div className={s.rowsList}>
              {op.consents.map((c) => (
                <div key={c.kind} className={s.labeledRow}>
                  <span className={s.rowLabel}>
                    {CONSENT_LABEL[c.kind] ?? c.kind}
                    <span className={s.hint}>
                      {c.noticeVersion ? ` · aviso v${c.noticeVersion}` : ' · sin aviso publicado'}
                    </span>
                  </span>
                  <StackedBar
                    k={k}
                    segments={[
                      { label: 'Otorgado', value: c.granted, color: COLORS.green },
                      { label: 'Retirado', value: c.revoked, color: COLORS.red },
                      { label: 'Versión anterior', value: c.outdatedVersion, color: COLORS.amber },
                      { label: 'Sin decidir', value: c.noResponse, color: COLORS.slate },
                    ]}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <Notes notes={[...(summary.data?.notes ?? []), ...(adoption.data?.notes ?? []), ...(operations.data?.notes ?? [])]} />
      {!printing && <PrivacyFooter />}
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  gold,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  gold?: boolean;
}) {
  return (
    <div className={pdf.indicatorCard}>
      <div className={pdf.indicatorLabelRow}>
        <span className={pdf.indicatorLabel}>{label}</span>
      </div>
      <div className={`${pdf.indicatorPrimaryValue} ${gold ? pdf.indicatorPrimaryValueGold : ''} ${s.kpiValue}`}>
        {value}
      </div>
      {sub && <p className={pdf.indicatorSubtext}>{sub}</p>}
    </div>
  );
}

function FullReportButton() {
  const { printReport, reportBusy } = usePanel();
  return (
    <button type="button" className={s.btnGold} disabled={reportBusy} onClick={() => printReport('full')}>
      Generar reporte PDF
    </button>
  );
}

export function PrivacyFooter() {
  return (
    <footer className={pdf.privacyFooterNotice}>
      <div className={pdf.privacyFooterIcon} aria-hidden>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      </div>
      <ul className={pdf.privacyFooterList}>
        <li>
          <span className={pdf.bulletDot} />
          <span>Solo cifras agregadas; nunca listas ni nombres de alumnos</span>
        </li>
        <li>
          <span className={pdf.bulletDot} />
          <span>Cada gráfica indica su n</span>
        </li>
        <li>
          <span className={pdf.bulletDot} />
          <span>Sin ranking ni comparación de profesores</span>
        </li>
        <li>
          <span className={pdf.bulletDot} />
          <span>Cada consulta y reporte queda registrado en la bitácora</span>
        </li>
      </ul>
    </footer>
  );
}
