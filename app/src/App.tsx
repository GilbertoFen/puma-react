'use client';
import React, { useState } from 'react';
import './styles/globals.css';
import LoginPage from './pages/LoginPage';
import WelcomePage from './pages/WelcomePage';
import QuestionnairePage from './pages/QuestionnairePage';
import { useRouter } from 'next/navigation';


// Pantallas disponibles
const SCREENS = {
  LOGIN: 'login',
  WELCOME: 'welcome',
  QUESTIONNAIRE: 'questionnaire',
  DONE: 'done',
  CHAT: 'chat',
};

export default function App() {
  const [screen, setScreen] = useState(SCREENS.LOGIN);
  const [user, setUser] = useState(null);
  const router = useRouter();

  const handleLogin = (userData: any) => {
    setUser(userData);
    setScreen(SCREENS.WELCOME);
  };


  const handleBegin = () => {
    setScreen(SCREENS.QUESTIONNAIRE);
  };

  const handleFinish = (answers: any) => {
    console.log('Respuestas del cuestionario:', answers);
    router.push('/home')
  };

  if (screen === SCREENS.LOGIN) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (screen === SCREENS.WELCOME) {
    return <WelcomePage user={user} onBegin={handleBegin} />;
  }

  if (screen === SCREENS.QUESTIONNAIRE) {
    return <QuestionnairePage user={user} onFinish={handleFinish} />;
  }

  if (screen === SCREENS.DONE) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#060d1f',
        color: 'white',
        fontFamily: 'Sora, sans-serif',
        gap: 16,
        textAlign: 'center',
        padding: 40,
      }}>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18 }}>
          Tus respuestas fueron guardadas. La IA está procesando tu perfil.
        </p>
        <button
          onClick={() => setScreen(SCREENS.CHAT)}
          style={{
            marginTop: 24,
            padding: '14px 40px',
            background: '#0f2d6b',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 100,
            color: 'white',
            fontSize: 16,
            cursor: 'pointer',
            fontFamily: 'Sora, sans-serif',
            fontWeight: 600,
          }}
        >
          Volver al inicio
        </button>
      </div>
    );
  }
}
