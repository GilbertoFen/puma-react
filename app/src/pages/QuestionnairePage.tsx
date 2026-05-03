'use client';
import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TextQuestion from '../components/questions/TextQuestion';
import ChoiceQuestion from '../components/questions/ChoiceQuestion';
import MultiQuestion from '../components/questions/MultiQuestion';
import InputListQuestion from '../components/questions/InputListQuestion';
import BranchQuestion from '../components/questions/BranchQuestion';
import { QUESTIONS } from '../utils/questions';
import { studentService } from '../services/student.service';
import { StudentProfile, UserData } from '../types';
import './QuestionnairePage.css';

interface QuestionnairePageProps {
  user: UserData;
  profile: StudentProfile | null; // <--- AGREGA ESTA LÍNEA
  onFinish: (answers: Record<string, any>) => void;
}

export default function QuestionnairePage({ user, profile, onFinish }: QuestionnairePageProps, ) {

  const [current, setCurrent] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [animDir, setAnimDir] = useState<string>('idle');
  const [error, setError] = useState('');
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const contentRef = useRef<HTMLDivElement>(null);

  

  const total = QUESTIONS.length;
  const q = QUESTIONS[current];
  const answer = answers[q.id] ?? '';

  const animateTransition = (direction: 'next' | 'prev', callback: () => void) => {
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
    let isValid = true;
    let errorMessage = "";

    if (q.type === 'text') {
      if (!answer || typeof answer !== 'string' || answer.trim() === '') {
        isValid = false;
        errorMessage = "Por favor, escribe una respuesta para continuar.";
      }
    }
    else if (q.type === 'branch') {
      const branchAnswer = answer?.answer;

      if (!branchAnswer) {
        isValid = false;
        errorMessage = "Selecciona 'Sí' o 'No' antes de seguir.";
      }
      else if (branchAnswer === 'Sí') {
        // CORRECCIÓN: Buscamos dentro del mismo objeto de respuesta 'answer'
        const listItems = answer?._list || [];
        const extraInfo = answer?.exp || "";

        const hasAnyProject = listItems.some((item: any) => typeof item === 'string' && item.trim().length > 0);
        const hasAnyDescription = typeof extraInfo === 'string' && extraInfo.trim().length > 0;

        if (!hasAnyProject && !hasAnyDescription) {
          isValid = false;
          errorMessage = "Si seleccionaste 'Sí', llena al menos un campo de experiencia.";
        }
      }
    }

    if (!isValid) {
      setError(errorMessage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setError(''), 3000);
      return;
    }

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

  const setAnswer = (val: any) => {
    setAnswers((prev) => ({ ...prev, [q.id]: val }));
  };

  const renderQuestion = () => {
    const commonProps = {
      question: q.question,
      value: answer,
      onChange: setAnswer
    };

    const props = q.props as any;

    switch (q.type) {
      case 'text':
        return <TextQuestion {...commonProps} placeholder={props.placeholder} />;
      case 'choice':
        return <ChoiceQuestion {...commonProps} options={props.options || []} />;
      case 'multi':
        return <MultiQuestion {...commonProps} options={props.options || []} maxSelect={props.maxSelect} />;
      case 'input_list':
        return <InputListQuestion {...commonProps} fields={props.fields} listLabel={props.listLabel} />;
      case 'branch':
        return (
          <BranchQuestion
            {...commonProps}
            yesLabel={props.yesLabel}
            noLabel={props.noLabel}
            yesContent={
              <InputListQuestion
                question=""
                // CORRECCIÓN: Guardamos los detalles dentro del mismo objeto q.id
                value={answer || {}}
                onChange={(val) => setAnswer({ ...answer, ...val })}
                listLabel="Proyectos realizados"
                fields={[{ label: 'Experiencia profesional', key: 'exp', placeholder: 'Área y función que desempeñaste' }]}
              />
            }
          />
        );
      default:
        return null;
    }
  };

  if (!profile) return <div className="loading-profile" style={{ color: '#bb8800' }}>Cargando datos de Acatlán...</div>;

  return (
    <div className="page questionnaire-page">
      <div className="bg-mesh" />
      <Navbar showAcatlan userInitial={profile.fullName.charAt(0)} />
      <div className="gold-line" />

      <div className="q-user-header">
        {/* Notificación de error unificada */}
        {error && <div className="login-error">{error}</div>}

        <h2 className="q-user-name">Bienvenido {profile.fullName}</h2>
        <p className="q-user-sub">{profile.academicInfo.career} · {profile.academicInfo.semester}</p>
      </div>

      <div className="q-progress-wrap">
        <div
          className="q-progress-bar"
          style={{
            width: `${((current + 1) / total) * 100}%`,
            backgroundColor: '#bb8800'
          }}
        />
      </div>

      <main className="q-main">
        <div ref={contentRef} className={`q-content ${animDir}`}>
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