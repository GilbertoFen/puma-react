/**
 * DATOS DE EJEMPLO para la pestaña "Sugerencias".
 *
 * Se reemplazarán por sugerencias generadas a partir de los conteos agregados del panel
 * (las mismas cifras de /metrics/dashboard/*). La IA no lee conversaciones ni ve datos de alumnos.
 * Para conectarlo: sustituir `SUGGESTIONS_MOCK` por una llamada al endpoint que exponga
 * `Suggestion[]` con esta misma forma.
 */

export type SuggestionPriority = 'ALTA' | 'MEDIA' | 'BAJA';
export type SuggestionSource = 'TEMAS' | 'RENDIMIENTO' | 'ASISTENCIA';
/** Pestaña del panel donde están los datos que respaldan la sugerencia. */
export type SuggestionTab = 'chat' | 'academic' | 'attendance';

export interface Suggestion {
  id: string;
  priority: SuggestionPriority;
  source: SuggestionSource;
  title: string;
  /** Evidencia con números (siempre agregados). */
  evidence: string[];
  action: string;
  dataTab: SuggestionTab;
}

export const SUGGESTIONS_MOCK: Suggestion[] = [
  {
    id: 'mock-1',
    priority: 'ALTA',
    source: 'TEMAS',
    title: 'Dudas recurrentes sobre inscripción a optativas',
    evidence: [
      '42 conversaciones etiquetadas con el tema en las últimas 4 semanas.',
      'Subió de 9 a 17 conversaciones por semana.',
    ],
    action: 'Publicar una guía corta del proceso de optativas y fijarla en el chat antes del periodo de altas.',
    dataTab: 'chat',
  },
  {
    id: 'mock-2',
    priority: 'MEDIA',
    source: 'RENDIMIENTO',
    title: 'Reprobación alta en una materia de 3er semestre',
    evidence: [
      'Reprobación de 31 % (n = 58 alumnos que terminaron).',
      'La reprobación media de las demás materias del semestre es 12 %.',
    ],
    action: 'Ofrecer asesorías grupales en las semanas 6 a 10 y revisar la carga de ese semestre.',
    dataTab: 'academic',
  },
  {
    id: 'mock-3',
    priority: 'BAJA',
    source: 'ASISTENCIA',
    title: 'Baja de asistencia los viernes por la tarde',
    evidence: ['Asistencia de 64 % en sesiones de viernes después de las 15:00 (n = 310 registros).'],
    action: 'Valorar mover actividades de refuerzo a otros días; no es una evaluación de grupos ni de profesores.',
    dataTab: 'attendance',
  },
];
