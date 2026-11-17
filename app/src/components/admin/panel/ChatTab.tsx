'use client';

import React, { useState } from 'react';
import pdf from '../AdminPdfDashboard.module.css';
import s from './AdminPanel.module.css';
import { adminService } from '../../../services/admin.service';
import type { QuestionnaireItem, QuestionnaireKind, TopicGroup } from '../../../types/adminMetrics.types';
import { Banner, Card, Notes, SectionToolbar, useAsync, usePanel } from './common';
import {
  COLORS,
  ColumnChart,
  HBarChart,
  Legend,
  Protected,
  StackedBar,
  fmtDec,
  fmtInt,
  fmtPct,
  fmtWeek,
} from './charts';

export const PSYCH_SUPPORT_URL = 'https://www.acatlan.unam.mx/';

const GROUP_LABEL: Record<TopicGroup, string> = {
  PERMANENCIA: 'Permanencia',
  ACADEMICO: 'Académico',
  TRAMITES: 'Trámites',
  BIENESTAR: 'Bienestar',
  EMPLEABILIDAD: 'Empleabilidad',
  OTRO: 'Otro',
};

const KIND_LABEL: Record<QuestionnaireKind, string> = {
  ONBOARDING: 'Inicial (onboarding)',
  CHECK_IN: 'Seguimiento (check-in)',
  TERM_SURVEY: 'Fin de semestre',
};

/** Chat y cuestionarios = dashboard/chat + questionnaires. */
export default function ChatTab({ initialKind = 'ONBOARDING' }: { initialKind?: QuestionnaireKind }) {
  const { filters, printing } = usePanel();
  const [kind, setKind] = useState<QuestionnaireKind>(initialKind);
  const chat = useAsync(() => adminService.chat(filters), [filters.weeks]);
  const quest = useAsync(() => adminService.questionnaires(kind), [kind]);

  const k = chat.data?.minGroupSize ?? quest.data?.minGroupSize ?? 1;
  const it = chat.data?.items;
  // Bienestar no se cuantifica en el panel: esas conversaciones son sensibles.
  const groups = (it?.topicsByGroup ?? []).filter((g) => g.topicGroup !== 'BIENESTAR');
  const queries = it?.queriesByWeek ?? [];
  const queriesN = queries.reduce((a, q) => a + (q.queries ?? 0), 0);
  const fb = it?.feedback.total;
  const fbN = (fb?.useful ?? 0) + (fb?.notUseful ?? 0);
  const items = quest.data?.items ?? [];

  return (
    <div className={pdf.dashboardContainer}>
      <SectionToolbar
        title="Chat y cuestionarios"
        subtitle="Temas, consultas y utilidad del asistente; respuestas agregadas de cuestionarios."
        usesPeriod={false}
        usesWeeks
        generatedAt={chat.data?.generatedAt ?? quest.data?.generatedAt}
        minGroupSize={k}
        reportSection="chat"
        reportExtra={{ kind }}
      />

      <Banner tone="amber">
        Solo conversaciones no sensibles de alumnos con análisis activado.
        {it &&
          ` Etiquetadas: ${fmtInt(it.coverage.labeledConversations)} de ${fmtInt(
            it.coverage.eligibleConversations,
          )} conversaciones elegibles${
            it.coverage.labeledRate !== null ? ` (${fmtPct(it.coverage.labeledRate)})` : ''
          }.`}
      </Banner>

      <div className={pdf.twoColumnsRow}>
        <Card
          title="Temas por grupo"
          subtitle="Conversaciones distintas por tema. Una conversación puede tener varios temas."
          n={it ? `${fmtInt(it.coverage.labeledConversations)} conversaciones etiquetadas` : undefined}
          loading={chat.loading}
          error={chat.error}
          onRetry={chat.reload}
          empty={!!it && groups.every((g) => g.topics.length === 0)}
          emptyText="Todavía no hay conversaciones etiquetadas."
        >
          {it && groups.some((g) => g.topics.length > 0) && (
            <div className={s.rowsList}>
              {groups
                .filter((g) => g.topics.length > 0)
                .map((g) => (
                  <div key={g.topicGroup} className={s.topicGroup}>
                    <div className={s.topicGroupHead}>
                      <span>{GROUP_LABEL[g.topicGroup] ?? g.topicGroup}</span>
                      <span className={s.hint}>
                        {g.conversations === null ? <Protected k={k} short /> : `${fmtInt(g.conversations)} conv.`}
                      </span>
                    </div>
                    <HBarChart
                      k={k}
                      rows={g.topics.map((t) => ({ key: t.topicCode, label: t.label, value: t.conversations }))}
                    />
                  </div>
                ))}
            </div>
          )}
          <div className={s.supportLinkRow}>
            <span className={s.muted}>Bienestar no se cuantifica en este panel.</span>
            <a href={PSYCH_SUPPORT_URL} target="_blank" rel="noopener noreferrer" className={pdf.wellbeingLinkBtn}>
              Atención psicológica · FES Acatlán
            </a>
          </div>
        </Card>

        <div className={s.stackCol}>
          <Card
            title="Consultas por semana"
            subtitle={`Mensajes enviados por alumnos. Últimas ${filters.weeks} semanas.`}
            n={it ? `${fmtInt(queriesN)} consultas` : undefined}
            loading={chat.loading}
            error={chat.error}
            onRetry={chat.reload}
            empty={!!it && queries.every((q) => q.queries === 0)}
            emptyText="No hubo consultas en estas semanas."
          >
            {it && queries.some((q) => q.queries !== 0) && (
              <ColumnChart
                k={k}
                height={130}
                data={queries.map((q) => ({ key: q.week, label: fmtWeek(q.week), value: q.queries }))}
              />
            )}
          </Card>

          <Card
            title="¿Le sirvió la respuesta?"
            subtitle="Calificaciones de los alumnos a las respuestas del asistente."
            n={fb && fb.useful !== null ? `${fmtInt(fbN)} calificaciones` : undefined}
            loading={chat.loading}
            error={chat.error}
            onRetry={chat.reload}
            empty={!!fb && fb.useful !== null && fbN === 0}
            emptyText="Todavía no hay calificaciones."
          >
            {fb && (fb.useful === null || fbN > 0) && (
              <>
                <Legend
                  items={[
                    { label: 'Útil', color: COLORS.green },
                    { label: 'No útil', color: COLORS.red },
                  ]}
                />
                <StackedBar
                  k={k}
                  segments={[
                    { label: 'Útil', value: fb.useful, color: COLORS.green },
                    { label: 'No útil', value: fb.notUseful, color: COLORS.red },
                  ]}
                />
                {fb.usefulRate !== null && (
                  <p className={pdf.indicatorSubtext}>{fmtPct(fb.usefulRate)} útil</p>
                )}
              </>
            )}
          </Card>
        </div>
      </div>

      {/* Cuestionarios */}
      <Card
        title="Cuestionarios"
        subtitle="Se cuenta solo el envío más reciente de cada alumno. El texto libre no se muestra."
        loading={quest.loading}
        error={quest.error}
        onRetry={quest.reload}
        empty={!!quest.data && items.length === 0}
        emptyText="Este cuestionario no tiene preguntas activas o respuestas."
        wide
      >
        {!printing ? (
          <label className={s.inlineField}>
            <span>Tipo de cuestionario</span>
            <select className={s.select} value={kind} onChange={(e) => setKind(e.target.value as QuestionnaireKind)}>
              {(Object.keys(KIND_LABEL) as QuestionnaireKind[]).map((kk) => (
                <option key={kk} value={kk}>
                  {KIND_LABEL[kk]}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className={pdf.cardSubtitle}>Cuestionario: {KIND_LABEL[kind]}</p>
        )}
        {items.length > 0 && (
          <div className={s.questionGrid}>
            {items.map((q) => (
              <QuestionBlock key={`${q.questionnaireVersion}-${q.questionCode}`} q={q} k={k} />
            ))}
          </div>
        )}
      </Card>

      <Notes notes={[...(chat.data?.notes ?? []), ...(quest.data?.notes ?? [])]} />
    </div>
  );
}

function QuestionBlock({ q, k }: { q: QuestionnaireItem; k: number }) {
  const head = (
    <div className={pdf.cardHeader}>
      <div>
        <p className={s.questionText}>{q.text}</p>
        <p className={pdf.cardSubtitle}>
          {q.category ? `${q.category} · ` : ''}v{String(q.questionnaireVersion)}
        </p>
      </div>
      {!q.suppressed && q.respondents !== null && (
        <span className={pdf.badgeSampleN}>n = {fmtInt(q.respondents)}</span>
      )}
    </div>
  );

  if (q.suppressed || q.respondents === null) {
    return (
      <div className={s.questionBox}>
        {head}
        <Protected k={k} />
      </div>
    );
  }

  if (q.type === 'TEXT') {
    return (
      <div className={s.questionBox}>
        {head}
        <p className={s.muted}>
          {fmtInt(q.respondents)} respuestas de texto libre · el texto no se muestra.
        </p>
      </div>
    );
  }

  const dist = q.optionDistribution ?? [];
  return (
    <div className={s.questionBox}>
      {head}
      {q.type === 'SCALE' && (
        <div className={s.scaleAvg}>
          Promedio:{' '}
          {q.averageScale === null ? <Protected k={k} /> : <strong>{fmtDec(q.averageScale, 2)}</strong>}
        </div>
      )}
      {dist.length > 0 && (
        <HBarChart
          k={k}
          max={q.respondents}
          rows={dist.map((o) => ({
            key: o.value,
            label: q.type === 'SCALE' ? `${o.value} · ${o.optionLabel}` : o.optionLabel,
            value: o.count,
            pct: o.count === null || !q.respondents ? null : (o.count / q.respondents) * 100,
          }))}
        />
      )}
      {q.type === 'MULTI_CHOICE' && <p className={s.chartFootnote}>Opción múltiple: los porcentajes pueden sumar más de 100 %.</p>}
    </div>
  );
}
