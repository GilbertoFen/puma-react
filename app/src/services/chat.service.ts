import { API_URL } from '../utils/api';

const getHeaders = () => {
    let token = localStorage.getItem('token');
    if (!token) {
        const rawData = localStorage.getItem('userData');
        if (rawData) {
            try {
                const userData = JSON.parse(rawData);
                token = userData.token || userData.access_token || userData.accessToken;
            } catch (e) {
                console.error("Error parseando userData para obtener token", e);
            }
        }
    }
    if (!token) {
        console.warn(" No se encontró token en localStorage. Las peticiones fallarán (401).");
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
    
    // 2. OBTENER MENSAJES 
    getMessages: async (id: string) => {
        const res = await fetch(`${API_URL}/chat/conversations/${id}/messages`, { headers: getHeaders() });
        return res.json();
    },

    sendMessage: async (content: string, conversationId: string | undefined, profile: string, history: any[]) => {
        const res = await fetch(`${API_URL}/chat/message`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ 
                content, 
                conversationId,
                student_profile: profile, 
                history: history          
            }),
        });
        return res.json();
    },

    updateTitle: async (id: string, title: string) => {
        const res = await fetch(`${API_URL}/chat/conversations/${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ title }),
        });
        return res.json();
    },

    deleteConversation: async (id: string) => {
        const res = await fetch(`${API_URL}/chat/conversations/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        return res.json();
    }
};