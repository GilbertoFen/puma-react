'use client';
import React from 'react';
import styles from './PageLoader.module.css';
import { AI_LOGO } from '../../utils/img/assets';
type Props = {
  message?: string;   // texto opcional debajo del logo
};

// Úsalo así en cualquier page.tsx o componente de página:
//
//   const [loading, setLoading] = useState(true);
//   if (loading) return <PageLoader message="Cargando tu perfil..." />;
//
// O en el chat mientras espera la primera respuesta:
//   if (!chatReady) return <PageLoader message="Iniciando PumaIA..." />;

export default function PageLoader({ message }: Props) {
  return (
    <div className={styles.root}>
      <div className={styles.bgMesh} />

      <div className={styles.center}>
        {/* Logo animado — reemplaza el SVG con tu imagen de Cloudinary */}
        <div className={styles.logoWrap}>
          <img src={AI_LOGO} alt="Análisis" style={{width:'100%',height:'100%',objectFit:'contain'}} /> 
          <div className={styles.pulse} />
        </div>

        {/* Barra de progreso indeterminada */}
        <div className={styles.barTrack}>
          <div className={styles.barFill} />
        </div>

        {message && <p className={styles.message}>{message}</p>}
      </div>
    </div>
  );
}

function LogoIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <circle cx="28" cy="28" r="27" stroke="rgba(201,168,76,0.35)" strokeWidth="1.5"/>
      <circle cx="28" cy="28" r="20" fill="rgba(201,168,76,0.07)"/>
      <circle cx="28" cy="22" r="6" fill="none" stroke="rgba(201,168,76,0.85)" strokeWidth="1.6"/>
      <path d="M18 40c0-5.5 4.5-10 10-10s10 4.5 10 10"
        stroke="rgba(201,168,76,0.85)" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M28 16v-4M28 44v-2M16 28h-4M44 28h-2"
        stroke="rgba(201,168,76,0.3)" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}
