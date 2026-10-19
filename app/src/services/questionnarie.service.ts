import { API_URL } from '../utils/api';

const CONTEXT_CATEGORY = 'EXPECTATIVAS';

const getHeaders = () => {
    const token = localStorage.getItem('token') || JSON.parse(localStorage.getItem('userData') || '{}').token;
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
};

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
     * @param frontendAnswers 
     */
    saveAnswers: async (frontendAnswers: Record<string, any>) => {

        // Regresamos a la estructura del primer intento que sí procesaba el NestJS
        const formattedAnswers = Object.entries(frontendAnswers).map(([questionId, value]) => {
            return {
                id: questionId, // Volvemos a usar "id" porque tu backend lo mapea desde aquí
                category: CATEGORY_MAP[questionId] || 'INTERESES', // Usamos el mapa corregido de Enums
                value: normalizeValue(value), // Volvemos a usar "value"
            };
        });

        const res = await fetch(`${API_URL}/questionnaire/save`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ answers: formattedAnswers }),
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Error al guardar el cuestionario');
        }

        return res.json();
    },

    getAnswers: async (): Promise<Record<string, any>> => {
        const res = await fetch(`${API_URL}/questionnaire/my-answers`, {
            headers: getHeaders(),
        });

        if (!res.ok) {
            throw new Error('No se pudieron recuperar las respuestas anteriores.');
        }

        const backendAnswers = await res.json();
        const frontendStructure: Record<string, any> = {};

        if (Array.isArray(backendAnswers)) {
            backendAnswers.forEach((ans: any) => {
                frontendStructure[ans.questionId] = ans.answer;
            });
        }
        return frontendStructure;
    },
};