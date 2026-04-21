'use client';
import React from 'react';
import type { Conversation } from './ChatLayout';
import styles from './ChatSidebar.module.css';
import HomeDrawer from '../home/HomeDrawer';

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
  return (
    <aside className={`${styles.sidebar} ${open ? styles.open : styles.closed}`}>
      <div className={styles.header}>
        <button
          className={styles.headerBtn}
          onClick={onToggle}
          title={open ? 'Cerrar sidebar' : 'Abrir sidebar'}
        >
          <ArrowIcon />
        </button>

        <button
          className={styles.headerBtn}
          onClick={onNavigate}
          title="Menú principal"
        >
          <HamburgerIcon />
        </button>
      </div>

      {open && (
        <>
          <button className={styles.newChat} onClick={onNewChat}>
            + Nuevo chat
          </button>

          <div className={styles.section}>
            <p className={styles.sectionLabel}>Puedo ayudarte con</p>
            <div className={styles.actionItem}>Plan de estudios</div>
            <div className={styles.actionItem}>Validar materias</div>
            <div className={styles.actionItem}>Orientación laboral</div>
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

          <button className={styles.settings} title="Configuración">
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

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
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
