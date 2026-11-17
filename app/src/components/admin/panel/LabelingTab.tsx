'use client';

import React, { useMemo, useState } from 'react';
import pdf from '../AdminPdfDashboard.module.css';
import s from './AdminPanel.module.css';
import { adminService } from '../../../services/admin.service';
import type { LabelingTopic, TopicGroup } from '../../../types/adminMetrics.types';
import { Banner, Card, useAsync } from './common';
import { fmtDateTime, fmtInt } from './charts';

const MAX_TOPICS = 5;
const GROUP_LABEL: Record<TopicGroup, string> = {
  PERMANENCIA: 'Permanencia',
  ACADEMICO: 'Académico',
  TRAMITES: 'Trámites',
  BIENESTAR: 'Bienestar',
  EMPLEABILIDAD: 'Empleabilidad',
  OTRO: 'Otro',
};

/**
 * Etiquetado manual de temas (solo ANALYST, /metrics/labeling).
 * El backend no manda nombre, correo, número de cuenta, grupo ni semestre.
 * Si por el contenido se reconoce a la persona, se salta (queda en la bitácora).
 */
export default function LabelingTab() {
  const topics = useAsync(() => adminService.labelingTopics(), []);
  const queue = useAsync(() => adminService.labelingQueue(10), []);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const remaining = (queue.data?.conversations ?? []).filter((c) => !done.has(c.id));
  const current = remaining[0] ?? null;
  const pending = queue.data ? Math.max(0, queue.data.pending - done.size) : null;

  const grouped = useMemo(() => {
    const m = new Map<TopicGroup, LabelingTopic[]>();
    for (const t of topics.data ?? []) {
      if (!m.has(t.topicGroup)) m.set(t.topicGroup, []);
      m.get(t.topicGroup)!.push(t);
    }
    return [...m.entries()];
  }, [topics.data]);

  const next = (id: string, msg: string) => {
    setDone((d) => new Set(d).add(id));
    setSelected([]);
    setLastAction(msg);
    if (remaining.length <= 1) {
      setDone(new Set());
      queue.reload();
    }
  };

  const toggle = (id: string) =>
    setSelected((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= MAX_TOPICS ? cur : [...cur, id],
    );

  const save = async () => {
    if (!current || selected.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      await adminService.addLabels(current.id, selected);
      next(current.id, 'Etiquetas guardadas.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron guardar las etiquetas.');
    } finally {
      setBusy(false);
    }
  };

  const skip = async () => {
    if (!current) return;
    setBusy(true);
    setError(null);
    try {
      await adminService.skipConversation(current.id);
      next(current.id, 'Conversación saltada. No se te volverá a mostrar.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo saltar la conversación.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={pdf.dashboardContainer}>
      <div className={pdf.periodHeaderCard}>
        <div className={pdf.periodTitleWrap}>
          <h2 className={pdf.mainDashboardTitle}>Etiquetado de temas</h2>
          <p className={pdf.mainDashboardSubtitle}>
            Conversaciones no sensibles de alumnos con análisis activado, sin nombre, correo, número de cuenta, grupo ni
            semestre.
          </p>
        </div>
        {pending !== null && <span className={pdf.periodPill}>{fmtInt(pending)} pendientes</span>}
      </div>

      <Banner tone="amber">
        Si por lo que escribe reconoces a la persona, no la etiquetes: usa “Saltar: reconozco a la persona”. Este
        contenido no se imprime ni se copia fuera de esta pantalla.
      </Banner>

      <div className={pdf.twoColumnsRow}>
        <Card
          title="Conversación"
          subtitle={current ? `Iniciada el ${fmtDateTime(current.createdAt)}` : undefined}
          loading={queue.loading}
          error={queue.error}
          onRetry={queue.reload}
          empty={!!queue.data && !current}
          emptyText="No hay conversaciones pendientes por etiquetar."
        >
          {current && (
            <div className={s.chatLog}>
              {current.messages.map((m, i) => (
                <div key={i} className={m.role === 'USER' ? s.msgUser : s.msgBot}>
                  <span className={s.msgRole}>{m.role === 'USER' ? 'Alumno' : 'Asistente'}</span>
                  <p>{m.content}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          title="Tema"
          subtitle={`Elige de 1 a ${MAX_TOPICS} temas.`}
          loading={topics.loading}
          error={topics.error}
          onRetry={topics.reload}
          empty={!!topics.data && topics.data.length === 0}
          emptyText="No hay temas activos en el catálogo."
        >
          {topics.data && topics.data.length > 0 && (
            <>
              <div className={s.rowsList}>
                {grouped.map(([g, list]) => (
                  <fieldset key={g} className={s.fieldset}>
                    <legend>{GROUP_LABEL[g] ?? g}</legend>
                    <div className={s.topicChips}>
                      {list.map((t) => (
                        <label key={t.id} className={`${s.candidate} ${selected.includes(t.id) ? s.candidateOn : ''}`}>
                          <input
                            type="checkbox"
                            checked={selected.includes(t.id)}
                            onChange={() => toggle(t.id)}
                            disabled={!current || busy}
                          />
                          <span>{t.label}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>
              {error && <p className={s.inlineError} role="alert">{error}</p>}
              {lastAction && !error && <p className={s.inlineSuccess} role="status">{lastAction}</p>}
              <div className={s.btnRow}>
                <button
                  type="button"
                  className={s.btnGold}
                  onClick={save}
                  disabled={!current || selected.length === 0 || busy}
                >
                  Guardar
                </button>
                <button type="button" className={s.btnGhost} onClick={skip} disabled={!current || busy}>
                  Saltar: reconozco a la persona
                </button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
