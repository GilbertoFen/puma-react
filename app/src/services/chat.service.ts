import { API_URL } from '../utils/api';

const getHeaders = () => {
    // 1. Intentamos obtener el token directamente (como lo hace tu logout)
    let token = localStorage.getItem('token');

    // 2. Si no está directo, lo buscamos dentro de userData
    if (!token) {
        const rawData = localStorage.getItem('userData');
        if (rawData) {
            try {
                const userData = JSON.parse(rawData);
                // Probamos todas las combinaciones posibles
                token = userData.token || userData.access_token || userData.accessToken;
            } catch (e) {
                console.error("Error parseando userData para obtener token", e);
            }
        }
    }

    // Debug en desarrollo (puedes quitarlo después)
    if (!token) {
        console.warn("⚠️ No se encontró token en localStorage. Las peticiones fallarán (401).");
    }

    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
};

export const chatService = {
    // Obtener todos los chats del sidebar
    getConversations: async () => {
        const res = await fetch(`${API_URL}/chat/conversations`, {
            headers: getHeaders()
        });
        if (res.status === 401) throw new Error('Sesión expirada');
        return res.json();
    },

    // Obtener mensajes de un chat específico
    // 2. OBTENER MENSAJES (Este es el que probablemente te falta o tiene otro nombre)
    getMessages: async (id: string) => {
        const res = await fetch(`${API_URL}/chat/conversations/${id}/messages`, { headers: getHeaders() });
        return res.json();
    },
    // Enviar mensaje (Crea o continúa)
    sendMessage: async (content: string, conversationId?: string) => {
        const res = await fetch(`${API_URL}/chat/message`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ content, conversationId }),
        });
        return res.json();
    },

    // Editar título
    updateTitle: async (id: string, title: string) => {
        const res = await fetch(`${API_URL}/chat/conversations/${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ title }),
        });
        return res.json();
    },

    // Eliminar conversación (por si lo necesitas en el front)
    deleteConversation: async (id: string) => {
        const res = await fetch(`${API_URL}/chat/conversations/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        return res.json();
    }
};