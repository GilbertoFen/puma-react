'use client';
import React, { useState, useRef, useEffect } from 'react';
import type { Country } from '../../types/exchange.types';
import styles from './CountrySelector.module.css';

type Props = {
  countries: Country[];
  selected: string;         // 'all' o country.code
  onChange: (code: string) => void;
};

export default function CountrySelector({ countries, selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Cierra al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedCountry = countries.find((c) => c.code === selected);
  const label = selectedCountry
    ? `${selectedCountry.flag} ${selectedCountry.name}`
    : '🌍 Selecciona un País disponible para Intercambios';

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <span className={styles.triggerLabel}>{label}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className={styles.dropdown}>
          {/* Opción "Todos los países" */}
          <button
            className={`${styles.option} ${selected === 'all' ? styles.optionActive : ''}`}
            onClick={() => { onChange('all'); setOpen(false); }}
          >
            <span className={styles.flag}>🌍</span>
            <span>Todos los países</span>
          </button>

          {countries.map((country) => (
            <button
              key={country.code}
              className={`${styles.option} ${selected === country.code ? styles.optionActive : ''}`}
              onClick={() => { onChange(country.code); setOpen(false); }}
            >
              <span className={styles.flag}>{country.flag}</span>
              <span>{country.name}</span>
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
