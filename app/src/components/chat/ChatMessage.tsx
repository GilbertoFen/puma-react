'use client';
import React, { useState } from 'react';
import type { Message } from './ChatLayout';
import styles from './ChatMessage.module.css';
import { COPY_ICON, MORE_ICON, EDIT_ICON, AI_LOGO } from '../../utils/img/assets';
import ReactMarkdown from 'react-markdown';

type Props = {
  message: Message;
};

function AiAvatar() {
  return (
    <img
      src={AI_LOGO}
      alt="AI"
      style={{
        width: '24px',
        height: '24px',
      }}
    />
  );
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'USER';
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);

  const copy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const startEdit = () => {
    setEditText(message.content);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditText(message.content);
    setEditing(false);
  };

  const confirmEdit = () => {
    const trimmed = editText.trim();
    if (!trimmed || trimmed === message.content) {
      cancelEdit();
      return;
    }
    setEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      confirmEdit();
    }
    if (e.key === 'Escape') cancelEdit();
  };

  return (
    <div className={`${styles.row} ${isUser ? styles.userRow : styles.aiRow}`}>
      {!isUser && <AiAvatar />}

      <div className={styles.bubble}>
        {editing ? (
          <div className={styles.editWrap}>
            <textarea
              className={styles.editTextarea}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleEditKeyDown}
              autoFocus
              rows={3}
            />
            <div className={styles.editActions}>
              <button className={styles.cancelBtn} onClick={cancelEdit} type="button">
                Cancelar
              </button>
              <button className={styles.confirmBtn} onClick={confirmEdit} type="button">
                <CheckIcon /> Enviar
              </button>
            </div>
          </div>
        ) : message.content === '__error__' ? (
          <div className={styles.errorBubble}>
            <ErrorIcon />
            <div>
              <p className={styles.errorTitle}>PumaIA no pudo responder</p>
              <p className={styles.errorDesc}>
                Hubo un problema con el servidor. Intenta enviar tu mensaje de nuevo.
              </p>
            </div>
          </div>
        ) : (
          <p className={styles.text}><ReactMarkdown>{message.content}</ReactMarkdown></p>
        )}

        {!editing && (
          <div className={`${styles.actions} ${isUser ? styles.actionsUser : styles.actionsAi}`}>
            {isUser ? (
              <button className={styles.actionBtn} title="Editar mensaje" onClick={startEdit}>
                <EditIcon />
              </button>
            ) : (
              <>
                <button className={styles.actionBtn} title="Copiar" onClick={copy}>
                  {copied ? <CheckIcon /> : <CopyIcon />}
                </button>
                <button className={styles.actionBtn} title="Más opciones">
                  <DotsIcon />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
function ErrorIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, marginTop: 2 }}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
function EditIcon() {
  return (
    <img
      src={EDIT_ICON}
      alt="Editar"
      style={{
        width: '14px',
        height: '14px',
      }}
    />
  );
}

function CopyIcon() {
  return (
    <img
      src={COPY_ICON}
      alt="Copiar"
      style={{
        width: '14px',
        height: '14px',
      }}
    />
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <img
      src={MORE_ICON}
      alt="Mas opciones"
      style={{
        width: '14px',
        height: '14px',
      }}
    />
  );
}
