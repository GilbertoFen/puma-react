import React from 'react';
import './Question.css';

interface TextQuestionProps {
  question: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export default function TextQuestion({ question, value, onChange, placeholder }: TextQuestionProps) {
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