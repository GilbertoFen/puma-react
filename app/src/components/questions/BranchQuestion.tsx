import React from 'react';
import './Question.css';

interface BranchQuestionProps {
  question: string;
  value?: { answer?: string; [key: string]: any };
  onChange: (val: any) => void;
  yesContent?: React.ReactNode;
  yesLabel?: string;
  noLabel?: string;
}

export default function BranchQuestion({
  question,
  value = {},
  onChange,
  yesContent,
  yesLabel = 'Sí',
  noLabel = 'No',
}: BranchQuestionProps) {
  const answer = value.answer;

  const setAnswer = (ans: string) => {
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
        <div className="q-branch-content">{yesContent}</div>
      )}
    </div>
  );
}