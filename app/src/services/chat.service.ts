import { API_URL, getAuthHeaders } from '../utils/api';

export interface ChatMessageResponse {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt?: string;
  conversationId?: string;
  crisis?: boolean;
  code?: string;
  statusCode?: number;
  error?: string;
  message?: string;
  userMessageId?: string;
}

export const chatService = {
  /**
   * Obtiene la lista de conversaciones activas del alumno autenticado.
   */
  getConversations: async () => {
    const res = await fetch(`${API_URL}/chat/conversations`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (res.status === 401) throw new Error('Sesión expirada');
    return res.json();
  },

  /**
   * Obtiene los mensajes pertenecientes a una conversación.
   */
  getMessages: async (id: string) => {
    const res = await fetch(
      `${API_URL}/chat/conversations/${encodeURIComponent(id)}/messages`,
      {
        headers: getAuthHeaders(),
        credentials: 'include',
      },
    );
    return res.json();
  },

  /**
   * Envía un mensaje al asistente conversacional.
   * Contrato único: POST /chat/message con { content, conversationId?, sensitive? }
   * Nota: student_profile y history ya no se envían porque el backend los construye internamente.
   */
  sendMessage: async (
    content: string,
    conversationId?: string,
    _profile?: string,
    _history?: any[],
    sensitive?: boolean,
  ): Promise<ChatMessageResponse | any> => {
    const payload: {
      content: string;
      conversationId?: string;
      sensitive?: boolean;
    } = {
      content: content.trim(),
    };

    if (conversationId && conversationId !== 'temp-conv') {
      payload.conversationId = conversationId;
    }

    if (typeof sensitive === 'boolean') {
      payload.sensitive = sensitive;
    }

    const res = await fetch(`${API_URL}/chat/message`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    // Si la respuesta HTTP no fue exitosa (403, 429, 502, 503, etc.),
    // garantizamos que el objeto devuelto exponga statusCode para que ChatLayout lo capture.
    if (!res.ok) {
      return {
        statusCode: res.status,
        error: data.error || res.statusText,
        message: data.message || 'Error en el asistente conversacional',
        code: data.code,
        conversationId: data.conversationId || conversationId,
        userMessageId: data.userMessageId,
        ...data,
      };
    }

    return data;
  },

  /**
   * Actualiza el título de una conversación.
   */
  updateTitle: async (id: string, title: string) => {
    const res = await fetch(
      `${API_URL}/chat/conversations/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ title: title.trim() }),
      },
    );
    return res.json();
  },

  /**
   * Elimina una conversación del estudiante autenticado.
   */
  deleteConversation: async (id: string) => {
    const res = await fetch(
      `${API_URL}/chat/conversations/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      },
    );
    return res.json();
  },

  /**
   * Método auxiliar: Envía retroalimentación (UP / DOWN) a un mensaje del asistente.
   * Contrato: POST /chat/messages/:id/feedback { feedback: 'UP' | 'DOWN', comment?: string }
   */
  sendFeedback: async (
    messageId: string,
    feedback: 'UP' | 'DOWN',
    comment?: string,
  ) => {
    const res = await fetch(
      `${API_URL}/chat/messages/${encodeURIComponent(messageId)}/feedback`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          feedback,
          ...(comment ? { comment: comment.trim() } : {}),
        }),
      },
    );
    return res.json();
  },

  /**
   * Método auxiliar: Asigna una etiqueta temática a la conversación.
   * Contrato: POST /chat/conversations/:id/labels { topicId }
   */
  addLabel: async (conversationId: string, topicId: string) => {
    const res = await fetch(
      `${API_URL}/chat/conversations/${encodeURIComponent(conversationId)}/labels`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ topicId }),
      },
    );
    return res.json();
  },
};
