'use client';
import React, { useState, useRef } from 'react';
import type { UploadedDocument, DocumentCategory } from '../../types/shared.types';
import { DOCUMENT_CATEGORY_LABELS } from '../../types/shared.types';
import styles from './Sections.module.css';

type Props = {
  documents: UploadedDocument[];
};

export default function DocumentsSection({ documents: initial }: Props) {
  const [docs, setDocs] = useState<UploadedDocument[]>(initial);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>('cv');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (files: FileList | null) => {
    if (!files) return;
    const newDocs: UploadedDocument[] = Array.from(files).map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      category: selectedCategory,
      uploadedAt: new Date().toISOString(),
      size: f.size,
    }));
    setDocs((prev) => [...prev, ...newDocs]);
    // TODO: subir a Cloudinary/API aquí
  };

  const removeDoc = (id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
    // TODO: llamada DELETE a la API
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });

  // Agrupa documentos por categoría
  const grouped = (Object.keys(DOCUMENT_CATEGORY_LABELS) as DocumentCategory[])
    .map((cat) => ({
      category: cat,
      label: DOCUMENT_CATEGORY_LABELS[cat],
      items: docs.filter((d) => d.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Mis documentos</h2>
        <p className={styles.sectionDesc}>
          Sube tu tira de materias, CV y certificados para que PumaIA tenga un análisis más completo de tu perfil.
        </p>
      </div>

      {/* Upload area */}
      <div
        className={styles.uploadArea}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleUpload(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.png"
          style={{ display: 'none' }}
          onChange={(e) => handleUpload(e.target.files)}
        />
        <UploadIcon />
        <p className={styles.uploadTitle}>Arrastra archivos aquí o haz click para seleccionar</p>
        <p className={styles.uploadHint}>PDF, Word, JPG o PNG · Máximo 10 MB por archivo</p>

        {/* Selector de categoría */}
        <div className={styles.categorySelect} onClick={(e) => e.stopPropagation()}>
          <label className={styles.categoryLabel}>Categoría:</label>
          <select
            className={styles.select}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as DocumentCategory)}
          >
            {(Object.entries(DOCUMENT_CATEGORY_LABELS) as [DocumentCategory, string][]).map(
              ([val, label]) => (
                <option key={val} value={val}>{label}</option>
              )
            )}
          </select>
        </div>
      </div>

      {/* Lista de documentos agrupada */}
      {grouped.length === 0 ? (
        <p className={styles.emptyMsg}>No has subido documentos aún.</p>
      ) : (
        <div className={styles.docGroups}>
          {grouped.map(({ category, label, items }) => (
            <div key={category} className={styles.docGroup}>
              <h4 className={styles.docGroupLabel}>{label}</h4>
              {items.map((doc) => (
                <div key={doc.id} className={styles.docRow}>
                  <FileIcon category={doc.category} />
                  <div className={styles.docInfo}>
                    <span className={styles.docName}>{doc.name}</span>
                    <span className={styles.docMeta}>
                      {formatDate(doc.uploadedAt)}
                      {doc.size ? ` · ${formatSize(doc.size)}` : ''}
                    </span>
                  </div>
                  <div className={styles.docActions}>
                    {doc.url && (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer"
                        className={styles.docBtn} title="Ver documento">
                        <EyeIcon />
                      </a>
                    )}
                    <button
                      className={`${styles.docBtn} ${styles.docBtnDanger}`}
                      onClick={() => removeDoc(doc.id)}
                      title="Eliminar documento"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FileIcon({ category }: { category: DocumentCategory }) {
  const emoji = category === 'cv' ? '📄' : category === 'tira_materias' ? '📋' : '📎';
  return <span style={{ fontSize: 20, flexShrink: 0 }}>{emoji}</span>;
}
function UploadIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
      stroke="rgba(201,168,76,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16"/>
      <line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  );
}
