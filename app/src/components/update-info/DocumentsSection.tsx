'use client';
import React, { useState, useRef } from 'react';
import type { UploadedDocument } from '../../types/shared.types';
import { gradeService, Subject } from '../../services/grades.service';
import styles from './Sections.module.css';
import AcademicHistoryDropdown from './AcademicHistoryDropdown';

type Props = {
  documents: UploadedDocument[];
};

type UploadState = 'idle' | 'loading_pdf' | 'review_grades' | 'saving_supabase';

export default function DocumentsSection({ documents: initial }: Props) {
  const [docs, setDocs] = useState<UploadedDocument[]>(initial);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [detectedSubjects, setDetectedSubjects] = useState<Subject[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Método único: Al subir, asume que es Tira de Materias (historial_academico)
  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const targetFile = files[0];

    if (targetFile.type !== 'application/pdf') {
      setErrorMsg('El historial académico debe ser un archivo PDF.');
      return;
    }

    setErrorMsg(null);
    setUploadState('loading_pdf');

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error("Sesión expirada");

      const data = await gradeService.analyzePDF(targetFile, token);
      setDetectedSubjects(data.subjects);
      setUploadState('review_grades');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error al analizar el historial.');
      setUploadState('idle');
    }
  };

  const handleConfirmGrades = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error("Sesión caducada.");

      setUploadState('saving_supabase');
      await gradeService.confirmGrades(detectedSubjects, token);

      setUploadState('idle');
      alert("¡Historial académico actualizado con éxito!");
      // En lugar de reload(), refrescamos el dropdown si tiene un método o recargamos suavemente
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error al guardar.');
      setUploadState('review_grades');
    }
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Tira de Materias</h2>
        <p className={styles.sectionDesc}>
          Sube tu historial académico oficial en PDF para actualizar tus materias y promedio automáticamente.
        </p>
      </div>

      {errorMsg && <div className={styles.errorBanner}>⚠️ {errorMsg}</div>}

      {/* ══ MÁQUINA DE ESTADOS ══ */}
      {uploadState === 'idle' && (
        <div className={styles.uploadArea} onClick={() => fileInputRef.current?.click()}>
          <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: 'none' }}
            onChange={(e) => handleUpload(e.target.files)} />
          <UploadIcon />
          <p className={styles.uploadTitle}>Seleccionar Historial Académico (PDF)</p>
        </div>
      )}

      {uploadState === 'loading_pdf' && (
        <div className={styles.loadingArea}>🌀 Procesando historial con PumaIA...</div>
      )}

      {uploadState === 'review_grades' && (
        <div className={styles.reviewArea}>
          <h4>✓ Materias detectadas</h4>
          <div className={styles.subjectList}>
            {detectedSubjects.map((s) => (
              <div key={s.subjectID} className={styles.subjectRow}>
                <span>{s.subjectName}</span>
                <strong>{s.grade}</strong>
              </div>
            ))}
          </div>
          <div className={styles.actions}>
            <button onClick={() => setUploadState('idle')}>Cancelar</button>
            <button onClick={handleConfirmGrades}>Confirmar y Guardar</button>
          </div>
        </div>
      )}

      {/* dropdown de materias actuales */}
      <AcademicHistoryDropdown />
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
    </svg>
  );
}
