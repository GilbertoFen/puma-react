'use client';

import React, { useState, useMemo } from 'react';
import styles from './AdminPage.module.css';
import { RealTimeScheduleItem, DayOfWeek } from '../../types/admin.types';

interface AdminScheduleCalendarProps {
  scheduleItems: RealTimeScheduleItem[];
  onSelectScheduleItem: (item: RealTimeScheduleItem) => void;
}

const ALL_DAYS: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DEFAULT_WEEKDAYS: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
// Horario integral de 7:00 a 22:00 hrs (horas 7 a 21, cubriendo 07:00 a 22:00)
const ALL_HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

export default function AdminScheduleCalendar({
  scheduleItems,
  onSelectScheduleItem,
}: AdminScheduleCalendarProps) {
  // Filtros requeridos: Materia, Día, Horas, Grupos, Semestre
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterDay, setFilterDay] = useState<string>('all');
  const [filterHourRange, setFilterHourRange] = useState<string>('all');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [filterSemester, setFilterSemester] = useState<number | 'all'>('all');

  // Catálogos dinámicos para los filtros basados en la base de datos
  const availableSubjects = useMemo(() => {
    return Array.from(new Set(scheduleItems.map((i) => i.subjectName))).sort();
  }, [scheduleItems]);

  const availableGroups = useMemo(() => {
    return Array.from(new Set(scheduleItems.map((i) => i.groupCode))).sort();
  }, [scheduleItems]);

  const hasSaturday = useMemo(() => {
    return scheduleItems.some((i) => i.day === 'Sábado');
  }, [scheduleItems]);

  // Columnas de días a mostrar (se adapta si se filtra por un día específico)
  const visibleDays: DayOfWeek[] = useMemo(() => {
    if (filterDay !== 'all') {
      return [filterDay as DayOfWeek];
    }
    return hasSaturday ? ALL_DAYS : DEFAULT_WEEKDAYS;
  }, [filterDay, hasSaturday]);

  // Filas de horas a mostrar (horario integral 7 a 22 o filtrado)
  const visibleHours = useMemo(() => {
    if (filterHourRange === 'matutino') {
      return [7, 8, 9, 10, 11, 12, 13];
    }
    if (filterHourRange === 'vespertino') {
      return [14, 15, 16, 17, 18, 19, 20, 21];
    }
    if (filterHourRange.includes('-')) {
      const [start, end] = filterHourRange.split('-').map(Number);
      const list: number[] = [];
      for (let h = start; h < end; h++) {
        list.push(h);
      }
      return list.length > 0 ? list : ALL_HOURS;
    }
    return ALL_HOURS;
  }, [filterHourRange]);

  // Filtrado de items con todas las dimensiones
  const filteredItems = useMemo(() => {
    return scheduleItems.filter((item) => {
      if (filterSubject !== 'all' && item.subjectName !== filterSubject) return false;
      if (filterDay !== 'all' && item.day !== filterDay) return false;
      if (filterGroup !== 'all' && item.groupCode !== filterGroup) return false;
      if (filterSemester !== 'all' && item.semester !== filterSemester) return false;
      if (filterHourRange !== 'all') {
        if (filterHourRange === 'matutino' && item.startHour >= 14) return false;
        if (filterHourRange === 'vespertino' && item.startHour < 14) return false;
        if (filterHourRange.includes('-')) {
          const [s, e] = filterHourRange.split('-').map(Number);
          if (item.startHour < s || item.endHour > e) return false;
        }
      }
      return true;
    });
  }, [scheduleItems, filterSubject, filterDay, filterGroup, filterSemester, filterHourRange]);

  // Retorna todas las clases activas en un día y hora para resolver empalmes sin romper el layout
  const getSlotsAt = (day: DayOfWeek, hour: number) => {
    return filteredItems.filter(
      (item) => item.day === day && item.startHour <= hour && hour < item.endHour
    );
  };

  return (
    <div className={styles.scheduleCalendarSection}>
      {/* Barra de título y filtros de supervisión */}
      <div className={styles.calendarControlsCard}>
        <div className={styles.calendarTitleWrap}>
          <div className={styles.calendarBadgeRow}>
            <span className={styles.calendarSubRange}>
              Horario Integral: 07:00 a 22:00 hrs
            </span>
          </div>

          <h2 className={styles.calendarMainTitle}>
            Supervisión de Cátedras, Salones y Docentes (MAC)
          </h2>
          <p className={styles.calendarSubText}>
            Visualización consolidada de horarios, espacios y claustro docente obtenida directamente de la base de datos institucional.
          </p>
        </div>

        {/* Filtros: Materia, Día, Horas, Grupos, Semestre */}
        <div className={styles.calendarFiltersRow}>
          {/* 1. Materia */}
          <div className={styles.filterGroup}>
            <label htmlFor="filter-subject" className={styles.filterLabel}>
              Materia:
            </label>
            <select
              id="filter-subject"
              className={styles.filterSelect}
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
            >
              <option value="all">Todas las Materias ({availableSubjects.length})</option>
              {availableSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Día */}
          <div className={styles.filterGroup}>
            <label htmlFor="filter-day" className={styles.filterLabel}>
              Día:
            </label>
            <select
              id="filter-day"
              className={styles.filterSelect}
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
            >
              <option value="all">Todos los Días</option>
              <option value="Lunes">Lunes</option>
              <option value="Martes">Martes</option>
              <option value="Miércoles">Miércoles</option>
              <option value="Jueves">Jueves</option>
              <option value="Viernes">Viernes</option>
              {hasSaturday && <option value="Sábado">Sábado</option>}
            </select>
          </div>

          {/* 3. Horas */}
          <div className={styles.filterGroup}>
            <label htmlFor="filter-hours" className={styles.filterLabel}>
              Horas:
            </label>
            <select
              id="filter-hours"
              className={styles.filterSelect}
              value={filterHourRange}
              onChange={(e) => setFilterHourRange(e.target.value)}
            >
              <option value="all">Todas las Horas (07:00 a 22:00)</option>
              <option value="matutino">Turno Matutino (07:00 - 14:00)</option>
              <option value="vespertino">Turno Vespertino (14:00 - 22:00)</option>
              <option value="7-9">Bloque 07:00 - 09:00</option>
              <option value="9-11">Bloque 09:00 - 11:00</option>
              <option value="11-13">Bloque 11:00 - 13:00</option>
              <option value="13-15">Bloque 13:00 - 15:00</option>
              <option value="14-16">Bloque 14:00 - 16:00</option>
              <option value="16-18">Bloque 16:00 - 18:00</option>
              <option value="18-20">Bloque 18:00 - 20:00</option>
              <option value="20-22">Bloque 20:00 - 22:00</option>
            </select>
          </div>

          {/* 4. Grupos */}
          <div className={styles.filterGroup}>
            <label htmlFor="filter-group" className={styles.filterLabel}>
              Grupo:
            </label>
            <select
              id="filter-group"
              className={styles.filterSelect}
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
            >
              <option value="all">Todos los Grupos ({availableGroups.length})</option>
              {availableGroups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Semestre */}
          <div className={styles.filterGroup}>
            <label htmlFor="filter-sem" className={styles.filterLabel}>
              Semestre:
            </label>
            <select
              id="filter-sem"
              className={styles.filterSelect}
              value={filterSemester}
              onChange={(e) =>
                setFilterSemester(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
            >
              <option value="all">Todos los Semestres (1° a 8°)</option>
              <option value={1}>1° Semestre</option>
              <option value={2}>2° Semestre</option>
              <option value={3}>3° Semestre</option>
              <option value={4}>4° Semestre</option>
              <option value={5}>5° Semestre</option>
              <option value={6}>6° Semestre</option>
              <option value={7}>7° Semestre</option>
              <option value={8}>8° Semestre</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cuadrícula semanal del Calendario (Horario integral 7 a 22 hrs) */}
      <div className={styles.calendarGridWrapper}>
        <div className={styles.calendarTable}>
          {/* Cabecera con los días */}
          <div
            className={styles.calendarHeaderRow}
            style={{ gridTemplateColumns: `85px repeat(${visibleDays.length}, minmax(0, 1fr))` }}
          >
            <div className={styles.hourCornerCell}>Horario</div>
            {visibleDays.map((day) => (
              <div key={day} className={styles.dayHeaderCell}>
                <span className={styles.dayName}>{day}</span>
              </div>
            ))}
          </div>

          {/* Filas horarias */}
          {visibleHours.map((hour) => {
            const hourLabel = `${hour.toString().padStart(2, '0')}:00`;

            return (
              <div
                key={hour}
                className={styles.calendarHourRow}
                style={{ gridTemplateColumns: `85px repeat(${visibleDays.length}, minmax(0, 1fr))` }}
              >
                <div className={styles.hourLabelCell}>{hourLabel}</div>

                {visibleDays.map((day) => {
                  const matches = getSlotsAt(day, hour);

                  if (matches.length === 0) {
                    return (
                      <div
                        key={`${day}-${hour}`}
                        className={styles.calendarEmptyCell}
                      />
                    );
                  }

                  return (
                    <div key={`${day}-${hour}`} className={styles.slotCellWrapper}>
                      {matches.map((item) => {
                        const isFirstHour = item.startHour === hour;

                        if (!isFirstHour) {
                          return (
                            <div
                              key={item.id}
                              className={styles.calendarContinuationCompact}
                              onClick={() => onSelectScheduleItem(item)}
                              title={`Continuación: ${item.subjectName} (${item.groupCode})`}
                            >
                              <span className={styles.miniContinuationText}>
                                ↳ {item.subjectName} ({item.groupCode})
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={item.id}
                            className={`${styles.calendarBlockCell} ${styles[`colorTag_${item.colorTag}`]}`}
                            onClick={() => onSelectScheduleItem(item)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                onSelectScheduleItem(item);
                              }
                            }}
                            title={`Clic para ver detalles: ${item.subjectName} (${item.groupCode}) · ${item.startTime}-${item.endTime} · ${item.professorName}`}
                          >
                            <div className={styles.blockTopRow}>
                              <span className={styles.blockGroupBadge}>{item.groupCode}</span>
                              <span className={styles.blockTimeBadge}>
                                {item.startTime} - {item.endTime}
                              </span>
                            </div>

                            <div className={styles.blockSubjectTitle}>{item.subjectName}</div>
                            <div className={styles.blockProfessor}>{item.professorName}</div>

                            <div className={styles.blockFooter}>
                              <span className={styles.blockClassroom}>{item.classroom}</span>
                              <span className={styles.blockCapacity}>
                                {item.enrolledStudents}/{item.capacity} al.
                              </span>
                            </div>
                          </div>
                        );
                      })}
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
