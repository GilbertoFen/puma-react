'use client';
import React, { useState } from 'react';
import styles from './DocumentChecklist.module.css';

type Props = {
  docs: string[];
  universityId: string;
};

export default function DocumentChecklist({ docs, universityId }: Props) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (doc: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(doc) ? next.delete(doc) : next.add(doc);
      return next;
    });
  };

  return (
    <div className={styles.panel}>
      <p className={styles.title}>Documentación Requerida para realizar este Intercambio</p>

      <ul className={styles.list}>
        {docs.map((doc) => (
          <li key={doc} className={styles.item}>
            <button
              className={`${styles.checkbox} ${checked.has(doc) ? styles.checked : ''}`}
              onClick={() => toggle(doc)}
              aria-checked={checked.has(doc)}
              role="checkbox"
            >
              {checked.has(doc) && <CheckIcon />}
            </button>
            <span className={`${styles.docLabel} ${checked.has(doc) ? styles.docLabelChecked : ''}`}>
              {doc}
            </span>
          </li>
        ))}
      </ul>

      <p className={styles.hint}>
        Da click en cualquier documento para obtener más información de dónde obtenerlo
      </p>

      {/* CTA para guardar en perfil */}
      <button className={styles.saveBtn}>
        <SaveIcon />
        <span>
          Guarda en tu Perfil esta opción para dar un seguimiento a los documentos y llevar un orden
        </span>
        <BookmarkIcon />
      </button>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
function SaveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    </svg>
  );
}
function BookmarkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>
  );
}
