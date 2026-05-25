'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ChatSidebar from './ChatSidebar';
import ChatArea from './ChatArea';
import styles from './ChatLayout.module.css';
import HomeDrawer from '../home/HomeDrawer';
import { HamburgerIcon } from '../home/HomePage';
import Navbar from '../Navbar';
import { chatService } from '../../services/chat.service';
import PageLoader from '../loaders/PageLoader';
import { getSafeInitial } from '../../utils/const';
export type Message = {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  title: string;
  messages: Message[];
};

const INITIAL_SUGGESTIONS = [
  'Recomiendame libros para las materias de la carrera.',
  'Ayudame a resolver un problema de programación en Python.',
  '¿Qué es lo que puedes hacer como asistente?',
];

export default function ChatLayout() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [ready, setReady] = useState(false);
  const [userInitial, setUserInitial] = useState('U');


const displayName = user?.nombre || user?.fullName || "Usuario";
  const activeConversation = Array.isArray(conversations)
    ? conversations.find((c) => c.id === activeId) ?? null
    : null;

  useEffect(() => {
    // para que FastAPI encienda.
    fetch('https://server-genai.onrender.com', { method: 'GET' }).catch(() => { });
  }, []);
  useEffect(() => {
    const init = async () => {
      const rawData = localStorage.getItem('userData');

      if (!rawData) {
        router.push('/');
        return;
      }

      try {
        const parsedUser = JSON.parse(rawData);
        setUser(parsedUser);
        setUserInitial(getSafeInitial(parsedUser));

        // Cargamos la lista de la BD inmediatamente
        const data = await chatService.getConversations();

        // IMPORTANTE: Aseguramos que cada conversación tenga un array de mensajes vacío
        // para que ChatArea no explote al leer .length
        const formattedData = Array.isArray(data)
          ? data.map((c: any) => ({ ...c, messages: c.messages || [] }))
          : [];

        setConversations(formattedData);
        if (!ready) return <PageLoader message="Iniciando PumaIA..." />;
      } catch (error) {
        console.error("Error en la carga inicial:", error);
        setConversations([]);
      } finally {
        setLoading(false);
        setReady(true);
      }
    };

    init();
  }, [router]); // Solo se ejecuta una vez al montar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarOpen(false); // Forzar cerrado en móvil al cambiar tamaño
      } else {
        setSidebarOpen(true); // Abrir en escritorio
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Ejecutar al montar
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 2. Efecto para cargar Mensajes cuando cambias de chat
  useEffect(() => {
    const loadMessages = async () => {
      if (!activeId) return;

      try {
        const messages = await chatService.getMessages(activeId);

        setConversations(prev => prev.map(c =>
          c.id === activeId ? { ...c, messages: Array.isArray(messages) ? messages : [] } : c
        ));
      } catch (error) {
        console.error("Error cargando mensajes del chat:", error);
      }
    };

    loadMessages();
  }, [activeId]); // Se ejecuta cada vez que haces clic en un chat diferente
  if (loading || !user) return <PageLoader message="Iniciando PumaIA..." />;
  
  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    setIsTyping(true);
    const studentProfile = `
      Nombre: ${user.nombre}.
      Carrera: ${user.carrera}.
      Promedio: ${user.average}.
      Intereses: ${user.intereses || 'No especificados'}.
    `;
    const currentHistory = activeConversation?.messages || [];
    // 1. Crear el mensaje del usuario inmediatamente para la UI (Optimistic UI)
    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'USER',
      content: text,
      createdAt: new Date().toISOString(),
    };

    // Guardamos el ID actual en una variable local para que no se pierda entre renders
    const currentActiveId = activeId;

    // Actualizar la pantalla de inmediato con el mensaje del usuario
    setConversations((prev) => {
      if (!currentActiveId) {
        // Si es un chat nuevo, creamos una conversación temporal en el estado
        return [
          {
            id: 'temp-conv',
            title: text.slice(0, 30),
            messages: [userMsg],
          },
          ...prev,
        ];
      }
      return prev.map((c) =>
        c.id === currentActiveId ? { ...c, messages: [...(c.messages || []), userMsg] } : c
      );
    });

    try {
      // 2. Enviar al backend real (pasando el ID real o undefined si es nuevo)
      const response = await chatService.sendMessage(
        text,
        currentActiveId || undefined,
        studentProfile,
        currentHistory
      );
      if (response.error || response.statusCode >= 400) {
        throw new Error(response.message || 'Error en el servidor');
      }
      

      // 3. ACTUALIZACIÓN CRÍTICA DEL ESTADO
      if (!currentActiveId && response.conversationId) {
        // ¡AQUÍ ESTÁ EL TRUCO! Primero fijamos el nuevo ID real que generó el Back
        setActiveId(response.conversationId);

        // Traemos la lista actualizada de chats desde la BD
        const updatedConvs = await chatService.getConversations();

        // Buscamos los mensajes reales (User + IA) de este nuevo chat para meterlos de golpe
        const realMessages = await chatService.getMessages(response.conversationId);

        setConversations(
          updatedConvs.map((c: any) =>
            c.id === response.conversationId ? { ...c, messages: realMessages } : { ...c, messages: c.messages || [] }
          )
        );
      } else if (currentActiveId) {
        const realMessages = await chatService.getMessages(currentActiveId);

        setConversations((prev) =>
          prev.map((c) => (c.id === currentActiveId ? { ...c, messages: realMessages } : c))
        );
      }

    } catch (error) {
      console.error("Error al procesar mensaje de la IA:", error);
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'ASSISTANT',
        content: '__error__',          // señal especial que ChatMessage detecta
        createdAt: new Date().toISOString(),
      };
      const targetId = activeId;
      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetId ? { ...c, messages: [...(c.messages || []), errorMsg] } : c
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleNewChat = () => {
    setActiveId(null);
  };
  const handleNavigate = () => {
    router.push('/home');
  };
  const handleSelect = (id: string) => {
  setActiveId(id);
  if (window.innerWidth <= 768) setSidebarOpen(false);
};


  return (
    <div className={styles.root}>
      <div className={styles.bgMesh} />

      <Navbar showAcatlan userInitial={userInitial} />
      <div className={styles.goldLine} />
      <div className={styles.toolbar}>
        <button
          className={styles.hamburgerBtn}
          onClick={() => setDrawerOpen(true)}
        >
          <HamburgerIcon />
        </button>
        <button
    className={styles.sidebarToggleBtn}
    onClick={() => setSidebarOpen((o) => !o)}
  >
    <SidebarIcon />
  </button>

        <span className={styles.toolbarGreeting}>
          Chat con PUMAIA
        </span>
      </div>
      <HomeDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      {drawerOpen && (
        <div
          className={styles.overlay}
          onClick={() => setDrawerOpen(false)}
        />
      )}
      <div className={styles.content}>
        <ChatSidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen((o) => !o)}
          onNavigate={handleNavigate}
          conversations={conversations}
          activeId={activeId}
          onSelect={handleSelect}
          onNewChat={handleNewChat}
        />

        <ChatArea
          conversation={activeConversation}
          suggestions={INITIAL_SUGGESTIONS}
          onSend={sendMessage}
          sidebarOpen={sidebarOpen}
          displayName={displayName}
          setDrawerOpen={setDrawerOpen}
          isTyping={isTyping}
        />
      </div>

    </div>

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