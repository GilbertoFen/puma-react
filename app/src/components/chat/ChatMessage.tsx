'use client';
import React, { useState } from 'react';
import type { Message } from './ChatLayout';
import styles from './ChatMessage.module.css';
import { COPY_ICON, MORE_ICON, EDIT_ICON, AI_LOGO } from '../../utils/img/assets';
import ReactMarkdown from 'react-markdown';
import { chatService } from '../../services/chat.service';

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

  const [feedback, setFeedback] = useState<'UP' | 'DOWN' | null>(
    (message as any).feedback?.value || null
  );
  const [showDislikeModal, setShowDislikeModal] = useState(false);
  const [dislikeComment, setDislikeComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleLike = async () => {
    if (submittingFeedback || !message.id || message.id.startsWith('error-')) return;
    setSubmittingFeedback(true);
    try {
      await chatService.sendFeedback(message.id, 'UP', 'La respuesta solucionó el problema');
      setFeedback('UP');
    } catch (err) {
      console.error('Error al registrar like:', err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleOpenDislikeModal = () => {
    setShowDislikeModal(true);
  };

  const handleConfirmDislike = async () => {
    if (submittingFeedback || !message.id) return;
    setSubmittingFeedback(true);
    try {
      await chatService.sendFeedback(
        message.id,
        'DOWN',
        dislikeComment.trim() || undefined
      );
      setFeedback('DOWN');
      setShowDislikeModal(false);
    } catch (err) {
      console.error('Error al registrar dislike:', err);
    } finally {
      setSubmittingFeedback(false);
    }
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
                <button className={styles.actionBtn} title="Copiar respuesta" onClick={copy}>
                  {copied ? <CheckIcon /> : <CopyIcon />}
                </button>
                {message.content !== '__error__' && !message.id.startsWith('error-') && (
                  <>
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${feedback === 'UP' ? styles.actionBtnActiveUp : ''}`}
                      title={feedback === 'UP' ? 'Te gustó esta respuesta' : 'Dar like (La respuesta solucionó el problema)'}
                      onClick={handleLike}
                      disabled={submittingFeedback}
                    >
                      <ThumbsUpIcon filled={feedback === 'UP'} />
                    </button>
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${feedback === 'DOWN' ? styles.actionBtnActiveDown : ''}`}
                      title={feedback === 'DOWN' ? 'No te gustó esta respuesta' : 'Dar dislike (Comentarios opcionales)'}
                      onClick={handleOpenDislikeModal}
                      disabled={submittingFeedback}
                    >
                      <ThumbsDownIcon filled={feedback === 'DOWN'} />
                    </button>
                  </>
                )}
                <button className={styles.actionBtn} title="Más opciones">
                  <DotsIcon />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {showDislikeModal && (
        <div
          className={styles.feedbackModalOverlay}
          onClick={() => setShowDislikeModal(false)}
        >
          <div
            className={styles.feedbackModalCard}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.feedbackModalHeader}>
              <h3 className={styles.feedbackModalTitle}>Retroalimentación de respuesta</h3>
              <button
                type="button"
                className={styles.feedbackModalCloseBtn}
                onClick={() => setShowDislikeModal(false)}
                title="Cerrar"
              >
                <CloseIcon />
              </button>
            </div>
            <p className={styles.feedbackModalDesc}>
              ¿Por qué no fue de ayuda esta respuesta? Tus comentarios nos ayudan a mejorar PumaIA para toda la comunidad de la FES Acatlán.
            </p>
            <textarea
              className={styles.feedbackTextarea}
              placeholder="Cuéntanos qué podemos mejorar o qué información fue incorrecta (opcional)..."
              value={dislikeComment}
              onChange={(e) => setDislikeComment(e.target.value)}
              maxLength={500}
            />
            <div className={styles.feedbackModalActions}>
              <button
                type="button"
                className={styles.feedbackCancelBtn}
                onClick={() => setShowDislikeModal(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.feedbackSubmitBtn}
                onClick={handleConfirmDislike}
                disabled={submittingFeedback}
              >
                {submittingFeedback ? 'Enviando...' : 'Enviar retroalimentación'}
              </button>
            </div>
          </div>
        </div>
      )}
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

function ThumbsUpIcon({ filled }: { filled?: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

function ThumbsDownIcon({ filled }: { filled?: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
