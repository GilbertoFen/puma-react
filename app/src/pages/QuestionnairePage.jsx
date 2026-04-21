'use client';
import React, { useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TextQuestion from '../components/questions/TextQuestion';
import ChoiceQuestion from '../components/questions/ChoiceQuestion';
import MultiQuestion from '../components/questions/MultiQuestion';
import InputListQuestion from '../components/questions/InputListQuestion';
import BranchQuestion from '../components/questions/BranchQuestion';
import { QUESTIONS } from '../utils/img/questions';
import './QuestionnairePage.css';

export default function QuestionnairePage({ user, onFinish }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [animDir, setAnimDir] = useState('in'); 
  const [isAnimating, setIsAnimating] = useState(false);
  const contentRef = useRef(null);

  const total = QUESTIONS.length;
  const q = QUESTIONS[current];
  const answer = answers[q.id] ?? '';

  const animateTransition = (direction, callback) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setAnimDir(direction === 'next' ? 'out-left' : 'out-right');

    setTimeout(() => {
      callback();
      setAnimDir(direction === 'next' ? 'in-right' : 'in-left');
      setTimeout(() => {
        setAnimDir('idle');
        setIsAnimating(false);
      }, 380);
    }, 320);
  };

  const goNext = () => {
    if (current < total - 1) {
      animateTransition('next', () => setCurrent((c) => c + 1));
    } else {
      onFinish(answers);
    }
  };

  const goPrev = () => {
    if (current > 0) {
      animateTransition('prev', () => setCurrent((c) => c - 1));
    }
  };

  const setAnswer = (val) => {
    setAnswers((prev) => ({ ...prev, [q.id]: val }));
  };

  const renderQuestion = () => {
    const commonProps = { question: q.question, value: answer, onChange: setAnswer };

    switch (q.type) {
      case 'text':
        return <TextQuestion {...commonProps} {...q.props} />;
      case 'choice':
        return <ChoiceQuestion {...commonProps} {...q.props} />;
      case 'multi':
        return <MultiQuestion {...commonProps} {...q.props} />;
      case 'input_list':
        return <InputListQuestion {...commonProps} {...q.props} />;
      case 'branch':
        return (
          <BranchQuestion
            {...commonProps}
            {...q.props}
            yesContent={
              <InputListQuestion
                question=""
                value={answers[q.id + '_detail'] || {}}
                onChange={(val) => setAnswers((prev) => ({ ...prev, [q.id + '_detail']: val }))}
                listLabel="Proyectos realizados"
                listCount={3}
                fields={[{ label: 'Experiencia profesional', key: 'exp', placeholder: 'Área y función que desempeñaste' }]}
              />
            }
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="page questionnaire-page">
      <div className="bg-mesh" />
      <Navbar showAcatlan userInitial={user.initial} />
      <div className="gold-line" />

      <div className="q-user-header">
        <h2 className="q-user-name">Bienvenido {user.nombre}</h2>
        <p className="q-user-sub">{user.carrera} · {user.semestre}</p>
      </div>

      <div className="q-progress-wrap">
        <div
          className="q-progress-bar"
          style={{ width: `${((current + 1) / total) * 100}%` }}
        />
      </div>

      <main className="q-main">
        <div
          ref={contentRef}
          className={`q-content ${animDir}`}
        >
          {renderQuestion()}
        </div>

        <div className="q-nav">
          {current > 0 && (
            <button className="q-btn secondary" onClick={goPrev} disabled={isAnimating}>
              Anterior
            </button>
          )}
          <button className="q-btn primary" onClick={goNext} disabled={isAnimating}>
            {current < total - 1 ? 'Siguiente' : 'Finalizar'}
          </button>
        </div>

        <div className="q-dots">
          {QUESTIONS.map((_, i) => (
            <span key={i} className={`q-dot ${i === current ? 'active' : i < current ? 'done' : ''}`} />
          ))}
        </div>
      </main>

      <div className="gold-line" />
      <Footer />
    </div>
  );
}
