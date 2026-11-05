// src/services/updateInfo.service.ts

import { API_URL, getAuthHeaders, getAuthToken } from '../utils/api';

export const updateInfoService = {
  // Método para obtener todo del usuario
  getProfileSummary: async () => {
    const res = await fetch(`${API_URL}/students/profile-summary`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error('Error al cargar el resumen del perfil profesional');
    }
    return res.json();
  },

  // Cursos
  getGlobalCourses: async () => {
    const res = await fetch(`${API_URL}/courses`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error('Error al obtener el catálogo de cursos');
    }
    return res.json();
  },

  // Becas
  getGlobalScholarships: async () => {
    const res = await fetch(`${API_URL}/schoolarships`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error('Error al obtener el catálogo de becas');
    }
    return res.json();
  },

  // CONCURSOS
  getGlobalContests: async () => {
    const res = await fetch(`${API_URL}/contests`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error('Error al obtener el catálogo de concursos');
    }
    return res.json();
  },

  // IDIOMAS
  getGlobalLanguages: async () => {
    const res = await fetch(`${API_URL}/languages`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error('Error al obtener el catálogo de idiomas');
    }
    return res.json();
  },

  // AREAS DE EXPERTISE
  getGlobalAreasExpertise: async () => {
    const res = await fetch(`${API_URL}/areas-expertise`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error('Error al obtener las áreas de expertise');
    }
    return res.json();
  },

  // CATEGORÍAS
  getGlobalCategories: async () => {
    const res = await fetch(`${API_URL}/category`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error('Error al obtener las categorías');
    }
    return res.json();
  },

  // Subir foto a cloudinary
  uploadAvatar: async (file: File, token?: string): Promise<string> => {
    const activeToken = token || getAuthToken();
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (activeToken) {
      headers['Authorization'] = `Bearer ${activeToken}`;
    }

    const response = await fetch(`${API_URL}/students/avatar`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Error al subir la foto de perfil');
    }

    const data = await response.json();
    return data.avatarUrl;
  },

  analyzeExperience: async (text: string) => {
    const response = await fetch(`${API_URL}/professional-experience/analyze`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ text }),
    });
    if (!response.ok) throw new Error('Error al analizar experiencia');
    return await response.json();
  },

  updateInterests: async (interestText: string) => {
    const res = await fetch(`${API_URL}/students/interests`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ interest: interestText }),
    });
    if (!res.ok) throw new Error('Error al actualizar la lista de intereses');
    return res.json();
  },

  getGlobalSkills: async () => {
    const res = await fetch(`${API_URL}/skills`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error('Error al obtener el catálogo de habilidades (skills)');
    }
    return res.json();
  },

  addCourse: async (courseId: string, studentId?: string) => {
    const res = await fetch(`${API_URL}/courses/courseUser`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({
        courseId,
        ...(studentId ? { studentId } : {}),
      }),
    });
    if (!res.ok) throw new Error('Error al vincular el curso al alumno');
    return res.json();
  },

  addScholarship: async (schoolarshipId: string, studentId?: string) => {
    const res = await fetch(`${API_URL}/schoolarships/assign`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({
        schoolarshipId,
        ...(studentId ? { studentId } : {}),
      }),
    });
    if (!res.ok) throw new Error('Error al asignar la beca');
    return res.json();
  },

  enrollInContest: async (contestId: string, studentId?: string) => {
    const res = await fetch(`${API_URL}/contests/enroll`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({
        contestId,
        ...(studentId ? { studentId } : {}),
      }),
    });
    if (!res.ok) throw new Error('Error al inscribir el concurso');
    return res.json();
  },

  addLanguage: async (dto: {
    studentId?: string;
    languageId: string;
    skillId: string;
  }) => {
    const res = await fetch(`${API_URL}/languages/languageUsers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error('Error al agregar el idioma al perfil');
    return res.json();
  },

  addProfessionalExperience: async (dto: {
    studentId?: string;
    areaExpertiseId: string;
    categoryId: string;
  }) => {
    const res = await fetch(`${API_URL}/professional-experience`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      throw new Error('Error al dar de alta la experiencia profesional');
    }
    return res.json();
  },

  // Eliminación y edición de relaciones
  removeCourse: async (courseUserId: string) => {
    const res = await fetch(`${API_URL}/courses/courseUser/${courseUserId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Error al eliminar el curso');
    return res.json();
  },

  updateCourseUser: async (courseUserId: string, courseId: string) => {
    const res = await fetch(`${API_URL}/courses/courseUser/${courseUserId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ courseId }),
    });
    if (!res.ok) throw new Error('Error al actualizar el curso');
    return res.json();
  },

  removeScholarship: async (scholarshipUserId: string) => {
    const res = await fetch(`${API_URL}/schoolarships/assign/${scholarshipUserId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Error al desvincular la beca');
    return res.json();
  },

  removeContest: async (enrollmentId: string) => {
    const res = await fetch(`${API_URL}/contests/enrollment/${enrollmentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Error al cancelar la inscripción al concurso');
    return res.json();
  },

  updateContestEnrollment: async (enrollmentId: string, contestId: string) => {
    const res = await fetch(`${API_URL}/contests/enrollment/${enrollmentId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ contestId }),
    });
    if (!res.ok) throw new Error('Error al modificar el concurso');
    return res.json();
  },

  removeLanguage: async (languageUserId: string) => {
    const res = await fetch(`${API_URL}/languages/languageUsers/${languageUserId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Error al retirar el idioma');
    return res.json();
  },

  updateLanguageUser: async (
    languageUserId: string,
    dto: { languageId?: string; skillId?: string }
  ) => {
    const res = await fetch(`${API_URL}/languages/languageUsers/${languageUserId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error('Error al actualizar el idioma');
    return res.json();
  },

  removeProfessionalExperience: async (id: string) => {
    const res = await fetch(`${API_URL}/professional-experience/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Error al eliminar la experiencia profesional');
    return res.json();
  },

  updateProfessionalExperience: async (
    id: string,
    dto: { areaExpertiseId?: string; categoryId?: string }
  ) => {
    const res = await fetch(`${API_URL}/professional-experience/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error('Error al actualizar la experiencia');
    return res.json();
  },

  getSavedAiAnalysis: async () => {
    const res = await fetch(`${API_URL}/ai-analysis/current`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error('Error al consultar el análisis de IA actual');
    }
    return res.json();
  },

  generateNewAiAnalysis: async () => {
    const res = await fetch(`${API_URL}/ai-analysis/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Error al procesar el motor de PumaIA');
    return res.json();
  },
};
