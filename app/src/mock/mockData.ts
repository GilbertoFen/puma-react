import type {
  User,
  QuestionnaireAnswer,
  ProfessionalReport,
  UploadedDocument,
} from '../types/shared.types';

export const MOCK_USER: User = {
  nombre: 'Jose Emmanuel',
  apellidos: 'Resendiz Lorenzo',
  cuenta: '321190239',
  carrera: 'Matemáticas Aplicadas y Computación',
  semestre: '6to semestre',
  initial: 'E',
  email: '321190239@pcpuma.acatlan.unam.mx',
  telefono: '',
};

export const MOCK_ANSWERS: QuestionnaireAnswer[] = [
  {
    questionId: 'reaccion_problema',
    question: 'Cuando ves un problema nuevo, ¿cuál es tu primera reacción instintiva?',
    answer: 'Lo analizo y comienzo a imaginar una solución estructurada antes de escribir código.',
    type: 'text',
  },
  {
    questionId: 'ambiente_trabajo',
    question: '¿En qué tipo de ambiente de trabajo te imaginas más cómodo?',
    answer: 'Startup / empresa pequeña',
    type: 'choice',
  },
  {
    questionId: 'materias_fuertes',
    question: '¿En qué materias sientes que eres genuinamente bueno?',
    answer: ['Programación', 'Álgebra', 'Bases de datos', 'Estadística'],
    type: 'multi',
  },
  {
    questionId: 'motivacion',
    question: '¿Qué es lo que más te motiva al trabajar en un proyecto?',
    answer: 'Ver resultados tangibles y aprender algo nuevo en cada iteración.',
    type: 'text',
  },
];

export const MOCK_REPORT: ProfessionalReport = {
  generatedAt: '2025-03-15T10:30:00Z',
  summary:
    'Tu perfil muestra una fuerte orientación hacia la resolución de problemas analíticos combinada con habilidades de programación. Destacas en ambientes dinámicos donde puedes ver resultados rápidos. Tu interés en bases de datos y estadística abre oportunidades tanto en desarrollo de software como en ciencia de datos.',
  strengths: [
    'Pensamiento analítico y estructurado',
    'Bases sólidas en programación y álgebra',
    'Adaptabilidad a entornos de trabajo dinámicos',
    'Orientación a resultados concretos',
  ],
  areasToGrow: [
    'Comunicación de ideas técnicas a públicos no técnicos',
    'Experiencia con proyectos en equipo de mayor escala',
    'Exposición a metodologías ágiles formales',
  ],
  topCareers: [
    {
      title: 'Desarrollador de Software',
      matchPercent: 91,
      description:
        'Tu combinación de habilidades técnicas y pensamiento analítico te posiciona muy bien para el desarrollo de software, especialmente en backend y arquitectura de sistemas.',
    },
    {
      title: 'Científico de Datos',
      matchPercent: 78,
      description:
        'Tu dominio de estadística y bases de datos, junto con la programación, forman una base excelente para análisis de datos y machine learning.',
    },
    {
      title: 'Analista de Sistemas',
      matchPercent: 71,
      description:
        'Tu capacidad para estructurar problemas complejos te permite diseñar y evaluar sistemas de información eficientemente.',
    },
  ],
};

export const MOCK_DOCUMENTS: UploadedDocument[] = [
  {
    id: 'doc-1',
    name: 'Tira_materias_2025-1.pdf',
    category: 'tira_materias',
    uploadedAt: '2025-02-10T08:00:00Z',
    size: 245000,
  },
  {
    id: 'doc-2',
    name: 'CV_Emmanuel_2025.pdf',
    category: 'cv',
    uploadedAt: '2025-03-01T14:22:00Z',
    size: 180000,
  },
];
