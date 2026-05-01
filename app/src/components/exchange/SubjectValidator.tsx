'use client';
import React from 'react';
import type { Subject } from '../../types/exchange.types';
import styles from './SubjectValidator.module.css';

type Props = {
  subjects: Subject[];
  userName: string;
  currentSemester: string;
  targetSemester: string;
  universityName: string;
};

export default function SubjectValidator({
  subjects,
  userName,
  currentSemester,
  targetSemester,
  universityName,
}: Props) {
  return (
    <div className={styles.panel}>
      {/* Cabecera con avatar e info */}
      <div className={styles.panelHeader}>
        <div className={styles.avatar}>
          <AvatarIcon />
        </div>
        <p className={styles.headerText}>
          <strong>{userName}.</strong> Tu semestre actual es{' '}
          <em>({currentSemestre})</em>, Tu semestre Previsto para el intercambio es{' '}
          <em>({targetSemester}mo)</em>
          <br />
          Selecciona las materias Optativas para encontrar sugerencias en la (universidad)
        </p>
      </div>

      {/* Grid de dos columnas */}
      <div className={styles.grid}>
        {/* Columna UNAM */}
        <div className={styles.col}>
          <p className={styles.colTitle}>Materias inscritas en el semestre de intercambio</p>
          {subjects.map((s) => (
            <SubjectRow key={s.id} name={s.name} side="unam" />
          ))}
        </div>

        {/* Columna universidad destino */}
        <div className={styles.col}>
          <p className={styles.colTitle}>Materias aptas a revalidar la (universidad)</p>
          {subjects.map((s) => (
            <SubjectRow
              key={s.id}
              name={s.equivalent}
              side="dest"
              hasMatch={s.hasMatch}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

type SubjectRowProps = {
  name?: string;
  side: 'unam' | 'dest';
  hasMatch?: boolean;
};

function SubjectRow({ name, side, hasMatch }: SubjectRowProps) {
  const isEmpty = side === 'dest' && !hasMatch;

  return (
    <div className={`${styles.subjectRow} ${isEmpty ? styles.noMatch : ''}`}>
      <span className={styles.subjectName}>
        {isEmpty
          ? 'No se encontraron coincidencias con esta materia'
          : name ?? '—'}
      </span>
      <button className={styles.subjectArrow} title="Ver opciones">
        <ChevronIcon />
      </button>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

function AvatarIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="15" fill="rgba(201,168,76,0.1)"
        stroke="rgba(201,168,76,0.3)" strokeWidth="1"/>
      <circle cx="16" cy="12" r="5" fill="none" stroke="rgba(201,168,76,0.7)" strokeWidth="1.5"/>
      <path d="M6 28c0-5.5 4.5-10 10-10s10 4.5 10 10"
        stroke="rgba(201,168,76,0.7)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
