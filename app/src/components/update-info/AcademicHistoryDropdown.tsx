'use client';
import React, { useState, useEffect } from 'react';
import { gradeService } from '../../services/grades.service'; // Asegúrate de que la ruta coincida con la de tu Perfil
import styles from './AcademicHistoryDropdown.module.css';
import InlineLoader from '../loaders/InlineLoader';

// Mantenemos tu shape exacto para que tus estilos y renderizado no se enteren del cambio relacional
type AcademicSubject = {
  subjectID: string;
  subjectName: string;
  grade: number;
  exists: boolean;
};

export default function AcademicHistoryDropdown() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<AcademicSubject[]>([]);
  const [loading, setLoading] = useState(true); // Loader interno para las materias
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftGrade, setDraftGrade] = useState('');

  // ── 1. Descarga e inyección real de historial ──────────────────
  // En tu AcademicHistoryDropdown.tsx

  // ── 1. CORRECCIÓN DEL FETCH Y EL MAPEO RELACIONAL ──────────────────
  useEffect(() => {
    const fetchRealGrades = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const rawGrades = await gradeService.getMyGrades(token);
        console.log("Datos crudos del historial recibidos:", rawGrades); // Para depuración

        const formatted: AcademicSubject[] = rawGrades.map((item: any) => {
          // Blindaje de llaves: revisamos todas las posibles formas en que venga el nombre de la materia
          const subjectNameReal =
            item.subject?.name ||
            item.course?.name ||
            item.materia?.name ||
            item.subjectName ||
            'MATERIA EN PROCESO';

          return {
            // Usamos el ID del renglón (la inscripción real) para asegurar que sea único
            subjectID: item.id || item.subjectID || crypto.randomUUID(),
            subjectName: subjectNameReal.toUpperCase(), // Forzamos mayúsculas estéticas para MAC
            grade: item.grade ?? 0,
            exists: true
          };
        });

        setRows(formatted);
      } catch (error) {
        console.error("Error al sincronizar historial en el dropdown:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRealGrades();
  }, []);

  // ── Edición de calificación ───────────────────────
  const startEdit = (s: AcademicSubject) => {
    setEditingId(s.subjectID);
    setDraftGrade(String(s.grade));
  };

  const saveEdit = async (id: string) => {
    const parsed = parseInt(draftGrade, 10);
    if (isNaN(parsed) || parsed < 0 || parsed > 10) return;

    // Optimistic Update: Modificamos la UI de inmediato para dar sensación de velocidad instantánea
    setRows((prev) =>
      prev.map((s) => (s.subjectID === id ? { ...s, grade: parsed } : s))
    );
    setEditingId(null);

    // ── 2. PATCH Real al Backend de NestJS ────────────────────────
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'; // Ajusta según tus constantes

      // Enviamos la actualización directamente a la tabla pivote de tu Supabase
      const res = await fetch(`${API_URL}/student-courses/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ grade: parsed })
      });

      if (!res.ok) {
        throw new Error('El servidor rechazó la actualización de la calificación.');
      }

      console.log(`✅ Calificación de la materia [${id}] actualizada con éxito en Supabase.`);
    } catch (error) {
      console.error("Error al guardar la calificación en el servidor:", error);
      alert("Hubo un problema al guardar en la base de datos. Recarga la página.");
    }
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
        <div className={styles.panel} style={{ position: 'relative', minHeight: loading ? '120px' : 'auto' }}>

          {loading && (
            <InlineLoader variant="overlay" message="Sincronizando materias..." />
          )}

          {!loading && rows.length === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', padding: '16px 0', textAlign: 'center' }}>
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

              {/* ── 2. CORRECCIÓN DE LA KEY ÚNICA EN EL JSX (Alrededor de la línea 132) ── */}
              {rows.map((s, index) => (
                // Combinamos el subjectID con el índice del mapa para garantizar una firma 100% única en el Virtual DOM
                <div key={`${s.subjectID}-${index}`} className={styles.row}>
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
                          if (e.key === 'Enter') saveEdit(s.subjectID);
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

                  {/* {editingId !== s.subjectID && (
                    <button
                      className={styles.editBtn}
                      onClick={() => startEdit(s)}
                      title="Editar calificación"
                    >
                      <EditIcon />
                    </button>
                  )} */}
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

// ── Íconos Auxiliares (Permanecen intactos para cuidar tus clases CSS) ───────────────────────────
function GraduationIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="rgba(201,168,76,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s', flexShrink: 0 }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}