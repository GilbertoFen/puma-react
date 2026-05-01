'use client';
import React from 'react';
import styles from './ExchangeHero.module.css';

export default function ExchangeHero() {
  return (
    <div className={styles.hero}>
      {/* Ícono — reemplaza con tu imagen de Cloudinary */}
      <div className={styles.iconWrap}>
        {/* <img src="TU_URL" alt="Intercambio" style={{width:'100%',height:'100%',objectFit:'contain'}} /> */}
        <ExchangeHeroIcon />
      </div>

      <div className={styles.text}>
        <h1 className={styles.title}>Tu pasaporte académico está a un click</h1>
        <p className={styles.desc}>
          Olvídate de las dudas y el papeleo infinito. Con PUMAIA, gestionamos tu
          revalidación de materias, consultamos tus becas disponibles y organizamos tu
          documentación en un solo lugar. Elige tu destino, nosotros nos encargamos del
          resto.
        </p>
      </div>
    </div>
  );
}

function ExchangeHeroIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 72 72" fill="none">
      <circle cx="36" cy="36" r="35" fill="rgba(255,255,255,0.06)"
        stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
      {/* Persona izquierda */}
      <circle cx="22" cy="26" r="6" fill="none" stroke="#c9a84c" strokeWidth="2"/>
      <path d="M12 46c0-5.5 4.5-10 10-10s10 4.5 10 10"
        stroke="#c9a84c" strokeWidth="2" strokeLinecap="round"/>
      {/* Flechas */}
      <path d="M36 28l8-6 8 6" stroke="#c9a84c" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M44 22v12" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round"/>
      <path d="M52 44l-8 6-8-6" stroke="rgba(201,168,76,0.5)" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M44 50V38" stroke="rgba(201,168,76,0.5)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
