// src/services/updateInfo.service.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pumaia.onrender.com/api';

// Configuración global del Header con Token incorporado de forma segura
const getHeaders = () => {
    if (typeof window === 'undefined') return { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
};

export const updateInfoService = {
    // Metodo para obtener todo del usuario 
    getProfileSummary: async () => {
        const res = await fetch(`${API_URL}/students/profile-summary`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Error al cargar el resumen del perfil profesional');
        return res.json();
    },
    // Cursos
    getGlobalCourses: async () => {
        const res = await fetch(`${API_URL}/courses`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Error al obtener el catálogo de cursos');
        return res.json();
    },

    // Becas
    getGlobalScholarships: async () => {
        const res = await fetch(`${API_URL}/schoolarships`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Error al obtener el catálogo de becas');
        return res.json();
    },

    // CONCURSOS
    getGlobalContests: async () => {
        const res = await fetch(`${API_URL}/contests`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Error al obtener el catálogo de concursos');
        return res.json();
    },

    // IDIOMAS
    getGlobalLanguages: async () => {
        const res = await fetch(`${API_URL}/languages`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Error al obtener el catálogo de idiomas');
        return res.json();
    },

    // AREAS DE EXPERTISE 
    getGlobalAreasExpertise: async () => {
        const res = await fetch(`${API_URL}/areas-expertise`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Error al obtener las áreas de expertise');
        return res.json();
    },

    // CATEGORÍAS 
    getGlobalCategories: async () => {
        const res = await fetch(`${API_URL}/category`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Error al obtener las categorías');
        return res.json();
    },
    // Subir foto a cloudinary 
    uploadAvatar: async (file: File, token: string): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_URL}/students/avatar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Error al subir la foto de perfil');
        }

        const data = await response.json();
        return data.avatarUrl; 
    },
    
    analyzeExperience: async (text: string) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/professional-experience/analyze`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text })
        });
        if (!response.ok) throw new Error('Error al analizar experiencia');
        return await response.json();
    },
    updateInterests: async (interestText: string) => {
        const res = await fetch(`${API_URL}/students/interests`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ interest: interestText }),
        });
        if (!res.ok) throw new Error('Error al actualizar la lista de intereses');
        return res.json();
    },
    getGlobalSkills: async () => {
        const res = await fetch(`${API_URL}/skills`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Error al obtener el catálogo de habilidades (skills)');
        return res.json();
    },

    addCourse: async (courseId: string, studentId: string) => {
        const res = await fetch(`${API_URL}/courses/courseUser`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ courseId, studentId }),
        });
        if (!res.ok) throw new Error('Error al vincular el curso al alumno');
        return res.json();
    },
    addScholarship: async (schoolarshipId: string, studentId: string) => {
        const res = await fetch(`${API_URL}/schoolarships/assign`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ schoolarshipId, studentId }),
        });
        if (!res.ok) throw new Error('Error al asignar la beca');
        return res.json();
    },

    enrollInContest: async (contestId: string, studentId: string) => {
        const res = await fetch(`${API_URL}/contests/enroll`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ contestId, studentId }),
        });
        if (!res.ok) throw new Error('Error al inscribir el concurso');
        return res.json();
    },

    addLanguage: async (dto: { studentId: string; languageId: string; skillId: string }) => {
        const res = await fetch(`${API_URL}/languages/languageUsers`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(dto),
        });
        if (!res.ok) throw new Error('Error al agregar el idioma al perfil');
        return res.json();
    },

    addProfessionalExperience: async (dto: { studentId: string; areaExpertiseId: string; categoryId: string }) => {
        const res = await fetch(`${API_URL}/professional-experience`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(dto),
        });
        if (!res.ok) throw new Error('Error al dar de alta la experiencia profesional');
        return res.json();
    },
    getSavedAiAnalysis: async () => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/ai-analysis/current`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error('Error al consultar el análisis de IA actual');
        return res.json();
    },
    generateNewAiAnalysis: async () => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/ai-analysis/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error('Error al procesar el motor de PumaIA');
        return res.json();
    }
};