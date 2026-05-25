'use client';
import React from 'react';
import type { Conversation } from './ChatLayout';
import styles from './ChatSidebar.module.css';
import { useRouter } from 'next/navigation';

type Props = {
  open: boolean;
  onToggle: () => void;
  onNavigate: () => void;
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
};

export default function ChatSidebar({
  open,
  onToggle,
  onNavigate,
  conversations,
  activeId,
  onSelect,
  onNewChat,
}: Props) {
  const router = useRouter();
  return (
    <aside className={`${styles.sidebar} ${open ? styles.open : styles.closed}`}>
      <div className={styles.header}>
        <button
          className={styles.headerBtn}
          onClick={onToggle}
          title={open ? 'Cerrar sidebar' : 'Abrir sidebar'}
        >
          <SidebarIcon />
        </button>

      </div>

      {open && (
        <>
          <button className={styles.newChat} onClick={onNewChat}>
            + Nuevo chat
          </button>

          <div className={styles.section}>
            <p className={styles.sectionLabel}>Puedo ayudarte con</p>
            <button
                className={styles.suggestionHighlight}
                onClick={() => router.push('/analyze')}
              >
                <span className={styles.suggestionHighlightGlow} />
                ✨ Análisis profesional de mi perfil
              </button>
          </div>

          {conversations.length > 0 && (
            <div className={styles.section}>
              <p className={styles.sectionLabel}>Recientes</p>
              <div className={styles.convList}>
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    className={`${styles.convItem} ${c.id === activeId ? styles.active : ''}`}
                    onClick={() => onSelect(c.id)}
                  >
                    {c.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button className={styles.settings} title="Configuración"
            onClick={() => router.push('/settings')}>
            ⚙️ Configuración
          </button>
        </>
      )}

      {!open && (
        <button className={styles.settingsIcon} title="Configuración">⚙️</button>
      )}
    </aside>
  );
}

function SidebarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
