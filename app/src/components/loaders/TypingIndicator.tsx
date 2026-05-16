'use client';
import React from 'react';
import styles from './TypingIndicator.module.css';

// Úsalo en ChatArea.tsx justo donde renderizas los mensajes.
// Muéstralo mientras el stream de la IA no ha terminado:
//
//   {isTyping && <TypingIndicator />}
//
// "isTyping" es true desde que el usuario envía hasta que
// el backend manda la primera línea de respuesta.

export default function TypingIndicator() {
  return (
    <div className={styles.row}>
      {/* Avatar de la IA — igual que en ChatMessage */}
      <div className={styles.avatar}>
        <AiAvatar />
      </div>

      <div className={styles.bubble}>
        {/* Tres puntos animados */}
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
    </div>
  );
}

function AiAvatar() {
  return (
    // Reemplaza con tu imagen de Cloudinary si lo prefieres:
    // <img src="TU_URL" style={{width:'100%',height:'100%',objectFit:'contain',borderRadius:'50%'}} />
    <svg viewBox="0 0 36 36" fill="none" width="36" height="36">
      <circle cx="18" cy="18" r="17" stroke="rgba(201,168,76,0.5)" strokeWidth="1.2"/>
      <circle cx="18" cy="18" r="12" fill="rgba(201,168,76,0.08)"/>
      <path d="M13 16c0-2.8 2.2-5 5-5s5 2.2 5 5c0 1.6-.8 3-2 3.9L22 26H14l1-7.1C13.8 19 13 17.6 13 16z"
        fill="none" stroke="rgba(201,168,76,0.8)" strokeWidth="1.1" strokeLinejoin="round"/>
    </svg>
  );
}
