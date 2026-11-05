'use client';

import React from 'react';
import styles from './TeacherPage.module.css';
import { TeacherCourse, DayOfWeek } from './teacherTypes';

interface TeacherScheduleCalendarProps {
  courses: TeacherCourse[];
  selectedCourseId: string;
  onSelectCourse: (courseId: string) => void;
}

const DAYS: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const DEFAULT_HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

export default function TeacherScheduleCalendar({
  courses,
  selectedCourseId,
  onSelectCourse,
}: TeacherScheduleCalendarProps) {
  // Rango horario dinámico para mostrar desde la clase más temprana hasta la más tardía
  const calendarHours = React.useMemo(() => {
    let minH = 7;
    let maxH = 15;

    for (const c of courses) {
      for (const s of c.scheduleSlots) {
        if (s.startHour < minH) minH = s.startHour;
        if (s.endHour > maxH) maxH = s.endHour;
      }
    }

    const hours: number[] = [];
    const startHour = Math.max(7, minH);
    const endHour = Math.min(22, maxH);

    for (let h = startHour; h < endHour; h++) {
      hours.push(h);
    }

    return hours.length > 0 ? hours : DEFAULT_HOURS;
  }, [courses]);

  // Encontrar qué slots caen en qué día y hora
  const getSlotAt = (day: DayOfWeek, hour: number) => {
    for (const course of courses) {
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
        {/* Título limpio sin subtítulo descriptivo */}
        <div className={styles.calendarTitleWrap}>
          <h2 className={styles.calendarTitle}>
            <CalendarGridIcon /> Horario Semanal Docente
          </h2>
        </div>

        <div className={styles.calendarLegend}>
          {courses.map((course) => {
            const isSelected = course.id === selectedCourseId;
            return (
              <button
                key={course.id}
                type="button"
                onClick={() => onSelectCourse(course.id)}
                className={`${styles.legendPill} ${styles[`legend_${course.colorTag}`]} ${
                  isSelected ? styles.legendPillActive : ''
                }`}
                title={`Ver detalles de ${course.name} (${course.group})`}
              >
                <span className={styles.legendDot} />
                <span className={styles.legendGroupName}>{course.group}</span>
                <span className={styles.legendCourseName}>· {course.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid del Calendario */}
      <div className={styles.calendarGridWrapper}>
        <div className={styles.calendarTable}>
          {/* Fila de cabecera: Días de la semana */}
          <div
            className={styles.calendarHeaderRow}
            style={{ gridTemplateColumns: `70px repeat(${DAYS.length}, 1fr)` }}
          >
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
              <div
                key={hour}
                className={styles.calendarHourRow}
                style={{ gridTemplateColumns: `70px repeat(${DAYS.length}, 1fr)` }}
              >
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
                  const isSelected = course.id === selectedCourseId;

                  if (!isFirstHour) {
                    return (
                      <div
                        key={`${day}-${hour}`}
                        className={`${styles.calendarFilledCell} ${styles.slotContinuation} ${
                          styles[`slot_${course.colorTag}`]
                        } ${isSelected ? styles.slotSelected : ''}`}
                        onClick={() => onSelectCourse(course.id)}
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
                      onClick={() => onSelectCourse(course.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          onSelectCourse(course.id);
                        }
                      }}
                      title={`Clic para ver detalles de ${course.name} (${course.group})`}
                    >
                      <div className={styles.slotContent}>
                        <div className={styles.slotTopRow}>
                          <span className={styles.slotGroupBadge}>
                            {course.group}
                          </span>
                          <span className={styles.slotTimeBadge}>
                            {slot.displayTime}
                          </span>
                        </div>

                        <div className={styles.slotCourseName}>{course.name}</div>

                        <div className={styles.slotClassroom}>
                          <ClassroomIcon />
                          <span>{course.classroom}</span>
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
