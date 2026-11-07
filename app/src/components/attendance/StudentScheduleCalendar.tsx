'use client';

import React, { useState, useMemo } from 'react';
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

/**
 * Obtiene el lunes de la semana para un offset dado (0 = semana actual)
 */
function getMondayOfWeek(offsetWeeks = 0): Date {
  const d = new Date();
  const day = d.getDay();
  // En JS: 0=Domingo, 1=Lunes, ... 6=Sábado
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday + offsetWeeks * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Formatea una fecha YYYY-MM-DD en hora local
 */
function toLocalDateKey(dateObj: Date): string {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function StudentScheduleCalendar({
  subjects,
  attendanceRecords,
}: StudentScheduleCalendarProps) {
  const [viewMode, setViewMode] = useState<'calendar' | 'subjects'>('calendar');
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [selectedSubject, setSelectedSubject] = useState<EnrolledScheduleSubject | null>(null);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  // Fechas concretas para Lunes a Viernes de la semana seleccionada
  const weekDays = useMemo(() => {
    const monday = getMondayOfWeek(weekOffset);
    return DAYS.map((dayName, idx) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + idx);
      const isToday = toLocalDateKey(date) === toLocalDateKey(new Date());
      const dateKey = toLocalDateKey(date);
      const dayNum = date.getDate();
      const monthStr = date.toLocaleDateString('es-MX', { month: 'short' });
      return {
        dayName,
        date,
        dateKey,
        dayNum,
        monthStr,
        isToday,
      };
    });
  }, [weekOffset]);

  // Texto legible del rango semanal (e.g. "Semana del 9 al 15 de Noviembre 2026")
  const weekLabel = useMemo(() => {
    const start = weekDays[0].date;
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const startStr = `${start.getDate()} de ${start.toLocaleDateString('es-MX', { month: 'short' })}`;
    const endStr = `${end.getDate()} de ${end.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}`;
    return `Semana del ${startStr} al ${endStr}`;
  }, [weekDays]);

  // Parseo y enriquecimiento de materias
  const parsedCourses = useMemo(() => {
    return subjects.map((sub, idx) => {
      const colorTag = COLOR_PALETTE[idx % COLOR_PALETTE.length];

      // Días
      const daysFound: DayOfWeek[] = [];
      const lowerDays = (sub.days || '').toLowerCase();
      if (lowerDays.includes('lun') || lowerDays.includes('lu')) daysFound.push('Lunes');
      if (lowerDays.includes('mar') || lowerDays.includes('ma')) daysFound.push('Martes');
      if (lowerDays.includes('mié') || lowerDays.includes('mie') || lowerDays.includes('mi')) daysFound.push('Miércoles');
      if (lowerDays.includes('jue') || lowerDays.includes('ju')) daysFound.push('Jueves');
      if (lowerDays.includes('vie') || lowerDays.includes('vi')) daysFound.push('Viernes');

      // Horas
      const hourMatches = Array.from((sub.time || '').matchAll(/(\d{1,2}):\d{2}/g)).map((m) =>
        parseInt(m[1], 10),
      );
      let startHour = 7;
      let endHour = 9;

      if (hourMatches.length >= 2) {
        startHour = hourMatches[0];
        endHour = hourMatches[1];
      } else if (hourMatches.length === 1) {
        startHour = hourMatches[0];
        endHour = startHour + 2;
      }

      const displayTime = `${startHour.toString().padStart(2, '0')}:00 - ${endHour
        .toString()
        .padStart(2, '0')}:00`;

      // Cruzar con registros de asistencia del backend
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
        if (subSectionId && recSectionId && subSectionId === recSectionId) return true;

        const recSubCode = String(rec.session?.section?.subject?.code || '').replace(/\D/g, '');
        if (cleanSubCode && recSubCode && cleanSubCode === recSubCode) return true;

        const recSubName = normalize(
          rec.session?.section?.subject?.subject ||
            rec.session?.section?.subject?.name ||
            rec.session?.section?.name ||
            '',
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

      const scheduleSlots = daysFound.map((day) => ({
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
        matchingRecords,
        rawSubject: sub,
      };
    });
  }, [subjects, attendanceRecords]);

  // Rango horario dinámico
  const calendarHours = useMemo(() => {
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

  // Encuentra la clase que corresponde a un día y hora
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

  // Verifica el estatus de asistencia de un curso en una fecha concreta YYYY-MM-DD
  const getAttendanceForCourseOnDate = (course: (typeof parsedCourses)[0], dateKey: string) => {
    const recordOnDate = course.matchingRecords.find((rec: any) => {
      // 1. Verificar por sessionDate directa (@db.Date)
      if (rec.sessionDate) {
        const dStr = String(rec.sessionDate).substring(0, 10);
        if (dStr === dateKey) return true;
      }
      if (rec.session?.sessionDate) {
        const dStr = String(rec.session.sessionDate).substring(0, 10);
        if (dStr === dateKey) return true;
      }
      // 2. Verificar por markedAt o startsAt
      const rawDate = rec.markedAt || rec.session?.startsAt;
      if (rawDate) {
        const dObj = new Date(rawDate);
        if (toLocalDateKey(dObj) === dateKey) return true;
      }
      return false;
    });

    if (recordOnDate) {
      return {
        hasRecord: true,
        status: recordOnDate.status,
        markedAt: recordOnDate.markedAt,
        method: recordOnDate.method,
        recordId: recordOnDate.id,
      };
    }

    return {
      hasRecord: false,
      status: 'PENDING' as const,
      markedAt: null,
      method: null,
      recordId: null,
    };
  };

  return (
    <div className={styles.calendarCard}>
      {/* ── BARRA SUPERIOR CON SELECTOR DE VISTAS ── */}
      <div className={styles.calendarHeader}>
        <div className={styles.calendarTitleWrap}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 className={styles.calendarTitle}>
              <CalendarGridIcon /> Asistencias y Horario de Clases
            </h2>
          </div>
          <span className={styles.calendarSub}>
            Consulta tus asistencias por clase en fechas concretas y el historial detallado por materia.
          </span>
        </div>

        {/* Botones de alternancia entre Vista Semanal y Vista General por Materia */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              border: viewMode === 'calendar' ? '1px solid #c9a84c' : '1px solid rgba(255,255,255,0.12)',
              background: viewMode === 'calendar' ? 'rgba(201, 168, 76, 0.2)' : 'rgba(255,255,255,0.04)',
              color: viewMode === 'calendar' ? '#ffd54f' : 'rgba(255,255,255,0.7)',
            }}
          >
            Vista Semanal (Fechas)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('subjects')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              border: viewMode === 'subjects' ? '1px solid #c9a84c' : '1px solid rgba(255,255,255,0.12)',
              background: viewMode === 'subjects' ? 'rgba(201, 168, 76, 0.2)' : 'rgba(255,255,255,0.04)',
              color: viewMode === 'subjects' ? '#ffd54f' : 'rgba(255,255,255,0.7)',
            }}
          >
            Resumen por Materia ({parsedCourses.length})
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* VISTA 1: CALENDARIO SEMANAL CON NAVEGACIÓN Y FECHAS CONCRETAS */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {viewMode === 'calendar' && (
        <div>
          {/* Navegador de Semanas */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              background: 'rgba(0, 0, 0, 0.25)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setWeekOffset((prev) => prev - 1)}
                style={{
                  background: 'rgba(255, 255, 255, 0.07)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  color: '#fff',
                  padding: '6px 12px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
                title="Semana anterior"
              >
                ← Semana anterior
              </button>

              <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginLeft: '6px' }}>
                {weekLabel} {weekOffset === 0 && <span style={{ color: '#c9a84c', fontSize: '12px' }}>(Semana actual)</span>}
              </span>

              <button
                type="button"
                onClick={() => setWeekOffset((prev) => prev + 1)}
                style={{
                  background: 'rgba(255, 255, 255, 0.07)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  color: '#fff',
                  padding: '6px 12px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
                title="Semana siguiente"
              >
                Semana siguiente →
              </button>
            </div>

            {weekOffset !== 0 && (
              <button
                type="button"
                onClick={() => setWeekOffset(0)}
                style={{
                  background: 'rgba(201, 168, 76, 0.2)',
                  border: '1px solid rgba(201, 168, 76, 0.4)',
                  color: '#ffd54f',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Volver a la semana actual
              </button>
            )}
          </div>

          {/* Grid Semanal con Días y Fechas */}
          <div className={styles.calendarGridWrapper}>
            <div className={styles.calendarTable}>
              {/* Cabecera de días con fechas reales */}
              <div
                className={styles.calendarHeaderRow}
                style={{ gridTemplateColumns: `70px repeat(${DAYS.length}, 1fr)` }}
              >
                <div className={styles.hourCornerCell}>Hora</div>
                {weekDays.map((dayInfo) => {
                  const isDaySelected = selectedDayKey === dayInfo.dateKey;
                  return (
                    <div
                      key={dayInfo.dateKey}
                      className={styles.dayHeaderCell}
                      onClick={() =>
                        setSelectedDayKey((prev) => (prev === dayInfo.dateKey ? null : dayInfo.dateKey))
                      }
                      style={{
                        cursor: 'pointer',
                        background: isDaySelected
                          ? 'rgba(201, 168, 76, 0.25)'
                          : dayInfo.isToday
                            ? 'rgba(201, 168, 76, 0.12)'
                            : undefined,
                        borderBottom: isDaySelected ? '2px solid #c9a84c' : undefined,
                        transition: 'all 0.2s ease',
                      }}
                      title={`Clic para filtrar clases del ${dayInfo.dayName} ${dayInfo.dayNum} ${dayInfo.monthStr}`}
                    >
                      <span className={styles.dayName}>{dayInfo.dayName}</span>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: dayInfo.isToday ? '#ffd54f' : 'rgba(255,255,255,0.7)',
                          display: 'block',
                          marginTop: '2px',
                        }}
                      >
                        {dayInfo.dayNum} {dayInfo.monthStr}
                      </span>
                      {dayInfo.isToday && (
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            color: '#060d1f',
                            background: '#ffd54f',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            marginTop: '2px',
                            display: 'inline-block',
                          }}
                        >
                          HOY
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Filas horarias con slots de clase y estado por fecha */}
              {calendarHours.map((hour) => {
                const hourLabel = `${hour.toString().padStart(2, '0')}:00`;
                return (
                  <div
                    key={hour}
                    className={styles.calendarHourRow}
                    style={{ gridTemplateColumns: `70px repeat(${DAYS.length}, 1fr)` }}
                  >
                    <div className={styles.hourLabelCell}>{hourLabel}</div>

                    {weekDays.map((dayInfo) => {
                      const match = getSlotAt(dayInfo.dayName, hour);

                      if (!match) {
                        return (
                          <div
                            key={`${dayInfo.dateKey}-${hour}`}
                            className={styles.calendarEmptyCell}
                          />
                        );
                      }

                      const { course, slot, isFirstHour } = match;
                      const isSelected = selectedSubject?.code === course.code;

                      if (!isFirstHour) {
                        return (
                          <div
                            key={`${dayInfo.dateKey}-${hour}`}
                            className={`${styles.calendarFilledCell} ${styles.slotContinuation} ${
                              styles[`slot_${course.colorTag}`]
                            } ${isSelected ? styles.slotSelected : ''}`}
                            onClick={() => setSelectedSubject(course.rawSubject)}
                            title={`Continuación de clase: ${course.name} (${course.group})`}
                          />
                        );
                      }

                      // Estatus puntual de asistencia en ESTA FECHA concreta
                      const att = getAttendanceForCourseOnDate(course, dayInfo.dateKey);
                      const isPresentOnDate = att.status === 'PRESENT';
                      const isAbsentOnDate = att.status === 'ABSENT';

                      return (
                        <div
                          key={`${dayInfo.dateKey}-${hour}`}
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

                            {/* Badge de asistencia puntual por día */}
                            <div style={{ marginTop: '6px' }}>
                              {isPresentOnDate ? (
                                <span
                                  style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    color: '#4ade80',
                                    background: 'rgba(74, 222, 128, 0.2)',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    border: '1px solid rgba(74, 222, 128, 0.35)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                  }}
                                >
                                  ✓ Asistencia (QR)
                                </span>
                              ) : isAbsentOnDate ? (
                                <span
                                  style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    color: '#f87171',
                                    background: 'rgba(239, 68, 68, 0.2)',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    border: '1px solid rgba(239, 68, 68, 0.35)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
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
                                    display: 'inline-block',
                                  }}
                                >
                                  • Sesión {dayInfo.isToday ? 'de hoy' : 'programada'}
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
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* VISTA 2: RESUMEN Y CONSULTA GENERAL POR MATERIA               */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {viewMode === 'subjects' && (
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0 }}>
              Historial General de Asistencias por Asignatura
            </h3>
            <span style={{ fontSize: '13px', color: '#c9a84c' }}>
              Total: {parsedCourses.length} Asignaturas cursadas
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {parsedCourses.map((c) => {
              const records = c.matchingRecords;
              const presentCount = records.filter((r: any) => r.status === 'PRESENT').length;
              const absentCount = records.filter((r: any) => r.status === 'ABSENT').length;
              const percentage = records.length > 0 ? Math.round((presentCount / records.length) * 100) : 100;

              return (
                <div
                  key={c.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '16px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                  onClick={() => setSelectedSubject(c.rawSubject)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#c9a84c',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        {c.group} · Clave {c.code}
                      </span>
                      <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: '2px 0 0' }}>
                        {c.name}
                      </h4>
                    </div>

                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 800,
                        color: percentage >= 80 ? '#4ade80' : percentage >= 60 ? '#facc15' : '#f87171',
                        background: 'rgba(0,0,0,0.3)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      {records.length > 0 ? `${percentage}%` : 'Sin clases'}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                    <span>Profesor: </span>
                    <strong style={{ color: 'rgba(255,255,255,0.9)' }}>{c.professor}</strong>
                  </div>

                  {/* Barra de progreso */}
                  <div
                    style={{
                      width: '100%',
                      height: '6px',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '100px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${percentage}%`,
                        background: percentage >= 80 ? '#4ade80' : percentage >= 60 ? '#facc15' : '#f87171',
                        borderRadius: '100px',
                      }}
                    />
                  </div>

                  {/* Contadores */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: '8px',
                      fontSize: '11.5px',
                      textAlign: 'center',
                      background: 'rgba(0,0,0,0.2)',
                      padding: '8px',
                      borderRadius: '8px',
                    }}
                  >
                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>Sesiones</span>
                      <strong style={{ color: '#fff', fontSize: '13px' }}>{records.length}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>Asistencias</span>
                      <strong style={{ color: '#4ade80', fontSize: '13px' }}>{presentCount}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>Faltas</span>
                      <strong style={{ color: absentCount > 0 ? '#f87171' : '#fff', fontSize: '13px' }}>
                        {absentCount}
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    style={{
                      background: 'rgba(201, 168, 76, 0.15)',
                      border: '1px solid rgba(201, 168, 76, 0.35)',
                      color: '#ffd54f',
                      padding: '8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Ver historial de fechas →
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MODAL / FICHA DETALLADA DE LA MATERIA SELECCIONADA ── */}
      {selectedSubject && (
        <div
          style={{
            margin: '20px 24px 24px',
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
              ✕ Cerrar
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
              <strong style={{ color: '#fff' }}>
                {selectedSubject.days} ({selectedSubject.time})
              </strong>
            </div>
            <div>
              <span style={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>Aula / Salón:</span>
              <strong style={{ color: '#fff' }}>{selectedSubject.classroom || 'FES Acatlán'}</strong>
            </div>
          </div>

          {/* Historial de clases individuales registradas por fecha */}
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
                    Historial de Asistencias por Fecha · {selectedSubject.officialName || selectedSubject.name}
                  </span>
                  <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                    {presentCount} de {currentRecords.length} asistencias
                  </span>
                </div>

                {currentRecords.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                    {currentRecords.map((rec: any, idx: number) => {
                      const markedDate = new Date(
                        rec.sessionDate || rec.markedAt || rec.session?.startsAt || Date.now(),
                      );
                      const dateStr = markedDate.toLocaleDateString('es-MX', {
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
                          key={rec.id || idx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'rgba(255,255,255,0.025)',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            fontSize: '12.5px',
                            borderLeft: `4px solid ${isPresent ? '#4ade80' : isAbsent ? '#f87171' : '#c9a84c'}`,
                          }}
                        >
                          <div>
                            <strong style={{ color: '#fff', display: 'block', textTransform: 'capitalize' }}>
                              {dateStr}
                            </strong>
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11.5px' }}>
                              Hora de registro: {timeStr} hrs · Método: {rec.method === 'QR' ? 'Código QR Dinámico' : 'Registro del Profesor'}
                            </span>
                          </div>
                          <div>
                            {isPresent ? (
                              <span
                                style={{
                                  color: '#4ade80',
                                  background: 'rgba(74, 222, 128, 0.15)',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '11.5px',
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
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '11.5px',
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
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '11.5px',
                                }}
                              >
                                ⏱ Pendiente
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '16px', color: 'rgba(255,255,255,0.5)', fontSize: '12.5px' }}>
                    No se han registrado sesiones pasadas de lista para esta asignatura todavía.
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
