'use client';

import React from 'react';
import pdf from '../AdminPdfDashboard.module.css';
import s from './AdminPanel.module.css';
import { adminService } from '../../../services/admin.service';
import type { AttendanceRates } from '../../../types/adminMetrics.types';
import { Banner, Card, Notes, SectionToolbar, useAsync, usePanel } from './common';
import { COLORS, Legend, LineChart, Protected, StackedBar, Val, fmtInt, fmtPct, fmtWeek } from './charts';

const ATT_LEGEND = [
  { label: 'Presente', color: COLORS.green },
  { label: 'Tarde', color: COLORS.amber },
  { label: 'Justificada', color: COLORS.blue },
  { label: 'Falta', color: COLORS.red },
];

/** Asistencia = dashboard/attendance. Por grupo, sin profesor y en orden alfabético por materia. */
export default function AttendanceTab() {
  const { filters } = usePanel();
  const att = useAsync(() => adminService.attendance(filters), [filters.periodId, filters.weeks]);
  const k = att.data?.minGroupSize ?? 1;
  const it = att.data?.items;
  const byWeek = it?.byWeek ?? [];
  // El back ya ordena por materia y grupo; se re-ordena aquí para garantizarlo (nunca por profesor ni desempeño).
  const bySection = [...(it?.bySection ?? [])].sort(
    (a, b) => a.subject.localeCompare(b.subject, 'es') || a.groupCode.localeCompare(b.groupCode, 'es'),
  );
  const weekRecords = byWeek.reduce((a, w) => a + (w.records ?? 0), 0);
  const hasWeekData = byWeek.some((w) => w.students !== 0);

  return (
    <div className={pdf.dashboardContainer}>
      <SectionToolbar
        title="Asistencia"
        subtitle="Registro por QR en sesiones cerradas. Indicativo: no prueba presencia física."
        usesPeriod
        usesWeeks
        generatedAt={att.data?.generatedAt}
        minGroupSize={k}
        reportSection="attendance"
      />

      <Banner tone="info">
        Uso para sugerir medidas institucionales; no es evaluación de profesores ni de alumnos. Los grupos van en orden
        alfabético por materia y no se muestra quién imparte cada uno.
      </Banner>

      <Card
        title="Asistencia semanal global"
        subtitle={`% de registros “presente” por semana. Últimas ${filters.weeks} semanas.`}
        n={it ? `${fmtInt(weekRecords)} registros` : undefined}
        loading={att.loading}
        error={att.error}
        onRetry={att.reload}
        empty={!!it && !hasWeekData}
        emptyText="No hay sesiones cerradas en estas semanas."
        wide
      >
        {it && hasWeekData && (
          <LineChart
            k={k}
            yMax={100}
            fmt={(n) => `${Math.round(n)} %`}
            color={COLORS.green}
            data={byWeek.map((w) => ({
              key: w.week,
              label: fmtWeek(w.week),
              value: w.students === null ? null : w.presentRate,
              noData: w.students === 0,
            }))}
          />
        )}
      </Card>

      <Card
        title="Asistencia por grupo"
        subtitle="Todo el periodo filtrado. Orden alfabético por materia y grupo."
        n={it ? `${fmtInt(bySection.length)} grupos` : undefined}
        loading={att.loading}
        error={att.error}
        onRetry={att.reload}
        empty={!!it && bySection.length === 0}
        emptyText="No hay registros de asistencia en sesiones cerradas para este periodo."
        wide
      >
        {it && bySection.length > 0 && (
          <>
            <Legend items={ATT_LEGEND} />
            <div className={s.tableScroll}>
              <table className={pdf.simpleTable}>
                <thead>
                  <tr>
                    <th>Materia</th>
                    <th>Grupo</th>
                    <th>Sesiones</th>
                    <th>Alumnos</th>
                    <th className={s.colStack}>Presente · tarde · justificada · falta</th>
                    <th>% presente</th>
                  </tr>
                </thead>
                <tbody>
                  {bySection.map((r) => (
                    <tr key={r.sectionId}>
                      <td className={pdf.subjectTextBold}>{r.subject}</td>
                      <td>{r.groupCode}</td>
                      <td>{fmtInt(r.sessions)}</td>
                      <td>
                        <Val v={r.students} k={k} short />
                      </td>
                      <td className={s.colStack}>
                        <AttendanceStack r={r} k={k} />
                      </td>
                      <td>
                        {r.students === null ? (
                          <Protected k={k} />
                        ) : r.presentRate === null ? (
                          '—'
                        ) : (
                          <span className={pdf.rateNumber}>{fmtPct(r.presentRate)}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {it && it.openSessionsExcluded > 0 && (
        <p className={s.muted}>
          {fmtInt(it.openSessionsExcluded)} sesiones siguen abiertas y no se cuentan hasta que se cierren.
        </p>
      )}
      <Notes notes={att.data?.notes} />
    </div>
  );
}

function AttendanceStack({ r, k }: { r: AttendanceRates; k: number }) {
  if (r.students === null) return <Protected k={k} />;
  if (!r.records) return <span className={s.muted}>Sin registros</span>;
  return (
    <StackedBar
      k={k}
      isPercent
      showValues={false}
      segments={[
        { label: 'Presente', value: r.presentRate, color: COLORS.green },
        { label: 'Tarde', value: r.lateRate, color: COLORS.amber },
        { label: 'Justificada', value: r.excusedRate, color: COLORS.blue },
        { label: 'Falta', value: r.absentRate, color: COLORS.red },
      ]}
    />
  );
}
