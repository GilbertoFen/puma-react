'use client';
import React, { useState, useRef } from 'react';
import type { UploadedDocument, DocumentCategory } from '../../types/shared.types';
import { DOCUMENT_CATEGORY_LABELS } from '../../types/shared.types';
import { gradeService, Subject } from '../../services/grades.service';
import styles from './Sections.module.css';
import AcademicHistoryDropdown from './AcademicHistoryDropdown';

type Props = {
  documents: UploadedDocument[];
};

// Estados internos para la subida asíncrona del historial académico
type UploadState = 'idle' | 'loading_pdf' | 'review_grades' | 'saving_supabase';

export default function DocumentsSection({ documents: initial }: Props) {
  const [docs, setDocs] = useState<UploadedDocument[]>(initial);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>('cv');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- NUEVOS ESTADOS COMPARTIDOS DEL PIPELINE DE MATERIAS ---
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [detectedSubjects, setDetectedSubjects] = useState<Subject[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftGrade, setDraftGrade] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Método unificado de subida
  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const targetFile = files[0];
    setErrorMsg(null);

    // ── DISPARO DE CASO ESPECIAL: Historial Académico Certificado ──
    if (selectedCategory === 'historial_academico') {
      if (targetFile.type !== 'application/pdf') {
        setErrorMsg('El historial académico debe ser obligatoriamente un archivo PDF.');
        return;
      }
      
      setUploadState('loading_pdf');
      try {
        // Ejecutamos tu llamada real al backend extractor de Python/Gemini
        const data = await gradeService.analyzePDF(targetFile);
        setDetectedSubjects(data.subjects);
        setUploadState('review_grades'); // Saltamos al modo revisión de materias
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || 'Error al analizar el PDF de calificaciones.');
        setUploadState('idle');
      }
      return; // Cortamos el flujo normal
    }

    // ── FLUJO NORMAL: Si es CV o Certificados tradicionales ──
    const newDocs: UploadedDocument[] = Array.from(files).map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      category: selectedCategory,
      uploadedAt: new Date().toISOString(),
      size: f.size,
    }));
    setDocs((prev) => [...prev, ...newDocs]);
    // TODO: Subida tradicional a Cloudinary/S3 para archivos planos
  };

  // ── Confirmar y escribir en Supabase (Pipeline de la pantalla inicial) ──
  const handleConfirmGrades = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error("Sesión caducada. Por favor, reingresa al sistema.");

      setUploadState('saving_supabase');
      
      // Persistimos los arreglos directamente en Supabase mediante NestJS
      await gradeService.confirmGrades(detectedSubjects, token);
      
      // Si todo sale bien, simulamos la inyección del documento en la lista visual
      const virtualDoc: UploadedDocument = {
        id: crypto.randomUUID(),
        name: 'Historial_Academico_Certificado_Validado.pdf',
        category: 'historial_academico',
        uploadedAt: new Date().toISOString(),
      };
      
      setDocs((prev) => [
        ...prev.filter(d => d.category !== 'historial_academico'), // Quitamos el anterior si existía
        virtualDoc
      ]);
      
      setUploadState('idle');
      alert("¡Historial académico actualizado con éxito en tu base de datos!");
      window.location.reload(); // Recarga sutil para actualizar los otros dropdowns de la página
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'No se pudieron guardar las calificaciones detectadas.');
      setUploadState('review_grades');
    }
  };

  // ── Métodos de edición en caliente de la tabla detectada ──
  const startEdit = (s: Subject) => {
    setEditingId(s.subjectID);
    setDraftGrade(String(s.grade));
  };

  const saveEdit = (id: string) => {
    const parsed = parseInt(draftGrade, 10);
    if (isNaN(parsed) || parsed < 0 || parsed > 10) return;
    setDetectedSubjects((prev) =>
      prev.map((s) => (s.subjectID === id ? { ...s, grade: parsed } : s))
    );
    setEditingId(null);
  };

  const removeDoc = (id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });

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
          Sube tu historial académico, CV y certificados para que PumaIA configure un análisis más completo de tu perfil profesional de MAC.
        </p>
      </div>

      {errorMsg && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* ══ MÁQUINA DE ESTADOS DINÁMICA DEL UPLOAD ══ */}
      {uploadState === 'idle' && (
        <div
          className={styles.uploadArea}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleUpload(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.png"
            style={{ display: 'none' }}
            onChange={(e) => handleUpload(e.target.files)}
          />
          <UploadIcon />
          <p className={styles.uploadTitle}>Arrastra archivos aquí o haz click para seleccionar</p>
          <p className={styles.uploadHint}>PDF, Word, JPG o PNG · Máximo 10 MB por archivo</p>

          <div className={styles.categorySelect} onClick={(e) => e.stopPropagation()}>
            <label className={styles.categoryLabel}>Categoría del documento:</label>
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
      )}

      {uploadState === 'loading_pdf' && (
        <div style={{ textAlign: 'center', padding: '40px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.05)' }}>
          <div className={styles.spinnerIconWrap}>🌀</div>
          <p style={{ color: '#c9a84c', fontSize: '14px', marginTop: '12px', fontWeight: 500 }}>PumaIA está analizando tu Historial Académico...</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '4px' }}>Extrayendo asignaturas y calificaciones con Inteligencia Artificial.</p>
        </div>
      )}

      {uploadState === 'saving_supabase' && (
        <div style={{ textAlign: 'center', padding: '40px 10px' }}>
          <p style={{ color: '#4ade80', fontSize: '14px', fontWeight: 500 }}>Escribiendo registros en Supabase...</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>Sincronizando expediente con tu perfil.</p>
        </div>
      )}

      {uploadState === 'review_grades' && (
        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.06)', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
          <h4 style={{ color: '#4ade80', fontSize: '15px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>✓ Historial procesado exitosamente</h4>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginBottom: '16px' }}>Verifica las materias detectadas antes de consolidar el cambio en el sistema:</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto', paddingRight: '6px', marginBottom: '20px' }}>
            {detectedSubjects.map((s) => (
              <div key={s.subjectID} style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)' }}>
                <span style={{ fontSize: '13px', color: '#fff', flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{s.subjectName}</span>
                
                {editingId === s.subjectID ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      style={{ width: '50px', background: '#111', border: '1px solid #c9a84c', color: '#fff', textAlign: 'center', borderRadius: '4px', fontSize: '13px', padding: '2px' }}
                      type="number" min={0} max={10} value={draftGrade}
                      onChange={(e) => setDraftGrade(e.target.value)}
                    />
                    <button style={{ background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer' }} onClick={() => saveEdit(s.subjectID)}>✓</button>
                    <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }} onClick={() => setEditingId(null)}>✕</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: s.grade >= 9 ? '#4ade80' : s.grade >= 7 ? '#c9a84c' : '#f87171' }}>{s.grade}</span>
                    <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }} onClick={() => startEdit(s)}>✏️</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'end' }}>
            <button style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }} onClick={() => setUploadState('idle')}>Cancelar</button>
            <button style={{ background: '#4ade80', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }} onClick={handleConfirmGrades}>Confirmar y sobreescribir historial</button>
          </div>
        </div>
      )}

      {/* ── LISTA DE DOCUMENTOS SUBIDOS ── */}
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
      
      <AcademicHistoryDropdown /> 
    </div>
  );
}

// Subcomponentes e iconos de presentación permanecen idénticos...
function FileIcon({ category }: { category: DocumentCategory }) {
  const emoji = category === 'cv' ? '📄' : category === 'historial_academico' ? '📜' : '📎';
  return <span style={{ fontSize: 20, flexShrink: 0 }}>{emoji}</span>;
}
function UploadIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  );
}