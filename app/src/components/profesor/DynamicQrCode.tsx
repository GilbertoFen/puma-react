'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { AI_LOGO } from '../../utils/img/assets';
import { QrTokenPayload } from './teacherTypes';
import { ENV } from '../../config/env.config';

interface DynamicQrCodeProps {
  payload?: QrTokenPayload | null;
  url?: string;
  size?: number;
}

/**
 * Generador visual de código QR dinámico funcional y estandarizado.
 * Utiliza QRCodeSVG de qrcode.react con nivel de corrección de error alto (level="H"),
 * codificando la URL oficial y completa de asistencia para lectura física directa con
 * cualquier dispositivo móvil (iOS / Android) e incrustando el logotipo oficial de PumaIA.
 */
export default function DynamicQrCode({ payload, url, size = 260 }: DynamicQrCodeProps) {
  let qrValue = url || '';

  if (!qrValue) {
    if (payload && payload.sessionId && payload.dynamicSalt) {
      const baseUrl =
        (typeof window !== 'undefined' && window.location?.origin) ||
        ENV.APP_URL ||
        'http://localhost:3000';
      const params = new URLSearchParams({
        sessionId: payload.sessionId,
        secret: payload.dynamicSalt,
        courseName: payload.courseId || 'Asignatura UNAM',
        group: payload.groupId || 'Grupo',
        sectionId: payload.courseId || '',
      });
      qrValue = `${baseUrl}/attendance?${params.toString()}`;
    } else {
      qrValue = 'https://pumaia.vercel.app/attendance';
    }
  }

  const logoSize = Math.round(size * 0.2); // ~20% del tamaño total para preservar legibilidad

  return (
    <div
      style={{
        display: 'inline-flex',
        padding: '16px',
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45), 0 0 0 2px rgba(201, 168, 76, 0.6)',
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <QRCodeSVG
        value={qrValue}
        size={size}
        level="H"
        bgColor="#ffffff"
        fgColor="#060d1f"
        imageSettings={{
          src: AI_LOGO as string,
          x: undefined,
          y: undefined,
          height: logoSize,
          width: logoSize,
          excavate: true,
        }}
      />
    </div>
  );
}
