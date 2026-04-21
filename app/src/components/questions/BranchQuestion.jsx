import React from 'react';
import './Question.css';

/**
 * BranchQuestion
 * Pregunta de sí/no con contenido condicional si se elige "Sí"
 *
 * Props:
 *   question    {string}     - Texto de la pregunta principal
 *   value       {Object}     - { answer: 'Si'|'No', details: {} }
 *   onChange    {fn}         - Callback (value) => void
 *   yesContent  {ReactNode}  - Contenido extra si la respuesta es "Sí"
 *   yesLabel    {string}     - Label del botón positivo (default "Sí")
 *   noLabel     {string}     - Label del botón negativo (default "No")
 */
export default function BranchQuestion({
  question,
  value = {},
  onChange,
  yesContent,
  yesLabel = 'Sí',
  noLabel = 'No',
}) {
  const answer = value.answer;

  const setAnswer = (ans) => {
    onChange({ ...value, answer: ans });
  };

  return (
    <div className="question-body">
      <h2 className="question-title">{question}</h2>
      <div className="q-choice-grid">
        <button
          className={`q-choice-btn ${answer === noLabel ? 'selected' : ''}`}
          onClick={() => setAnswer(noLabel)}
          type="button"
        >
          {noLabel}
        </button>
        <button
          className={`q-choice-btn ${answer === yesLabel ? 'selected' : ''}`}
          onClick={() => setAnswer(yesLabel)}
          type="button"
        >
          {yesLabel}
        </button>
      </div>

      {answer === yesLabel && yesContent && (
        <div className="q-branch-content">
          {yesContent}
        </div>
      )}
    </div>
  );
}
