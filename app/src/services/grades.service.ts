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
  /**
   * Envía el PDF al endpoint de análisis (subjects/analyze-pdf)
   */
  analyzePDF: async (file: File): Promise<AcademicResponse> => {
    const formData = new FormData();
    formData.append('file', file); // 'file' coincide con @UploadedFile() en Nest

    const response = await fetch(`${API_URL}/subjects/analyze-pdf`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Error al analizar el historial académico.');
    }

    return await response.json();
  },

  /**
   * Envía las materias confirmadas al endpoint de importación (grade/confirm-import)
   */
  confirmGrades: async (subjects: Subject[], token: string): Promise<any> => {
    // Filtramos solo las materias que existen en el catálogo (tienen ID)
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
        'Authorization': `Bearer ${token}`, // Enviamos el token del alumno
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
      return []; // Devolvemos arreglo vacío si algo falla
    }
  }
};