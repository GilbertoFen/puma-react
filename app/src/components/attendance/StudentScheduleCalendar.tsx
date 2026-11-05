'use client';

import React, { useState } from 'react';
import styles from '../profesor/TeacherPage.module.css';
import { DayOfWeek } from '../profesor/teacherTypes';
import { EnrolledScheduleSubject } from '../../services/schedule.service';
import { AttendanceRecordResponse } from '../../services/attendance.service';

interface StudentScheduleCalendarProps {
  subjects: EnrolledScheduleSubject[];
  attendanceRecords: AttendanceRecordResponse[];
}

const DAYS: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const DEFAULT_HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

const COLOR_PALETTE = ['gold', 'blue', 'cyan', 'navy'] as const;

export default function StudentScheduleCalendar({
  subjects,
  attendanceRecords,
}: StudentScheduleCalendarProps) {
  const [selectedSubject, setSelectedSubject] = useState<EnrolledScheduleSubject | null>(null);

  // Mapear materias a slots en días y horas
  const parsedCourses = React.useMemo(() => {
    return subjects.map((sub, idx) => {
      const colorTag = COLOR_PALETTE[idx % COLOR_PALETTE.length];

      // Parsear días
      const daysFound: DayOfWeek[] = [];
      const lowerDays = (sub.days || '').toLowerCase();
      if (lowerDays.includes('lun') || lowerDays.includes('lu')) daysFound.push('Lunes');
      if (lowerDays.includes('mar') || lowerDays.includes('ma')) daysFound.push('Martes');
      if (lowerDays.includes('mié') || lowerDays.includes('mie') || lowerDays.includes('mi')) daysFound.push('Miércoles');
      if (lowerDays.includes('jue') || lowerDays.includes('ju')) daysFound.push('Jueves');
      if (lowerDays.includes('vie') || lowerDays.includes('vi')) daysFound.push('Viernes');

      // Parsear horas
      const hourMatches = Array.from((sub.time || '').matchAll(/(\d{1,2}):\d{2}/g)).map(m => parseInt(m[1], 10));
      let startHour = 7;
      let endHour = 9;

      if (hourMatches.length >= 2) {
        startHour = hourMatches[0];
        endHour = hourMatches[1];
      } else if (hourMatches.length === 1) {
        startHour = hourMatches[0];
        endHour = startHour + 2;
      }

      // Horario de visualización
      const displayTime = `${startHour.toString().padStart(2, '0')}:00 - ${endHour.toString().padStart(2, '0')}:00`;

      // Cruzar con registros de asistencia
      const cleanSubCode = String(sub.code || '').replace(/\D/g, '');
      const subSectionId = (sub as any).sectionId;
      const normalize = (str: string) =>
        str
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

      const cleanSubName = normalize(sub.officialName || sub.name || '');

      const matchingRecords = attendanceRecords.filter((rec: any) => {
        const recSectionId = rec.session?.sectionId || rec.session?.section?.id;

        // 1. Coincidencia directa por ID de sección (el identificador más exacto)
        if (subSectionId && recSectionId && subSectionId === recSectionId) {
          return true;
        }

        // 2. Coincidencia por clave oficial de materia (ej. 1754 vs 1086)
        const recSubCode = String(rec.session?.section?.subject?.code || '').replace(/\D/g, '');
        if (cleanSubCode && recSubCode && cleanSubCode === recSubCode) {
          return true;
        }

        // 3. Coincidencia por nombre normalizado de materia
        const recSubName = normalize(
          rec.session?.section?.subject?.subject ||
          rec.session?.section?.subject?.name ||
          rec.session?.section?.name ||
          ''
        );

        if (cleanSubName && recSubName) {
          if (cleanSubName === recSubName) return true;
          if (
            cleanSubName.length >= 8 &&
            recSubName.length >= 8 &&
            (recSubName.includes(cleanSubName) || cleanSubName.includes(recSubName))
          ) {
            return true;
          }
        }

        return false;
      });

      const hasPresent = matchingRecords.some(r => r.status === 'PRESENT');
      const hasAbsent = matchingRecords.some(r => r.status === 'ABSENT');

      let attendanceStatus: 'present' | 'absent' | 'pending' = 'pending';
      if (hasPresent) {
        attendanceStatus = 'present';
      } else if (hasAbsent) {
        attendanceStatus = 'absent';
      }

      const scheduleSlots = daysFound.map(day => ({
        day,
        startHour,
        endHour,
        displayTime,
      }));

      return {
        id: sub.code || `sub-${idx}`,
        name: sub.officialName || sub.name,
        code: sub.code,
        credits: sub.credits,
        group: sub.group,
        classroom: sub.classroom || 'Aula FES',
        professor: sub.professor || 'Profesor asignado',
        colorTag,
        scheduleSlots,
        attendanceStatus,
        matchingRecords,
        rawSubject: sub,
      };
    });
  }, [subjects, attendanceRecords]);

  // Determinar rango horario dinámico para mostrar en el calendario
  const calendarHours = React.useMemo(() => {
    let minH = 7;
    let maxH = 15;

    for (const c of parsedCourses) {
      for (const s of c.scheduleSlots) {
        if (s.startHour < minH) minH = s.startHour;
        if (s.endHour > maxH) maxH = s.endHour;
      }
    }

    const hours: number[] = [];
    for (let h = Math.max(7, minH); h <= Math.min(22, maxH); h++) {
      hours.push(h);
    }
    return hours.length > 0 ? hours : DEFAULT_HOURS;
  }, [parsedCourses]);

  const getSlotAt = (day: DayOfWeek, hour: number) => {
    for (const course of parsedCourses) {
      for (const slot of course.scheduleSlots) {
        if (slot.day === day && slot.startHour <= hour && hour < slot.endHour) {
          const isFirstHour = slot.startHour === hour;
          return {
            course,
            slot,
            isFirstHour,
            duration: slot.endHour - slot.startHour,
          };
        }
      }
    }
    return null;
  };

  return (
    <div className={styles.calendarCard}>
      <div className={styles.calendarHeader}>
        <div className={styles.calendarTitleWrap}>
          <h2 className={styles.calendarTitle}>
            <CalendarGridIcon /> Mi Horario Semanal y Asistencias
          </h2>
          <span className={styles.calendarSub}>
            Horario oficial de asignaturas inscritas con estatus de asistencia en tiempo real.
          </span>
        </div>

        {/* Leyenda interactiva de materias inscritas */}
        <div className={styles.calendarLegend}>
          {parsedCourses.map((c) => {
            const isSelected = selectedSubject?.code === c.code;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedSubject(c.rawSubject)}
                className={`${styles.legendPill} ${styles[`legend_${c.colorTag}`]} ${
                  isSelected ? styles.legendPillActive : ''
                }`}
                title={`Ver detalles de ${c.name} (${c.group})`}
              >
                <span className={styles.legendDot} />
                <span className={styles.legendGroupName}>{c.group}</span>
                <span className={styles.legendCourseName}>· {c.name}</span>
                {c.attendanceStatus === 'present' && (
                  <span style={{ fontSize: '10px', color: '#4ade80', marginLeft: '4px' }}>
                    ✓ Asistencia
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid del Calendario */}
      <div className={styles.calendarGridWrapper}>
        <div className={styles.calendarTable}>
          {/* Cabecera de días */}
          <div className={styles.calendarHeaderRow}>
            <div className={styles.hourCornerCell}>Hora</div>
            {DAYS.map((day) => (
              <div key={day} className={styles.dayHeaderCell}>
                <span className={styles.dayName}>{day}</span>
              </div>
            ))}
          </div>

          {/* Filas horarias */}
          {calendarHours.map((hour) => {
            const hourLabel = `${hour.toString().padStart(2, '0')}:00`;
            return (
              <div key={hour} className={styles.calendarHourRow}>
                <div className={styles.hourLabelCell}>{hourLabel}</div>

                {DAYS.map((day) => {
                  const match = getSlotAt(day, hour);

                  if (!match) {
                    return (
                      <div
                        key={`${day}-${hour}`}
                        className={styles.calendarEmptyCell}
                      />
                    );
                  }

                  const { course, slot, isFirstHour } = match;
                  const isSelected = selectedSubject?.code === course.code;

                  if (!isFirstHour) {
                    return (
                      <div
                        key={`${day}-${hour}`}
                        className={`${styles.calendarFilledCell} ${styles.slotContinuation} ${
                          styles[`slot_${course.colorTag}`]
                        } ${isSelected ? styles.slotSelected : ''}`}
                        onClick={() => setSelectedSubject(course.rawSubject)}
                        title={`Continuación de clase: ${course.name} (${course.group})`}
                      />
                    );
                  }

                  return (
                    <div
                      key={`${day}-${hour}`}
                      className={`${styles.calendarFilledCell} ${
                        styles[`slot_${course.colorTag}`]
                      } ${isSelected ? styles.slotSelected : ''}`}
                      onClick={() => setSelectedSubject(course.rawSubject)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setSelectedSubject(course.rawSubject);
                        }
                      }}
                      title={`Clic para ver detalles de ${course.name} (${course.group})`}
                    >
                      <div className={styles.slotContent}>
                        <div className={styles.slotTopRow}>
                          <span className={styles.slotGroupBadge}>{course.group}</span>
                          <span className={styles.slotTimeBadge}>{slot.displayTime}</span>
                        </div>

                        <div className={styles.slotCourseName}>{course.name}</div>

                        <div className={styles.slotClassroom}>
                          <ClassroomIcon />
                          <span>{course.classroom}</span>
                        </div>

                        {/* Estatus de asistencia de la materia */}
                        <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {course.attendanceStatus === 'present' ? (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                color: '#4ade80',
                                background: 'rgba(74, 222, 128, 0.15)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              ✓ Asistencia registrada
                            </span>
                          ) : course.attendanceStatus === 'absent' ? (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                color: '#f87171',
                                background: 'rgba(239, 68, 68, 0.15)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              ✗ Falta registrada
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: '10px',
                                color: 'rgba(255, 255, 255, 0.65)',
                                background: 'rgba(255, 255, 255, 0.08)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              • Sesión programada
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal / Ficha de detalles de la materia seleccionada */}
      {selectedSubject && (
        <div
          style={{
            marginTop: '20px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(201, 168, 76, 0.3)',
            borderRadius: '14px',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#fff', margin: 0 }}>
                {selectedSubject.officialName || selectedSubject.name}
              </h3>
              <span style={{ fontSize: '12px', color: '#c9a84c' }}>
                Clave: {selectedSubject.code} · Grupo: {selectedSubject.group} · {selectedSubject.credits ?? '—'} Créditos
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedSubject(null)}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                color: '#fff',
                borderRadius: '6px',
                padding: '4px 10px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Cerrar
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '10px',
              fontSize: '13px',
              background: 'rgba(0,0,0,0.2)',
              padding: '12px 14px',
              borderRadius: '8px',
            }}
          >
            <div>
              <span style={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>Profesor:</span>
              <strong style={{ color: '#fff' }}>{selectedSubject.professor || 'No especificado'}</strong>
            </div>
            <div>
              <span style={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>Días y Horario:</span>
              <strong style={{ color: '#fff' }}>{selectedSubject.days} ({selectedSubject.time})</strong>
            </div>
            <div>
              <span style={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>Aula / Salón:</span>
              <strong style={{ color: '#fff' }}>{selectedSubject.classroom || 'Acatlán'}</strong>
            </div>
          </div>

          {/* Apartado de asistencias por materia requerido por PumaIA */}
          {(() => {
            const courseMatch = parsedCourses.find(
              (c) =>
                c.code === selectedSubject.code ||
                c.name.toLowerCase() === (selectedSubject.name || '').toLowerCase(),
            );
            const currentRecords = courseMatch?.matchingRecords || [];
            const presentCount = currentRecords.filter((r: any) => r.status === 'PRESENT').length;

            return (
              <div
                style={{
                  marginTop: '4px',
                  padding: '14px 16px',
                  background: 'rgba(0, 0, 0, 0.25)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#c9a84c' }}>
                    Registro de Asistencias · {selectedSubject.officialName || selectedSubject.name}
                  </span>
                  <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                    {presentCount} de {currentRecords.length} asistencias
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: '6px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>Total de sesiones registradas:</span>
                    <strong style={{ color: '#fff', fontSize: '14px' }}>{currentRecords.length}</strong>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 10px', borderRadius: '6px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>Total de asistencias del alumno:</span>
                    <strong style={{ color: '#4ade80', fontSize: '14px' }}>{presentCount}</strong>
                  </div>
                </div>

                {currentRecords.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Sesiones Registradas:
                    </span>
                    {currentRecords.map((rec: any, idx: number) => {
                      const markedDate = new Date(rec.markedAt || rec.session?.startsAt || Date.now());
                      const dateStr = markedDate.toLocaleDateString('es-MX', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      });
                      const timeStr = markedDate.toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      const isPresent = rec.status === 'PRESENT';
                      const isAbsent = rec.status === 'ABSENT';
                      const sessionClosed = rec.session?.status === 'CLOSED';

                      let statusBadge = (
                        <span style={{ color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                          Sesión pendiente
                        </span>
                      );

                      if (isPresent) {
                        statusBadge = (
                          <span style={{ color: '#4ade80', background: 'rgba(74, 222, 128, 0.15)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                            ✓ Asistencia registrada (QR)
                          </span>
                        );
                      } else if (isAbsent || sessionClosed) {
                        statusBadge = (
                          <span style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.15)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                            ✗ Sesión finalizada sin registro
                          </span>
                        );
                      }

                      const profName = rec.session?.section?.professor
                        ? `${rec.session.section.professor.name} ${rec.session.section.professor.lastNameP}`
                        : selectedSubject.professor || 'Profesor asignado';

                      return (
                        <div
                          key={rec.id || idx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'rgba(255,255,255,0.02)',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            borderLeft: `3px solid ${isPresent ? '#4ade80' : isAbsent ? '#f87171' : '#c9a84c'}`,
                          }}
                        >
                          <div>
                            <strong style={{ color: '#fff', display: 'block' }}>
                              {dateStr} · {timeStr} hrs
                            </strong>
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
                              Prof. {profName}
                            </span>
                          </div>
                          <div>{statusBadge}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '10px', color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
                    No hay sesiones pasadas de lista registradas para esta asignatura todavía.
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

function CalendarGridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ClassroomIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
    </svg>
  );
}

