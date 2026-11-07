'use client';

import React, { useState, useEffect } from 'react';
import styles from './TeacherPage.module.css';
import { TeacherCourse } from './teacherTypes';
import { TeacherAttendanceService } from './teacherAttendanceService';

interface TeacherGroupsPanelProps {
  courses: TeacherCourse[];
  selectedCourseId: string;
  onSelectCourse: (courseId: string) => void;
  onOpenQrModal: (course: TeacherCourse) => void;
  onOpenStudentsModal: (course: TeacherCourse) => void;
  studentsCountMap: Record<string, number>;
}

export default function TeacherGroupsPanel({
  courses,
  selectedCourseId,
  onSelectCourse,
  onOpenQrModal,
  onOpenStudentsModal,
  studentsCountMap,
}: TeacherGroupsPanelProps) {
  // Estado de horario lectivo controlado y validado por el backend
  const [scheduleStatusMap, setScheduleStatusMap] = useState<Record<string, boolean>>({});
  const [isUpdatingSimulation, setIsUpdatingSimulation] = useState<string | null>(null);

  useEffect(() => {
    courses.forEach((c) => {
      TeacherAttendanceService.fetchSectionScheduleStatus(c.id).then((st) => {
        if (st) {
          setScheduleStatusMap((prev) => ({
            ...prev,
            [c.id]: st.inSchedule,
          }));
        }
      });
    });
  }, [courses]);

  const toggleClassSimulation = async (courseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUpdatingSimulation(courseId);
    try {
      const currentActive = Boolean(scheduleStatusMap[courseId]);
      const res = await TeacherAttendanceService.simulateSectionSchedule(
        courseId,
        !currentActive,
      );
      if (res) {
        setScheduleStatusMap((prev) => ({
          ...prev,
          [courseId]: res.inSchedule,
        }));
      }
    } finally {
      setIsUpdatingSimulation(null);
    }
  };

  // Determinar la siguiente clase para mostrar
  const getNextClassInfo = (course: TeacherCourse) => {
    if (course.scheduleSlots.length > 0) {
      const nextSlot = course.scheduleSlots[0];
      return `${nextSlot.day} · ${nextSlot.displayTime}`;
    }
    return course.schedule;
  };

  return (
    <div className={styles.groupsPanel}>
      <div className={styles.panelTitleBar}>
        <div className={styles.panelTitleLeft}>
          <h2 className={styles.panelTitle}>
            <GraduationCapIcon /> Grupos del Semestre
          </h2>
          <span className={styles.panelBadgeCount}>{courses.length} Asignaturas</span>
        </div>
        <p className={styles.panelSubtitle}>
          Selecciona un grupo para validar el horario lectivo y gestionar la asistencia.
        </p>
      </div>

      <div className={styles.cardsList}>
        {courses.length === 0 ? (
          <div
            style={{
              padding: '36px 16px',
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.65)',
              fontSize: '13px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '120px',
            }}
          >
            <span>Cargando asignaturas del docente...</span>
          </div>
        ) : (
          courses.map((course) => {
          const isSelected = course.id === selectedCourseId;
          const isClassActive = Boolean(scheduleStatusMap[course.id]);
          const nextClassText = getNextClassInfo(course);
          const totalStudents = studentsCountMap[course.id] ?? course.students.length;

          return (
            <div
              key={course.id}
              className={`${styles.groupCard} ${isSelected ? styles.groupCardSelected : ''}`}
              onClick={() => onSelectCourse(course.id)}
            >
              {/* Encabezado de la Tarjeta */}
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderLeft}>
                  <span className={`${styles.groupTagPill} ${styles[`tag_${course.colorTag}`]}`}>
                    {course.group}
                  </span>
                  <span className={styles.courseCode}>{course.code}</span>
                </div>

                <div className={styles.studentCounterTag}>
                  <UsersSmallIcon /> {totalStudents} alumnos
                </div>
              </div>

              {/* Título de la Asignatura */}
              <h3 className={styles.courseTitle}>{course.name}</h3>

              {/* Datos de aula y horario oficial */}
              <div className={styles.courseInfoLines}>
                <div className={styles.infoLine}>
                  <ClockIcon /> {course.schedule}
                </div>
                <div className={styles.infoLine}>
                  <BuildingIcon /> {course.classroom}
                </div>
              </div>

              {/* SECCIÓN INTERACTIVA AL HACER CLIC / SELECCIONAR */}
              {isSelected && (
                <div className={styles.interactiveExpandedSection}>
                  <div className={styles.dividerSubtle} />

                  {/* Siguiente clase: [Día y Hora] */}
                  <div className={styles.nextClassBanner}>
                    <span className={styles.nextClassLabel}>Siguiente clase:</span>
                    <strong className={styles.nextClassValue}>{nextClassText}</strong>
                  </div>

                  {/* Validación de Horario (Reactiva / Simulada) */}
                  <div className={styles.scheduleValidationBox}>
                    <div className={styles.validationStatusRow}>
                      <span className={styles.validationIndicatorText}>
                        {isClassActive ? (
                          <span className={styles.statusLive}>
                            <span className={styles.pulseLiveDot} /> Horario de clase activo
                          </span>
                        ) : (
                          <span className={styles.statusInactive}>
                            <span className={styles.idleDot} /> Fuera de horario de clase
                          </span>
                        )}
                      </span>

                      {/* Switch interactivo para simular horario lectivo */}
                      <button
                        type="button"
                        className={styles.simulationToggleBtn}
                        onClick={(e) => toggleClassSimulation(course.id, e)}
                        title="Alternar simulación de horario activo para pruebas"
                      >
                        {isClassActive ? 'Simular: Fuera de horario' : 'Simular: En clase ahora'}
                      </button>
                    </div>

                    {!isClassActive && (
                      <p className={styles.inactiveHint}>
                      </p>
                    )}
                  </div>

                  {/* Botones de Operación por Tarjeta */}
                  <div className={styles.cardActionButtons}>
                    {/* Botón Principal: Ver QR de asistencia */}
                    <button
                      type="button"
                      className={`${styles.btnViewQr} ${!isClassActive ? styles.btnDisabled : ''
                        }`}
                      disabled={!isClassActive}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isClassActive) {
                          onOpenQrModal(course);
                        }
                      }}
                      title={
                        isClassActive
                          ? 'Generar y proyectar código QR de asistencia en pantalla'
                          : 'Disponible únicamente durante el horario lectivo activo'
                      }
                    >
                      <QrIcon />
                      <span>Ver QR de asistencia</span>
                    </button>

                    {/* Botón Secundario: Ver lista de alumnos */}
                    <button
                      type="button"
                      className={styles.btnViewStudents}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenStudentsModal(course);
                      }}
                      title="Ver y gestionar lista de alumnos y pases de lista de hoy"
                    >
                      <ListIcon />
                      <span>Ver lista de alumnos</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
      </div>
    </div>
  );
}

function GraduationCapIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" />
      <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
      <path d="M9 9h1" />
      <path d="M9 13h1" />
      <path d="M9 17h1" />
      <path d="M14 9h1" />
      <path d="M14 13h1" />
      <path d="M14 17h1" />
    </svg>
  );
}

function UsersSmallIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function QrIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <circle cx="6.5" cy="6.5" r="1.5" fill="currentColor" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" />
      <circle cx="17.5" cy="17.5" r="1.5" fill="currentColor" />
      <circle cx="6.5" cy="17.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

