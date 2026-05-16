'use client';
import React from 'react';
import styles from './InlineLoader.module.css';

type Variant =
  | 'bar'      // barra de progreso debajo de un botón o sección
  | 'spinner'  // spinner circular pequeño (para dentro de botones)
  | 'overlay'; // overlay semitransparente sobre una sección

type Props = {
  variant?: Variant;
  message?: string;
};

// ── Uso según contexto ──────────────────────────────────
//
// Dentro de un botón "Guardar":
//   <button disabled={saving}>
//     {saving ? <InlineLoader variant="spinner" /> : 'Guardar cambios'}
//   </button>
//
// Debajo de una sección mientras guarda:
//   <>
//     <MiSeccion />
//     {saving && <InlineLoader variant="bar" message="Guardando datos..." />}
//   </>
//
// Overlay sobre una card mientras carga:
//   <div style={{ position: 'relative' }}>
//     <MiCard />
//     {loading && <InlineLoader variant="overlay" message="Cargando..." />}
//   </div>

export default function InlineLoader({ variant = 'bar', message }: Props) {
  if (variant === 'spinner') {
    return (
      <span className={styles.spinnerWrap} aria-label="Cargando">
        <span className={styles.spinner} />
        {message && <span className={styles.spinnerMsg}>{message}</span>}
      </span>
    );
  }

  if (variant === 'overlay') {
    return (
      <div className={styles.overlay} aria-label="Cargando">
        <span className={styles.overlaySpinner} />
        {message && <p className={styles.overlayMsg}>{message}</p>}
      </div>
    );
  }

  // default: bar
  return (
    <div className={styles.barWrap} aria-label="Cargando">
      <div className={styles.barTrack}>
        <div className={styles.barFill} />
      </div>
      {message && <p className={styles.barMsg}>{message}</p>}
    </div>
  );
}
