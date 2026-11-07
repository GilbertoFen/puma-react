'use client';
import React, { useState } from 'react';
import type { QuestionnaireAnswer } from '../../types/shared.types';
import styles from './Sections.module.css';
import ExtraDataForm from './ExtraDataForm';
import { questionnaireService } from '../../services/questionnarie.service';
import { QUESTIONS, QuestionDef } from '../../utils/questions';

type Props = {
  answers: QuestionnaireAnswer[];
  onUpdateAnswer: (id: string, newAnswer: any) => void;
};

export default function QuestionnaireSection({ answers, onUpdateAnswer }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  // Mapeo rápido de definiciones por id de pregunta
  const questionsMap = React.useMemo(() => {
    const map = new Map<string, QuestionDef>();
    for (const q of QUESTIONS) {
      map.set(q.id, q);
    }
    return map;
  }, []);

  const startEdit = (id: string, current: any) => {
    const qDef = questionsMap.get(id);
    let initialVal = current;

    if (qDef?.type === 'multi') {
      if (!Array.isArray(initialVal)) {
        initialVal = initialVal && initialVal !== 'Sin responder' ? [initialVal] : [];
      }
    } else if (qDef?.type === 'branch') {
      if (typeof initialVal !== 'object' || initialVal === null) {
        initialVal = { answer: initialVal === 'No' ? 'No' : 'Sí', exp: '' };
      }
    } else if (qDef?.type === 'choice' || qDef?.type === 'text') {
      if (typeof initialVal !== 'string') {
        initialVal = initialVal ? String(initialVal) : '';
      }
    }

    setDrafts((prev) => ({ ...prev, [id]: initialVal }));
    setEditing(id);
  };

  const cancelEdit = () => setEditing(null);

  const saveEdit = async (id: string) => {
    const draftVal = drafts[id];
    setSaving(true);
    try {
      await questionnaireService.updateAnswers({ [id]: draftVal });
      onUpdateAnswer(id, draftVal);
      setEditing(null);
    } catch (error) {
      console.error('Error al guardar la respuesta:', error);
      alert('No se pudo guardar la modificación.');
    } finally {
      setSaving(false);
    }
  };

  // Manejador para preguntas de opción múltiple con varias respuestas (multi-choice)
  const handleToggleMulti = (id: string, opt: string, qDef: QuestionDef) => {
    const currentList: string[] = Array.isArray(drafts[id]) ? [...drafts[id]] : [];
    const exclusive = qDef.props.exclusiveOption;
    const maxSelect = qDef.props.maxSelect;

    let updated: string[];
    if (currentList.includes(opt)) {
      updated = currentList.filter((item) => item !== opt);
    } else {
      if (exclusive && opt === exclusive) {
        updated = [opt];
      } else {
        const withoutExclusive = exclusive ? currentList.filter((item) => item !== exclusive) : currentList;
        if (maxSelect && withoutExclusive.length >= maxSelect) {
          // Si ya alcanzó el máximo, no agregar más
          return;
        }
        updated = [...withoutExclusive, opt];
      }
    }
    setDrafts((prev) => ({ ...prev, [id]: updated }));
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Mis respuestas del cuestionario</h2>
        <p className={styles.sectionDesc}>
          Estas son las respuestas que diste al inicio. Puedes editarlas en cualquier momento
          respetando su formato original para que el análisis de PumaIA sea más preciso.
        </p>
      </div>

      <div className={styles.cardList}>
        {answers.map((item) => {
          const qDef = questionsMap.get(item.questionId);
          const isEditingThis = editing === item.questionId;
          const currentDraft = drafts[item.questionId];

          return (
            <div key={item.questionId} className={styles.answerCard}>
              <p className={styles.question}>{qDef?.question || item.question}</p>

              {isEditingThis ? (
                <div className={styles.editBlock}>
                  {/* RENDERIZADO DINÁMICO SEGÚN EL TIPO DE PREGUNTA ORIGINAL */}

                  {/* 1. OPCIÓN MÚLTIPLE DE RESPUESTA ÚNICA (choice) */}
                  {qDef?.type === 'choice' && (
                    <div className={styles.optionsGrid}>
                      {(qDef.props.options || []).map((opt) => {
                        const isSelected = currentDraft === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            className={`${styles.optionBtn} ${isSelected ? styles.optionBtnSelected : ''}`}
                            onClick={() => setDrafts((prev) => ({ ...prev, [item.questionId]: opt }))}
                          >
                            <span
                              className={`${styles.optionRadio} ${isSelected ? styles.optionRadioSelected : ''}`}
                            />
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* 2. OPCIÓN MÚLTIPLE DE VARIAS RESPUESTAS (multi) */}
                  {qDef?.type === 'multi' && (
                    <div>
                      {qDef.props.maxSelect && (
                        <p style={{ fontSize: '11.5px', color: '#c9a84c', marginBottom: '6px' }}>
                          Selecciona hasta {qDef.props.maxSelect} opciones
                        </p>
                      )}
                      <div className={styles.multiChipsWrap}>
                        {(qDef.props.options || []).map((opt) => {
                          const isSelected = Array.isArray(currentDraft) && currentDraft.includes(opt);
                          return (
                            <button
                              key={opt}
                              type="button"
                              className={`${styles.multiChipBtn} ${isSelected ? styles.multiChipBtnActive : ''}`}
                              onClick={() => handleToggleMulti(item.questionId, opt, qDef)}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3. PREGUNTA RAMIFICADA (branch: Sí/No + detalles) */}
                  {qDef?.type === 'branch' && (
                    <div>
                      <div className={styles.branchRow}>
                        <button
                          type="button"
                          className={`${styles.branchBtn} ${currentDraft?.answer === 'No' ? styles.branchBtnActive : ''}`}
                          onClick={() =>
                            setDrafts((prev) => ({
                              ...prev,
                              [item.questionId]: { answer: 'No', exp: '' },
                            }))
                          }
                        >
                          No
                        </button>
                        <button
                          type="button"
                          className={`${styles.branchBtn} ${currentDraft?.answer === 'Sí' ? styles.branchBtnActive : ''}`}
                          onClick={() =>
                            setDrafts((prev) => ({
                              ...prev,
                              [item.questionId]: {
                                answer: 'Sí',
                                exp: currentDraft?.exp || '',
                              },
                            }))
                          }
                        >
                          Sí
                        </button>
                      </div>

                      {currentDraft?.answer === 'Sí' && (
                        <div className={styles.branchExtraArea}>
                          <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                            Detalle de proyectos o tecnologías:
                          </label>
                          <textarea
                            className={styles.editArea}
                            placeholder="Ej: Python, React, hackatón UNAM, proyectos personales..."
                            value={currentDraft?.exp ?? ''}
                            onChange={(e) =>
                              setDrafts((prev) => ({
                                ...prev,
                                [item.questionId]: {
                                  ...currentDraft,
                                  exp: e.target.value,
                                },
                              }))
                            }
                            rows={2}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4. PREGUNTA ABIERTA O TEXTO LIBRE (text / default) */}
                  {(!qDef || qDef.type === 'text' || qDef.type === 'input_list') && (
                    <textarea
                      className={styles.editArea}
                      value={typeof currentDraft === 'string' ? currentDraft : JSON.stringify(currentDraft || '')}
                      onChange={(e) =>
                        setDrafts((prev) => ({ ...prev, [item.questionId]: e.target.value }))
                      }
                      rows={3}
                      autoFocus
                    />
                  )}

                  <div className={styles.editActions}>
                    <button className={styles.cancelBtn} onClick={cancelEdit} disabled={saving}>
                      Cancelar
                    </button>
                    <button
                      className={styles.saveBtn}
                      onClick={() => saveEdit(item.questionId)}
                      disabled={saving}
                    >
                      <CheckIcon /> {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.answerRow}>
                  <div className={styles.answerValue}>
                    {Array.isArray(item.answer) ? (
                      item.answer.map((a) => (
                        <span key={a} className={styles.chip}>
                          {a}
                        </span>
                      ))
                    ) : typeof item.answer === 'object' && item.answer !== null ? (
                      (() => {
                        const branchObj = item.answer as any;
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span className={styles.answerText}>
                              <strong>¿Tiene experiencia?:</strong> {branchObj.answer || 'No'}
                            </span>
                            {branchObj.exp && (
                              <span
                                className={styles.answerText}
                                style={{ opacity: 0.8, fontSize: '0.9em' }}
                              >
                                <strong>Detalle:</strong> {branchObj.exp}
                              </span>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      <span className={styles.answerText}>{item.answer || 'Sin responder'}</span>
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
          );
        })}
      </div>
      <ExtraDataForm />
    </div>
  );
}

function EditIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#4ade80"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
