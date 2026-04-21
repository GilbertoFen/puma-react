'use client';
import React, { useState } from 'react';
import type { Message } from './ChatLayout';
import styles from './ChatMessage.module.css';
import { COPY_ICON, MORE_ICON, EDIT_ICON, AI_LOGO } from '../../utils/img/assets';

type Props = {
  message: Message;
  onEdit: (id: string, newText: string) => void;
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

export default function ChatMessage({ message, onEdit }: Props) {
  const isUser = message.role === 'user';
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
    onEdit(message.id, trimmed);
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
        ) : (
          <p className={styles.text}>{message.content}</p>
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
