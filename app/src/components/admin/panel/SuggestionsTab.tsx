'use client';

import React, { useState } from 'react';
import pdf from '../AdminPdfDashboard.module.css';
import s from './AdminPanel.module.css';
import { Banner, SectionToolbar, usePanel } from './common';
import {
  SUGGESTIONS_MOCK,
  type Suggestion,
  type SuggestionPriority,
  type SuggestionSource,
  type SuggestionTab,
} from './suggestionsMock';

const PRIORITY: Record<SuggestionPriority, { label: string; cls: string }> = {
  ALTA: { label: 'Prioridad alta', cls: s.prioHigh },
  MEDIA: { label: 'Prioridad media', cls: s.prioMid },
  BAJA: { label: 'Prioridad baja', cls: s.prioLow },
};
const SOURCE: Record<SuggestionSource, string> = {
  TEMAS: 'Fuente: temas del chat',
  RENDIMIENTO: 'Fuente: rendimiento',
  ASISTENCIA: 'Fuente: asistencia',
};

/** Sugerencias: VISTA PREVIA con datos de ejemplo (ver suggestionsMock.ts). */
export default function SuggestionsTab({ onGoTo }: { onGoTo?: (tab: SuggestionTab) => void }) {
  const { printing } = usePanel();
  const [feedback, setFeedback] = useState<Record<string, 'useful' | 'na'>>({});

  return (
    <div className={pdf.dashboardContainer}>
      <SectionToolbar
        title="Sugerencias"
        subtitle="Acciones institucionales propuestas a partir de cifras agregadas."
        usesPeriod={false}
        generatedAt={null}
        reportSection="suggestions"
      />

      <Banner tone="purple">
        Vista previa con datos de ejemplo. Las sugerencias se generarán con conteos agregados del panel; la IA no lee
        conversaciones ni ve datos de alumnos.
      </Banner>

      <div className={s.suggestionGrid}>
        {SUGGESTIONS_MOCK.map((sg) => (
          <SuggestionCard
            key={sg.id}
            sg={sg}
            printing={printing}
            value={feedback[sg.id]}
            onFeedback={(v) => setFeedback((f) => ({ ...f, [sg.id]: v }))}
            onGoTo={onGoTo}
          />
        ))}
      </div>
      {!printing && (
        <p className={s.muted}>
          “Útil” y “No aplica” solo se recuerdan en esta pantalla mientras las sugerencias sean de ejemplo.
        </p>
      )}
    </div>
  );
}

function SuggestionCard({
  sg,
  printing,
  value,
  onFeedback,
  onGoTo,
}: {
  sg: Suggestion;
  printing: boolean;
  value?: 'useful' | 'na';
  onFeedback: (v: 'useful' | 'na') => void;
  onGoTo?: (tab: SuggestionTab) => void;
}) {
  return (
    <article className={`${pdf.cardBox} ${s.card} ${value === 'na' ? s.dimmed : ''}`}>
      <div className={s.chipsRow}>
        <span className={`${s.prio} ${PRIORITY[sg.priority].cls}`}>{PRIORITY[sg.priority].label}</span>
        <span className={s.chip}>{SOURCE[sg.source]}</span>
        <span className={s.chipMock}>Ejemplo</span>
      </div>
      <h3 className={pdf.cardTitle}>{sg.title}</h3>
      <div>
        <span className={s.notesTitle}>Evidencia</span>
        <ul className={s.notesList}>
          {sg.evidence.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      </div>
      <div>
        <span className={s.notesTitle}>Acción sugerida</span>
        <p className={s.actionText}>{sg.action}</p>
      </div>
      {!printing && (
        <div className={s.btnRow}>
          <button
            type="button"
            className={value === 'useful' ? s.btnGold : s.btnGhost}
            aria-pressed={value === 'useful'}
            onClick={() => onFeedback('useful')}
          >
            Útil
          </button>
          <button
            type="button"
            className={value === 'na' ? s.btnGold : s.btnGhost}
            aria-pressed={value === 'na'}
            onClick={() => onFeedback('na')}
          >
            No aplica
          </button>
          {onGoTo && (
            <button type="button" className={s.btnGhost} onClick={() => onGoTo(sg.dataTab)}>
              Ver datos
            </button>
          )}
        </div>
      )}
    </article>
  );
}
