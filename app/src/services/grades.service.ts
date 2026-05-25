import { API_URL } from '../utils/api';

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
  analyzePDF: async (file: File, token: string): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/subjects/analyze-pdf`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}` 
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Error al analizar y guardar el historial académico.');
    }

    
    return await response.json();
  },

  confirmGrades: async (subjects: Subject[], token: string): Promise<any> => {

    const payload = {
      subjects: subjects
        .filter((s) => s.exists && s.subjectID)
        .map((s) => ({
          subjectID: s.subjectID,
          grade: s.grade,
        })),
    };

    const response = await fetch(`${API_URL}/grade/confirm-import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Error al guardar las calificaciones.');
    }

    return await response.json();
  },
  getMyGrades: async (token: string): Promise<Subject[]> => {
    try {
      const response = await fetch(`${API_URL}/grade/my-grades`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('No se pudieron cargar las materias del perfil');
      }

      return await response.json();
    } catch (error) {
      console.error("GradesService Error:", error);
      return []; 
    }
  }
};