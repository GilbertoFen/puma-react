import React from 'react';
import './Question.css';

interface MultiQuestionProps {
  question: string;
  options: string[];
  value?: string[];
  onChange: (selected: string[]) => void;
  maxSelect?: number;
  exclusiveOption?: string;
}

export default function MultiQuestion({ question, options, value: raw, onChange, maxSelect, exclusiveOption }: MultiQuestionProps) {
  const value = Array.isArray(raw) ? raw : [];   // evita el '' que llega por defecto

  const toggle = (opt: string) => {
    if (value.includes(opt)) { onChange(value.filter((v) => v !== opt)); return; }
    if (exclusiveOption && opt === exclusiveOption) { onChange([opt]); return; }
    const base = exclusiveOption ? value.filter((v) => v !== exclusiveOption) : value;
    if (maxSelect && base.length >= maxSelect) return;
    onChange([...base, opt]);
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