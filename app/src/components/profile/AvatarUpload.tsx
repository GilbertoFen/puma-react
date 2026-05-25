'use client';
import React, { useState, useRef } from 'react';
import styles from './AvatarUpload.module.css';

type Props = {
  currentPhotoUrl?: string;
  initial: string;
  onUpload: (file: File) => Promise<string>; // recibe el archivo, devuelve la URL final
};

export default function AvatarUpload({ currentPhotoUrl, initial, onUpload }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | null) => {
    if (!file) return;

    // Validaciones
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes (JPG, PNG, WebP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar 5 MB');
      return;
    }

    // Preview inmediato antes de subir
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);

    setError('');
    setUploading(true);
    setSuccess(false);

    try {
      const finalUrl = await onUpload(file);
      setPreviewUrl(finalUrl);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err: any) {
      setError(err.message || 'Error al subir la imagen');
      setPreviewUrl(currentPhotoUrl || null); // revertir preview
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className={styles.wrap}>
      {/* Zona clickeable / drag */}
      <div
        className={`${styles.avatarZone} ${uploading ? styles.uploading : ''}`}
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        title="Cambiar foto de perfil"
      >
        {/* Foto o inicial */}
        {previewUrl ? (
          <img src={previewUrl} alt="Foto de perfil" className={styles.photo} />
        ) : (
          <div className={styles.initial}>{initial}</div>
        )}

        {/* Overlay de cámara — siempre visible al hover */}
        <div className={styles.overlay}>
          {uploading ? <SpinnerIcon /> : <CameraIcon />}
        </div>

        {/* Spinner de carga sobre la foto */}
        {uploading && <div className={styles.loadingRing} />}
      </div>

      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />

      {/* Feedback */}
      {error && <p className={styles.errorMsg}>{error}</p>}
      {success && <p className={styles.successMsg}><CheckIcon /> Foto actualizada</p>}
    </div>
  );
}

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: 'spin 0.8s linear infinite' }}>
      <path d="M12 2a10 10 0 0 1 10 10"/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}