import React from 'react';
import './Question.css';

interface MultiQuestionProps {
  question: string;
  options: string[];
  value?: string[];
  onChange: (selected: string[]) => void;
  maxSelect?: number;
}

export default function MultiQuestion({ question, options, value = [], onChange, maxSelect }: MultiQuestionProps) {
  const toggle = (opt: string) => {
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
      {maxSelect && <p className="q-hint">Selecciona hasta {maxSelect} opciones</p>}
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