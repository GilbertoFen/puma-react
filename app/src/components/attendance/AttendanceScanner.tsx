'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import { attendanceService } from '../../services/attendance.service';
import styles from './AttendancePage.module.css';

interface AttendanceScannerProps {
  onSuccess?: () => void;
  onGoToCalendar?: () => void;
}

export default function AttendanceScanner({ onSuccess, onGoToCalendar }: AttendanceScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  const [scanResult, setScanResult] = useState<{
    subjectName?: string;
    group?: string;
    markedAt: string;
    status: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const hasCapturedRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const barcodeDetectorRef = useRef<any>(null);

  // Detección nativa de códigos QR por hardware si el navegador lo soporta (Android Chrome, iOS Safari 17+)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        const BD = (window as any).BarcodeDetector;
        if (typeof BD.getSupportedFormats === 'function') {
          BD.getSupportedFormats()
            .then((formats: string[]) => {
              if (formats.includes('qr_code')) {
                barcodeDetectorRef.current = new BD({ formats: ['qr_code'] });
              }
            })
            .catch(() => {});
        }
      } catch (_) {}
    }
  }, []);

  // Detener la cámara de manera segura
  const stopCamera = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Procesamiento del payload QR y llamada al backend
  const handleDecodedText = useCallback(async (rawText: string) => {
    if (hasCapturedRef.current || isProcessing) return;
    hasCapturedRef.current = true;
    setIsProcessing(true);
    setBackendError(null);

    // Feedback táctil en móviles
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(150);
      } catch (_) {}
    }

    try {
      let sessionId = '';
      let secret = '';

      // 1. Intentar decodificar como URL completa con parámetros (estándar oficial PumaIA)
      try {
        const url = new URL(rawText);
        sessionId = url.searchParams.get('sessionId') || url.searchParams.get('session_id') || '';
        secret = url.searchParams.get('secret') || url.searchParams.get('token') || '';
      } catch (_) {
        // 2. Intentar decodificar como JSON (formato alternativo/legado)
        try {
          const parsed = JSON.parse(rawText);
          sessionId = parsed.sessionId || parsed.session_id || parsed.id || '';
          secret = parsed.secret || parsed.qrToken || parsed.token || parsed.dynamicSalt || '';
        } catch (_) {
          // 3. Fallback: formato delimitado 'sessionId|secret' o 'sessionId:secret'
          if (rawText.includes('|')) {
            const parts = rawText.split('|');
            sessionId = parts[0]?.trim();
            secret = parts[1]?.trim();
          } else if (rawText.includes(':')) {
            const parts = rawText.split(':');
            sessionId = parts[0]?.trim();
            secret = parts[1]?.trim();
          }
        }
      }

      if (!sessionId || !secret) {
        throw new Error(
          'El código QR escaneado no corresponde a una sesión de asistencia válida de PumaIA.'
        );
      }

      stopCamera();

      // Enviar al backend para validación oficial
      const response = await attendanceService.recordAttendance({
        sessionId,
        secret,
      });

      const record = response.record;
      const officialSubject =
        record.session?.section?.subject?.subject ||
        record.session?.section?.subject?.name ||
        record.session?.section?.name ||
        'Asignatura UNAM';
      const officialGroup = record.session?.section?.groupCode
        ? `Grupo ${record.session.section.groupCode}`
        : record.session?.section?.group || 'Grupo asignado';

      setScanResult({
        subjectName: officialSubject,
        group: officialGroup,
        markedAt: new Date(record.markedAt || Date.now()).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        status: 'Asistencia confirmada',
      });

      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Error al registrar asistencia:', err);
      setBackendError(err.message || 'No fue posible registrar tu asistencia.');
      hasCapturedRef.current = false;
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, onSuccess, stopCamera]);

  // Ciclo continuo y optimizado de lectura de fotogramas de video
  const scanLoop = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || video.videoWidth === 0) {
      if (!hasCapturedRef.current) {
        animationFrameId.current = requestAnimationFrame(scanLoop);
      }
      return;
    }

    const now = performance.now();
    // Throttle a ~15 lecturas por segundo para mantener 60fps fluidos sin sobrecargar CPU de móviles
    if (now - lastScanTimeRef.current >= 65) {
      lastScanTimeRef.current = now;

      // 1. Prioridad: BarcodeDetector nativo acelerado por hardware
      if (barcodeDetectorRef.current) {
        try {
          const barcodes = await barcodeDetectorRef.current.detect(video);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            handleDecodedText(barcodes[0].rawValue);
            return;
          }
        } catch (_) {
          // Si falla BarcodeDetector continúa al fallback de jsQR
        }
      }

      // 2. Fallback de alta velocidad: jsQR con canvas reutilizable y resolución adaptada
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }
      const canvas = canvasRef.current;

      // Escalado a resolución óptima (máx 640px) para decodificación en <10ms en cualquier móvil
      const MAX_DIM = 640;
      let scale = 1;
      if (video.videoWidth > MAX_DIM || video.videoHeight > MAX_DIM) {
        scale = Math.min(MAX_DIM / video.videoWidth, MAX_DIM / video.videoHeight);
      }
      const scanWidth = Math.max(320, Math.floor(video.videoWidth * scale));
      const scanHeight = Math.max(240, Math.floor(video.videoHeight * scale));

      if (canvas.width !== scanWidth || canvas.height !== scanHeight) {
        canvas.width = scanWidth;
        canvas.height = scanHeight;
      }

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, scanWidth, scanHeight);
        const imageData = ctx.getImageData(0, 0, scanWidth, scanHeight);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (code && code.data && code.data.trim() !== '') {
          handleDecodedText(code.data);
          return;
        }
      }
    }

    if (!hasCapturedRef.current) {
      animationFrameId.current = requestAnimationFrame(scanLoop);
    }
  }, [handleDecodedText]);

  // Iniciar cámara web / cámara del móvil
  const startCamera = async () => {
    setPermissionError(null);
    setBackendError(null);
    setScanResult(null);
    hasCapturedRef.current = false;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionError(
        'Tu navegador o dispositivo no soporta el acceso a la cámara. Intenta con un navegador moderno.'
      );
      return;
    }

    try {
      // Priorizar cámara trasera en móviles (facingMode environment) con resolución HD estándar
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setIsScanning(true);

      // Conexión del stream al elemento de video
      requestAnimationFrame(() => {
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.setAttribute('playsinline', 'true');
          video.setAttribute('webkit-playsinline', 'true');
          video.muted = true;
          video
            .play()
            .then(() => {
              if (!animationFrameId.current) {
                animationFrameId.current = requestAnimationFrame(scanLoop);
              }
            })
            .catch((e) => {
              console.error('Error reproduciendo video:', e);
            });
        }
      });
    } catch (err: any) {
      console.warn('Permiso de cámara rechazado o error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError(
          'Se denegó el permiso para usar la cámara. Por favor autoriza el acceso a la cámara en los ajustes de tu navegador para poder registrar tu asistencia.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPermissionError('No se encontró ninguna cámara conectada en tu equipo.');
      } else {
        setPermissionError(`Error de cámara: ${err.message || 'No fue posible iniciar el video.'}`);
      }
      setIsScanning(false);
    }
  };

  return (
    <div className={styles.scannerCard}>
      {/* 1. Modal / Tarjeta de Asistencia Confirmada */}
      {scanResult ? (
        <div className={styles.successCard}>
          <div className={styles.successIconWrap}>
            <CheckBadgeLargeIcon />
          </div>

          <h3 className={styles.successTitle}>¡Asistencia Registrada!</h3>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
            Tu asistencia ha sido verificada y registrada en el sistema de PumaIA.
          </p>

          <div className={styles.successDetailsBox}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Asignatura:</span>
              <span className={styles.detailValue}>{scanResult.subjectName}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Grupo:</span>
              <span className={styles.detailValue}>{scanResult.group}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Hora de registro:</span>
              <span className={styles.detailValue}>{scanResult.markedAt}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Estatus oficial:</span>
              <span className={styles.detailValue} style={{ color: '#4ade80' }}>
                Presente (Validado con QR)
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '6px', width: '100%' }}>
            <button
              type="button"
              className={styles.btnSecondary}
              style={{ flex: 1 }}
              onClick={() => {
                setScanResult(null);
                startCamera();
              }}
            >
              Escanear otra vez
            </button>
            {onGoToCalendar && (
              <button
                type="button"
                className={styles.btnPrimary}
                style={{ flex: 1 }}
                onClick={onGoToCalendar}
              >
                Ver en mi calendario
              </button>
            )}
          </div>
        </div>
      ) : isScanning ? (
        /* 2. Visor de Cámara Activo */
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%' }}>
          <div className={styles.viewportContainer}>
            <video
              ref={(el) => {
                videoRef.current = el;
                if (el && streamRef.current && el.srcObject !== streamRef.current) {
                  el.srcObject = streamRef.current;
                  el.setAttribute('playsinline', 'true');
                  el.setAttribute('webkit-playsinline', 'true');
                  el.muted = true;
                  el.play()
                    .then(() => {
                      if (!animationFrameId.current) {
                        animationFrameId.current = requestAnimationFrame(scanLoop);
                      }
                    })
                    .catch(() => {});
                }
              }}
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  videoRef.current
                    .play()
                    .then(() => {
                      if (!animationFrameId.current) {
                        animationFrameId.current = requestAnimationFrame(scanLoop);
                      }
                    })
                    .catch(() => {});
                }
              }}
              className={styles.cameraVideo}
              playsInline
              muted
              autoPlay
            />

            {/* Máscara y Retícula de Enfoque */}
            <div className={styles.scanOverlay}>
              <div className={styles.scanFrame}>
                <span className={styles.cornerTopLeft} />
                <span className={styles.cornerTopRight} />
                <span className={styles.cornerBottomLeft} />
                <span className={styles.cornerBottomRight} />
                <div className={styles.scanLaser} />
              </div>
            </div>

            <div className={styles.scanInstructionBadge}>
              {isProcessing ? 'Validando asistencia...' : 'Apunta al código QR del profesor'}
            </div>
          </div>

          {backendError && (
            <div className={styles.permissionAlert} style={{ marginTop: '4px' }}>
              <span className={styles.permissionAlertTitle}>Error al validar</span>
              <span className={styles.permissionAlertDesc}>{backendError}</span>
            </div>
          )}

          <button
            type="button"
            className={styles.btnSecondary}
            onClick={stopCamera}
          >
            Cancelar escaneo
          </button>
        </div>
      ) : (
        /* 3. Estado inicial: Botón para abrir el escáner */
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div className={styles.scannerIconWrap}>
            <QrCodeLargeIcon />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <h3 className={styles.scannerCardTitle}>Pasar Asistencia a Clase</h3>
            <p className={styles.scannerCardDesc}>
              Coloca la cámara de tu teléfono o computadora frente al código QR dinámico
              que proyecta tu profesor al inicio de la sesión.
            </p>
          </div>

          {permissionError && (
            <div className={styles.permissionAlert}>
              <span className={styles.permissionAlertTitle}>Acceso a la cámara requerido</span>
              <span className={styles.permissionAlertDesc}>{permissionError}</span>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={startCamera}
                style={{ marginTop: '8px' }}
              >
                Reintentar permiso de cámara
              </button>
            </div>
          )}

          {backendError && (
            <div className={styles.permissionAlert}>
              <span className={styles.permissionAlertTitle}>Aviso de asistencia</span>
              <span className={styles.permissionAlertDesc}>{backendError}</span>
            </div>
          )}

          <button
            type="button"
            className={styles.btnPrimary}
            onClick={startCamera}
            style={{ fontSize: '15px', padding: '14px 32px' }}
          >
            <CameraIcon /> Abrir escáner de asistencia
          </button>
        </div>
      )}
    </div>
  );
}

function QrCodeLargeIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <path d="M7 7h.01M17 7h.01M7 17h.01M17 17h.01" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function CheckBadgeLargeIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
      stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 3.09 4.37.64.64 4.37L22 12l-1.9 3.9-.64 4.37-4.37.64L12 22l-3.09-3.09-4.37-.64-.64-4.37L2 12l1.9-3.9.64-4.37 4.37-.64z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

