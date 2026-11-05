'use client';
import React, { useState, useRef } from 'react';
import type { UploadedDocument } from '../../types/shared.types';
import { gradeService, Subject } from '../../services/grades.service';
import { scheduleService, EnrolledScheduleSubject } from '../../services/schedule.service';
import styles from './Sections.module.css';
import AcademicHistoryDropdown from './AcademicHistoryDropdown';

type Props = {
  documents: UploadedDocument[];
};

type UploadState = 'idle' | 'loading_pdf' | 'review_grades' | 'saving_supabase';
type ScheduleUploadState = 'idle' | 'loading_pdf' | 'review_schedule' | 'saving';

export default function DocumentsSection({ documents: initial }: Props) {
  const [docs, setDocs] = useState<UploadedDocument[]>(initial);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scheduleInputRef = useRef<HTMLInputElement>(null);

  // Estados de Tira de Materias (DGAE)
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [detectedSubjects, setDetectedSubjects] = useState<Subject[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estados de Horario Actual (Comprobante de Inscripción)
  const [scheduleState, setScheduleState] = useState<ScheduleUploadState>('idle');
  const [detectedScheduleSubjects, setDetectedScheduleSubjects] = useState<EnrolledScheduleSubject[]>([]);
  const [schedulePeriod, setSchedulePeriod] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // Flujo 1: Carga y lectura de Tira de Materias (DGAE)
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
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error al guardar.');
      setUploadState('review_grades');
    }
  };

  // Flujo 2: Carga y lectura del Horario Actual (Comprobante de Inscripción)
  const handleScheduleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const targetFile = files[0];

    if (targetFile.type !== 'application/pdf') {
      setScheduleError('El comprobante de horario debe ser un archivo PDF.');
      return;
    }

    setScheduleError(null);
    setScheduleState('loading_pdf');

    try {
      const token = localStorage.getItem('token') || undefined;
      const result = await scheduleService.analyzeSchedulePDF(targetFile, token);

      setDetectedScheduleSubjects(result.subjects);
      setSchedulePeriod(result.period);
      setScheduleState('review_schedule');
    } catch (err: any) {
      console.error(err);
      setScheduleError(err.message || 'No se pudo leer el documento de horario.');
      setScheduleState('idle');
    }
  };

  const handleConfirmSchedule = async () => {
    try {
      setScheduleState('saving');
      const token = localStorage.getItem('token') || undefined;
      const activeSchedule = scheduleService.getStudentSchedule();

      if (activeSchedule) {
        scheduleService.saveStudentSchedule(activeSchedule, token);
      }

      setScheduleState('idle');
      alert("¡Horario actual registrado y vinculado exitosamente al alumno!");
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      setScheduleError(err.message || 'Error al guardar el horario.');
      setScheduleState('review_schedule');
    }
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Documentos Académicos</h2>
        <p className={styles.sectionDesc}>
          Carga tu historial oficial de la DGAE y tu horario actual para sincronizar tus materias, créditos y grupos.
        </p>
      </div>

      {errorMsg && <div className={styles.errorBanner}>⚠️ {errorMsg}</div>}
      {scheduleError && <div className={styles.errorBanner}>⚠️ {scheduleError}</div>}

      {/* ══ 1. BOTÓN TIRA DE MATERIAS (DGAE) ══ */}
      {uploadState === 'idle' && (
        <div className={styles.uploadArea} onClick={() => fileInputRef.current?.click()}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={(e) => handleUpload(e.target.files)}
          />
          <UploadIcon />
          <p className={styles.uploadTitle}>Seleccionar Historial Académico (PDF)</p>
        </div>
      )}

      {uploadState === 'loading_pdf' && (
        <div className={styles.loadingArea}>🌀 Procesando historial con PumaIA...</div>
      )}

      {uploadState === 'review_grades' && (
        <div className={styles.reviewArea}>
          <h4>✓ Materias detectadas en Historial</h4>
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

      {/* ══ 2. SEGUNDO BOTÓN: HORARIO ACTUAL (COMPROBANTE DE INSCRIPCIÓN) ══ */}
      {scheduleState === 'idle' && (
        <div
          className={styles.uploadArea}
          onClick={() => scheduleInputRef.current?.click()}
          style={{ marginTop: '12px' }}
        >
          <input
            ref={scheduleInputRef}
            type="file"
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={(e) => handleScheduleUpload(e.target.files)}
          />
          <UploadIcon />
          <p className={styles.uploadTitle}>Horario actual (PDF)</p>
        </div>
      )}

      {scheduleState === 'loading_pdf' && (
        <div className={styles.loadingArea} style={{ marginTop: '12px' }}>
          🌀 Procesando horario actual con PumaIA...
        </div>
      )}

      {scheduleState === 'review_schedule' && (
        <div className={styles.reviewArea} style={{ marginTop: '12px' }}>
          <h4>✓ Asignaturas inscritas detectadas ({schedulePeriod || 'Horario Actual'})</h4>
          <div className={styles.subjectList}>
            {detectedScheduleSubjects.map((s, idx) => (
              <div key={`${s.code}-${idx}`} className={styles.subjectRow}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', textAlign: 'left' }}>
                  <span style={{ fontWeight: 600 }}>{s.officialName || s.name}</span>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    <span>Clave: {s.code}</span>
                    <span>·</span>
                    <span>{s.credits !== null ? `${s.credits} créditos` : 'Créditos pendientes'}</span>
                    <span>·</span>
                    <span>Gpo: {s.group}</span>
                    {s.days && <span>· {s.days}</span>}
                    {s.time && <span>· {s.time}</span>}
                    {s.professor && <span>· Prof. {s.professor}</span>}
                  </div>
                </div>
                <strong style={{ fontSize: '12px', color: s.matchStatus === 'matched' ? '#4ade80' : '#fbbf24', whiteSpace: 'nowrap' }}>
                  {s.matchStatus === 'matched' ? '✓ Vinculada' : '⚠️ Pendiente'}
                </strong>
              </div>
            ))}
          </div>
          <div className={styles.actions}>
            <button onClick={() => setScheduleState('idle')}>Cancelar</button>
            <button onClick={handleConfirmSchedule}>Confirmar y Guardar Horario</button>
          </div>
        </div>
      )}

      {/* dropdown de materias del estudiante con datos enriquecidos */}
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
