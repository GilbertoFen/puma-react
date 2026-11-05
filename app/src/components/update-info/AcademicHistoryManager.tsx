'use client';
import React, { useEffect, useState } from 'react';
import styles from '../../components/profile/ProfilePage.module.css';
import { lookupSubjectInCatalog } from '../../utils/academic-catalog';
import { scheduleService } from '../../services/schedule.service';

type Subject = {
  subjectID: string;
  subjectName: string;
  grade?: number;
  code?: string;
  credits?: number | null;
  group?: string;
  days?: string;
  schedule?: string;
  professor?: string;
  matchStatus?: 'matched' | 'pending';
};

interface Props {
  initialSubjects: any[];
  isCollapsible?: boolean;
}

export default function AcademicHistoryManager({ initialSubjects, isCollapsible = false }: Props) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isOpen, setIsOpen] = useState(!isCollapsible);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftGrade, setDraftGrade] = useState('');

  useEffect(() => {
    const schedule = scheduleService.getStudentSchedule();

    const formatted: Subject[] = (initialSubjects || []).map((s: any) => {
      const name = (s.subjectName || s.subject?.subject || s.name || '').toUpperCase();
      const rawCode = s.code || s.subject?.code || null;
      const catMatch = lookupSubjectInCatalog(rawCode, name);
      const finalCode = rawCode ? String(rawCode) : catMatch?.code;
      const finalCredits = s.credits ?? s.subject?.credits ?? catMatch?.credits ?? null;

      const schedMatch = schedule?.subjects.find(
        (sched) => (finalCode && sched.code === finalCode) || sched.name.toUpperCase() === name
      );

      return {
        subjectID: s.subjectID || s.id || crypto.randomUUID(),
        subjectName: catMatch?.name || name,
        grade: s.grade,
        code: finalCode,
        credits: finalCredits,
        group: schedMatch?.group,
        days: schedMatch?.days,
        schedule: schedMatch?.time || schedMatch?.rawSchedule,
        professor: schedMatch?.professor,
        matchStatus: catMatch ? 'matched' : (finalCode ? 'matched' : 'pending'),
      };
    });

    // Añadir materias del horario actual si no están en initialSubjects
    if (schedule?.subjects && Array.isArray(schedule.subjects)) {
      schedule.subjects.forEach((schedSub) => {
        const exists = formatted.some(
          (f) => (f.code && f.code === schedSub.code) || f.subjectName === schedSub.name.toUpperCase()
        );

        if (!exists) {
          formatted.unshift({
            subjectID: `sched-${schedSub.code}-${schedSub.group}`,
            subjectName: schedSub.officialName || schedSub.name.toUpperCase(),
            code: schedSub.code,
            credits: schedSub.credits,
            group: schedSub.group,
            days: schedSub.days,
            schedule: schedSub.time || schedSub.rawSchedule,
            professor: schedSub.professor,
            matchStatus: schedSub.matchStatus,
            grade: undefined,
          });
        }
      });
    }

    setSubjects(formatted);
  }, [initialSubjects]);

  const handleEdit = (s: Subject) => {
    if (s.grade === undefined) return;
    setEditingId(s.subjectID);
    setDraftGrade(String(s.grade));
  };

  const saveEdit = (id: string) => {
    const val = parseInt(draftGrade, 10);
    if (isNaN(val) || val < 0 || val > 10) return;
    setSubjects(prev => prev.map(s => s.subjectID === id ? { ...s, grade: val } : s));
    setEditingId(null);
  };

  const uniqueSubjects = subjects.filter((subject, index, self) =>
    index === self.findIndex((t) => t.subjectID === subject.subjectID)
  );

  return (
    <div className={styles.historyManagerRoot}>
      {isCollapsible && (
        <button className={styles.cardLinkBtn} onClick={() => setIsOpen(!isOpen)} style={{ marginBottom: '10px' }}>
          {isOpen ? '✕ Cerrar historial' : 'Ver historial completo →'}
        </button>
      )}

      {isOpen && (
        <div className={styles.historyContent}>
          <h3 className={styles.fieldLabel} style={{ marginBottom: '12px' }}>Materias Registradas</h3>

          <div className={styles.subjectsGrid}>
            {uniqueSubjects.map(s => (
              <div key={s.subjectID} className={styles.historyItem}>
                <div className={styles.badge} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px' }}>
                    <span className={styles.subjectNameText} style={{ fontWeight: 600 }}>{s.subjectName}</span>
                    <div className={styles.gradeContainer}>
                      {editingId === s.subjectID ? (
                        <div className={styles.editGradeWrapper}>
                          <input
                            type="number"
                            value={draftGrade}
                            onChange={(e) => setDraftGrade(e.target.value)}
                            className={styles.fieldInput}
                            style={{ width: '45px', padding: '2px 5px', fontSize: '12px' }}
                            autoFocus
                          />
                          <button className={styles.cardEditBtn} onClick={() => saveEdit(s.subjectID)}>✓</button>
                        </div>
                      ) : (
                        <div className={styles.gradeDisplay}>
                          <span className={styles.gradeValueText}>
                            {s.grade !== undefined && s.grade !== null ? s.grade : 'En curso'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Metadatos: Clave, Créditos, Grupo, Horario, Profesor */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>
                    {s.code && <span style={{ color: 'rgba(201,168,76,0.9)' }}>Clave: {s.code}</span>}
                    {s.credits !== null && s.credits !== undefined && <span>· {s.credits} cr</span>}
                    {s.group && <span>· Gpo {s.group}</span>}
                    {s.days && s.schedule && <span>· {s.days} ({s.schedule})</span>}
                    {s.professor && <span>· Prof. {s.professor}</span>}
                    {s.matchStatus === 'pending' && <span style={{ color: '#fbbf24' }}>· Pendiente</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
