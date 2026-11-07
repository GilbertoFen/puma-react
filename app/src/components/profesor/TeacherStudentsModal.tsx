'use client';

import React, { useState, useEffect } from 'react';
import styles from './TeacherPage.module.css';
import { TeacherCourse, StudentAttendance, AttendanceStatus } from './teacherTypes';
import { TeacherAttendanceService } from './teacherAttendanceService';

interface TeacherStudentsModalProps {
  course: TeacherCourse;
  students: StudentAttendance[];
  onClose: () => void;
  onUpdateStatus: (studentId: string, status: AttendanceStatus) => void;
  onResetAttendance?: (studentId: string) => void;
}

interface SessionItem {
  id: string;
  sectionId: string;
  sessionDate: string;
  startsAt: string;
  closesAt?: string | null;
  status: 'OPEN' | 'CLOSED';
  presentCount: number;
  absentCount: number;
  totalEnrolled: number;
}

interface StudentHistoryRecord {
  sessionId: string;
  sessionDate: string;
  startsAt: string;
  closesAt: string | null;
  sessionStatus: string;
  status: 'PRESENT' | 'ABSENT' | 'PENDING' | 'LATE' | 'EXCUSED';
  method: string | null;
  markedAt: string | null;
  recordId: string | null;
}

export default function TeacherStudentsModal({
  course,
  students: initialStudents,
  onClose,
  onUpdateStatus,
  onResetAttendance,
}: TeacherStudentsModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionStudents, setSessionStudents] = useState<StudentAttendance[]>(initialStudents);
  const [isLoadingSession, setIsLoadingSession] = useState(false);

  // Estado para el modal de historial individual del alumno
  const [historyStudent, setHistoryStudent] = useState<{
    id: string;
    name: string;
    accountNumber: string;
  } | null>(null);
  const [studentHistoryRecords, setStudentHistoryRecords] = useState<StudentHistoryRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // 1. Cargar las sesiones reales de esta materia desde el backend
  useEffect(() => {
    let active = true;
    TeacherAttendanceService.fetchSectionSessions(course.id)
      .then((sessList) => {
        if (!active || !Array.isArray(sessList)) return;
        setSessions(sessList);
        if (sessList.length > 0) {
          // Seleccionar por defecto la primera (la más reciente / hoy)
          setSelectedSessionId(sessList[0].id);
        }
      })
      .catch((err) => console.warn('Aviso al recuperar sesiones:', err));
    return () => {
      active = false;
    };
  }, [course.id]);

  // 2. Al cambiar la sesión seleccionada, cargar los registros de esa fecha concreta
  useEffect(() => {
    if (!selectedSessionId) {
      setSessionStudents(initialStudents);
      return;
    }

    let active = true;
    setIsLoadingSession(true);
    TeacherAttendanceService.fetchSessionRecords(selectedSessionId)
      .then((records) => {
        if (!active || !Array.isArray(records)) return;

        // Mapear los registros de la sesión a formato StudentAttendance
        const mapped: StudentAttendance[] = records.map((r: any) => {
          let currentStatus: 'presente' | 'falta' | 'pendiente' = 'pendiente';
          if (r.status === 'PRESENT') currentStatus = 'presente';
          else if (r.status === 'ABSENT') currentStatus = 'falta';

          return {
            id: r.studentId,
            name: r.name,
            accountNumber: r.accountNumber,
            currentStatus,
            markedAt: r.markedAt || undefined,
            attendanceMethod: r.method === 'QR' ? 'QR' : undefined,
          };
        });

        setSessionStudents(mapped);
      })
      .catch((err) => console.warn('Error al cargar alumnos de la sesión:', err))
      .finally(() => {
        if (active) setIsLoadingSession(false);
      });

    return () => {
      active = false;
    };
  }, [selectedSessionId, initialStudents]);

  // 3. Consultar historial de un alumno específico
  const handleOpenStudentHistory = async (st: { id: string; name: string; accountNumber: string }) => {
    setHistoryStudent(st);
    setLoadingHistory(true);
    try {
      const records = await TeacherAttendanceService.fetchSectionStudentHistory(course.id, st.id);
      setStudentHistoryRecords(records || []);
    } catch (err) {
      console.warn('Error al cargar historial del alumno:', err);
      setStudentHistoryRecords([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const displayedStudents = sessionStudents.length > 0 ? sessionStudents : initialStudents;

  const filteredStudents = displayedStudents.filter(
    (st) =>
      st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.accountNumber.includes(searchTerm),
  );

  const presentCount = displayedStudents.filter((s) => s.currentStatus === 'presente').length;
  const pendingCount = displayedStudents.filter((s) => s.currentStatus === 'pendiente').length;
  const absentCount = displayedStudents.filter((s) => s.currentStatus === 'falta').length;

  const currentSessionObj = sessions.find((s) => s.id === selectedSessionId);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.studentsModalWindow} onClick={(e) => e.stopPropagation()}>
        {/* Cabecera del Modal */}
        <div className={styles.studentsModalHeader}>
          <div className={styles.studentsModalTitles}>
            <div className={styles.modalBadgeRow}>
              <span className={styles.qrCourseBadge}>{course.group}</span>
              <span className={styles.qrCodeBadge}>{course.code}</span>
            </div>
            <h2 className={styles.studentsModalTitle}>
              Control de Asistencias · {course.name}
            </h2>
          </div>

          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            aria-label="Cerrar lista de alumnos"
          >
            ✕
          </button>
        </div>

        {/* Barra de Selección de Sesión / Fecha */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 28px',
            background: 'rgba(201, 168, 76, 0.08)',
            borderBottom: '1px solid rgba(201, 168, 76, 0.25)',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffd54f' }}>
              Fecha de clase:
            </span>
            {sessions.length > 0 ? (
              <select
                value={selectedSessionId || ''}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                style={{
                  background: 'rgba(6, 13, 31, 0.85)',
                  border: '1px solid rgba(201, 168, 76, 0.5)',
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {sessions.map((sess, idx) => {
                  const dObj = new Date(sess.sessionDate || sess.startsAt);
                  const dateStr = dObj.toLocaleDateString('es-MX', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });
                  const isCurrent = idx === 0 && sess.status === 'OPEN';
                  return (
                    <option key={sess.id} value={sess.id}>
                      {dateStr} {isCurrent ? '· EN CURSO (Hoy)' : sess.status === 'OPEN' ? '· Abierta' : '· Finalizada'} ({sess.presentCount} presentes)
                    </option>
                  );
                })}
              </select>
            ) : (
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                Sesión del día de hoy
              </span>
            )}
          </div>
        </div>

        {/* Barra de Filtros y Resumen */}
        <div className={styles.studentsToolbar}>
          {/* Buscador */}
          <div className={styles.searchBoxWrap}>
            <SearchIcon />
            <input
              type="text"
              className={styles.studentSearchInput}
              placeholder="Buscar por nombre o número de cuenta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className={styles.clearSearchBtn}
                onClick={() => setSearchTerm('')}
              >
                ✕
              </button>
            )}
          </div>

          {/* Badges de Conteo */}
          <div className={styles.statusCountersRow}>
            <span className={`${styles.counterBadge} ${styles.counterPresent}`}>
              ● {presentCount} Presentes (QR)
            </span>
            <span className={`${styles.counterBadge} ${styles.counterPending}`}>
              ● {pendingCount} Pendientes
            </span>
            <span className={`${styles.counterBadge} ${styles.counterAbsent}`}>
              ● {absentCount} Faltas
            </span>
            <span className={styles.counterBadgeTotal}>Total: {displayedStudents.length}</span>
          </div>
        </div>

        {/* TABLA DE ASISTENCIA */}
        <div className={styles.tableScrollWrapper}>
          {isLoadingSession ? (
            <div style={{ padding: '36px', textAlign: 'center', color: '#c9a84c' }}>
              Cargando registros de la fecha seleccionada...
            </div>
          ) : (
            <table className={styles.minimalTable}>
              <thead>
                <tr>
                  <th className={styles.thName}>1. Nombre del Alumno</th>
                  <th className={styles.thAccount}>2. Cuenta</th>
                  <th className={styles.thStatus}>3. Estado en esta Fecha</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: '#c9a84c', fontSize: '12px' }}>
                    4. Historial Completo
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((st) => {
                    const isPresent = st.currentStatus === 'presente';
                    const isPending = st.currentStatus === 'pendiente';
                    const isAbsent = st.currentStatus === 'falta';

                    return (
                      <tr key={st.id} className={styles.tableRow}>
                        {/* Columna 1: Nombre */}
                        <td className={styles.tdName}>
                          <div className={styles.studentNameCell}>
                            <div className={styles.studentAvatarMini}>{st.name.charAt(0)}</div>
                            <span className={styles.nameText}>{st.name}</span>
                          </div>
                        </td>

                        {/* Columna 2: Número de cuenta */}
                        <td className={styles.tdAccount}>
                          <code className={styles.accountNumberCode}>{st.accountNumber}</code>
                        </td>

                        {/* Columna 3: Control de asistencia para esta fecha */}
                        <td className={styles.tdStatus}>
                          {isPresent ? (
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                                alignItems: 'flex-start',
                              }}
                            >
                              <div
                                className={styles.statusPresentLockedPill}
                                title="Asistencia validada mediante escaneo de código QR."
                              >
                                <span className={styles.lockedIconCheck}>✓</span>
                                <span className={styles.lockedText}>Presente</span>
                                <span className={styles.lockedTag}>Validado vía QR</span>
                              </div>
                              {onResetAttendance && (
                                <button
                                  type="button"
                                  className={styles.btnActionRemoveAttendance}
                                  onClick={() => onResetAttendance(st.id)}
                                  title="Quitar asistencia a este alumno para repetir pruebas"
                                >
                                  ✕ Quitar asistencia (Pruebas)
                                </button>
                              )}
                            </div>
                          ) : isPending ? (
                            <div className={styles.statusActionCluster}>
                              <span className={styles.badgePendingCurrent}>
                                <span className={styles.pendingDotIcon}>⏱</span> Pendiente
                              </span>
                              <button
                                type="button"
                                className={styles.btnActionMarkAbsent}
                                onClick={() => onUpdateStatus(st.id, 'falta')}
                                title="Marcar falta al término de la sesión"
                              >
                                ✕ Marcar Falta
                              </button>
                            </div>
                          ) : isAbsent ? (
                            <div className={styles.statusActionCluster}>
                              <span className={styles.badgeAbsentCurrent}>✕ Falta</span>
                              <button
                                type="button"
                                className={styles.btnActionRevertPending}
                                onClick={() => onUpdateStatus(st.id, 'pendiente')}
                                title="Revertir estado a Pendiente"
                              >
                                Revertir a Pendiente
                              </button>
                            </div>
                          ) : null}
                        </td>

                        {/* Columna 4: Historial Individual del Alumno */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenStudentHistory(st)}
                            style={{
                              background: 'rgba(201, 168, 76, 0.15)',
                              border: '1px solid rgba(201, 168, 76, 0.4)',
                              color: '#ffd54f',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                            title="Ver todas las fechas y asistencias registradas de este alumno"
                          >
                            Ver historial
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className={styles.noResultsCell}>
                      No se encontraron alumnos que coincidan con &quot;{searchTerm}&quot;
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pie del modal */}
        <div className={styles.studentsModalFooter}>
          <span className={styles.footerNote}>
            Los datos reflejan los pases de lista almacenados individualmente por fecha en la base de datos oficial.
          </span>
          <button type="button" className={styles.footerCloseBtn} onClick={onClose}>
            Aceptar y Cerrar
          </button>
        </div>
      </div>

      {/* ── MODAL SUB-NIVEL: HISTORIAL INDIVIDUAL DEL ALUMNO ── */}
      {historyStudent && (
        <div
          className={styles.modalOverlay}
          style={{ zIndex: 1200, background: 'rgba(0, 0, 0, 0.85)' }}
          onClick={() => setHistoryStudent(null)}
        >
          <div
            style={{
              background: '#0d1527',
              border: '1px solid rgba(201, 168, 76, 0.4)',
              borderRadius: '16px',
              padding: '24px 28px',
              maxWidth: '620px',
              width: '90%',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#c9a84c', fontWeight: 700, textTransform: 'uppercase' }}>
                  Historial Individual de Asistencia
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: '4px 0 0' }}>
                  {historyStudent.name}
                </h3>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                  Cuenta: {historyStudent.accountNumber} · Asignatura: {course.name} ({course.group})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setHistoryStudent(null)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                ✕
              </button>
            </div>

            {loadingHistory ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#c9a84c', fontSize: '13px' }}>
                Cargando historial de clases del alumno...
              </div>
            ) : (
              <div>
                {/* Resumen */}
                {(() => {
                  const total = studentHistoryRecords.length;
                  const presents = studentHistoryRecords.filter((r) => r.status === 'PRESENT').length;
                  const absents = studentHistoryRecords.filter((r) => r.status === 'ABSENT').length;
                  const pct = total > 0 ? Math.round((presents / total) * 100) : 100;

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          gap: '8px',
                          background: 'rgba(0,0,0,0.3)',
                          padding: '12px',
                          borderRadius: '8px',
                          textAlign: 'center',
                          fontSize: '12px',
                        }}
                      >
                        <div>
                          <span style={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>Clases impartidas</span>
                          <strong style={{ color: '#fff', fontSize: '14px' }}>{total}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>Asistencias</span>
                          <strong style={{ color: '#4ade80', fontSize: '14px' }}>{presents}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>Faltas</span>
                          <strong style={{ color: '#f87171', fontSize: '14px' }}>{absents}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>% Asistencia</span>
                          <strong
                            style={{
                              color: pct >= 80 ? '#4ade80' : pct >= 60 ? '#facc15' : '#f87171',
                              fontSize: '14px',
                            }}
                          >
                            {pct}%
                          </strong>
                        </div>
                      </div>

                      {/* Lista cronológica de fechas */}
                      <div
                        style={{
                          maxHeight: '260px',
                          overflowY: 'auto',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          marginTop: '6px',
                        }}
                      >
                        {studentHistoryRecords.length > 0 ? (
                          studentHistoryRecords.map((rec) => {
                            const dObj = new Date(rec.sessionDate || rec.startsAt);
                            const dateStr = dObj.toLocaleDateString('es-MX', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            });
                            const timeStr = rec.markedAt
                              ? new Date(rec.markedAt).toLocaleTimeString('es-MX', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '—';
                            const isPresent = rec.status === 'PRESENT';
                            const isAbsent = rec.status === 'ABSENT';

                            return (
                              <div
                                key={rec.sessionId}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '8px 12px',
                                  background: 'rgba(255,255,255,0.03)',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  borderLeft: `3px solid ${
                                    isPresent ? '#4ade80' : isAbsent ? '#f87171' : '#c9a84c'
                                  }`,
                                }}
                              >
                                <div>
                                  <strong style={{ color: '#fff', textTransform: 'capitalize', display: 'block' }}>
                                    {dateStr}
                                  </strong>
                                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
                                    Hora marcada: {timeStr} hrs · Método:{' '}
                                    {rec.method === 'QR' ? 'Código QR Dinámico' : 'Pase manual'}
                                  </span>
                                </div>
                                <div>
                                  {isPresent ? (
                                    <span
                                      style={{
                                        color: '#4ade80',
                                        background: 'rgba(74, 222, 128, 0.15)',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        fontWeight: 700,
                                      }}
                                    >
                                      ✓ Presente
                                    </span>
                                  ) : isAbsent ? (
                                    <span
                                      style={{
                                        color: '#f87171',
                                        background: 'rgba(239, 68, 68, 0.15)',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        fontWeight: 700,
                                      }}
                                    >
                                      ✗ Falta
                                    </span>
                                  ) : (
                                    <span
                                      style={{
                                        color: 'rgba(255,255,255,0.6)',
                                        background: 'rgba(255,255,255,0.08)',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                      }}
                                    >
                                      ⏱ Pendiente
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div style={{ textAlign: 'center', padding: '16px', color: 'rgba(255,255,255,0.5)' }}>
                            No hay sesiones de clase registradas para esta asignatura todavía.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <button
              type="button"
              onClick={() => setHistoryStudent(null)}
              style={{
                alignSelf: 'flex-end',
                background: 'rgba(201, 168, 76, 0.2)',
                border: '1px solid rgba(201, 168, 76, 0.4)',
                color: '#ffd54f',
                padding: '8px 18px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: '8px',
              }}
            >
              Cerrar Historial
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ opacity: 0.6 }}
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
