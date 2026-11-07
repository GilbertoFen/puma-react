'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './TeacherPage.module.css';
import {
  TeacherCourse,
  TeacherProfile,
  QrTokenPayload,
  StudentAttendance,
} from './teacherTypes';
import DynamicQrCode from './DynamicQrCode';
import { TeacherAttendanceService } from './teacherAttendanceService';
import { ENV } from '../../config/env.config';

interface TeacherQrModalProps {
  course: TeacherCourse;
  teacher: TeacherProfile;
  students: StudentAttendance[];
  onClose: () => void;
  onStudentScanned: (studentId: string) => void;
  onResetStudentAttendance?: (studentId: string) => void;
  onResetAllAttendances?: () => void;
}

const ROTATION_INTERVAL_SECONDS = 5; // Rotación automática continua cada 5 segundos

export default function TeacherQrModal({
  course,
  teacher,
  students,
  onClose,
  onStudentScanned,
  onResetStudentAttendance,
  onResetAllAttendances,
}: TeacherQrModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(ROTATION_INTERVAL_SECONDS);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateSalt = () => {
    return `QR-${(
      Math.random().toString(36).substring(2, 8) +
      Date.now().toString(36).substring(4)
    ).toUpperCase()}`;
  };

  const [qrPayload, setQrPayload] = useState<QrTokenPayload | null>(() => {
    const expiresAt = Date.now() + ROTATION_INTERVAL_SECONDS * 1000;
    return {
      sessionId: `sess-${course.id}-${Date.now()}`,
      courseId: course.id,
      groupId: course.group,
      dynamicSalt: generateSalt(),
      expiresAt,
    };
  });

  const [scanFeedback, setScanFeedback] = useState<{
    studentName: string;
    timestamp: string;
  } | null>(null);

  const [totalScannedCount, setTotalScannedCount] = useState(() => {
    return students.filter((s) => s.currentStatus === 'presente').length;
  });

  useEffect(() => {
    setTotalScannedCount(students.filter((s) => s.currentStatus === 'presente').length);
  }, [students]);

  // Al abrir el modal, abrir o recuperar la sesión real en /api/attendance/sessions
  useEffect(() => {
    let cancelled = false;
    TeacherAttendanceService.openSession(course.id).then((session) => {
      if (cancelled || !session) return;
      setActiveSessionId(session.id);
      if (session.qrToken) {
        setQrPayload({
          sessionId: session.id,
          courseId: course.id,
          groupId: course.group,
          dynamicSalt: session.qrToken,
          expiresAt: session.qrExpiresAt
            ? new Date(session.qrExpiresAt).getTime()
            : Date.now() + ROTATION_INTERVAL_SECONDS * 1000,
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [course.id, course.group]);

  const rotateToken = useCallback(
    async (_reason: 'timeout' | 'scan' | 'manual') => {
      if (activeSessionId) {
        const dynamic = await TeacherAttendanceService.fetchDynamicQrToken(
          activeSessionId,
        );
        if (dynamic) {
          setQrPayload({
            sessionId: dynamic.sessionId,
            courseId: course.id,
            groupId: course.group,
            dynamicSalt: dynamic.qrToken,
            expiresAt: new Date(dynamic.expiresAt).getTime(),
          });
          setSecondsLeft(dynamic.windowSeconds || ROTATION_INTERVAL_SECONDS);
          return;
        }
      }

      const nextExpiresAt = Date.now() + ROTATION_INTERVAL_SECONDS * 1000;
      const newPayload: QrTokenPayload = {
        sessionId: activeSessionId || `sess-${course.id}-${Date.now()}`,
        courseId: course.id,
        groupId: course.group,
        dynamicSalt: generateSalt(),
        expiresAt: nextExpiresAt,
      };

      setQrPayload(newPayload);
      setSecondsLeft(ROTATION_INTERVAL_SECONDS);
    },
    [activeSessionId, course.id, course.group],
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          rotateToken('timeout');
          return ROTATION_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [rotateToken]);

  // Polling periódico cada 3 segundos para detectar en tiempo real cuando el alumno escanea el QR
  useEffect(() => {
    if (!activeSessionId) return;

    let isSubscribed = true;
    const pollRecords = async () => {
      try {
        const records = await TeacherAttendanceService.fetchSessionRecords(activeSessionId);
        if (!isSubscribed || !Array.isArray(records)) return;

        const presentStudentIds = new Set(
          records.filter((r: any) => r.status === 'PRESENT').map((r: any) => r.studentId)
        );

        records.forEach((rec: any) => {
          if (rec.status === 'PRESENT') {
            onStudentScanned(rec.studentId);
          }
        });

        // Revertir en memoria si el docente quitó la asistencia o se eliminó en backend
        students.forEach((st) => {
          if (st.currentStatus === 'presente' && !presentStudentIds.has(st.id)) {
            onResetStudentAttendance?.(st.id);
          }
        });

        setTotalScannedCount(presentStudentIds.size);
      } catch (err) {
        console.warn('Error en sondeo de asistencia:', err);
      }
    };

    pollRecords();
    const interval = setInterval(pollRecords, 3000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [activeSessionId, onStudentScanned, onResetStudentAttendance, students]);

  const handleRemoveStudentAttendance = async (studentId: string) => {
    if (activeSessionId) {
      await TeacherAttendanceService.resetStudentAttendance(activeSessionId, studentId);
    }
    onResetStudentAttendance?.(studentId);
    setTotalScannedCount((prev) => Math.max(0, prev - 1));
  };

  const handleResetAllSessionAttendances = async () => {
    if (activeSessionId) {
      await TeacherAttendanceService.resetAllSessionAttendances(activeSessionId);
    }
    onResetAllAttendances?.();
    setTotalScannedCount(0);
  };

  const handleCloseSession = async () => {
    if (activeSessionId) {
      await TeacherAttendanceService.closeSession(activeSessionId);
    }
    onClose();
  };

  const isDestroyedRef = useRef(false);
  useEffect(() => {
    return () => {
      isDestroyedRef.current = true;
      setQrPayload(null);
    };
  }, []);

  const handleSimulateScan = () => {
    const pendingStudent = students.find((s) => s.currentStatus === 'pendiente');

    if (pendingStudent) {
      onStudentScanned(pendingStudent.id);
      setTotalScannedCount((c) => Math.min(c + 1, students.length));

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setScanFeedback({
        studentName: pendingStudent.name,
        timestamp: timeStr,
      });
      // El escaneo registra la asistencia pero NO interrumpe ni altera la rotación cada 5s
    } else {
      setScanFeedback({
        studentName: 'Todos los alumnos están presentes',
        timestamp: new Date().toLocaleTimeString(),
      });
    }

    setTimeout(() => {
      setScanFeedback(null);
    }, 4500);
  };

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const percentageLeft = (secondsLeft / ROTATION_INTERVAL_SECONDS) * 100;

  const baseUrl =
    (typeof window !== 'undefined' && window.location?.origin) ||
    ENV.APP_URL ||
    'http://localhost:3000';
  const testUrl = qrPayload
    ? `${baseUrl}/attendance?sessionId=${encodeURIComponent(qrPayload.sessionId)}&secret=${encodeURIComponent(qrPayload.dynamicSalt)}&courseName=${encodeURIComponent(course.name)}&group=${encodeURIComponent(course.group)}&sectionId=${encodeURIComponent(course.id)}&subjectCode=${encodeURIComponent(course.code)}`
    : '';

  const presentStudents = students.filter((s) => s.currentStatus === 'presente');

  const handleCopyLink = () => {
    if (!testUrl || typeof navigator === 'undefined' || !navigator.clipboard) return;
    navigator.clipboard.writeText(testUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.qrModalWindow}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.qrModalHeader}>
          <div className={styles.qrHeaderTitles}>
            <div className={styles.modalBadgeRow}>
              <span className={styles.qrCourseBadge}>{course.group}</span>
              <span className={styles.qrCodeBadge}>{course.code}</span>
            </div>

            <h2 className={styles.qrModalTitle}>{course.name}</h2>

            <div className={styles.qrMetaDetails}>
              <span className={styles.qrMetaItem}>
                <strong>Profesor:</strong> {teacher.name}
              </span>
              <span className={styles.qrMetaItemDivider}>·</span>
              <span className={styles.qrMetaItem}>
                <strong>Horario de Clase:</strong> {course.schedule}
              </span>
              <span className={styles.qrMetaItemDivider}>·</span>
              <span className={styles.qrMetaItem}>
                <strong>Aula:</strong> {course.classroom}
              </span>
            </div>
          </div>

          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            aria-label="Cerrar ventana de QR"
            title="Cerrar ventana"
          >
            ✕
          </button>
        </div>

        <div className={styles.qrModalBody}>
          <div className={styles.qrDisplayCard}>
            <DynamicQrCode url={testUrl} payload={qrPayload} size={280} />

            <div className={styles.timerContainer}>
              <div className={styles.timerHeaderRow}>
                <span className={styles.timerLabel}>
                  <TimerIcon /> Rotación de seguridad automática (5s):
                </span>
                <span className={styles.countdownDigits}>
                  {formatCountdown(secondsLeft)} ({secondsLeft}s)
                </span>
              </div>

              <div className={styles.timerProgressBarTrack}>
                <div
                  className={styles.timerProgressBarFill}
                  style={{ width: `${percentageLeft}%` }}
                />
              </div>
            </div>

            {/* Enlace de asistencia del alumno */}
            {testUrl && (
              <div className={styles.qrTestLinkCard}>
                <div className={styles.qrTestLinkHeader}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#ffd54f' }}>
                    {course.group} · {course.name}
                  </span>
                </div>
                <p className={styles.qrTestDesc}>
                  Enlace directo para validar asistencia del alumno:
                </p>
                <div className={styles.qrTestInputRow}>
                  <input
                    type="text"
                    readOnly
                    value={testUrl}
                    className={styles.qrTestUrlInput}
                    title="Enlace de asistencia para el alumno"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    type="button"
                    className={styles.qrTestBtnCopy}
                    onClick={handleCopyLink}
                    title="Copiar enlace al portapapeles"
                  >
                    {copied ? '¡Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className={styles.qrSecuritySidePanel}>
            {scanFeedback && (
              <div className={styles.scanSuccessAlert}>
                <div className={styles.scanAlertIcon}>✓</div>
                <div className={styles.scanAlertText}>
                  <strong>¡Asistencia registrada con éxito!</strong>
                  <span>
                    {scanFeedback.studentName} ({scanFeedback.timestamp})
                  </span>
                  <span className={styles.rotatedNotice}>
                    Código QR rotado automáticamente.
                  </span>
                </div>
              </div>
            )}

            <div className={styles.scannedCounterCard}>
              <div className={styles.counterRow}>
                <span className={styles.counterLabel}>
                  Alumnos presentes hoy:
                </span>
                <span className={styles.counterValue}>
                  {totalScannedCount} <small>/ {students.length}</small>
                </span>
              </div>
              <div className={styles.counterProgressBg}>
                <div
                  className={styles.counterProgressFill}
                  style={{
                    width: `${
                      students.length > 0
                        ? (totalScannedCount / students.length) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Lista en tiempo real de alumnos presentes con opción de quitar asistencia (Pruebas) */}
            {presentStudents.length > 0 && (
              <div className={styles.activeScannedList}>
                <div className={styles.activeScannedHeader}>
                  <span>Alumnos registrados hoy ({presentStudents.length})</span>
                  <button
                    type="button"
                    className={styles.btnResetAllTest}
                    onClick={handleResetAllSessionAttendances}
                    title="Quitar todas las asistencias de prueba"
                  >
                    ↺ Quitar todas (Pruebas)
                  </button>
                </div>
                {presentStudents.map((st) => (
                  <div key={st.id} className={styles.activeScannedRow}>
                    <div className={styles.activeScannedInfo}>
                      <span className={styles.activeScannedName}>{st.name}</span>
                      <span className={styles.activeScannedAcc}>{st.accountNumber}</span>
                    </div>
                    <button
                      type="button"
                      className={styles.btnRemoveSingleAttendance}
                      onClick={() => handleRemoveStudentAttendance(st.id)}
                      title="Quitar asistencia de prueba a este alumno"
                    >
                      ✕ Quitar
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.qrActionButtonsStack}>
              <button
                type="button"
                className={styles.btnSimulateScanAction}
                onClick={handleSimulateScan}
                title="Registrar asistencia y rotar código QR"
              >
                <ScanPhoneIcon />
                <span>Escanear</span>
              </button>

              <button
                type="button"
                className={styles.btnManualRotateAction}
                onClick={() => rotateToken('manual')}
                title="Forzar nueva rotación inmediata del código QR"
              >
                <RefreshIcon />
                <span>Rotar código manualmente</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimerIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ScanPhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
      <path d="M9 7h6" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}
