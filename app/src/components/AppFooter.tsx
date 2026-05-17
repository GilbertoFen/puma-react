'use client';
import React from 'react';
import Link from 'next/link';
import styles from './AppFooter.module.css';

type Variant =
  | 'dark'    // fondo oscuro translúcido — para home, chat, profile, etc.
  | 'light'   // fondo claro sobre tarjeta blanca — para login, faqs
  | 'minimal' // una sola línea compacta — para páginas con poco espacio

type Props = {
  variant?: Variant;
  appName?: string;
};

export default function AppFooter({ variant = 'dark', appName = 'PUMAIA' }: Props) {
  return (
    <footer className={`${styles.footer} ${styles[variant]}`}>

      {/* Columna izquierda — marca */}
      <div className={styles.brand}>
        <span className={styles.brandName}>{appName}</span>
        <span className={styles.brandSub}>FES Acatlán · UNAM</span>
        <span className={styles.copy}>© {new Date().getFullYear()} Todos los derechos reservados</span>
      </div>

      {/* Columna centro — links */}
      <nav className={styles.links}>
        <Link href="/about-page" className={styles.link}>¿Qué es {appName}?</Link>
        <Link href="/faqs" className={styles.link}>Preguntas frecuentes</Link>
        <a
          href="https://www.acatlan.unam.mx"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          Sitio FES Acatlán
        </a>
        <a
          href="https://www.unam.mx"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          Página oficial UNAM
        </a>
        <a
          href="https://mac.acatlan.unam.mx/portada/"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          Página oficial de MAC
        </a>
      </nav>

      {/* Columna derecha — ayuda */}
      <div className={styles.help}>
        <span className={styles.helpLabel}>¿Necesitas ayuda?</span>
        <Link href="/faqs" className={styles.helpLink}>Visita las FAQs</Link>
      </div>

    </footer>
  );
}
