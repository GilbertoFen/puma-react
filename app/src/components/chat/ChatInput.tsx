'use client';
import React, { useState, useRef } from 'react';
import styles from './ChatInput.module.css';
import { ATTACH_ICON, SEND_ICON } from '../../utils/img/assets';

type AttachedFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
};

type Props = {
  onSend: (text: string, files: AttachedFile[]) => void;
};

export default function ChatInput({ onSend }: Props) {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed && files.length === 0) return;
    onSend(trimmed, files);
    setText('');
    setFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  };

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const newFiles: AttachedFile[] = Array.from(incoming).map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      size: f.size,
      type: f.type,
      file: f,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragging(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const canSend = text.trim().length > 0 || files.length > 0;

  return (
    <div
      className={`${styles.outer} ${dragging ? styles.dragging : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {dragging && (
        <div className={styles.dragOverlay}>
          <span>Suelta los archivos aquí</span>
        </div>
      )}

      {files.length > 0 && (
        <div className={styles.fileList}>
          {files.map((f) => (
            <div key={f.id} className={styles.fileChip}>
              <FileIcon type={f.type} />
              <span className={styles.fileName}>{f.name}</span>
              <span className={styles.fileSize}>{formatSize(f.size)}</span>
              <button
                className={styles.fileRemove}
                onClick={() => removeFile(f.id)}
                type="button"
                title="Quitar archivo"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={styles.wrap}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => addFiles(e.target.files)}
        />

        <button
          className={styles.iconBtn}
          onClick={openFilePicker}
          type="button"
          title="Adjuntar archivo"
        >
          <AttachIcon />
        </button>

        <textarea
          ref={textareaRef}
          className={styles.input}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Escribe cualquier duda que tengas sobre..."
          rows={1}
        />

        <button
          className={`${styles.sendBtn} ${canSend ? styles.active : ''}`}
          onClick={handleSend}
          type="button"
          title="Enviar"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}

function AttachIcon() {
  return (
    <img
    src={ATTACH_ICON}
    alt="Adjuntar"
    style={{
      width:'24px',
      height: '24px',
    }}
    />
  );
}

function SendIcon() {
  return (
    <img
    src={SEND_ICON}
    alt="Enviar"
    style={{
      transform: 'rotate(180deg)',
      width:'24px',
      height: '24px',
    }}
    />
  
  );
}

function FileIcon({ type }: { type: string }) {
  const isImage = type.startsWith('image/');
  const isPdf = type === 'application/pdf';
  if (isImage) return <span style={{ fontSize: 14 }}>🖼</span>;
  if (isPdf)   return <span style={{ fontSize: 14 }}>📄</span>;
  return        <span style={{ fontSize: 14 }}>📎</span>;
}
