/**
 * Para agregar un nuevo tipo de pregunta:
 * 1. Define el tipo aquí con su componente renderizador
 * 2. Crea el componente en /components/questions/
 * 3. Úsalo en el array QUESTIONS de QuestionnaireScreen
 *
 * Tipos disponibles:
 *   - 'text'        → Respuesta libre (textarea)
 *   - 'choice'      → Selección única (botones)
 *   - 'multi'       → Selección múltiple (chips)
 *   - 'input_list'  → Lista de inputs (proyectos, etc.)
 *   - 'branch'      → Pregunta con bifurcación condicional
 */

export const QUESTION_TYPES = {
  text: 'text',
  choice: 'choice',
  multi: 'multi',
  input_list: 'input_list',
  branch: 'branch',
};
