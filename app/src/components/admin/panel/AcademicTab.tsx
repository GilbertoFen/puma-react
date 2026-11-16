'use client';

import React, { useState } from 'react';
import pdf from '../AdminPdfDashboard.module.css';
import s from './AdminPanel.module.css';
import { adminService } from '../../../services/admin.service';
import { Banner, Card, Notes, SectionToolbar, latest, useAsync, usePanel } from './common';
import {
  COLORS,
  ColumnChart,
  HBarChart,
  Legend,
  LineChart,
  Protected,
  StackedBar,
  Val,
  fmtDec,
  fmtInt,
  fmtPct,
} from './charts';

const TOP_SUBJECTS = 15;

/** Académico = dashboard/performance + progress. */
export default function AcademicTab() {
  const { filters, printing } = usePanel();
  const perf = useAsync(() => adminService.performance(filters), [filters.periodId]);
  const progress = useAsync(() => adminService.progress(), []);
  const [showAll, setShowAll] = useState(false);

  const k = perf.data?.minGroupSize ?? progress.data?.minGroupSize ?? 1;
  const p = perf.data?.items;
  const failRows = p?.failRateBySubject ?? [];
  const visibleFail = showAll || printing ? failRows : failRows.slice(0, TOP_SUBJECTS);
  const histN = (p?.averageHistogram ?? []).reduce((a, b) => a + (b.students ?? 0), 0);
  const histProtected = (p?.averageHistogram ?? []).some((b) => b.students === null);
  const progRows = progress.data?.items ?? [];
  const progN = progRows.reduce((a, r) => a + (r.studentsWithTranscript ?? 0), 0);

  return (
    <div className={pdf.dashboardContainer}>
      <SectionToolbar
        title="Académico"
        subtitle="Reprobación, promedios, avance de créditos y recursamiento."
        usesPeriod
        generatedAt={latest(perf.data?.generatedAt, progress.data?.generatedAt)}
        minGroupSize={k}
        reportSection="academic"
      />

      <Banner tone="amber">
        <strong>Ojo:</strong> Los historiales cargados solo traen materias aprobadas; la reprobación y el recursamiento salen bajos.
      </Banner>

      <div className={pdf.twoColumnsRow}>
        <Card
          title="Reprobación por materia"
          subtitle="Sobre alumnos que terminaron la materia. De mayor a menor."
          n={p ? `${fmtInt(failRows.length)} materias` : undefined}
          loading={perf.loading}
          error={perf.error}
          onRetry={perf.reload}
          empty={!!p && failRows.length === 0}
          emptyText="No hay materias con suficientes alumnos que hayan terminado."
        >
          {p && failRows.length > 0 && (
            <>
              <HBarChart
                k={k}
                max={Math.max(10, ...failRows.map((r) => r.failRate))}
                fmt={fmtPct}
                rows={visibleFail.map((r) => ({
                  key: r.subjectId,
                  label: r.subjectName,
                  hint: `${r.semester ? `${r.semester}° sem · ` : ''}n = ${
                    r.completedStudents === null ? 'protegido' : fmtInt(r.completedStudents)
                  }`,
                  value: r.failRate,
                  color: COLORS.red,
                }))}
              />
              {!printing && failRows.length > TOP_SUBJECTS && (
                <button type="button" className={s.btnGhost} onClick={() => setShowAll((v) => !v)}>
                  {showAll ? `Ver solo las ${TOP_SUBJECTS} primeras` : `Ver las ${failRows.length} materias`}
                </button>
              )}
            </>
          )}
        </Card>

        <Card
          title="Distribución de promedios"
          subtitle="Promedio general de cada alumno registrado con promedio."
          n={p ? `${fmtInt(histN)} alumnos${histProtected ? ' + protegidos' : ''}` : undefined}
          loading={perf.loading}
          error={perf.error}
          onRetry={perf.reload}
          empty={!!p && histN === 0 && !histProtected}
        >
          {p && (histN > 0 || histProtected) && (
            <ColumnChart
              k={k}
              data={p.averageHistogram.map((b) => ({ key: b.bin, label: b.bin, value: b.students }))}
            />
          )}
        </Card>
      </div>

      <div className={pdf.twoColumnsRow}>
        <Card
          title="Promedio por periodo"
          subtitle="Solo inscripciones con periodo (las de la tira sin periodo no entran)."
          n={p ? `${fmtInt(p.averageByPeriod.length)} periodos` : undefined}
          loading={perf.loading}
          error={perf.error}
          onRetry={perf.reload}
          empty={!!p && p.averageByPeriod.length === 0}
          emptyText="No hay calificaciones con periodo registrado."
        >
          {p && p.averageByPeriod.length > 0 && (
            <>
              <LineChart
                k={k}
                yMax={10}
                fmt={(n) => fmtDec(n, 1)}
                data={p.averageByPeriod.map((r) => ({ key: r.periodId, label: r.period, value: r.averageGrade }))}
              />
              <div className={s.chipsRow}>
                {p.averageByPeriod.map((r) => (
                  <span key={r.periodId} className={s.chip}>
                    {r.period}: n = <Val v={r.students} k={k} short />
                  </span>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card
          title="Avance de créditos por semestre"
          subtitle="Créditos obtenidos frente a los esperados por el plan. Solo alumnos con tira; no depende del periodo."
          n={progress.data ? `${fmtInt(progN)} alumnos con tira` : undefined}
          loading={progress.loading}
          error={progress.error}
          onRetry={progress.reload}
          empty={!!progress.data && progRows.length === 0}
        >
          {progress.data && progRows.length > 0 && (
            <>
              <Legend
                items={[
                  { label: 'Al corriente (≥ 90 %)', color: COLORS.green },
                  { label: 'Rezago leve (70–90 %)', color: COLORS.amber },
                  { label: 'Rezago (< 70 %)', color: COLORS.red },
                ]}
              />
              <div className={s.rowsList}>
                {progRows.map((r) => (
                  <div key={r.semester} className={s.labeledRow}>
                    <span className={s.rowLabel}>
                      {r.semester}° semestre
                      <span className={s.hint}>
                        {' · n = '}
                        {r.studentsWithTranscript === null ? 'protegido' : fmtInt(r.studentsWithTranscript)}
                        {r.expectedCredits !== null && ` · esperados ${fmtInt(r.expectedCredits)} cr.`}
                        {r.averageEarnedCredits !== null && ` · promedio ${fmtDec(r.averageEarnedCredits, 0)} cr.`}
                        {' · sin tira: '}
                        {r.studentsWithoutTranscript === null ? 'protegido' : fmtInt(r.studentsWithoutTranscript)}
                      </span>
                    </span>
                    {r.suppressed ? (
                      <Protected k={k} />
                    ) : (
                      <StackedBar
                        k={k}
                        segments={[
                          { label: 'Al corriente', value: r.onTrack, color: COLORS.green },
                          { label: 'Rezago leve', value: r.slightDelay, color: COLORS.amber },
                          { label: 'Rezago', value: r.delay, color: COLORS.red },
                        ]}
                      />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <Card
        title="Materias con más recursamiento"
        subtitle="Alumnos con más de un intento en la misma materia (10 materias con más casos)."
        n={p ? `${fmtInt(p.mostRetaken.length)} materias` : undefined}
        loading={perf.loading}
        error={perf.error}
        onRetry={perf.reload}
        empty={!!p && p.mostRetaken.length === 0}
        emptyText="No se registra recursamiento con los historiales cargados."
        wide
      >
        {p && p.mostRetaken.length > 0 && (
          <table className={pdf.simpleTable}>
            <thead>
              <tr>
                <th>Materia</th>
                <th>Semestre</th>
                <th>Alumnos recursando</th>
              </tr>
            </thead>
            <tbody>
              {p.mostRetaken.map((r) => (
                <tr key={r.subjectId}>
                  <td className={pdf.subjectTextBold}>{r.subjectName}</td>
                  <td>{r.semester ? `${r.semester}°` : '—'}</td>
                  <td>
                    <Val v={r.studentsRetaking} k={k} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Notes notes={[...(perf.data?.notes ?? []), ...(progress.data?.notes ?? [])]} />
    </div>
  );
}
