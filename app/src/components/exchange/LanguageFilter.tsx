'use client';
import React, { useState, useRef, useEffect } from 'react';
import type { Language } from '../../types/exchange.types';
import styles from './CountrySelector.module.css'; // reutiliza el mismo CSS

const LANGUAGES: Language[] = ['Español', 'Inglés (B2)', 'Francés', 'Neerlandés', 'Alemán'];

type Props = {
  selected: Language | 'all';
  onChange: (lang: Language | 'all') => void;
};

export default function LanguageFilter({ selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className={styles.wrap} ref={ref} style={{ maxWidth: 180 }}>
      <button
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <span className={styles.triggerLabel}>
          {selected === 'all' ? 'Idioma' : selected}
        </span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className={styles.dropdown}>
          <button
            className={`${styles.option} ${selected === 'all' ? styles.optionActive : ''}`}
            onClick={() => { onChange('all'); setOpen(false); }}
          >
            Todos los idiomas
          </button>
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              className={`${styles.option} ${selected === lang ? styles.optionActive : ''}`}
              onClick={() => { onChange(lang); setOpen(false); }}
            >
              {lang}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}
