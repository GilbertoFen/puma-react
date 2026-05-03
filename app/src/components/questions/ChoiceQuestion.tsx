import React from 'react';
import './Question.css';

interface ChoiceQuestionProps {
  question: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
}

export default function ChoiceQuestion({ question, options, value, onChange }: ChoiceQuestionProps) {
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
