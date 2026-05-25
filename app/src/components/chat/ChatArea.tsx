'use client';
import React, { useRef, useEffect, useState } from 'react';
import type { Conversation } from './ChatLayout';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import Navbar from '../Navbar';
import styles from './ChatArea.module.css';
import { HamburgerIcon } from '../home/HomePage';
import { AI_LOGO, EDIT_ICON, COPY_ICON, SEND_ICON } from '../../utils/img/assets';
import ChatSidebar from './ChatSidebar';
import TypingIndicator from '../loaders/TypingIndicator';
import { useRouter } from 'next/navigation';
type Props = {
  conversation: Conversation | null;
  suggestions: string[];
  onSend: (text: string) => void;
  sidebarOpen: boolean;
  displayName: string;
  setDrawerOpen: (open: boolean) => void;
  isTyping: boolean;

};

function AiLogo() {
  return (
    <img
      src={AI_LOGO}
      alt="IA"
      style={{ width: '124px', height: '124px', objectFit: 'contain', marginBottom: '12px' }}
    />
  );
}

export default function ChatArea({ conversation, suggestions, onSend, sidebarOpen, displayName, setDrawerOpen, isTyping }: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isEmpty = !conversation || !conversation.messages || conversation.messages.length === 0;
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages?.length, isTyping]);
  const router = useRouter();

  return (

    <div className={styles.main}>
      <div className={styles.container}>
        {isEmpty && !isTyping ? (
          <div className={styles.emptyState}>
            <AiLogo />
            <div className={styles.emptyText}>
              <h2 className={styles.emptyGreeting}>Hola {displayName}.</h2>
              <h2 className={styles.emptyQuestion}>¿Qué necesitas el día de hoy?</h2>
            </div>
            <div className={styles.suggestions}>
              {/* Sugerencia destacada — análisis profesional */}
              <button
                className={styles.suggestionHighlight}
                onClick={() => router.push('/analyze')}
              >
                <span className={styles.suggestionHighlightGlow} />
                ✨ Realiza un análisis profesional de mi perfil
              </button>

              {/* Sugerencias normales */}
              {suggestions.map((s) => (
                <button key={s} className={styles.suggestion} onClick={() => onSend(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Mensajes + typing juntos */
          <div className={styles.messages}>
            {conversation?.messages?.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isTyping && <TypingIndicator />}   {/* ← siempre visible aquí */}
            <div ref={messagesEndRef} />
          </div>
        )}

        <div className={styles.inputWrapper}>
          <ChatInput onSend={onSend} />
        </div>
      </div>
    </div>
  );
}
