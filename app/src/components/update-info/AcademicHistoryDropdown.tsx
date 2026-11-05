'use client';
import React, { useState, useEffect } from 'react';
import { gradeService } from '../../services/grades.service';
import { scheduleService } from '../../services/schedule.service';
import { lookupSubjectInCatalog } from '../../utils/academic-catalog';
import { API_URL, getAuthToken } from '../../utils/api';
import styles from './AcademicHistoryDropdown.module.css';
import InlineLoader from '../loaders/InlineLoader';

type AcademicSubject = {
  subjectID: string;
  realSubjectId?: string;
  subjectName: string;
  grade?: number;
  exists: boolean;
  code?: string;
  credits?: number | null;
  group?: string;
  days?: string;
  schedule?: string;
  professor?: string;
  matchStatus?: 'matched' | 'pending';
  isCurrentSchedule?: boolean;
};

export default function AcademicHistoryDropdown() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<AcademicSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftGrade, setDraftGrade] = useState('');

  useEffect(() => {
    const fetchRealGrades = async () => {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const rawGrades = await gradeService.getMyGrades(token);
        const schedule = scheduleService.getStudentSchedule();

        const formatted: AcademicSubject[] = rawGrades.map((item: any) => {
          const subjectNameReal =
            item.subject?.subject ||
            item.subject?.name ||
            item.course?.name ||
            item.materia?.name ||
            item.subjectName ||
            'MATERIA EN PROCESO';

          const rawCode = item.code || item.subject?.code || null;
          const catalogMatch = lookupSubjectInCatalog(rawCode, subjectNameReal);
          const finalCode = rawCode ? String(rawCode) : (catalogMatch?.code || undefined);
          const finalCredits = item.credits ?? item.subject?.credits ?? catalogMatch?.credits ?? null;

          // Buscar si esta materia está en el horario actual inscrito
          const scheduleMatch = schedule?.subjects.find(
            (s) => (finalCode && s.code === finalCode) || s.name.toUpperCase() === subjectNameReal.toUpperCase()
          );

          return {
            subjectID: item.id || item.subjectID || crypto.randomUUID(),
            realSubjectId: item.subjectID || item.subjectId || item.subject?.id,
            subjectName: catalogMatch?.name || subjectNameReal.toUpperCase(),
            grade: item.grade ?? undefined,
            exists: true,
            code: finalCode,
            credits: finalCredits,
            group: scheduleMatch?.group,
            days: scheduleMatch?.days,
            schedule: scheduleMatch?.time || scheduleMatch?.rawSchedule,
            professor: scheduleMatch?.professor,
            matchStatus: catalogMatch ? 'matched' : (finalCode ? 'matched' : 'pending'),
            isCurrentSchedule: !!scheduleMatch,
          };
        });

        // Si hay materias en el horario actual que aún no están en el historial calificado
        if (schedule?.subjects && Array.isArray(schedule.subjects)) {
          for (const schedSub of schedule.subjects) {
            const alreadyExists = formatted.some(
              (f) => (f.code && f.code === schedSub.code) || f.subjectName === schedSub.name.toUpperCase()
            );

            if (!alreadyExists) {
              formatted.unshift({
                subjectID: `sched-${schedSub.code}-${schedSub.group}`,
                subjectName: schedSub.officialName || schedSub.name.toUpperCase(),
                exists: schedSub.matchStatus === 'matched',
                code: schedSub.code,
                credits: schedSub.credits,
                group: schedSub.group,
                days: schedSub.days,
                schedule: schedSub.time || schedSub.rawSchedule,
                professor: schedSub.professor,
                matchStatus: schedSub.matchStatus,
                isCurrentSchedule: true,
              });
            }
          }
        }

        setRows(formatted);
      } catch (error) {
        console.error('Error al sincronizar historial en el dropdown:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRealGrades();
  }, []);

  const startEdit = (s: AcademicSubject) => {
    if (s.grade === undefined) return;
    setEditingId(s.subjectID);
    setDraftGrade(String(s.grade));
  };

  const saveEdit = async (id: string) => {
    const parsed = parseInt(draftGrade, 10);
    if (isNaN(parsed) || parsed < 5 || parsed > 10) return;

    const targetRow = rows.find((s) => s.subjectID === id);

    setRows((prev) =>
      prev.map((s) => (s.subjectID === id ? { ...s, grade: parsed } : s)),
    );
    setEditingId(null);

    try {
      const token = getAuthToken();

      if (targetRow?.realSubjectId) {
        // Endpoint autorizado para el estudiante titular (actualiza Enrollment y recalcula promedio atómicamente)
        const res = await fetch(`${API_URL}/grade/confirm-import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({
            subjects: [
              {
                subjectID: targetRow.realSubjectId,
                grade: parsed,
              },
            ],
          }),
        });

        if (!res.ok) {
          throw new Error('El servidor rechazó la actualización de la calificación.');
        }
      } else {
        // Respaldo administrativo alineado con PUT /api/grade/:id en GradeController
        const res = await fetch(`${API_URL}/grade/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({ grade: parsed }),
        });

        if (!res.ok) {
          throw new Error('El servidor rechazó la actualización de la calificación.');
        }
      }
    } catch (error) {
      console.error('Error al guardar la calificación en el servidor:', error);
    }
  };

  const cancelEdit = () => setEditingId(null);

  return (
    <div className={styles.wrap}>
      <button
        className={`${styles.toggle} ${open ? styles.toggleOpen : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        <GraduationIcon />
        <span>Ver historial académico completo</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div
          className={styles.panel}
          style={{ position: 'relative', minHeight: loading ? '120px' : 'auto' }}
        >
          {loading && (
            <InlineLoader variant="overlay" message="Sincronizando materias..." />
          )}

          {!loading && rows.length === 0 && (
            <p
              style={{
                color: 'rgba(255,255,255,0.4)',
                fontSize: '13px',
                padding: '16px 0',
                textAlign: 'center',
              }}
            >
              Aún no has cargado materias en tu historial.
            </p>
          )}

          {!loading && rows.length > 0 && (
            <>
              <div className={styles.tableHead}>
                <span>Materia</span>
                <span className={styles.colGrade}>Calificación</span>
                <span className={styles.colAction} />
              </div>

              {rows.map((s, index) => (
                <div key={`${s.subjectID}-${index}`} className={styles.row}>
                  <div className={styles.subjectCol}>
                    <span className={styles.subjectName}>{s.subjectName}</span>
                    <div className={styles.subjectMeta}>
                      {s.code && <span className={`${styles.metaChip} ${styles.metaChipGold}`}>Clave: {s.code}</span>}
                      {s.credits !== null && s.credits !== undefined && (
                        <span className={styles.metaChip}>{s.credits} créditos</span>
                      )}
                      {s.group && <span className={styles.metaChip}>Gpo: {s.group}</span>}
                      {s.days && s.schedule && (
                        <span className={styles.metaChip}>{s.days} · {s.schedule}</span>
                      )}
                      {s.professor && (
                        <span className={styles.metaChip}>Prof. {s.professor}</span>
                      )}
                      {s.matchStatus === 'pending' && (
                        <span className={styles.pendingChip}>⚠️ Pendiente de correspondencia</span>
                      )}
                    </div>
                  </div>

                  {editingId === s.subjectID ? (
                    <div className={styles.gradeEditRow}>
                      <input
                        className={styles.gradeInput}
                        type="number"
                        min={5}
                        max={10}
                        value={draftGrade}
                        onChange={(e) => setDraftGrade(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(s.subjectID);
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        autoFocus
                      />
                      <button
                        className={styles.saveBtn}
                        onClick={() => saveEdit(s.subjectID)}
                      >
                        <CheckIcon />
                      </button>
                      <button className={styles.cancelBtn} onClick={cancelEdit}>
                        ✕
                      </button>
                    </div>
                  ) : s.grade !== undefined && s.grade !== null ? (
                    <span className={`${styles.grade} ${gradeColor(s.grade)}`}>
                      {s.grade}
                    </span>
                  ) : (
                    <span className={styles.inProgressGrade}>En curso</span>
                  )}

                  {editingId !== s.subjectID && s.grade !== undefined && (
                    <button
                      className={styles.editBtn}
                      onClick={() => startEdit(s)}
                      title="Editar calificación"
                    >
                      <EditIcon />
                    </button>
                  )}
                </div>
              ))}

              <p className={styles.hint}>
                Solo puedes editar calificaciones. Para actualizar materias, sube un nuevo PDF de historial.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function gradeColor(grade: number): string {
  if (grade >= 9) return styles.gradeHigh;
  if (grade >= 7) return styles.gradeMid;
  return styles.gradeLow;
}

function GraduationIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(201,168,76,0.8)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: open ? 'rotate(180deg)' : 'none',
        transition: 'transform 0.25s',
        flexShrink: 0,
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
function EditIcon() {
  return (
    <svg
      width="13"
      height="13"
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
      width="12"
      height="12"
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
