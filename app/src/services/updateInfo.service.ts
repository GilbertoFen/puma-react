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

    // ─────────────────────────────────────────────────────────
    // 1. MÉTODOS DE LECTURA (GET) - CATÁLOGOS Y SUMARIOS
    // ─────────────────────────────────────────────────────────

    // MÉTODO MAESTRO: Obtiene el árbol relacional completo del estudiante
    getProfileSummary: async () => {
        const res = await fetch(`${API_URL}/students/profile-summary`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Error al cargar el resumen del perfil profesional');
        return res.json();
    },

    // CATÁLOGO DE CURSOS (Asociado a @Controller('courses'))
    getGlobalCourses: async () => {
        const res = await fetch(`${API_URL}/courses`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Error al obtener el catálogo de cursos');
        return res.json();
    },

    // CATÁLOGO DE BECAS (Asociado a @Controller('schoolarships'))
    getGlobalScholarships: async () => {
        const res = await fetch(`${API_URL}/schoolarships`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Error al obtener el catálogo de becas');
        return res.json();
    },

    // CATÁLOGO DE CONCURSOS (Asociado a @Controller('contests'))
    getGlobalContests: async () => {
        const res = await fetch(`${API_URL}/contests`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Error al obtener el catálogo de concursos');
        return res.json();
    },

    // CATÁLOGO DE IDIOMAS (Asociado a @Controller('languages'))
    getGlobalLanguages: async () => {
        const res = await fetch(`${API_URL}/languages`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Error al obtener el catálogo de idiomas');
        return res.json();
    },

    // CATÁLOGO DE ÁREAS DE EXPERTISE (Asociado a @Controller('areas-expertise'))
    getGlobalAreasExpertise: async () => {
        const res = await fetch(`${API_URL}/areas-expertise`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Error al obtener las áreas de expertise');
        return res.json();
    },

    // CATÁLOGO DE CATEGORÍAS MACRO (Asociado a @Controller('category'))
    getGlobalCategories: async () => {
        const res = await fetch(`${API_URL}/category`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Error al obtener las categorías');
        return res.json();
    },


    // ─────────────────────────────────────────────────────────
    // 2. MÉTODOS DE ESCRITURA Y ASOCIACIÓN (POST / PATCH / DELETE)
    // ─────────────────────────────────────────────────────────

    // INTERESES (Mapeado a PATCH /students/interests)
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

    // VINCULAR CURSO (Mapeado a POST /courses/courseUser)
    addCourse: async (courseId: string, studentId: string) => {
        const res = await fetch(`${API_URL}/courses/courseUser`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ courseId, studentId }),
        });
        if (!res.ok) throw new Error('Error al vincular el curso al alumno');
        return res.json();
    },

    // VINCULAR BECA (Mapeado a POST /schoolarships/assign)
    addScholarship: async (schoolarshipId: string, studentId: string) => {
        const res = await fetch(`${API_URL}/schoolarships/assign`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ schoolarshipId, studentId }),
        });
        if (!res.ok) throw new Error('Error al asignar la beca');
        return res.json();
    },

    // VINCULAR CONCURSO (Mapeado a POST /contests/enroll)
    enrollInContest: async (contestId: string, studentId: string) => {
        const res = await fetch(`${API_URL}/contests/enroll`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ contestId, studentId }),
        });
        if (!res.ok) throw new Error('Error al inscribir el concurso');
        return res.json();
    },

    // VINCULAR IDIOMA Y NIVEL (Mapeado a POST /languages/languageUsers)
    addLanguage: async (dto: { studentId: string; languageId: string; skillId: string }) => {
        const res = await fetch(`${API_URL}/languages/languageUsers`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(dto),
        });
        if (!res.ok) throw new Error('Error al agregar el idioma al perfil');
        return res.json();
    },

    // VINCULAR EXPERIENCIA PROFESIONAL (Mapeado a POST /professional-experience)
    addProfessionalExperience: async (dto: { studentId: string; areaExpertiseId: string; categoryId: string }) => {
        const res = await fetch(`${API_URL}/professional-experience`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(dto),
        });
        if (!res.ok) throw new Error('Error al dar de alta la experiencia profesional');
        return res.json();
    }
};