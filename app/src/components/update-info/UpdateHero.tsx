'use client';
import React, { useEffect, useState } from 'react';
import styles from './UpdateHero.module.css';

type Props = {
  onDismiss: () => void;
};

export default function UpdateHero({ onDismiss }: Props) {
  // Simula carga de datos — después reemplaza con tu fetch real
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={styles.hero} onClick={!loading ? onDismiss : undefined}>
      {/* Ícono circular — reemplaza con tu imagen de Cloudinary */}
      <div className={styles.iconWrap}>
        {/* <img src="TU_URL_CLOUDINARY" alt="Análisis" style={{width:'100%',height:'100%',objectFit:'contain'}} /> */}
        <HeroIcon />
      </div>

      <div className={styles.textBlock}>
        <h1 className={styles.title}>Revisa tus últimos registros de análisis profesional</h1>

        {loading ? (
          <div className={styles.dots}>
            <span /><span /><span /><span />
          </div>
        ) : (
          <p className={styles.hint}>Toca para ver tu información →</p>
        )}
      </div>
    </div>
  );
}

// SVG placeholder — reemplaza con tu ícono real
function HeroIcon() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <circle cx="36" cy="36" r="35" fill="rgba(255,255,255,0.06)"
        stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"/>
      {/* Persona izquierda */}
      <circle cx="24" cy="26" r="6" fill="none" stroke="#c9a84c" strokeWidth="2"/>
      <path d="M14 48c0-5.5 4.5-10 10-10s10 4.5 10 10"
        stroke="#c9a84c" strokeWidth="2" strokeLinecap="round"/>
      {/* Flechas de intercambio */}
      <path d="M38 30l6-6 6 6M44 24v14" stroke="#c9a84c" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M50 42l-6 6-6-6M44 48V34" stroke="rgba(201,168,76,0.5)" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
