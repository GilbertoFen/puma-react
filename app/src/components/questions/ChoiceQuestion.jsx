import React from 'react';
import './Question.css';

/**
 * ChoiceQuestion
 * Pregunta de selección única con botones
 *
 * Props:
 *   question  {string}   - Texto de la pregunta
 *   options   {string[]} - Opciones a mostrar
 *   value     {string}   - Opción seleccionada
 *   onChange  {fn}       - Callback (value) => void
 */
export default function ChoiceQuestion({ question, options, value, onChange }) {
  return (
    <div className="question-body">
      <h2 className="question-title">{question}</h2>
      <div className="q-choice-grid">
        {options.map((opt) => (
          <button
            key={opt}
            className={`q-choice-btn ${value === opt ? 'selected' : ''}`}
            onClick={() => onChange(opt)}
            type="button"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
