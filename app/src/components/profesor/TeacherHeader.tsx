'use client';

import React from 'react';
import Navbar from '../Navbar';
import styles from './TeacherPage.module.css';
import { TeacherProfile } from './teacherTypes';

interface TeacherHeaderProps {
  teacher: TeacherProfile;
  onLogout: () => void;
}

export default function TeacherHeader({ teacher, onLogout }: TeacherHeaderProps) {
  return (
    <header className={styles.headerContainer}>
      {/* Navbar Institucional idéntico a la raíz con logo UNAM a la izquierda */}
      <Navbar userInitial={teacher.avatarInitial} />
      <div className={styles.goldLine} />

      {/* Subcabecera / Hero del Profesor */}
      <div className={styles.teacherHeroSection}>
        <div className={styles.teacherHeroContent}>
          {/* Avatar con Inicial Dorada */}
          <div className={styles.goldAvatarCircle} title={`Profesor: ${teacher.name}`}>
            <span>{teacher.avatarInitial}</span>
          </div>

          {/* Información del Docente sin badge de sesión activa ni semestre en cabecera */}
          <div className={styles.teacherDetails}>
            <div className={styles.saluteRow}>
              <span className={styles.salutePrefix}>Portal del Personal Académico</span>
            </div>

            <h1 className={styles.teacherFullName}>{teacher.name}</h1>

            <div className={styles.badgesCluster}>
              <span className={styles.teacherBadgeRole}>
                <AcademicIcon /> {teacher.role}
              </span>

              <span className={styles.teacherBadgeDept}>
                {teacher.department} · {teacher.institution}
              </span>
            </div>
          </div>
        </div>

        {/* Acciones de Cabecera (Cerrar sesión) */}
        <div className={styles.headerRightActions}>
          <button
            type="button"
            className={styles.logoutBtn}
            onClick={onLogout}
            title="Cerrar sesión docente y regresar a la pantalla de acceso"
          >
            <ExitIcon />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function AcademicIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

function ExitIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
