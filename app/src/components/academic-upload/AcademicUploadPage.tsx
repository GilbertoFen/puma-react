'use client';
import React, { useState, useRef } from 'react';
import Navbar from '../Navbar';
import styles from './AcademicUploadPage.module.css';
import { gradeService, Subject } from '../../services/grades.service';
import { scheduleService, EnrolledScheduleSubject } from '../../services/schedule.service';
import { lookupSubjectInCatalog } from '../../utils/academic-catalog';
import { extractMaxSemesterFromGroups } from '../../utils/schedule-parser';

export type DisplaySubject = {
  subjectID: string;
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

type PageState = 'upload' | 'loading' | 'review' | 'confirmed';

type Props = {
  user: { nombre: string; initial: string; cuenta?: number };
  onContinue: () => void;
};

export default function AcademicUploadPage({ user, onContinue }: Props) {
  const [pageState, setPageState] = useState<PageState>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [scheduleFile, setScheduleFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [scheduleDragging, setScheduleDragging] = useState(false);
  const [subjects, setSubjects] = useState<DisplaySubject[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scheduleInputRef = useRef<HTMLInputElement>(null);

  // ── Manejo de tira de materias DGAE ──
  const handleFile = (f: File | null) => {
    if (!f || f.type !== 'application/pdf') return;
    setFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  // ── Manejo de horario actual ──
  const handleScheduleFile = (f: File | null) => {
    if (!f || f.type !== 'application/pdf') return;
    setScheduleFile(f);
  };

  const onScheduleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setScheduleDragging(false);
    handleScheduleFile(e.dataTransfer.files[0]);
  };

  // ── Enviar y procesar documentos ──
  const handleSend = async () => {
    if (!file && !scheduleFile) return;
    setError(null);
    setScheduleError(null);
    setPageState('loading');

    try {
      const token = localStorage.getItem('token') || undefined;
      const combinedSubjects: DisplaySubject[] = [];
      let parsedScheduleResult: any = null;

      // 1. Procesar Comprobante de Horario si se adjuntó
      if (scheduleFile) {
        try {
          parsedScheduleResult = await scheduleService.analyzeSchedulePDF(
            scheduleFile,
            token,
            user.cuenta
          );
        } catch (sErr: any) {
          console.error(sErr);
          setScheduleError(sErr.message || 'Error al leer el horario actual.');
          throw sErr;
        }
      }

      // 2. Procesar Tira de Materias (DGAE) si se adjuntó
      if (file) {
        if (!token) throw new Error("No hay sesión activa. Por favor inicia sesión.");
        const data = await gradeService.analyzePDF(file, token);

        if (data?.currentSemester) {
          try {
            const rawUser = localStorage.getItem('userData');
            if (rawUser) {
              const u = JSON.parse(rawUser);
              u.semestre = `${data.currentSemester}° semestre`;
              u.currentSemester = data.currentSemester;
              localStorage.setItem('userData', JSON.stringify(u));
            }
          } catch {}
        }

        if (Array.isArray(data.subjects)) {
          data.subjects.forEach((s: Subject) => {
            const catalogMatch = lookupSubjectInCatalog(null, s.subjectName);
            const schedMatch = parsedScheduleResult?.subjects.find(
              (ss: EnrolledScheduleSubject) =>
                (catalogMatch?.code && ss.code === catalogMatch.code) ||
                ss.name.toUpperCase() === s.subjectName.toUpperCase()
            );

            combinedSubjects.push({
              subjectID: s.subjectID,
              subjectName: catalogMatch?.name || s.subjectName,
              grade: s.grade,
              exists: s.exists,
              code: catalogMatch?.code || (schedMatch ? schedMatch.code : undefined),
              credits: catalogMatch?.credits ?? null,
              group: schedMatch?.group,
              days: schedMatch?.days,
              schedule: schedMatch?.time || schedMatch?.rawSchedule,
              professor: schedMatch?.professor,
              matchStatus: catalogMatch ? 'matched' : 'pending',
              isCurrentSchedule: !!schedMatch,
            });
          });
        }
      }

      // 3. Agregar materias del horario que no estaban en la tira calificada
      if (parsedScheduleResult?.subjects && Array.isArray(parsedScheduleResult.subjects)) {
        const schedGroups = parsedScheduleResult.subjects.map((s: any) => s.group).filter(Boolean);
        const schedSem = extractMaxSemesterFromGroups(schedGroups);
        if (schedSem) {
          try {
            const rawUser = localStorage.getItem('userData');
            if (rawUser) {
              const u = JSON.parse(rawUser);
              if (!u.currentSemester || schedSem > u.currentSemester) {
                u.semestre = `${schedSem}° semestre`;
                u.currentSemester = schedSem;
                localStorage.setItem('userData', JSON.stringify(u));
              }
            }
          } catch {}
        }

        parsedScheduleResult.subjects.forEach((schedSub: EnrolledScheduleSubject) => {
          const existsInCombined = combinedSubjects.some(
            (c) => (c.code && c.code === schedSub.code) || c.subjectName === schedSub.name.toUpperCase()
          );

          if (!existsInCombined) {
            combinedSubjects.unshift({
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
        });
      }

      setSubjects(combinedSubjects);
      setPageState('review');
    } catch (err: any) {
      setError(err.message || 'Error al procesar los documentos.');
      setPageState('upload');
    }
  };

  const handleConfirm = async () => {
    setPageState('confirmed');
  };

  const resetUpload = () => {
    setFile(null);
    setScheduleFile(null);
    setSubjects([]);
    setError(null);
    setScheduleError(null);
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
              <h1 className={styles.title}>Carga de Documentos Académicos</h1>
              <p className={styles.subtitle}>
                Sube tu historial oficial de la DGAE y tu horario actual para analizar tus materias, créditos y grupos.
              </p>
            </div>

            {error && <div style={{ color: '#f87171', fontSize: '13px', textAlign: 'center' }}>⚠️ {error}</div>}
            {scheduleError && <div style={{ color: '#fbbf24', fontSize: '13px', textAlign: 'center' }}>⚠️ {scheduleError}</div>}

            {/* 1. Zona drag & drop: Tira de Materias (DGAE) */}
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
                <div className={styles.fileReady}>
                  <PdfIcon />
                  <div className={styles.fileInfo}>
                    <span className={styles.fileName}>{file.name}</span>
                    <span className={styles.fileSize}>
                      {(file.size / 1024).toFixed(0)} KB · PDF · Tira de materias
                    </span>
                  </div>
                  <button
                    className={styles.removeFile}
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    title="Quitar archivo"
                  >✕</button>
                </div>
              ) : (
                <div className={styles.dropContent}>
                  <UploadIcon />
                  <p className={styles.dropTitle}>
                    {dragging ? 'Suelta el PDF aquí' : 'Tira de materias (DGAE)'}
                  </p>
                  <p className={styles.dropHint}>Arrastra tu historial académico oficial · Solo PDF</p>
                </div>
              )}
            </div>

            {/* 2. Segundo botón: Horario actual (Comprobante de Inscripción) */}
            <div
              className={`${styles.dropZone} ${scheduleDragging ? styles.dropZoneActive : ''} ${scheduleFile ? styles.dropZoneReady : ''}`}
              onDragOver={(e) => { e.preventDefault(); setScheduleDragging(true); }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setScheduleDragging(false); }}
              onDrop={onScheduleDrop}
              onClick={() => !scheduleFile && scheduleInputRef.current?.click()}
            >
              <input
                ref={scheduleInputRef}
                type="file"
                accept="application/pdf"
                style={{ display: 'none' }}
                onChange={(e) => handleScheduleFile(e.target.files?.[0] ?? null)}
              />

              {scheduleFile ? (
                <div className={styles.fileReady}>
                  <PdfIcon />
                  <div className={styles.fileInfo}>
                    <span className={styles.fileName}>{scheduleFile.name}</span>
                    <span className={styles.fileSize}>
                      {(scheduleFile.size / 1024).toFixed(0)} KB · PDF · Horario actual
                    </span>
                  </div>
                  <button
                    className={styles.removeFile}
                    onClick={(e) => { e.stopPropagation(); setScheduleFile(null); }}
                    title="Quitar archivo"
                  >✕</button>
                </div>
              ) : (
                <div className={styles.dropContent}>
                  <UploadIcon />
                  <p className={styles.dropTitle}>
                    {scheduleDragging ? 'Suelta el PDF aquí' : 'Horario actual'}
                  </p>
                  <p className={styles.dropHint}>Arrastra tu comprobante de inscripción aquí · Solo PDF</p>
                </div>
              )}
            </div>

            {/* Botón enviar */}
            <button
              className={`${styles.sendBtn} ${(!file && !scheduleFile) || pageState === 'loading' ? styles.sendBtnDisabled : ''}`}
              onClick={handleSend}
              disabled={(!file && !scheduleFile) || pageState === 'loading'}
            >
              {pageState === 'loading' ? (
                <span className={styles.loadingRow}>
                  <SpinnerIcon /> Procesando documentos...
                </span>
              ) : file && scheduleFile ? (
                'Analizar historial y horario'
              ) : file ? (
                'Analizar historial'
              ) : (
                'Analizar horario actual'
              )}
            </button>

            <div style={{ marginTop: '8px', textAlign: 'center' }}>
              <button
                onClick={() => window.location.href = '/home'}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(201, 168, 76, 0.7)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '8px'
                }}
              >
                Omitir por ahora y volver al inicio
              </button>
            </div>
          </div>
        )}

        {/* ══ ESTADO: review ══════════════════════════ */}
        {pageState === 'review' && (
          <div className={styles.reviewSection}>
            <div className={styles.reviewHeader}>
              <div className={styles.reviewTitleRow}>
                <CheckCircleIcon />
                <h1 className={styles.title}>Documentos procesados correctamente</h1>
              </div>
              <p className={styles.subtitle}>
                Revisa las materias y horarios vinculados a tu cuenta de estudiante.
              </p>
            </div>

            {/* Tabla de materias */}
            <div className={styles.table}>
              <div className={styles.tableHead}>
                <span>Materia</span>
                <span className={styles.colGrade}>Calificación / Estado</span>
              </div>

              {subjects.map((s) => (
                <div key={s.subjectID} className={styles.tableRow}>
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

                  {s.grade !== undefined && s.grade !== null ? (
                    <span className={`${styles.grade} ${gradeColor(s.grade)}`}>
                      {s.grade}
                    </span>
                  ) : (
                    <span className={styles.inProgressGrade}>Inscrita</span>
                  )}
                </div>
              ))}
            </div>

            {/* Acciones */}
            <div className={styles.reviewActions}>
              <button className={styles.reuploadBtn} onClick={resetUpload}>
                <UploadIcon small /> Subir otros documentos
              </button>
              <button className={styles.confirmBtn} onClick={handleConfirm}>
                Confirmar y continuar
              </button>
            </div>
          </div>
        )}

        {pageState === 'confirmed' && (
          <div className={styles.confirmedSection}>
            <div className={styles.confirmedCard}>
              <div className={styles.confirmedIcon}>
                <BigCheckIcon />
              </div>
              <h2 className={styles.confirmedTitle}>¡Documentos registrados!</h2>
              <p className={styles.confirmedDesc}>
                Tu historial académico y tu horario actual se vincularon correctamente y ya están disponibles en tu perfil.
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

function gradeColor(grade: number): string {
  if (grade >= 9) return styles.gradeHigh;
  if (grade >= 7) return styles.gradeMid;
  return styles.gradeLow;
}

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
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke="#c9a84c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
    <svg className={styles.spinner} width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function BigCheckIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
      stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}
