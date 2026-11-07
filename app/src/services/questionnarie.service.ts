import { API_URL, getAuthHeaders } from '../utils/api';

const CONTEXT_CATEGORY = 'EXPECTATIVAS';

const CATEGORY_MAP: Record<string, string> = {
  tiempo_traslado: CONTEXT_CATEGORY,
  situacion_laboral: CONTEXT_CATEGORY,
  equipo_computo: CONTEXT_CATEGORY,
  materias_fuertes: 'HABILIDADES',
  reaccion_problema: 'INTERESES',
  experiencia_laboral: 'EXPERIENCIA',
  ambiente_trabajo: 'EXPECTATIVAS',
};

const normalizeValue = (v: any) => {
  if (typeof v === 'string') return v.trim();
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const out = { ...v };
    if (Array.isArray(out._list)) {
      out._list = out._list.map((s: any) => String(s).trim()).filter(Boolean);
    }
    if (typeof out.exp === 'string') out.exp = out.exp.trim();
    return out;
  }
  return v;
};

export const questionnaireService = {
  /**
   * Guarda o actualiza las respuestas del cuestionario vocacional.
   */
  saveAnswers: async (frontendAnswers: Record<string, any>) => {
    const formattedAnswers = Object.entries(frontendAnswers).map(
      ([questionId, value]) => {
        return {
          id: questionId,
          category: CATEGORY_MAP[questionId] || 'INTERESES',
          value: normalizeValue(value),
        };
      },
    );

    const res = await fetch(`${API_URL}/questionnaire/save`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ answers: formattedAnswers }),
    });

    if (!res.ok) {
      if (res.status === 409) {
        // Si el estudiante ya completó previamente el cuestionario, redirigir a actualización parcial
        return questionnaireService.updateAnswers(frontendAnswers);
      }
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al guardar el cuestionario');
    }

    return res.json();
  },

  /**
   * Recupera las respuestas previas del alumno autenticado.
   */
  getAnswers: async (): Promise<Record<string, any>> => {
    const res = await fetch(`${API_URL}/questionnaire/my-answers`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error('No se pudieron recuperar las respuestas anteriores.');
    }

    const backendAnswers = await res.json();
    const frontendStructure: Record<string, any> = {};

    if (Array.isArray(backendAnswers)) {
      backendAnswers.forEach((ans: any) => {
        if (ans && ans.questionId) {
          frontendStructure[ans.questionId] = ans.answer;
        }
      },
      );
    }
    return frontendStructure;
  },

  /**
   * Método auxiliar para actualización parcial de respuestas (PATCH /api/questionnaire/update).
   */
  updateAnswers: async (partialAnswers: Record<string, any>) => {
    const formattedAnswers = Object.entries(partialAnswers).map(
      ([questionId, value]) => ({
        id: questionId,
        category: CATEGORY_MAP[questionId] || 'INTERESES',
        value: normalizeValue(value),
      }),
    );

    const res = await fetch(`${API_URL}/questionnaire/update`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ answers: formattedAnswers }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al actualizar respuestas.');
    }

    return res.json();
  },

  /**
   * Método auxiliar para consultar el historial completo de envíos del alumno.
   */
  getMyResponses: async () => {
    const res = await fetch(`${API_URL}/questionnaire/my-responses`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error('No se pudo obtener el historial de respuestas.');
    }

    return res.json();
  },
};
