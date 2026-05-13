'use client';
import React, { useState, useRef } from 'react';
import Navbar from '../Navbar';
import styles from './AcademicUploadPage.module.css';
import { gradeService, Subject } from '../../services/grades.service';
// ─────────────────────────────────────────────────────
// TIPOS — reflejan exactamente el JSON del endpoint
// ─────────────────────────────────────────────────────


type AcademicResponse = {
  rawMarkdown: string;
  subjects: Subject[];
};

// ─────────────────────────────────────────────────────
// MOCK — 3 materias simuladas
// Cuando conectes el endpoint real, borra este objeto
// y úsalo como tipo de la respuesta del fetch
// ─────────────────────────────────────────────────────
export const MOCK_RESPONSE: AcademicResponse = {
  rawMarkdown: '# Historial Académico Validado',
  subjects: [
    { subjectID: '5a12de93-e175-4ba7-9f35-cd40fcd77f74', subjectName: 'ÁLGEBRA SUPERIOR', grade: 8, exists: true },
    { subjectID: '2c715176-8f75-49cb-977f-6f0603eb4daf', subjectName: 'CÁLCULO I', grade: 6, exists: true },
    { subjectID: 'b3f9a021-cc41-4d78-a801-7e2d5f3e9a10', subjectName: 'PROGRAMACIÓN I', grade: 9, exists: true },
    { subjectID: 'b3f9a021-cc41-4d78-a801-7e2d5f3e9a30', subjectName: 'PROGRAMACIÓN II', grade: 9, exists: true },
    { subjectID: 'b3f9a021-cc41-4d78-a801-7e2d5f3e9a20', subjectName: 'PROGRAMACIÓN III', grade: 9, exists: true },

  ],
};

// ─────────────────────────────────────────────────────
// ESTADOS DE LA PANTALLA
//   'upload'    → zona de subida de PDF
//   'loading'   → enviando al backend (spinner)
//   'review'    → tabla de materias para revisar
//   'confirmed' → notificación de éxito
// ─────────────────────────────────────────────────────
type PageState = 'upload' | 'loading' | 'review' | 'confirmed';

type Props = {
  user: { nombre: string; initial: string };
  onContinue: () => void;   // navega a /home al confirmar
};

export default function AcademicUploadPage({ user, onContinue }: Props) {
  const [pageState, setPageState] = useState<PageState>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftGrade, setDraftGrade] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);



  // ── Manejo de archivo ──────────────────────────────
  const handleFile = (f: File | null) => {
    if (!f || f.type !== 'application/pdf') return;
    setFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  // ── Enviar al backend ──────────────────────────────
  // Cuando tengas la ruta real:
  //   1. Reemplaza el setTimeout por un fetch real
  //   2. Usa el FormData con el PDF
  //   3. Parsea la respuesta como AcademicResponse
  const handleSend = async () => {
    if (!file) return;
    setError(null);
    setPageState('loading');

    try {
      const data = await gradeService.analyzePDF(file);
      setSubjects(data.subjects);
      setPageState('review');
    } catch (err: any) {
      setError(err.message);
      setPageState('upload');
    }
  };

  // ── Editar calificación ────────────────────────────
  const saveEdit = (id: string) => {
    const parsed = parseInt(draftGrade, 10);
    if (isNaN(parsed) || parsed < 0 || parsed > 10) return;
    setSubjects((prev) =>
      prev.map((s) => (s.subjectID === id ? { ...s, grade: parsed } : s))
    );
    setEditingId(null);
  };

  const startEdit = (s: Subject) => {
    setEditingId(s.subjectID);
    setDraftGrade(String(s.grade));
  };

  const cancelEdit = () => setEditingId(null);

  // ── Confirmar y notificar ──────────────────────────
  const handleConfirm = async () => {
  try {
    // 1. Buscamos directamente la llave 'token' que guardaste en el login
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error("Sesión no encontrada. Por favor inicia sesión de nuevo.");
    }

    setPageState('loading');
    
    // 2. Enviamos el token al servicio
    await gradeService.confirmGrades(subjects, token);
    
    setPageState('confirmed');
  } catch (err: any) {
    console.error("Error en confirmación:", err);
    setError(err.message); // Usamos el banner de error que ya tienes
    setPageState('review');
  }
};

  const resetUpload = () => {
    setFile(null);
    setSubjects([]);
    setPageState('upload');
  };

  return (
    <div className={styles.root}>
      <div className={styles.bgMesh} />
      <Navbar showAcatlan userInitial={user.initial} />
      <div className={styles.goldLine} />

      <main className={styles.main}>

        {/* ══ ESTADO: upload ══════════════════════════ */}
        {(pageState === 'upload' || pageState === 'loading') && (
          <div className={styles.uploadSection}>
            <div className={styles.uploadHeader}>
              <h1 className={styles.title}>Sube tu historial académico</h1>
              <p className={styles.subtitle}>
                Necesitamos tu historial en PDF para analizar tus materias y
                personalizar tus recomendaciones.
              </p>
            </div>

            {/* Zona drag & drop */}
            <div
              className={`${styles.dropZone} ${dragging ? styles.dropZoneActive : ''} ${file ? styles.dropZoneReady : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false); }}
              onDrop={onDrop}
              onClick={() => !file && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                style={{ display: 'none' }}
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />

              {file ? (
                /* Archivo seleccionado */
                <div className={styles.fileReady}>
                  <PdfIcon />
                  <div className={styles.fileInfo}>
                    <span className={styles.fileName}>{file.name}</span>
                    <span className={styles.fileSize}>
                      {(file.size / 1024).toFixed(0)} KB · PDF
                    </span>
                  </div>
                  <button
                    className={styles.removeFile}
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    title="Quitar archivo"
                  >✕</button>
                </div>
              ) : (
                /* Zona vacía */
                <div className={styles.dropContent}>
                  <UploadIcon />
                  <p className={styles.dropTitle}>
                    {dragging ? 'Suelta el PDF aquí' : 'Arrastra tu historial académico aquí'}
                  </p>
                  <p className={styles.dropHint}>o haz click para seleccionar · Solo PDF</p>
                </div>
              )}
            </div>

            {/* Botón enviar */}
            <button
              className={`${styles.sendBtn} ${!file || pageState === 'loading' ? styles.sendBtnDisabled : ''}`}
              onClick={handleSend}
              disabled={!file || pageState === 'loading'}
            >
              {pageState === 'loading' ? (
                <span className={styles.loadingRow}>
                  <SpinnerIcon /> Procesando documento...
                </span>
              ) : 'Analizar historial'}
            </button>
          </div>
        )}

        {/* ══ ESTADO: review ══════════════════════════ */}
        {pageState === 'review' && (
          <div className={styles.reviewSection}>
            <div className={styles.reviewHeader}>
              <div className={styles.reviewTitleRow}>
                <CheckCircleIcon />
                <h1 className={styles.title}>Historial procesado correctamente</h1>
              </div>
              <p className={styles.subtitle}>
                Revisa las materias detectadas. Puedes editar la calificación si detectas
                algún error antes de confirmar.
              </p>
            </div>

            {/* Tabla de materias */}
            <div className={styles.table}>
              <div className={styles.tableHead}>
                <span>Materia</span>
                <span className={styles.colGrade}>Calificación</span>
                <span className={styles.colAction}></span>
              </div>

              {subjects.map((s) => (
                <div key={s.subjectID} className={styles.tableRow}>
                  <span className={styles.subjectName}>{s.subjectName}</span>

                  {editingId === s.subjectID ? (
                    /* Modo edición */
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
                      <button className={styles.saveGradeBtn} onClick={() => saveEdit(s.subjectID)}>
                        <CheckIcon />
                      </button>
                      <button className={styles.cancelGradeBtn} onClick={cancelEdit}>
                        ✕
                      </button>
                    </div>
                  ) : (
                    /* Calificación normal */
                    <span className={`${styles.grade} ${gradeColor(s.grade)}`}>
                      {s.grade}
                    </span>
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
            </div>

            {/* Acciones */}
            <div className={styles.reviewActions}>
              <button className={styles.reuploadBtn} onClick={resetUpload}>
                <UploadIcon small /> Subir otro PDF
              </button>
              <button className={styles.confirmBtn} onClick={handleConfirm}>
                Confirmar y continuar
              </button>
            </div>
          </div>
        )}

        {/* ══ ESTADO: confirmed ═══════════════════════ */}
        {pageState === 'confirmed' && (
          <div className={styles.confirmedSection}>
            <div className={styles.confirmedCard}>
              <div className={styles.confirmedIcon}>
                <BigCheckIcon />
              </div>
              <h2 className={styles.confirmedTitle}>¡Documento registrado!</h2>
              <p className={styles.confirmedDesc}>
                Tu historial académico se subió correctamente y ya está disponible
                en tu perfil para consulta.
              </p>
              <button className={styles.continueBtn} onClick={onContinue}>
                Ir al portal →
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────
function gradeColor(grade: number): string {
  if (grade >= 9) return styles.gradeHigh;
  if (grade >= 7) return styles.gradeMid;
  return styles.gradeLow;
}

// ── Íconos SVG ────────────────────────────────────────
function UploadIcon({ small }: { small?: boolean }) {
  const s = small ? 14 : 40;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  );
}

function PdfIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
      stroke="rgba(201,168,76,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      className={styles.spinner}>
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function BigCheckIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none"
      stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
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
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
