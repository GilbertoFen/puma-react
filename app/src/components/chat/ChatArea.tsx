'use client';
import React, { useRef, useEffect } from 'react';
import type { Conversation } from './ChatLayout';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import Navbar from '../Navbar';
import styles from './ChatArea.module.css';
import { AI_LOGO, EDIT_ICON, COPY_ICON, SEND_ICON } from '../../utils/img/assets';
type Props = {
  conversation: Conversation | null;
  suggestions: string[];
  onSend: (text: string) => void;
  onEdit: (messageId: string, newText: string) => void;
  sidebarOpen: boolean;
};

function AiLogo() {
  return (
    <img
      src={AI_LOGO}
      alt="IA"
      style={{ width:'124px', height:'124px', objectFit:'contain', marginBottom:'12px' }}  
    />
  );
}

export default function ChatArea({ conversation, suggestions, onSend, onEdit, sidebarOpen }: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isEmpty = !conversation || conversation.messages.length === 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages.length]);

  return (
    <div className={`${styles.area} ${sidebarOpen ? styles.withSidebar : ''}`}>
      <Navbar showAcatlan={true} />

      <div className={styles.main}>
        <div className={styles.container}>
          {isEmpty ? (
            <div className={styles.emptyState}>
              <AiLogo />
              <div className={styles.emptyText}>
                <h2 className={styles.emptyGreeting}>Hola Emmanuel Romero.</h2>
                <h2 className={styles.emptyQuestion}>¿Qué necesitas el día de hoy?</h2>
              </div>
              <div className={styles.suggestions}>
                {suggestions.map((s) => (
                  <button key={s} className={styles.suggestion} onClick={() => onSend(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.messages}>
              {conversation!.messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} onEdit={onEdit} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          <div className={styles.inputWrapper}>
            <ChatInput onSend={onSend} />
          </div>
        </div>
      </div>
    </div>
  );
}
