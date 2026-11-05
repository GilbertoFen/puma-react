'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { AI_LOGO } from '../../utils/img/assets';
import { QrTokenPayload } from './teacherTypes';

interface DynamicQrCodeProps {
  payload?: QrTokenPayload | null;
  size?: number;
}

/**
 * Generador visual de código QR dinámico funcional y estandarizado.
 * Utiliza QRCodeSVG de qrcode.react con nivel de corrección de error alto (level="H"),
 * codificando la URL oficial "https://pumaia.vercel.app" para lectura física con cualquier móvil
 * e incrustando el logotipo oficial de PumaIA en el centro excavado proporcionalmente.
 */
export default function DynamicQrCode({ payload, size = 260 }: DynamicQrCodeProps) {
  const qrValue = payload && payload.sessionId && payload.dynamicSalt
    ? JSON.stringify({
        app: 'pumaia',
        sessionId: payload.sessionId,
        secret: payload.dynamicSalt,
        courseId: payload.courseId,
        groupId: payload.groupId,
        expiresAt: payload.expiresAt,
      })
    : 'https://pumaia.vercel.app';
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
