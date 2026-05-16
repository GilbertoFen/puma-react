'use client';
import React, { useState } from 'react';
import styles from './AcademicHistoryDropdown.module.css';

// ─────────────────────────────────────────────────────
// TIPOS — shape exacto del endpoint
// ─────────────────────────────────────────────────────
type AcademicSubject = {
  subjectID: string;
  subjectName: string;
  grade: number;
  exists: boolean;
};

// ─────────────────────────────────────────────────────
// MOCK — simula la respuesta del endpoint
// Reemplaza con fetch real cuando conectes el back
// ─────────────────────────────────────────────────────
const MOCK_SUBJECTS: AcademicSubject[] = [
  { subjectID: '5a12de93', subjectName: 'ÁLGEBRA SUPERIOR',   grade: 8, exists: true },
  { subjectID: '2c715176', subjectName: 'CÁLCULO I',          grade: 6, exists: true },
  { subjectID: 'b3f9a021', subjectName: 'PROGRAMACIÓN I',     grade: 9, exists: true },
  { subjectID: 'c4e82b11', subjectName: 'ESTADÍSTICA I',      grade: 7, exists: true },
  { subjectID: 'd5f93c22', subjectName: 'ÁLGEBRA LINEAL',     grade: 8, exists: true },
];

// ─────────────────────────────────────────────────────

export default function AcademicHistoryDropdown() {
  const [open, setOpen]           = useState(false);
  const [rows, setRows]           = useState<AcademicSubject[]>(MOCK_SUBJECTS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftGrade, setDraftGrade] = useState('');

  // ── Edición de calificación ───────────────────────
  const startEdit = (s: AcademicSubject) => {
    setEditingId(s.subjectID);
    setDraftGrade(String(s.grade));
  };

  const saveEdit = (id: string) => {
    const parsed = parseInt(draftGrade, 10);
    if (isNaN(parsed) || parsed < 0 || parsed > 10) return;
    setRows((prev) =>
      prev.map((s) => (s.subjectID === id ? { ...s, grade: parsed } : s))
    );
    setEditingId(null);
    // TODO: PATCH /api/historial/:id  con { grade: parsed }
  };

  const cancelEdit = () => setEditingId(null);

  return (
    <div className={styles.wrap}>
      {/* Toggle */}
      <button
        className={`${styles.toggle} ${open ? styles.toggleOpen : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        <GraduationIcon />
        <span>Ver historial académico completo</span>
        <ChevronIcon open={open} />
      </button>

      {/* Lista desplegable */}
      {open && (
        <div className={styles.panel}>
          <div className={styles.tableHead}>
            <span>Materia</span>
            <span className={styles.colGrade}>Calificación</span>
            <span className={styles.colAction} />
          </div>

          {rows.map((s) => (
            <div key={s.subjectID} className={styles.row}>
              <span className={styles.subjectName}>{s.subjectName}</span>

              {editingId === s.subjectID ? (
                <div className={styles.gradeEditRow}>
                  <input
                    className={styles.gradeInput}
                    type="number"
                    min={0}
                    max={10}
                    value={draftGrade}
                    onChange={(e) => setDraftGrade(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter')  saveEdit(s.subjectID);
                      if (e.key === 'Escape') cancelEdit();
                    }}
                    autoFocus
                  />
                  <button className={styles.saveBtn} onClick={() => saveEdit(s.subjectID)}>
                    <CheckIcon />
                  </button>
                  <button className={styles.cancelBtn} onClick={cancelEdit}>✕</button>
                </div>
              ) : (
                <span className={`${styles.grade} ${gradeColor(s.grade)}`}>{s.grade}</span>
              )}

              {editingId !== s.subjectID && (
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

// ── Íconos ────────────────────────────────────────────
function GraduationIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="rgba(201,168,76,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  );
}
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s', flexShrink: 0 }}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}
function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
