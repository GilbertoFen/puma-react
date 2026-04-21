import React from 'react';
import './Question.css';

/**
 * MultiQuestion
 * Selección múltiple con chips/tags
 *
 * Props:
 *   question  {string}   - Texto de la pregunta
 *   options   {string[]} - Opciones disponibles
 *   value     {string[]} - Opciones seleccionadas
 *   onChange  {fn}       - Callback (selectedArray) => void
 *   maxSelect {number}   - Máximo de selecciones (opcional)
 */
export default function MultiQuestion({ question, options, value = [], onChange, maxSelect }) {
  const toggle = (opt) => {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else {
      if (maxSelect && value.length >= maxSelect) return;
      onChange([...value, opt]);
    }
  };

  return (
    <div className="question-body">
      <h2 className="question-title">{question}</h2>
      {maxSelect && (
        <p className="q-hint">Selecciona hasta {maxSelect} opciones</p>
      )}
      <div className="q-chips-wrap">
        {options.map((opt) => (
          <button
            key={opt}
            className={`q-chip ${value.includes(opt) ? 'selected' : ''}`}
            onClick={() => toggle(opt)}
            type="button"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
