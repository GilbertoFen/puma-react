// ─────────────────────────────────────────────────────
// Tipos compartidos entre update-info y profile
// Cuando conectes el backend, estos son los shapes
// que deberían venir de tu API
// ─────────────────────────────────────────────────────

export type User = {
  nombre: string;
  apellidos: string;
  cuenta: string;
  carrera: string;
  semestre: string;
  initial: string;
  email?: string;
  telefono?: string;
  fotoPerfil?: string; // URL de Cloudinary
};

// Respuesta del cuestionario de bienvenida
export type QuestionnaireAnswer = {
  questionId: string;
  question: string;
  answer: string | string[]; // texto libre o selección múltiple
  type: 'text' | 'choice' | 'multi';
};

// Reporte de análisis profesional generado por la IA
export type ProfessionalReport = {
  generatedAt: string; // ISO date string
  topCareers: CareerSuggestion[];
  strengths: string[];
  areasToGrow: string[];
  summary: string;
};

export type CareerSuggestion = {
  title: string;
  matchPercent: number;
  description: string;
};

// Documento subido por el usuario
export type UploadedDocument = {
  id: string;
  name: string;
  category: DocumentCategory;
  uploadedAt: string; // ISO date string
  url?: string;       // URL de Cloudinary cuando esté disponible
  size?: number;      // bytes
};

export type DocumentCategory =
  | 'tira_materias'
  | 'cv'
  | 'certificado'
  | 'curso'
  | 'competencia'
  | 'otro';

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  tira_materias: 'Tira de materias',
  cv: 'Currículum vitae',
  certificado: 'Certificado',
  curso: 'Constancia de curso',
  competencia: 'Certificado de competencia',
  otro: 'Otro documento',
};
