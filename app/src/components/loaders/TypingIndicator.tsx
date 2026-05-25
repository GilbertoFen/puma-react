'use client';
import React from 'react';
import styles from './TypingIndicator.module.css';
import { AI_LOGO } from '../../utils/img/assets';
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
    <img src={AI_LOGO} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} ></img>
    
  )
}
