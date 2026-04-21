import React from 'react';
import './Question.css';

/**
 * TextQuestion
 * Pregunta con respuesta libre (textarea)
 *
 * Props:
 *   question  {string}   - Texto de la pregunta
 *   value     {string}   - Valor actual
 *   onChange  {fn}       - Callback (value) => void
 *   placeholder {string} - Placeholder del textarea
 */
export default function TextQuestion({ question, value, onChange, placeholder }) {
  return (
    <div className="question-body">
      <h2 className="question-title">{question}</h2>
      <textarea
        className="q-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Escribe tu respuesta...'}
        rows={5}
      />
    </div>
  );
}
