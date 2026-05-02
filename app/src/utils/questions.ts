// ─────────────────────────────────────────────
// DEFINICION DE PREGUNTAS
// Para agregar una nueva pregunta:
//   1. Añade un objeto al array QUESTIONS con:
//      - id       (único)
//      - type     ('text' | 'choice' | 'multi' | 'input_list' | 'branch')
//      - question (texto de la pregunta)
//      - props    (props específicas del tipo, ver cada componente)
// ─────────────────────────────────────────────
export const QUESTIONS = [
  {
    id: 'reaccion_problema',
    type: 'text',
    question: 'Cuando ves un problema nuevo, ¿cuál es tu primera reacción instintiva?',
    props: {
      placeholder: 'Lo analizo y comienzo a imaginar una solución...',
    },
  },
  {
    id: 'experiencia_laboral',
    type: 'branch',
    question: '¿Tienes alguna experiencia laboral, servicio social o proyecto propio, aunque sea informal?',
    props: {
      yesLabel: 'Sí',
      noLabel: 'No',
    },
  },
  {
    id: 'materias_fuertes',
    type: 'multi',
    question: '¿En qué materias sientes que eres genuinamente bueno, aunque no sean las que más disfrutas?',
    props: {
      options: [
        'Cálculo', 'Álgebra', 'Programación', 'Estadística',
        'Bases de datos', 'Física', 'Redes', 'Diseño',
        'Redacción', 'Inglés', 'Administración', 'Economía',
      ],
      maxSelect: 5,
    },
  },
  {
    id: 'ambiente_trabajo',
    type: 'choice',
    question: '¿En qué tipo de ambiente de trabajo te imaginas más cómodo?',
    props: {
      options: [
        'Startup / empresa pequeña',
        'Corporativo / empresa grande',
        'Freelance / independiente',
        'Investigación / academia',
        'Gobierno / sector público',
      ],
    },
  },
  {
    id: 'motivacion',
    type: 'text',
    question: '¿Qué es lo que más te motiva al trabajar en un proyecto?',
    props: {
      placeholder: 'Ver resultados, aprender algo nuevo, resolver algo difícil...',
    },
  },
];