'use client';
import React, { useState } from 'react';
import type { Subject } from '../../types/exchange.types';
import styles from './SubjectValidator.module.css';

// ─────────────────────────────────────────────────────
// MOCK de materias inscritas en UNAM (lado izquierdo)
// Reemplaza con datos reales del alumno desde el back
// ─────────────────────────────────────────────────────
const MOCK_UNAM_SUBJECTS = [
  'Álgebra Lineal',
  'Cálculo Diferencial e Integral',
  'Programación Orientada a Objetos',
  'Estructuras de Datos',
  'Probabilidad y Estadística',
];

// ─────────────────────────────────────────────────────
// MOCK de materias aptas para revalidar (lado derecho)
// Reemplaza con la respuesta del back para cada universidad
// ─────────────────────────────────────────────────────
const MOCK_DEST_SUBJECTS: (string | null)[] = [
  'Álgebra Lineal Avanzada',   // match
  'Cálculo Multivariable',      // match
  null,                         // sin equivalencia
  'Data Structures & Algorithms', // match
  null,                         // sin equivalencia
];

// ─────────────────────────────────────────────────────

type Props = {
  subjects: Subject[];          // sigue recibiendo los de la universidad para compatibilidad
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
  // Usa el mock mientras no conectes el back
  // Cuando tengas el endpoint: reemplaza MOCK_UNAM_SUBJECTS y MOCK_DEST_SUBJECTS
  // con los datos que devuelva la API según la universidad seleccionada
  const unamSubjects = MOCK_UNAM_SUBJECTS;
  const destSubjects = MOCK_DEST_SUBJECTS;

  return (
    <div className={styles.panel}>
      {/* Cabecera */}
      <div className={styles.panelHeader}>
        <div className={styles.avatar}><AvatarIcon /></div>
        <p className={styles.headerText}>
          <strong>{userName}.</strong> Tu semestre actual es{' '}
          <em>({currentSemester})</em>, tu semestre previsto para el intercambio es{' '}
          <em>({targetSemester}mo)</em>.<br />
          Selecciona las materias optativas para encontrar sugerencias en{' '}
          <em>{universityName}</em>
        </p>
      </div>

      {/* Grid de dos columnas */}
      <div className={styles.grid}>
        {/* Columna UNAM */}
        <div className={styles.col}>
          <p className={styles.colTitle}>Materias en tu semestre de intercambio</p>
          {unamSubjects.map((name, i) => (
            <SubjectRow key={i} name={name} type="unam" />
          ))}
        </div>

        {/* Columna destino */}
        <div className={styles.col}>
          <p className={styles.colTitle}>Materias aptas para revalidar</p>
          {destSubjects.map((name, i) => (
            <SubjectRow key={i} name={name ?? undefined} type="dest" hasMatch={!!name} />
          ))}
        </div>
      </div>
    </div>
  );
}

type SubjectRowProps = {
  name?: string;
  type: 'unam' | 'dest';
  hasMatch?: boolean;
};

function SubjectRow({ name, type, hasMatch = true }: SubjectRowProps) {
  const noMatch = type === 'dest' && !hasMatch;
  return (
    <div className={`${styles.subjectRow} ${noMatch ? styles.noMatch : ''}`}>
      {noMatch ? (
        <span className={styles.noMatchText}>Sin equivalencia encontrada</span>
      ) : (
        <span className={styles.subjectName}>{name}</span>
      )}
      <button className={styles.subjectChevron} type="button">
        <ChevronIcon />
      </button>
    </div>
  );
}

// ── Íconos ────────────────────────────────────────────
function AvatarIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" width="28" height="28">
      <circle cx="16" cy="16" r="15" fill="rgba(201,168,76,0.08)"
        stroke="rgba(201,168,76,0.3)" strokeWidth="1"/>
      <circle cx="16" cy="12" r="5" fill="none"
        stroke="rgba(201,168,76,0.7)" strokeWidth="1.5"/>
      <path d="M6 28c0-5.5 4.5-10 10-10s10 4.5 10 10"
        stroke="rgba(201,168,76,0.7)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}