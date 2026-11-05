'use client';

import React, { useState } from 'react';
import styles from './TeacherPage.module.css';
import { TeacherCourse, StudentAttendance, AttendanceStatus } from './teacherTypes';

interface TeacherStudentsModalProps {
  course: TeacherCourse;
  students: StudentAttendance[];
  onClose: () => void;
  onUpdateStatus: (studentId: string, status: AttendanceStatus) => void;
  onResetAttendance?: (studentId: string) => void;
}

export default function TeacherStudentsModal({
  course,
  students,
  onClose,
  onUpdateStatus,
  onResetAttendance,
}: TeacherStudentsModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = students.filter(
    (st) =>
      st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.accountNumber.includes(searchTerm)
  );

  const presentCount = students.filter((s) => s.currentStatus === 'presente').length;
  const pendingCount = students.filter((s) => s.currentStatus === 'pendiente').length;
  const absentCount = students.filter((s) => s.currentStatus === 'falta').length;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.studentsModalWindow}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal sin el subtítulo descriptivo */}
        <div className={styles.studentsModalHeader}>
          <div className={styles.studentsModalTitles}>
            <div className={styles.modalBadgeRow}>
              <span className={styles.qrCourseBadge}>{course.group}</span>
              <span className={styles.qrCodeBadge}>{course.code}</span>
            </div>
            <h2 className={styles.studentsModalTitle}>
              Lista de Alumnos · {course.name}
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

        {/* Barra de Filtros y Resumen (Sin botón de marcar todos presentes) */}
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
            <span className={styles.counterBadgeTotal}>
              Total: {students.length}
            </span>
          </div>
        </div>

        {/* TABLA DE ASISTENCIA CON REGLAS DE NEGOCIO ESTRICTAS */}
        <div className={styles.tableScrollWrapper}>
          <table className={styles.minimalTable}>
            <thead>
              <tr>
                <th className={styles.thName}>1. Nombre del Alumno</th>
                <th className={styles.thAccount}>2. Número de Cuenta</th>
                <th className={styles.thStatus}>3. Estado de Asistencia (Hoy)</th>
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
                          <div className={styles.studentAvatarMini}>
                            {st.name.charAt(0)}
                          </div>
                          <span className={styles.nameText}>{st.name}</span>
                        </div>
                      </td>

                      {/* Columna 2: Número de cuenta */}
                      <td className={styles.tdAccount}>
                        <code className={styles.accountNumberCode}>{st.accountNumber}</code>
                      </td>

                      {/* Columna 3: Control unidireccional y blindado de asistencia */}
                      <td className={styles.tdStatus}>
                        {isPresent ? (
                          // BLOQUEO UNIDIRECCIONAL CON CONTROL DE PRUEBAS PARA REVERTIR
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                            <div
                              className={styles.statusPresentLockedPill}
                              title="Asistencia validada mediante escaneo de código QR."
                            >
                              <span className={styles.lockedIconCheck}>✓</span>
                              <span className={styles.lockedText}>Presente</span>
                              <span className={styles.lockedTag}>Validado vía QR</span>
                            </div>
                            <button
                              type="button"
                              className={styles.btnActionRemoveAttendance}
                              onClick={() => onResetAttendance?.(st.id)}
                              title="Quitar asistencia a este alumno para repetir pruebas"
                            >
                              ✕ Quitar asistencia (Pruebas)
                            </button>
                          </div>
                        ) : isPending ? (
                          // ESTADO INICIAL PENDIENTE: Única acción permitida al docente es pasar a FALTA
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
                          // ESTADO FALTA: Marcado manualmente por el profesor (con opción de revertir a Pendiente si hubo error)
                          <div className={styles.statusActionCluster}>
                            <span className={styles.badgeAbsentCurrent}>
                              ✕ Falta
                            </span>
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
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3} className={styles.noResultsCell}>
                    No se encontraron alumnos que coincidan con &quot;{searchTerm}&quot;
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pie del modal */}
        <div className={styles.studentsModalFooter}>
          <span className={styles.footerNote}>
            Los alumnos acreditados vía QR quedan bloqueados para garantizar la transparencia del registro.
          </span>
          <button type="button" className={styles.footerCloseBtn} onClick={onClose}>
            Aceptar y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
