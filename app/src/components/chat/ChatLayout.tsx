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
  'Ayúdame a armar un plan de estudios para MAC',
  'Ayúdame a validar materias de un intercambio',
  'Recomiéndame algo',
  '...',
];

export default function ChatLayout() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isTyping, setIsTyping] = useState(false)

  const userInitial = user?.fullName?.charAt(0);
  const displayName = user?.fullName || userInitial?.nombre || "Usuario";

  const activeConversation = Array.isArray(conversations)
    ? conversations.find((c) => c.id === activeId) ?? null
    : null;

  useEffect(() => {
    // Simplemente hacer una petición vacía al entrar a la página de chat
    // para que FastAPI empiece a "despertar" antes de que el usuario escriba.
    fetch('https://server-genai.onrender.com', { method: 'GET' }).catch(() => { });
  }, []);
  // 1. Efecto de Carga Inicial (Usuario y Lista de Conversaciones)
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

        // Cargamos la lista de la BD inmediatamente
        const data = await chatService.getConversations();

        // IMPORTANTE: Aseguramos que cada conversación tenga un array de mensajes vacío
        // para que ChatArea no explote al leer .length
        const formattedData = Array.isArray(data)
          ? data.map((c: any) => ({ ...c, messages: c.messages || [] }))
          : [];

        setConversations(formattedData);
      } catch (error) {
        console.error("Error en la carga inicial:", error);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]); // Solo se ejecuta una vez al montar

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
  if (loading || !user) return <div className={styles.loadingScreen}>Cargando PumaIA...</div>;

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    setIsTyping(true); // Bloqueamos el input y mostramos carga

    // 1. Añadimos el mensaje del usuario localmente (Optimistic UI)
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'USER',
      content: text,
      createdAt: new Date().toISOString(),
    };

    // Actualizamos la UI inmediatamente para que el usuario vea su mensaje
    setConversations((prev) =>
      prev.map((c) =>
        (activeId ? c.id === activeId : c.id === 'temp') // 'temp' por si es nueva
          ? { ...c, messages: [...(c.messages || []), userMsg] }
          : c
      )
    );

    try {
      // 2. Llamada al servicio con el ID actual (si existe)
      const response = await chatService.sendMessage(text, activeId || undefined);

      if (response.error || response.statusCode >= 400) {
        throw new Error(response.message || 'Error en el servidor');
      }

      // 3. Si era una conversación nueva, actualizamos el activeId
      if (!activeId && response.conversationId) {
        setActiveId(response.conversationId);
      }

      // 4. Refrescamos conversaciones para obtener los datos reales del DB
      const updatedData = await chatService.getConversations();
      setConversations(updatedData);

    } catch (error) {
      console.error("Error al enviar:", error);
      // BLINDAJE: Si falla, avisamos al usuario pero NO rompemos la app
      alert("PumaIA está tardando en despertar. Por favor, espera un momento y reintenta.");

      // Opcional: Podrías eliminar el mensaje del usuario que no se pudo procesar
    } finally {
      setIsTyping(false); // Liberamos el estado de carga
    }
  };

  const handleNewChat = () => {
    setActiveId(null);
  };
  const handleNavigate = () => {
    router.push('/home');
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

        <span className={styles.toolbarGreeting}>
          Bienvenido al portal {displayName}
        </span>
      </div>
      <HomeDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNavigate={(section) => {
          setDrawerOpen(false);
          if (section === 'pumaia') router.push('/chat');
          if (section === 'perfil') router.push('/profile');
          if (section === 'actualizar') router.push('/update-info');
          if (section === 'intercambio') router.push('/exchange');
          if (section === 'ajustes') router.push('/settings');
        }}
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
          onSelect={setActiveId}
          onNewChat={handleNewChat}
        />

        <ChatArea
          conversation={activeConversation}
          suggestions={INITIAL_SUGGESTIONS}
          onSend={sendMessage}
          sidebarOpen={sidebarOpen}
          displayName={displayName}
          setDrawerOpen={setDrawerOpen}
        />
      </div>

    </div>

  );
}
