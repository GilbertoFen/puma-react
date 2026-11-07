import { API_URL, getAuthHeaders, getAuthToken } from '../utils/api';

export type Subject = {
  subjectID: string;
  subjectName: string;
  grade: number;
  exists: boolean;
};

export type AcademicResponse = {
  rawMarkdown: string;
  subjects: Subject[];
};

export const gradeService = {
  analyzePDF: async (file: File, token?: string): Promise<any> => {
    const activeToken = token || getAuthToken();
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (activeToken) {
      headers['Authorization'] = `Bearer ${activeToken}`;
    }

    const response = await fetch(`${API_URL}/subjects/analyze-pdf`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        err.message || 'Error al analizar y guardar el historial académico.',
      );
    }

    return await response.json();
  },

  confirmGrades: async (subjects: Subject[], token?: string): Promise<any> => {
    const activeToken = token || getAuthToken();
    const isUuid = (val?: string | null) =>
      Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

    const validGradeItems = subjects
      .filter(
        (s) =>
          s.exists &&
          isUuid(s.subjectID) &&
          typeof s.grade === 'number' &&
          !isNaN(s.grade) &&
          s.grade >= 5 &&
          s.grade <= 10
      )
      .map((s) => ({
        subjectID: s.subjectID as string,
        grade: Math.round(s.grade),
      }));

    if (validGradeItems.length === 0) {
      return { success: true, count: 0, message: 'No hay calificaciones pendientes de confirmación.' };
    }

    const payload = {
      subjects: validGradeItems,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
    };

    const response = await fetch(`${API_URL}/grade/confirm-import`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Error al guardar las calificaciones.');
    }

    return await response.json();
  },

  getMyGrades: async (token?: string): Promise<Subject[]> => {
    try {
      const activeToken = token || getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
      };

      const response = await fetch(`${API_URL}/grade/my-grades`, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('No se pudieron cargar las materias del perfil');
      }

      return await response.json();
    } catch (error) {
      console.error('GradesService Error:', error);
      return [];
    }
  },

  /**
   * Método auxiliar para actualizar una calificación individual (administrativo / manual).
   */
  updateGradeById: async (
    id: string,
    grade: number,
    token?: string,
  ): Promise<any> => {
    const activeToken = token || getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
    };

    const response = await fetch(`${API_URL}/grade/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers,
      credentials: 'include',
      body: JSON.stringify({ grade: Math.round(grade) }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        err.message || 'El servidor rechazó la actualización de la calificación.',
      );
    }

    return await response.json();
  },
};
