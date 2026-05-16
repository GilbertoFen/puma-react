'use client';
import React, { useState } from 'react';
import type { QuestionnaireAnswer } from '../../types/shared.types';
import styles from './Sections.module.css';
import ExtraDataForm from './ExtraDataForm';

type Props = {
  answers: QuestionnaireAnswer[];
};
const getDraftString = (answer: any): string => {
  if (!answer) return '';
  if (typeof answer === 'string') return answer;
  if (Array.isArray(answer)) return answer.join(', ');
  if (typeof answer === 'object') {
    // Si es tipo branch condicional, mostramos la opción elegida y la experiencia guardada
    return `${answer.answer} ${answer.exp ? ` - Experiencia: ${answer.exp}` : ''}`;
  }
  return '';
};

export default function QuestionnaireSection({ answers }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const startEdit = (id: string, current: any) => {
    setDrafts((prev) => ({ ...prev, [id]: current }));
    setEditing(id);
  };

  const cancelEdit = () => setEditing(null);

  const saveEdit = (id: string) => {
    // TODO: llamada a API posterior para guardar modificaciones individuales si se requiere
    console.log('Guardar respuesta', id, drafts[id]);
    setEditing(null);
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Mis respuestas del cuestionario</h2>
        <p className={styles.sectionDesc}>
          Estas son las respuestas que diste al inicio. Puedes editarlas en cualquier momento
          para que el análisis de PumaIA sea más preciso.
        </p>
      </div>

      <div className={styles.cardList}>
        {answers.map((item) => (
          <div key={item.questionId} className={styles.answerCard}>
            <p className={styles.question}>{item.question}</p>

            {editing === item.questionId ? (
              <div className={styles.editBlock}>
                <textarea
                  className={styles.editArea}
                  value={drafts[item.questionId] ?? ''}
                  onChange={(e) =>
                    setDrafts((prev) => ({ ...prev, [item.questionId]: e.target.value }))
                  }
                  rows={3}
                  autoFocus
                />
                <div className={styles.editActions}>
                  <button className={styles.cancelBtn} onClick={cancelEdit}>Cancelar</button>
                  <button className={styles.saveBtn} onClick={() => saveEdit(item.questionId)}>
                    <CheckIcon /> Guardar
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.answerRow}>
                <div className={styles.answerValue}>
                  {/* 2. BLINDAJE DE RENDERIZADO SEGÚN TIPO DE DATO REAL */}
                  {Array.isArray(item.answer) ? (
                    item.answer.map((a) => (
                      <span key={a} className={styles.chip}>{a}</span>
                    ))
                  ) : typeof item.answer === 'object' && item.answer !== null ? (
                    (() => {
                      const branchObj = item.answer as any;
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span className={styles.answerText}>
                            <strong>¿Tiene experiencia?:</strong> {branchObj.answer}
                          </span>
                          {branchObj.exp && (
                            <span className={styles.answerText} style={{ opacity: 0.8, fontSize: '0.9em' }}>
                              <strong>Detalle:</strong> {branchObj.exp}
                            </span>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    // Texto estándar
                    <span className={styles.answerText}>{item.answer}</span>
                  )}
                </div>

                <button
                  className={styles.editBtn}
                  onClick={() => startEdit(item.questionId, item.answer)}
                  title="Editar respuesta"
                >
                  <EditIcon />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <button className={styles.redoBtn}>
        <RefreshIcon /> Responder el cuestionario completo de nuevo
      </button>
      <ExtraDataForm />
    </div>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}
