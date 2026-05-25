'use client';
import React, { useState } from 'react';
import type { QuestionnaireAnswer } from '../../types/shared.types';
import styles from './Sections.module.css';
import ExtraDataForm from './ExtraDataForm';
import { questionnaireService } from '../../services/questionnarie.service'; 

type Props = {
  answers: QuestionnaireAnswer[];
  onUpdateAnswer: (id: string, newAnswer: string) => void; 
};
const getDraftString = (answer: any): string => {
  if (!answer) return '';
  if (typeof answer === 'string') return answer;
  if (Array.isArray(answer)) return answer.join(', ');
  if (typeof answer === 'object') {
    return `${answer.answer} ${answer.exp ? `- Experiencia: ${answer.exp}` : ''}`;
  }
  return '';
};

export default function QuestionnaireSection({ answers, onUpdateAnswer }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false); // Estado para evitar doble click

  const startEdit = (id: string, current: any) => {
    // 🔥 CORRECCIÓN: Usamos getDraftString para que la textarea no explote con objetos/arrays
    setDrafts((prev) => ({ ...prev, [id]: getDraftString(current) }));
    setEditing(id);
  };

  const cancelEdit = () => setEditing(null);

  const saveEdit = async (id: string) => {
    const newAnswer = drafts[id];
    if (!newAnswer || newAnswer.trim() === '') return cancelEdit();

    setSaving(true);
    try {
      // 1. Mandamos SOLO la pregunta modificada al backend
      // El servicio la convertirá en { id, category, value } y el backend hará un upsert perfecto
      await questionnaireService.saveAnswers({ [id]: newAnswer });

      // 2. Avisamos al padre (UpdateInfoPage) para que actualice la UI al instante
      onUpdateAnswer(id, newAnswer);

      // 3. Cerramos el modo edición
      setEditing(null);
    } catch (error) {
      console.error('Error al guardar la respuesta:', error);
      alert('No se pudo guardar la modificación.');
    } finally {
      setSaving(false);
    }
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
