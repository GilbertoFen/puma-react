// ─────────────────────────────────────────────
// DEFINICION DE PREGUNTAS
// Para agregar una nueva pregunta:
//   1. Añade un objeto al array QUESTIONS con:
//      - id       (único, NO lo cambies después: es la llave en la BD)
//      - type     ('text' | 'choice' | 'multi' | 'input_list' | 'branch')
//      - question (texto de la pregunta)
//      - props    (props específicas del tipo, ver cada componente)
//   2. Agrega el id en CATEGORY_MAP de questionnarie.service.ts
//
// IMPORTANTE: el texto de cada opción es el valor que se guarda en la BD.
// Si cambias el texto de una opción, las respuestas antiguas dejan de coincidir.
// ─────────────────────────────────────────────

export type QuestionType = 'text' | 'choice' | 'multi' | 'input_list' | 'branch';

export interface QuestionField {
  label: string;
  key: string;
  placeholder?: string;
}

export interface QuestionProps {
  // text
  placeholder?: string;
  // choice / multi
  options?: string[];
  layout?: 'inline' | 'stack';       // choice: 'stack' para opciones largas
  maxSelect?: number;                // multi
  exclusiveOption?: string;          // multi: opción que se excluye con las demás
  // input_list
  fields?: QuestionField[];
  listLabel?: string;
  // branch
  yesLabel?: string;
  noLabel?: string;
  yesListLabel?: string;
  yesItemPlaceholder?: string;
  yesAddLabel?: string;
  yesFields?: QuestionField[];
}

export interface QuestionDef {
  id: string;
  type: QuestionType;
  question: string;
  props: QuestionProps;
}

const NINGUNA_AREA = 'Ninguna en específico todavía (Aún conociendo la carrera)';

export const QUESTIONS: QuestionDef[] = [
  // ── 1. Traslado ─────────────────────────────
  {
    id: 'tiempo_traslado',
    type: 'choice',
    question:
      '¿Cuánto tiempo te toma en promedio trasladarte de tu casa a la FES Acatlán (solo trayecto de ida)?',
    props: {
      layout: 'stack',
      options: [
        'Menos de 45 minutos',
        'Entre 45 y 90 minutos',
        'Entre 1.5 y 2.5 horas',
        'Más de 2.5 horas (Zona foránea / trayecto largo)',
      ],
    },
  },

  // ── 2. Situación laboral ────────────────────
  {
    id: 'situacion_laboral',
    type: 'choice',
    question: '¿Cuál es tu situación laboral actual durante el semestre escolar?',
    props: {
      layout: 'stack',
      options: [
        'Dedicación exclusiva al estudio (No trabajo)',
        'Trabajo de medio tiempo / becario (< 20 horas por semana)',
        'Trabajo de tiempo completo (> 35 horas por semana)',
        'No trabajo actualmente, pero busco empleo activo',
      ],
    },
  },

  // ── 3. Equipo de cómputo e internet ─────────
  {
    id: 'equipo_computo',
    type: 'choice',
    question:
      '¿Cuentas con equipo de cómputo propio y conexión a internet suficiente para programar y hacer proyectos en casa?',
    props: {
      layout: 'stack',
      options: [
        'Sí, cuento con laptop/PC adecuada para programar y compilar',
        'Cuento con equipo pero es compartido o con rendimiento limitado',
        'No, dependo enteramente de las salas y laboratorios de cómputo de Acatlán',
      ],
    },
  },

  // ── 4. Áreas de afinidad (reutiliza id materias_fuertes) ──
  {
    id: 'materias_fuertes',
    type: 'multi',
    question:
      '¿En cuáles de las siguientes áreas sientes que tienes mayor facilidad, fortaleza o gusto personal?',
    props: {
      maxSelect: 2,
      exclusiveOption: NINGUNA_AREA,
      options: [
        'Programación, lógica y desarrollo de software',
        'Matemáticas formales y teóricas (Cálculo, Álgebra, Demostraciones)',
        'Probabilidad, Estadística y Análisis de Datos',
        'Optimización, Investigación de Operaciones y Métodos Numéricos',
        NINGUNA_AREA,
      ],
    },
  },

  // ── 5. Afrontamiento académico (reutiliza id reaccion_problema) ──
  {
    id: 'reaccion_problema',
    type: 'choice',
    question:
      'Cuando repruebas un primer examen parcial o no entiendes un tema clave de una materia, ¿cuál suele ser tu conducta habitual?',
    props: {
      layout: 'stack',
      options: [
        'Busco asesorías, libros o videos y armo grupos de estudio',
        'Prefiero estudiar de forma autodidacta hasta resolverlo',
        'Me genera frustración y tiendo a descuidar la materia o dejar de asistir',
        'Desatiendo esa materia para salvar las demás y planeo recursarla',
      ],
    },
  },

  // ── 6. Experiencia previa (reutiliza id experiencia_laboral) ──
  {
    id: 'experiencia_laboral',
    type: 'branch',
    question:
      '¿Has programado proyectos personales, participado en hackathones/olimpiadas o realizado cursos técnicos certificados previamente?',
    props: {
      yesLabel: 'Sí',
      noLabel: 'No',
      yesListLabel: 'Tecnologías, proyectos o eventos',
      yesItemPlaceholder: 'Ej: Python, Hackatón UNAM, Olimpiada de Matemáticas',
      yesAddLabel: '+ Agregar otro',
      yesFields: [], // solo lista, sin campo extra
    },
  },

  // ── 7. Meta profesional (reutiliza id ambiente_trabajo) ──
  {
    id: 'ambiente_trabajo',
    type: 'choice',
    question:
      '¿Hacia qué sector o ambiente laboral te gustaría enfocar tu carrera al egresar de MAC?',
    props: {
      layout: 'stack',
      options: [
        'Desarrollo de software backend / arquitectura web y móvil',
        'Ciencia de datos, machine learning o inteligencia artificial',
        'Sector financiero, riesgos o actuaría (FinTech / Banca)',
        'Investigación científica, docencia o posgrado formal',
        'Emprender o crear una startup/empresa de base tecnológica',
      ],
    },
  },
];