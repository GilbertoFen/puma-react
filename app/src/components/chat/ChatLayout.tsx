'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ChatSidebar from './ChatSidebar';
import ChatArea from './ChatArea';
import styles from './ChatLayout.module.css';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export type Conversation = {
  id: string;
  title: string;
  messages: Message[];
};

const INITIAL_SUGGESTIONS = [
  'Ayúdame a armar un plan de estudios para MAC',
  'Ayúdame a validar materias de un intercambio',
  'Recomiéndame material de estudio sobre...',
  '...',
];

export default function ChatLayout() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

  const newConversation = (): Conversation => {
    const id = crypto.randomUUID();
    const conv: Conversation = { id, title: 'Conversación actual', messages: [] };
    setConversations((prev) => [...prev, conv]);
    setActiveId(id);
    return conv;
  };

  const sendMessage = (text: string) => {
    let conv = activeConversation;
    if (!conv) conv = newConversation();

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    const aiMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `Claro, déjame ayudarte con: "${text}". Esta es una respuesta simulada.`,
      timestamp: new Date(),
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conv!.id
          ? {
              ...c,
              title: text.slice(0, 30) + (text.length > 30 ? '...' : ''),
              messages: [...c.messages, userMsg, aiMsg],
            }
          : c
      )
    );

    if (!activeConversation) setActiveId(conv.id);
  };

  const editMessage = (messageId: string, newText: string) => {
    if (!activeConversation) return;

    const msgIndex = activeConversation.messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    const updatedMsg: Message = {
      ...activeConversation.messages[msgIndex],
      content: newText,
    };

    const aiMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `Entendido, respondo a tu mensaje editado: "${newText}". Respuesta simulada.`,
      timestamp: new Date(),
    };

    const trimmedHistory = activeConversation.messages.slice(0, msgIndex);

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? { ...c, messages: [...trimmedHistory, updatedMsg, aiMsg] }
          : c
      )
    );
  };

  const handleNewChat = () => setActiveId(null);

  const handleNavigate = () => {
    router.push('/home');   
  };

  return (
    <div className={styles.root}>
      <div className={styles.bgMesh} />

      <ChatSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
        onNavigate={handleNavigate}
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onNewChat={handleNewChat}
      />

      <ChatArea
        conversation={activeConversation}
        suggestions={INITIAL_SUGGESTIONS}
        onSend={sendMessage}
        onEdit={editMessage}
        sidebarOpen={sidebarOpen}
      />
    </div>
  );
}
