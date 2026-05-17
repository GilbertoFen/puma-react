'use client';
import React, { useEffect, useState } from 'react';
// Importamos los mismos estilos del perfil para heredar el look & feel
import styles from '../../components/profile/ProfilePage.module.css';

type Subject = {
  subjectID: string;
  subjectName: string;
  grade: number;
};

interface Props {
  initialSubjects: Subject[];
  isCollapsible?: boolean;
}

export default function AcademicHistoryManager({ initialSubjects, isCollapsible = false }: Props) {
  const [subjects, setSubjects] = useState(initialSubjects);
  const [isOpen, setIsOpen] = useState(!isCollapsible);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftGrade, setDraftGrade] = useState('');

  const handleEdit = (s: Subject) => {
    setEditingId(s.subjectID);
    setDraftGrade(String(s.grade));
  };

  const saveEdit = (id: string) => {
    const val = parseInt(draftGrade);
    if (isNaN(val) || val < 0 || val > 10) return;
    setSubjects(prev => prev.map(s => s.subjectID === id ? { ...s, grade: val } : s));
    setEditingId(null);
  };
  const uniqueSubjects = subjects.filter((subject, index, self) =>
    index === self.findIndex((t) => t.subjectID === subject.subjectID)
  );
  useEffect(() => {
    setSubjects(initialSubjects);
  }, [initialSubjects]);

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
                <div className={styles.badge}>
                  <span className={styles.subjectNameText}>{s.subjectName}</span>

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
                        <span className={styles.gradeValueText}>{s.grade}</span>

                      </div>
                    )}
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

// Icono pequeño de edición para mantener consistencia
function EditIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}