'use client';

import React from 'react';
import styles from './AdminPage.module.css';
import { RealTimeScheduleItem } from '../../types/admin.types';

interface AdminScheduleDetailModalProps {
  item: RealTimeScheduleItem | null;
  onClose: () => void;
}

export default function AdminScheduleDetailModal({
  item,
  onClose,
}: AdminScheduleDetailModalProps) {
  if (!item) return null;

  const isOngoing = item.currentStatus === 'ongoing';
  const isUpcoming = item.currentStatus === 'upcoming';

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalCardMedium}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-modal-title"
      >
        {/* Cabecera del modal */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderTitleWrap}>
            <div className={styles.modalBadgeRow}>
              <span className={styles.groupBadgePill}>
                {item.groupCode}{item.semester ? ` · ${item.semester}° Semestre` : ''}
              </span>

              <span
                className={`${styles.statusLivePill} ${
                  isOngoing ? styles.liveOngoing : isUpcoming ? styles.liveUpcoming : styles.liveCompleted
                }`}
              >
                <span className={isOngoing ? styles.greenPulse : styles.clockDot} />
                {isOngoing
                  ? 'En Curso Ahora Mismo'
                  : isUpcoming
                  ? 'Próxima Clase Programada'
                  : 'Cátedra Concluida Hoy'}
              </span>
            </div>

            <h2 id="schedule-modal-title" className={styles.scheduleModalTitle}>
              {item.subjectName}
            </h2>
            {item.area && <span className={styles.areaTag}>Área: {item.area}</span>}
          </div>

          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            aria-label="Cerrar detalle de clase"
          >
            ✕
          </button>
        </div>

        {/* Ficha técnica de supervisión de aula */}
        <div className={styles.scheduleInfoGrid}>
          <div className={styles.scheduleInfoCard}>
            <div className={styles.infoCardHeader}>
              <UserTieIcon />
              <span>Profesor Titular de Cátedra</span>
            </div>
            <div className={styles.infoCardValue}>{item.professorName}</div>
            <span className={styles.infoCardMeta}>Según el horario cargado</span>
          </div>

          <div className={styles.scheduleInfoCard}>
            <div className={styles.infoCardHeader}>
              <BuildingIcon />
              <span>Espacio Asignado</span>
            </div>
            <div className={styles.infoCardValueGold}>{item.classroom ?? 'Sin aula registrada'}</div>
            <span className={styles.infoCardMeta}>Según el horario cargado</span>
          </div>

          <div className={styles.scheduleInfoCard}>
            <div className={styles.infoCardHeader}>
              <ClockIcon />
              <span>Día y Horario Oficial</span>
            </div>
            <div className={styles.infoCardValue}>
              {item.day} de {item.startTime} a {item.endTime} hrs
            </div>
            <span className={styles.infoCardMeta}>Bloque lectivo de {item.endHour - item.startHour} horas continuas</span>
          </div>

          <div className={styles.scheduleInfoCard}>
            <div className={styles.infoCardHeader}>
              <UsersIcon />
              <span>Ocupación y Matrícula</span>
            </div>
            <div className={styles.infoCardValue}>
              {item.enrolledStudents} inscritos
              {item.capacity ? ` / ${item.capacity} de cupo` : ''}
            </div>
            <span className={styles.infoCardMeta}>
              {item.capacity
                ? `${Math.round((item.enrolledStudents / item.capacity) * 100)}% del cupo cubierto`
                : 'Sin cupo registrado'}
            </span>
          </div>
        </div>

        {/*
          Sin asistencia ni aprobación por grupo en esta ficha: no hay dato real aquí y, junto al
          nombre del profesor, permitiría comparar profesores. La asistencia agregada por grupo
          (sin profesor) está en la pestaña Asistencia.
        */}

        {/* Footer del Modal */}
        <div className={styles.modalFooter}>
          <div className={styles.privacyNoteSmall}>
            <ShieldIcon />
            <span>
              Vista de supervisión académica directiva. Ningún nombre de estudiante es procesado en este módulo.
            </span>
          </div>

          <button
            type="button"
            className={styles.modalPrimaryBtn}
            onClick={onClose}
          >
            Cerrar Ficha de Supervisión
          </button>
        </div>
      </div>
    </div>
  );
}

function UserTieIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}


function ShieldIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

